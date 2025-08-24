import type { GameRunField, ParsedGameRun } from '../types/game-run.types';
import humanFormat from 'human-format';

// Custom scale for formatting numbers
const BILLIONS_SCALE = new humanFormat.Scale({
  '': 1,
  K: 1e3,
  M: 1e6,
  B: 1e9,
  T: 1e12,
  Q: 1e15,
  q: 1e18,
  S: 1e21,
  s: 1e24,
  O: 1e27,
});

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

// Parse shorthand numbers like "100K", "10.9M", "15.2B"
function parseShorthandNumber(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  
  // Remove $ signs, commas and trim
  let cleaned = value.replace(/[$,]/g, '').trim();
  
  // Handle x multipliers like "x8.00"
  if (cleaned.startsWith('x')) {
    cleaned = cleaned.substring(1);
  }
  
  // If it's just a number, return it
  if (/^\d+\.?\d*$/.test(cleaned)) {
    return parseFloat(cleaned);
  }
  
  // Check for shorthand notation (case sensitive for q vs Q)
  const shorthandRegex = /^(\d+\.?\d*)\s*([KMBTQqSsO]?)$/;
  const match = cleaned.match(shorthandRegex);
  
  if (!match) return 0;
  
  const number = parseFloat(match[1]);
  const suffix = match[2];
  
  const multipliers: Record<string, number> = {
    '': 1,
    'K': 1e3,
    'M': 1e6,
    'B': 1e9,
    'T': 1e12,
    'Q': 1e15,
    'q': 1e18,
    'S': 1e21,
    's': 1e24,
    'O': 1e27
  };
  
  return number * (multipliers[suffix] || 1);
}

// Format numbers back to human-readable format
function formatNumber(value: number): string {
  if (Math.abs(value) < 1000) return Math.round(value).toString();
  return humanFormat(value, { decimals: 1, separator: '', scale: BILLIONS_SCALE });
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
  
  if (lowerKey.includes('time')) return { type: 'duration' };
  if (lowerKey === 'date' || lowerKey === 'time' || lowerKey.includes('date')) return { type: 'date' };
  if (lowerKey === 'notes' || lowerKey === 'killed by') return { type: 'string' };
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
      displayValue = formatNumber(processedValue as number);
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