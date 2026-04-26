import type { GameRunField, ParsedGameRun } from '@/shared/types/game-run.types';
import type { CsvDelimiter } from '@/features/data-import/csv-import/types';
import type { ImportFormatSettings } from '@/shared/locale/types';
import { CANONICAL_STORAGE_FORMAT } from '@/shared/locale/types';
import { getImportFormat, getDisplayLocale } from '@/shared/locale/locale-store';
import { getDelimiterString } from '../../data-import/csv-import/csv-parser';
import { formatFilenameDateTime, formatIsoDate, formatIsoTime } from '../../../shared/formatting/date-formatters';
import { formatLargeNumber } from '@/shared/formatting/number-scale';
import { encodeNotesForStorage } from '@/shared/domain/fields/notes-encoding';
import { V3_COLUMN_PREFIX } from '@/shared/domain/migrations/storage-keys';
import { csvHeaderOf, internalFields } from '@/shared/domain/field-graph';
import {
  _DATE_NODE,
  _NOTES_NODE,
  _RUN_TYPE_NODE,
  _TIME_NODE,
} from '@/shared/domain/field-graph/catalog/fields.nodes';

// Interface for field information
interface FieldInfo {
  fieldName: string;      // camelCase internal name
  originalKey: string;    // Original key for CSV header
  isAppGenerated: boolean; // Whether this is an app-generated field
}

// Interface for delimiter conflict information
export interface DelimiterConflict {
  fieldName: string;
  originalKey: string;
  conflictingValues: string[];
  affectedRunCount: number;
}

/**
 * Output format mode for CSV export.
 * - 'canonical': Format numbers using US-centric canonical format (for localStorage storage)
 * - 'localized': Format numbers using user's import/export format (for file export to user)
 * - undefined: Use rawValue as-is (backward compatibility)
 */
type CsvOutputFormat = 'canonical' | 'localized';

// Interface for export configuration
export interface CsvExportConfig {
  delimiter: CsvDelimiter;
  customDelimiter?: string;
  includeAppFields: boolean; // Whether to include Date/Time columns
  /**
   * Output format for numbers.
   * - 'canonical': Always use US format (period decimal) - for localStorage
   * - 'localized': Use user's import/export format setting - for file downloads
   * - undefined: Use rawValue as-is (backward compatibility)
   */
  outputFormat?: CsvOutputFormat;
}

// Interface for export result
export interface CsvExportResult {
  csvContent: string;
  conflicts: DelimiterConflict[];
  fieldCount: number;
  rowCount: number;
}

/**
 * Get all unique field keys from runs with their original keys
 * Orders fields: internal fields first (_date, _time, _notes, _runType, _rank), then battle_date, then alphabetically
 */
function getAllFieldKeys(runs: ParsedGameRun[]): FieldInfo[] {
  const internalFieldOrder = internalFields();
  const internalFieldRank = new Map(internalFieldOrder.map((id, idx) => [id, idx]));

  const fieldMap = new Map<string, FieldInfo>();

  // Add internal fields (in graph-declared order) if they exist in any run.
  // CSV header comes from HAS_CSV_HEADER; if the override is missing the
  // canonical id is the safest fallback.
  for (const fieldName of internalFieldOrder) {
    const hasField = runs.some(run => run.fields[fieldName]);
    if (hasField) {
      fieldMap.set(fieldName, {
        fieldName,
        originalKey: csvHeaderOf(fieldName) ?? fieldName,
        isAppGenerated: true
      });
    }
  }

  // Collect all fields from runs (including battle_date and other game fields)
  for (const run of runs) {
    for (const [fieldName, field] of Object.entries(run.fields)) {
      // Skip internal fields (already added above) — rank map doubles as the
      // membership check, so the graph stays the single source of truth.
      if (internalFieldRank.has(fieldName)) continue;

      if (!fieldMap.has(fieldName)) {
        fieldMap.set(fieldName, {
          fieldName,
          originalKey: field.originalKey,
          isAppGenerated: false
        });
      }
    }
  }

  return Array.from(fieldMap.values()).sort((a, b) => {
    const aRank = internalFieldRank.get(a.fieldName);
    const bRank = internalFieldRank.get(b.fieldName);

    if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
    if (aRank !== undefined) return -1;
    if (bRank !== undefined) return 1;

    // battle_date comes first among game fields
    if (a.fieldName === 'battleDate' && b.fieldName !== 'battleDate') return -1;
    if (a.fieldName !== 'battleDate' && b.fieldName === 'battleDate') return 1;

    // Then sort alphabetically
    return a.originalKey.localeCompare(b.originalKey);
  });
}

