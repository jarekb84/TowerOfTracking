import type { GameRunField, ParsedGameRun } from '@/shared/types/game-run.types';
import type { ImportFormatSettings } from '@/shared/locale/types';
import {
  parseShorthandNumber,
  formatLargeNumber
} from '../../../../shared/formatting/number-scale';
import { decodeNotesFromStorage } from '@/shared/domain/fields/notes-encoding';
import { dataTypeOf, resolveFieldByAnyKey, type DataType } from '@/shared/domain/field-graph';
import { V3_COLUMN_PREFIX } from '@/shared/domain/migrations/storage-keys';

// Field configuration for processing rules
interface FieldConfig {
  type: DataType;
}

// Parse duration strings like "7H 45M 35S" or "1d 13h 24m 51s" into seconds
function parseDuration(duration: string): number {
  if (!duration || typeof duration !== 'string') return 0;

  const regex = /(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i;
  const match = duration.match(regex);

  if (!match) return 0;

  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  const seconds = parseInt(match[4] || '0', 10);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

// Format duration in seconds back to readable format
function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);
  
  return parts.join(' ') || '0s';
}

// TRANSITIONAL — deleted by commit 11b (parser-boundary resolver
// centralization). Same input-shape normalization lives in three other
// files (`csv-parser.ts:buildColumnToFieldMap`, `csv-field-mapping.ts`,
// `v2-to-v3-migrator.ts:classifyV2Header`); commit 11b collapses all four
// into a single `resolveFieldByAnyKey(rawString)` call. Decision shape
// is captured in
// `docs/field-graph/EXPLORATION-parser-boundary-resolution.md`.
function deriveCanonicalKey(originalKey: string): string {
  if (originalKey.startsWith(V3_COLUMN_PREFIX)) {
    return originalKey.slice(V3_COLUMN_PREFIX.length);
  }
  if (originalKey.startsWith('_')) {
    return '_' + toCamelCase(originalKey.slice(1));
  }
  return toCamelCase(originalKey);
}

// Resolve a field's data type via the graph. The graph is authoritative for
// every declared Field and every legacy key (RENAMED_FROM edges resolve V2
// display labels like 'Real Time' / 'Killed By' through to their V3
// canonical's IS_OF_TYPE). Unknown columns default to 'number' — the modal
// case for game-export stats.
function getFieldConfig(originalKey: string): FieldConfig {
  const camel = deriveCanonicalKey(originalKey);
  const canonicalId = resolveFieldByAnyKey(camel)?.id ?? camel;
  return { type: dataTypeOf(canonicalId) ?? 'number' };
}

/**
 * Process a string field value, decoding notes if necessary.
 */
function processStringField(originalKey: string, rawValue: string): string {
  const lowerKey = originalKey.toLowerCase();
  const isNotesField = lowerKey === '_notes' || lowerKey === 'notes';
  return isNotesField ? decodeNotesFromStorage(rawValue) : rawValue;
}

/**
 * Create rich field object with all representations.
 *
 * @param originalKey - The original field key from the import data
 * @param rawValue - The raw string value from the import
 * @param importFormat - Optional import format settings (defaults to store's import format)
 * @returns GameRunField with processed value, raw value, and display value
 */
export function createGameRunField(
  originalKey: string,
  rawValue: string,
  importFormat?: ImportFormatSettings
): GameRunField {
  const fieldConfig = getFieldConfig(originalKey);

  let processedValue: number | string | Date;
  let displayValue: string;
  let dataType: GameRunField['dataType'];
  let finalRawValue = rawValue; // Track if we need to decode rawValue

  switch (fieldConfig.type) {
    case 'duration':
      processedValue = parseDuration(rawValue);
      displayValue = formatDuration(processedValue as number);
      dataType = 'duration';
      break;

    case 'date':
      try {
        processedValue = new Date(rawValue);
        displayValue = rawValue;
        dataType = 'date';
      } catch {
        processedValue = rawValue;
        displayValue = rawValue;
        dataType = 'string';
      }
      break;

    case 'number':
      // parseShorthandNumber uses store's import format if not explicitly provided
      processedValue = parseShorthandNumber(rawValue, importFormat);
      // formatLargeNumber uses store's display locale
      displayValue = formatLargeNumber(processedValue as number);
      dataType = 'number';
      break;

    case 'string': {
      const decodedValue = processStringField(originalKey, rawValue);
      processedValue = decodedValue;
      displayValue = decodedValue;
      finalRawValue = decodedValue; // Store decoded value so exports re-encode correctly
      dataType = 'string';
      break;
    }

    default:
      processedValue = rawValue;
      displayValue = rawValue;
      dataType = 'string';
  }

  return {
    value: processedValue,
    rawValue: finalRawValue,
    displayValue,
    originalKey,
    dataType,
  };
}


// Efficient data access patterns
export function getFieldValue<T = unknown>(run: ParsedGameRun, fieldName: string): T | null {
  const field = run.fields[fieldName];
  return field ? field.value as T : null;
}

export function getFieldRaw(run: ParsedGameRun, fieldName: string): string {
  const field = run.fields[fieldName];
  return field ? field.rawValue : '';
}

// Convert camelCase field name to original key for lookup
export function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

// Extract timestamp from date and time fields if available
export function extractTimestampFromFields(fields: Record<string, GameRunField>): Date | null {
  const dateField = fields.date;
  const timeField = fields.time;

  try {
    if (dateField && timeField) {
      const dateStr = dateField.rawValue;
      const timeStr = timeField.rawValue;
      const timestamp = new Date(`${dateStr} ${timeStr}`);

      if (!isNaN(timestamp.getTime())) {
        return timestamp;
      }
    } else if (dateField) {
      const timestamp = new Date(dateField.rawValue);
      if (!isNaN(timestamp.getTime())) {
        return timestamp;
      }
    }
  } catch {
    // Fall through to null
  }

  return null; // Return null if no valid date/time found
}

/**
 * Create an internal field (app-generated metadata) — display-label
 * passthrough, with `dataType` resolved from the graph.
 *
 * The graph (`IS_OF_TYPE` edges in `data-types.edges.ts`) is authoritative.
 * `_rank` resolves to `'number'`; `_date` to `'date'`; `_notes` / `_runType`
 * / `_time` to `'string'`. The `'string'` fallback only fires for
 * unrecognized internal-shaped keys (test fixtures, future fields not yet
 * in the catalog).
 *
 * @param originalKey - Display name for the field (e.g., "Notes", "Run Type")
 * @param value - The string value to store
 * @returns GameRunField with graph-driven dataType
 */
export function createInternalField(originalKey: string, value: string): GameRunField {
  const dataType = dataTypeOf(deriveCanonicalKey(originalKey)) ?? 'string';
  return {
    value,
    rawValue: value,
    displayValue: value,
    originalKey,
    dataType,
  };
}