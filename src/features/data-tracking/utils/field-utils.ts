import type { GameRunField, ParsedGameRun } from '../types/game-run.types';
import {
  parseShorthandNumber,
  formatLargeNumber
} from '../../../shared/formatting/number-scale';

// Field configuration for processing rules
interface FieldConfig {
  type: 'number' | 'duration' | 'string' | 'date';
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

function getFieldConfig(key: string, rawValue?: string): FieldConfig {
  const lowerKey = key.toLowerCase();

  // Handle internal fields (prefixed with underscore)
  if (lowerKey === '_date' || lowerKey === 'date') return { type: 'date' };
  if (lowerKey === '_time' || lowerKey === 'time') return { type: 'date' };
  if (lowerKey === '_notes' || lowerKey === 'notes') return { type: 'string' };
  if (lowerKey === '_runtype' || lowerKey === 'runtype' || lowerKey === '_run_type' || lowerKey === 'run_type') return { type: 'string' };

  // Handle battle_date field from game (can be "Battle Date" with space or "battledate")
  if (lowerKey === 'battle date' || lowerKey === 'battledate' || lowerKey === 'battle_date') return { type: 'date' };

  // Existing game field detection
  if (lowerKey.includes('time')) return { type: 'duration' };
  if (lowerKey.includes('date')) return { type: 'date' };
  if (lowerKey === 'killed by') return { type: 'string' };
  if (lowerKey === 'tier' && rawValue && rawValue.includes('+')) return { type: 'string' };

  return { type: 'number' };
}

// Create rich field object with all representations
export function createGameRunField(originalKey: string, rawValue: string): GameRunField {
  const fieldConfig = getFieldConfig(originalKey, rawValue);
  
  let processedValue: number | string | Date;
  let displayValue: string;
  let dataType: GameRunField['dataType'];
  
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
      processedValue = parseShorthandNumber(rawValue);
      displayValue = formatLargeNumber(processedValue as number);
      dataType = 'number';
      break;
      
    case 'string':
      processedValue = rawValue;
      displayValue = rawValue;
      dataType = 'string';
      break;
      
    default:
      processedValue = rawValue;
      displayValue = rawValue;
      dataType = 'string';
  }
  
  return {
    value: processedValue,
    rawValue,
    displayValue,
    originalKey,
    dataType,
  };
}


// Efficient data access patterns
export function getFieldValue<T = any>(run: ParsedGameRun, fieldName: string): T | null {
  const field = run.fields[fieldName];
  return field ? field.value as T : null;
}

export function getFieldDisplay(run: ParsedGameRun, fieldName: string): string {
  const field = run.fields[fieldName];
  return field ? field.displayValue : '-';
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