/**
 * Build a string-typed field record. Used by the export preprocessor to
 * synthesize internal-field rows from cached `ParsedGameRun` properties when
 * the row didn't carry the field in `fields`.
 */
function stringField(rawValue: string): GameRunField {
  return { value: rawValue, rawValue, displayValue: rawValue, originalKey: '', dataType: 'string' };
}

/**
 * Transitional preprocessor: ensures the three internal fields with cached-
 * property fallbacks (`_date`, `_time`, `_runType`) are populated, and pre-
 * encodes `_notes` for tab-delimited storage.
 *
 * After commit 9 wires `IS_DERIVED_FROM` + a derivation cascade, the parser
 * will guarantee these fields are populated by the time export runs and the
 * cached-property branches in this function disappear. Notes encoding moves
 * to a dedicated edge (or `'user-text'` data-type variant) at the same time.
 *
 * Until then, this is the single place where the exporter carries per-field
 * knowledge — no other site of csv-exporter reads field ids directly.
 */
function withPopulatedAppFields(run: ParsedGameRun): ParsedGameRun {
  const fields = { ...run.fields };

  if (!fields[_DATE_NODE.id]?.rawValue) {
    fields[_DATE_NODE.id] = stringField(formatIsoDate(run.timestamp));
  }
  if (!fields[_TIME_NODE.id]?.rawValue) {
    fields[_TIME_NODE.id] = stringField(formatIsoTime(run.timestamp));
  }
  if (!fields[_RUN_TYPE_NODE.id]?.rawValue) {
    fields[_RUN_TYPE_NODE.id] = stringField(run.runType);
  }

  const notesField = fields[_NOTES_NODE.id];
  if (notesField) {
    fields[_NOTES_NODE.id] = { ...notesField, rawValue: encodeNotesForStorage(notesField.rawValue) };
  }

  return { ...run, fields };
}

/**
 * Detect delimiter conflicts in the data
 */
function detectDelimiterConflicts(
  runs: ParsedGameRun[],
  delimiter: string,
  includeAppFields: boolean = true
): DelimiterConflict[] {
  const conflicts: Map<string, DelimiterConflict> = new Map();
  const fieldKeys = getAllFieldKeys(runs);

  for (const rawRun of runs) {
    const run = withPopulatedAppFields(rawRun);
    for (const fieldInfo of fieldKeys) {
      if (fieldInfo.isAppGenerated && !includeAppFields) continue;

      const value = run.fields[fieldInfo.fieldName]?.rawValue ?? '';

      // Check if value contains delimiter
      if (value.includes(delimiter)) {
        const key = fieldInfo.fieldName;
        
        if (!conflicts.has(key)) {
          conflicts.set(key, {
            fieldName: fieldInfo.fieldName,
            originalKey: fieldInfo.originalKey,
            conflictingValues: [],
            affectedRunCount: 0
          });
        }
        
        const conflict = conflicts.get(key)!;
        conflict.affectedRunCount++;
        
        // Add unique conflicting values (max 3 examples)
        if (conflict.conflictingValues.length < 3 && !conflict.conflictingValues.includes(value)) {
          conflict.conflictingValues.push(value);
        }
      }
    }
  }
  
  return Array.from(conflicts.values());
}

/**
 * Resolve the format settings to use based on outputFormat mode.
 */
function resolveOutputFormat(outputFormat?: CsvOutputFormat): ImportFormatSettings | undefined {
  if (outputFormat === 'canonical') {
    return CANONICAL_STORAGE_FORMAT;
  }
  if (outputFormat === 'localized') {
    return getImportFormat();
  }
  return undefined; // Use rawValue as-is
}

/**
 * Check if a raw value ends with a letter (indicates shorthand like K, M, T, aa).
 * Simple check: if last char is a-z/A-Z, it's shorthand. If it's 0-9, it's exact.
 */
function hasScaleSuffix(rawValue: string): boolean {
  const lastChar = rawValue.trim().slice(-1);
  return /[a-zA-Z]/.test(lastChar);
}

/**
 * Format an exact number for STORAGE (canonical).
 * Raw number, no thousands separator, period decimal.
 */
function formatExactNumberCanonical(value: number): string {
  return Number.isInteger(value)
    ? Math.round(value).toString()
    : value.toString();
}

/**
 * Format an exact number for USER EXPORT (localized).
 * Uses locale decimal separator but NO thousands separators.
 */
