import type { GameRunField, ParsedGameRun } from '@/shared/types/game-run.types';
import type { ImportFormatSettings } from '@/shared/locale/types';
import {
  parseShorthandNumber,
  formatLargeNumber
} from '../../../../shared/formatting/number-scale';
import { decodeNotesFromStorage } from '@/shared/domain/fields/notes-encoding';
import { dataTypeOf, type DataType } from '@/shared/domain/field-graph';

// Field configuration for processing rules
interface FieldConfig {
  type: DataType;
}

// V2-display-label fallbacks for type detection. Catches the cases where the
// display label doesn't trivially derive to the V3 canonical id (e.g. 'Real
// Time' → 'realTime' but the graph node is 'battleReport_realTime'). Commit
// 10 (RENAMED_FROM edges) closes this gap by letting `dataTypeOf` resolve
// the V3 canonical from the legacy key — at which point this entire helper
// + its callers can disappear.
function legacyTypeFallback(key: string, rawValue?: string): DataType {
  const lower = key.toLowerCase();

  // Tier with '+' suffix (e.g., "10+") is a string indicator for tournament.
  if (lower === 'tier' && rawValue?.includes('+')) return 'string';

  // V2 'Killed By' display label — game string, not numeric. Becomes a
  // RENAMED_FROM edge to `battleReport_killedBy` in commit 10.
  if (lower === 'killed by') return 'string';

  // Substring patterns catch V2 labels like 'Real Time' (duration), 'Battle
  // Date' (date) that haven't been folded into the graph as RENAMED_FROM yet.
  if (lower.includes('time')) return 'duration';
  if (lower.includes('date')) return 'date';

  return 'number';
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

// Derive a candidate canonical field id from a CSV / clipboard column label.
// `_Run Type` → `_runType`; `Battle Date` → `battleDate`; `Tier` → `tier`.
// V3 canonical ids that match a graph node land via the first lookup in
// `getFieldConfig`; V2 labels that don't yet have a `RENAMED_FROM` edge fall
// through to `legacyTypeFallback`.
function deriveCanonicalKey(originalKey: string): string {
  if (originalKey.startsWith('_')) {
    return '_' + toCamelCase(originalKey.slice(1));
  }
  return toCamelCase(originalKey);
}

// Resolve a field's data type. Graph wins; legacy V2 display-label heuristics
// only run when the graph has no opinion (passthrough fields, V2-only labels
// not yet declared as RENAMED_FROM).
function getFieldConfig(originalKey: string, rawValue?: string): FieldConfig {
  const declared = dataTypeOf(deriveCanonicalKey(originalKey));
  if (declared) return { type: declared };
  return { type: legacyTypeFallback(originalKey, rawValue) };
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
  const fieldConfig = getFieldConfig(originalKey, rawValue);

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