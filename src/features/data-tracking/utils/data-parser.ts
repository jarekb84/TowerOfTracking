import humanFormat from 'human-format';
import type { ParsedGameRun } from '../types/game-run.types';

// Parse duration strings like "7H 45M 35S" into seconds
export function parseDuration(duration: string): number {
  if (!duration || typeof duration !== 'string') return 0;
  
  const regex = /(?:(\d+)H)?\s*(?:(\d+)M)?\s*(?:(\d+)S)?/i;
  const match = duration.match(regex);
  
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Parse shorthand numbers like "100K", "10.9M", "15.2B", "1.10T"
export function parseShorthandNumber(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  
  // Remove commas and trim
  const cleaned = value.replace(/,/g, '').trim();
  
  // If it's just a number, return it
  if (/^\d+\.?\d*$/.test(cleaned)) {
    return parseFloat(cleaned);
  }
  
  // Check for shorthand notation
  const shorthandRegex = /^(\d+\.?\d*)\s*([KMBTQSX]?)$/i;
  const match = cleaned.match(shorthandRegex);
  
  if (!match) return 0;
  
  const number = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  
  const multipliers: Record<string, number> = {
    '': 1,
    'K': 1000,
    'M': 1000000,
    'B': 1000000000,
    'T': 1000000000000,
    'Q': 1000000000000000,
    'S': 1000000000000000000,
    'X': 1000000000000000000000
  };
  
  return number * (multipliers[suffix] || 1);
}

// Parse tab-delimited data from clipboard
export function parseTabDelimitedData(rawData: string): Record<string, string> {
  const lines = rawData.trim().split('\n');
  const parsed: Record<string, string> = {};
  
  for (const line of lines) {
    const tabIndex = line.indexOf('\t');
    if (tabIndex === -1) continue;
    
    const key = line.substring(0, tabIndex).trim();
    const value = line.substring(tabIndex + 1).trim();
    
    if (key && value) {
      parsed[key] = value;
    }
  }
  
  return parsed;
}

// Extract key statistics from parsed data
export function extractKeyStats(rawData: Record<string, string>): Partial<ParsedGameRun> {
  const stats: Partial<ParsedGameRun> = {};
  
  // Map common field names to our standardized keys
  const fieldMappings = {
    // Tier variations
    tier: ['tier', 'level', 'stage'],
    wave: ['wave', 'waves', 'wave number', 'waves cleared'],
    coins: ['coins', 'coin', 'gold coins', 'total coins'],
    cash: ['cash', 'money', 'currency', 'dollars'],
    cells: ['cells', 'cell', 'upgrade cells', 'total cells'],
    duration: ['real time', 'duration', 'time played', 'play time', 'session time'],
  };
  
  for (const [standardKey, variants] of Object.entries(fieldMappings)) {
    for (const variant of variants) {
      // Try exact match first
      let value = rawData[variant];
      
      // If not found, try case-insensitive match
      if (!value) {
        const foundKey = Object.keys(rawData).find(
          key => key.toLowerCase() === variant.toLowerCase()
        );
        if (foundKey) {
          value = rawData[foundKey];
        }
      }
      
      if (value) {
        if (standardKey === 'duration') {
          stats.duration = parseDuration(value);
        } else {
          const numValue = parseShorthandNumber(value);
          if (numValue > 0) {
            (stats as any)[standardKey] = numValue;
          }
        }
        break; // Found a match, move to next standard key
      }
    }
  }
  
  return stats;
}

// Main parsing function
export function parseGameRun(rawInput: string): ParsedGameRun {
  const rawData = parseTabDelimitedData(rawInput);
  const keyStats = extractKeyStats(rawData);
  
  // Create parsed data with both numbers and original strings
  const parsedData: Record<string, number | string | Date> = {};
  
  for (const [key, value] of Object.entries(rawData)) {
    // Try to parse as duration first
    if (value.match(/\d+[HMS]/i)) {
      const durationSeconds = parseDuration(value);
      if (durationSeconds > 0) {
        parsedData[key] = durationSeconds;
        parsedData[key + '_formatted'] = value;
        continue;
      }
    }
    
    // Try to parse as number
    const numValue = parseShorthandNumber(value);
    if (numValue > 0 && numValue.toString() !== value) {
      parsedData[key] = numValue;
      parsedData[key + '_formatted'] = value;
    } else {
      parsedData[key] = value;
    }
  }
  
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    rawData,
    parsedData,
    ...keyStats,
  };
}

// Format numbers back to human-readable format
export function formatNumber(value: number): string {
  if (value < 1000) return value.toString();
  return humanFormat(value, { decimals: 1, separator: '' });
}

// Format duration in seconds back to readable format
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}H`);
  if (minutes > 0) parts.push(`${minutes}M`);
  if (secs > 0) parts.push(`${secs}S`);
  
  return parts.join(' ') || '0S';
}