function formatExactNumberLocalized(value: number, displayLocale: string): string {
  return new Intl.NumberFormat(displayLocale, {
    useGrouping: false, // No thousands separators
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a field value for CSV output.
 * Behavior differs based on outputFormat:
 * - 'canonical': Raw exact numbers, shorthand with period decimal
 * - 'localized': Exact numbers with locale decimal sep (no thousands), shorthand with locale decimal
 * - undefined: Use rawValue as-is (backward compatibility)
 */
function formatFieldValue(
  field: { value: unknown; rawValue: string; dataType: string } | undefined,
  format: ImportFormatSettings | undefined,
  outputFormat: CsvOutputFormat | undefined
): string {
  if (!field) return '';

  // If no format specified or not a number field, use rawValue
  if (!format || field.dataType !== 'number') {
    return field.rawValue;
  }

  const numValue = typeof field.value === 'number' ? field.value : 0;
  const isShorthand = hasScaleSuffix(field.rawValue);

  if (isShorthand) {
    // Original used shorthand → format with shorthand (formatLargeNumber handles locale)
    return formatLargeNumber(numValue, format);
  }

  // Original was exact number → preserve precision
  if (outputFormat === 'canonical') {
    // Storage: raw number, no formatting
    return formatExactNumberCanonical(numValue);
  } else {
    // User export: locale-aware thousands separator
    const displayLocale = getDisplayLocale();
    return formatExactNumberLocalized(numValue, displayLocale);
  }
}

/**
 * Export runs to CSV format
 */
export function exportToCsv(
  runs: ParsedGameRun[],
  config: CsvExportConfig
): CsvExportResult {
  if (runs.length === 0) {
    return {
      csvContent: '',
      conflicts: [],
      fieldCount: 0,
      rowCount: 0
    };
  }

  const delimiter = config.delimiter === 'custom'
    ? config.customDelimiter || ','
    : getDelimiterString(config.delimiter);

  // Get field information
  const fieldKeys = getAllFieldKeys(runs).filter(field =>
    !field.isAppGenerated || config.includeAppFields
  );

  // Detect conflicts
  const conflicts = detectDelimiterConflicts(runs, delimiter, config.includeAppFields);

  // Resolve output format for number formatting
  const formatSettings = resolveOutputFormat(config.outputFormat);

  // Build CSV content
  const lines: string[] = [];

  // Header row. Internal fields keep their display-name header (`_Date`,
  // `_Time`, ...). EVERY non-internal column carries the `v3_` prefix
  // (PRD §9.1 Option C), including unrecognized passthrough columns which
  // become `v3_unrecognizedField_<name>`. Uniform prefixing lets the
  // storage-version detector recognize V3 files from any single header.
  const headers = fieldKeys.map(field => {
    if (field.isAppGenerated) return field.originalKey;
    return `${V3_COLUMN_PREFIX}${field.fieldName}`;
  });
  lines.push(headers.join(delimiter));

  // Data rows. The preprocessor populates internal fields with cached-
  // property fallbacks and pre-encodes notes; from here on, app + game
  // fields share one extraction path keyed off `field.dataType`.
  for (const rawRun of runs) {
    const run = withPopulatedAppFields(rawRun);
    const values: string[] = [];

    for (const fieldInfo of fieldKeys) {
      const value = formatFieldValue(run.fields[fieldInfo.fieldName], formatSettings, config.outputFormat);
      values.push(value);
    }

    lines.push(values.join(delimiter));
  }
  
  return {
    csvContent: lines.join('\n'),
    conflicts,
    fieldCount: fieldKeys.length,
    rowCount: runs.length
  };
}

/**
 * Generate filename for export
 */
export function generateExportFilename(runCount: number): string {
  const timestamp = formatFilenameDateTime(new Date());
  return `tower_tracking_export_${runCount}_runs_${timestamp}.csv`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }
  
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    throw new Error('Failed to copy to clipboard');
  }
}

/**
 * Download text as file using File System Access API with fallback
 */
export async function downloadAsFile(content: string, filename: string): Promise<void> {
  try {
    // Try using File System Access API first (Chrome 86+, Edge 86+)
    if ('showSaveFilePicker' in window) {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'CSV files',
          accept: { 'text/csv': ['.csv'] }
        }]
      });
      
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return;
    }
    
    // Fallback to traditional download for unsupported browsers
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      throw new Error('File download not supported');
    }
  } catch (error) {
    // If user cancels the save dialog, don't throw an error
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    throw new Error('Failed to download file');
  }
}