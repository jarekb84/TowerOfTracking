import type { GameRunField, ParsedGameRun } from '@/shared/types/game-run.types';
import type { ImportFormatSettings } from '@/shared/locale/types';
import {
  parseShorthandNumber,
  formatLargeNumber
} from '../../../../shared/formatting/number-scale';
import { decodeNotesFromStorage } from '@/shared/domain/fields/notes-encoding';

// Field configuration for processing rules
interface FieldConfig {
  type: 'number' | 'duration' | 'string' | 'date';
}

// Exact match field configurations - O(1) lookup instead of if-chain
const EXACT_FIELD_CONFIGS: Record<string, FieldConfig> = {
  // Internal fields (prefixed with underscore)
  '_date': { type: 'date' },
  'date': { type: 'date' },
  '_time': { type: 'date' },
  'time': { type: 'date' },
  '_notes': { type: 'string' },
  'notes': { type: 'string' },
  '_runtype': { type: 'string' },
  'runtype': { type: 'string' },
  '_run_type': { type: 'string' },
  'run_type': { type: 'string' },
  // Battle date variants
  'battle date': { type: 'date' },
  'battledate': { type: 'date' },
  'battle_date': { type: 'date' },
  // Other string fields
  'killed by': { type: 'string' },
};

// Pattern-based field detection (order matters - first match wins)
const PATTERN_FIELD_CONFIGS: Array<{ pattern: string; config: FieldConfig }> = [
  { pattern: 'time', config: { type: 'duration' } },
  { pattern: 'date', config: { type: 'date' } },
];

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

function getFieldConfig(key: string, rawValue?: string): FieldConfig {
  const lowerKey = key.toLowerCase();

  // 1. Check exact match first (O(1) lookup)
  const exactMatch = EXACT_FIELD_CONFIGS[lowerKey];
  if (exactMatch) return exactMatch;

  // 2. Special case: tier with '+' suffix (e.g., "10+") is a string
  if (lowerKey === 'tier' && rawValue?.includes('+')) return { type: 'string' };

  // 3. Check pattern-based matches
  for (const { pattern, config } of PATTERN_FIELD_CONFIGS) {
    if (lowerKey.includes(pattern)) return config;
  }

  // 4. Default to number
  return { type: 'number' };
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
 * Create an internal field (app-generated metadata) with string data type
 *
 * Internal fields are application-controlled metadata (notes, run type, etc.)
 * and always use string data type with simple value pass-through.
 *
 * @param originalKey - Display name for the field (e.g., "Notes", "Run Type")
 * @param value - The string value to store
 * @returns GameRunField with string data type
 */
export function createInternalField(originalKey: string, value: string): GameRunField {
  return {
    value,
    rawValue: value,
    displayValue: value,
    originalKey,
    dataType: 'string' as const
  };
}