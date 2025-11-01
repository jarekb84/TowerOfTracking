import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type { CsvDelimiter } from '@/features/data-import/csv-import/types';
import { getDelimiterString } from '../../data-import/csv-import/csv-parser';
import { formatIsoDate, formatIsoTime, formatFilenameDateTime } from '../../../shared/formatting/date-formatters';
import {
  INTERNAL_FIELD_MAPPINGS,
  INTERNAL_FIELD_ORDER,
  INTERNAL_FIELD_NAMES,
  isInternalField
} from '@/shared/domain/fields/internal-field-config';

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

// Interface for export configuration
export interface CsvExportConfig {
  delimiter: CsvDelimiter;
  customDelimiter?: string;
  includeAppFields: boolean; // Whether to include Date/Time columns
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
 * Orders fields: internal fields first (_date, _time, _notes, _runType), then battle_date, then alphabetically
 */
function getAllFieldKeys(runs: ParsedGameRun[]): FieldInfo[] {
  const fieldMap = new Map<string, FieldInfo>();

  // Add internal fields if they exist in any run
  for (const [fieldName, originalKey] of Object.entries(INTERNAL_FIELD_MAPPINGS)) {
    // Check if any run has this internal field
    const hasField = runs.some(run => run.fields[fieldName]);
    if (hasField) {
      fieldMap.set(fieldName, {
        fieldName,
        originalKey,
        isAppGenerated: true
      });
    }
  }

  // Collect all fields from runs (including battle_date and other game fields)
  for (const run of runs) {
    for (const [fieldName, field] of Object.entries(run.fields)) {
      // Skip internal fields (already added above)
      if (isInternalField(fieldName)) continue;

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
    // Sort internal fields first in specific order
    const aIsInternal = INTERNAL_FIELD_ORDER.includes(a.fieldName);
    const bIsInternal = INTERNAL_FIELD_ORDER.includes(b.fieldName);

    if (aIsInternal && !bIsInternal) return -1;
    if (!aIsInternal && bIsInternal) return 1;

    if (aIsInternal && bIsInternal) {
      return INTERNAL_FIELD_ORDER.indexOf(a.fieldName) - INTERNAL_FIELD_ORDER.indexOf(b.fieldName);
    }

    // battle_date comes first among game fields
    if (a.fieldName === 'battleDate' && b.fieldName !== 'battleDate') return -1;
    if (a.fieldName !== 'battleDate' && b.fieldName === 'battleDate') return 1;

    // Then sort alphabetically
    return a.originalKey.localeCompare(b.originalKey);
  });
}

/**
 * Detect delimiter conflicts in the data
 */
export function detectDelimiterConflicts(
  runs: ParsedGameRun[], 
  delimiter: string,
  includeAppFields: boolean = true
): DelimiterConflict[] {
  const conflicts: Map<string, DelimiterConflict> = new Map();
  const fieldKeys = getAllFieldKeys(runs);
  
  for (const run of runs) {
    for (const fieldInfo of fieldKeys) {
      // Skip app fields if not included
      if (fieldInfo.isAppGenerated && !includeAppFields) continue;
      
      let value = '';
      
      if (fieldInfo.isAppGenerated) {
        // Handle internal app-generated fields
        if (fieldInfo.fieldName === INTERNAL_FIELD_NAMES.DATE) {
          const dateField = run.fields[INTERNAL_FIELD_NAMES.DATE];
          value = dateField?.rawValue || formatIsoDate(run.timestamp);
        } else if (fieldInfo.fieldName === INTERNAL_FIELD_NAMES.TIME) {
          const timeField = run.fields[INTERNAL_FIELD_NAMES.TIME];
          value = timeField?.rawValue || formatIsoTime(run.timestamp);
        } else if (fieldInfo.fieldName === INTERNAL_FIELD_NAMES.NOTES) {
          value = run.fields[INTERNAL_FIELD_NAMES.NOTES]?.rawValue || '';
        } else if (fieldInfo.fieldName === INTERNAL_FIELD_NAMES.RUN_TYPE) {
          value = run.fields[INTERNAL_FIELD_NAMES.RUN_TYPE]?.rawValue || run.runType;
        }
      } else {
        // Handle regular game fields (including battle_date)
        const field = run.fields[fieldInfo.fieldName];
        value = field?.rawValue || '';
      }
      
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
  
  // Build CSV content
  const lines: string[] = [];
  
  // Header row
  const headers = fieldKeys.map(field => field.originalKey);
  lines.push(headers.join(delimiter));
  
  // Data rows
  for (const run of runs) {
    const values: string[] = [];
    
    for (const fieldInfo of fieldKeys) {
      let rawValue = '';
      
      if (fieldInfo.isAppGenerated) {
        // Handle internal app-generated fields
        if (fieldInfo.fieldName === INTERNAL_FIELD_NAMES.DATE) {
          const dateField = run.fields[INTERNAL_FIELD_NAMES.DATE];
          rawValue = dateField?.rawValue || formatIsoDate(run.timestamp);
        } else if (fieldInfo.fieldName === INTERNAL_FIELD_NAMES.TIME) {
          const timeField = run.fields[INTERNAL_FIELD_NAMES.TIME];
          rawValue = timeField?.rawValue || formatIsoTime(run.timestamp);
        } else if (fieldInfo.fieldName === INTERNAL_FIELD_NAMES.NOTES) {
          rawValue = run.fields[INTERNAL_FIELD_NAMES.NOTES]?.rawValue || '';
        } else if (fieldInfo.fieldName === INTERNAL_FIELD_NAMES.RUN_TYPE) {
          rawValue = run.fields[INTERNAL_FIELD_NAMES.RUN_TYPE]?.rawValue || run.runType;
        }
      } else {
        // Handle regular game fields (including battle_date)
        const field = run.fields[fieldInfo.fieldName];
        rawValue = field?.rawValue || '';
      }
      
      values.push(rawValue);
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