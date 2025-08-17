import humanFormat from 'human-format';

// Custom scale mapping using 'B' for billions instead of 'G'
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
import type { 
  ParsedGameRun,
  CamelCaseGameRunData, 
  ProcessedGameRunData,
  DataTransformResult,
  RawClipboardData,
  GameRunField
} from '../types/game-run.types';
import { createGameRunField, toCamelCase as fieldUtilsToCamelCase } from './field-utils';

// Parse duration strings like "7H 45M 35S" or "1d 13h 24m 51s" into seconds
export function parseDuration(duration: string): number {
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

// Parse shorthand numbers like "100K", "10.9M", "15.2B", "1.10T", "94.90q"
export function parseShorthandNumber(value: string): number {
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
    'Q': 1e15,       // Quadrillion
    'q': 1e18,       // Quintillion
    'S': 1e21,       // Sextillion
    's': 1e24,       // Septillion
    'O': 1e27        // Octillion
  };
  
  return number * (multipliers[suffix] || 1);
}

// Convert property name to camelCase (moved to field-utils.ts)
function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

// Parse tab-delimited data from clipboard
export function parseTabDelimitedData(rawData: string): RawClipboardData {
  const lines = rawData.trim().split('\n');
  const parsed: Record<string, string> = {};
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Check for numbered arrow format: "     1→Game Time        1d 13h 24m 51s"
    const arrowIndex = line.indexOf('→');
    if (arrowIndex !== -1) {
      // Extract everything after the arrow and number
      const afterArrow = line.substring(arrowIndex + 1);
      
      // Find the first occurrence of multiple spaces to separate key from value
      const match = afterArrow.match(/^(\S+(?:\s+\S+)*)\s{2,}(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        if (key && value) {
          parsed[key] = value;
        }
        continue;
      }
    }
    
    // Handle simple format: "Game Time        1d 13h 24m 51s"
    const match = line.match(/^(\S+(?:\s+\S+)*)\s{2,}(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      
      if (key && value) {
        parsed[key] = value;
      }
      continue;
    }
    
    // Handle tab-delimited format as fallback
    const tabIndex = line.indexOf('\t');
    if (tabIndex !== -1) {
      const key = line.substring(0, tabIndex).trim();
      const value = line.substring(tabIndex + 1).trim();
      
      if (key && value) {
        parsed[key] = value;
      }
    }
  }
  
  return parsed;
}

// Transform raw clipboard data to strongly typed structure
export function transformGameRunData(rawData: RawClipboardData): DataTransformResult {
  const camelCaseData: Partial<CamelCaseGameRunData> = {};
  const processedData: Partial<ProcessedGameRunData> = {};
  
  // Map each raw field to camelCase and processed versions
  for (const [key, value] of Object.entries(rawData)) {
    const camelKey = toCamelCase(key) as keyof CamelCaseGameRunData;
    
    // Store raw string version
    camelCaseData[camelKey] = value as any;
    
    // Process based on field type
    if (key === 'Notes') {
      // String fields
      processedData[camelKey as keyof ProcessedGameRunData] = value as any;
    } else if (key === 'Tier') {
      // Tier can be numeric or include '+' for tournament (e.g., '8+')
      const numeric = parseInt(value.replace(/[^0-9]/g, ''), 10);
      processedData[camelKey as keyof ProcessedGameRunData] = (Number.isFinite(numeric) ? numeric : 0) as any;
    } else if (key === 'Game Time' || key === 'Real Time') {
      processedData[camelKey as keyof ProcessedGameRunData] = parseDuration(value) as any;
    } else if (key === 'Tier' || key === 'Wave' || key.includes('Shards') || key.includes('Modules') || 
               key.includes('Upgrade') || key.includes('Packages') || key === 'Death Defy' || 
               key.includes('Tapped') || key.includes('Spawned') || key.includes('Skipped') ||
               key.includes('Enemies') || key.includes('Elites') || key.includes('catches') ||
               key === 'Gems' || key === 'Medals') {
      // Integer fields
      processedData[camelKey as keyof ProcessedGameRunData] = Math.floor(parseShorthandNumber(value)) as any;
    } else if (key === 'Killed By') {
      // String fields
      processedData[camelKey as keyof ProcessedGameRunData] = value as any;
    } else if (key.includes('Damage') && key.includes('Berserk') && value.startsWith('x')) {
      // Multiplier fields
      processedData[camelKey as keyof ProcessedGameRunData] = parseShorthandNumber(value) as any;
    } else {
      // All other numeric fields
      processedData[camelKey as keyof ProcessedGameRunData] = parseShorthandNumber(value) as any;
    }
  }
  
  // Ensure notes field exists
  if (!camelCaseData.notes) camelCaseData.notes = '';
  if (!processedData.notes) processedData.notes = '';

  return {
    camelCaseData: camelCaseData as CamelCaseGameRunData,
    processedData: processedData as ProcessedGameRunData
  };
}

// Extract key statistics from processed data for quick access
export function extractKeyStats(processedData: ProcessedGameRunData): {
  tier: number;
  wave: number;
  coinsEarned: number;
  cellsEarned: number;
  realTime: number;
} {
  return {
    tier: processedData.tier || 0,
    wave: processedData.wave || 0,
    coinsEarned: processedData.coinsEarned || 0,
    cellsEarned: processedData.cellsEarned || 0,
    realTime: processedData.realTime || 0
  };
}

export function extractKeyStatsFromFields(fields: Record<string, GameRunField>): {
  tier: number;
  wave: number;
  coinsEarned: number;
  cellsEarned: number;
  realTime: number;
  runType: 'farm' | 'tournament';
} {
  const tier = (fields.tier?.value as number) || 0;
  const tierStr = (fields.tier?.rawValue) || '';
  const runType: 'farm' | 'tournament' = /\+/.test(tierStr) ? 'tournament' : 'farm';
  
  return {
    tier,
    wave: (fields.wave?.value as number) || 0,
    coinsEarned: (fields.coinsEarned?.value as number) || 0,
    cellsEarned: (fields.cellsEarned?.value as number) || 0,
    realTime: (fields.realTime?.value as number) || 0,
    runType
  };
}

// Calculate value per hour
export function calculatePerHour(value: number, durationInSeconds: number): number {
  if (durationInSeconds === 0) {
    return 0;
  }
  const hours = durationInSeconds / 3600;
  return value / hours;
}

// Main parsing function with enhanced field structure
export function parseGameRun(rawInput: string, customTimestamp?: Date): ParsedGameRun {
  try {
    const clipboardData = parseTabDelimitedData(rawInput);
    console.log('Parsed clipboard data:', clipboardData);
    
    // Generate field-based structure
    const fields: Record<string, GameRunField> = {};
    const fieldsByOriginalKey = new Map<string, string>();
    
    for (const [originalKey, rawValue] of Object.entries(clipboardData)) {
      const camelKey = fieldUtilsToCamelCase(originalKey);
      const field = createGameRunField(originalKey, rawValue);
      
      fields[camelKey] = field;
      fieldsByOriginalKey.set(originalKey.toLowerCase(), camelKey);
    }
    
    // Extract key stats from field structure
    const fieldKeyStats = extractKeyStatsFromFields(fields);
    
    return {
      id: crypto.randomUUID(),
      timestamp: customTimestamp || new Date(),
      fields,
      _fieldsByOriginalKey: fieldsByOriginalKey,
      ...fieldKeyStats,
    };
  } catch (error) {
    console.error('Error parsing game run:', error);
    throw error;
  }
}

// Map tournament tier (with '+') to league label
export function getTournamentLeague(tierNumber: number): string | null {
  if (!Number.isFinite(tierNumber) || tierNumber <= 0) return null;
  if (tierNumber >= 14) return 'Legend';
  if (tierNumber >= 11) return 'Champion';
  if (tierNumber >= 8) return 'Platinum';
  if (tierNumber >= 5) return 'Gold';
  if (tierNumber >= 3) return 'Silver';
  return 'Copper';
}

// Format tier label including tournament league when applicable, e.g., '8+ Platinum'
export function formatTierLabel(camelTier: string | undefined, numericTier: number | undefined): string {
  const hasPlus = typeof camelTier === 'string' && /\+/.test(camelTier);
  if (hasPlus) {
    const tierNum = Number(numericTier ?? parseInt((camelTier || '').replace(/[^0-9]/g, ''), 10));
    const league = getTournamentLeague(tierNum);
    const base = `${tierNum}+`;
    return league ? `${base} ${league}` : base;
  }
  // Fallback to numeric tier if available, otherwise the raw string
  if (numericTier && numericTier > 0) return String(numericTier);
  return camelTier || '-';
}

// Format numbers back to human-readable format
export function formatNumber(value: number): string {
  if (Math.abs(value) < 1000) return Math.round(value).toString();
  return humanFormat(value, { decimals: 1, separator: '', scale: BILLIONS_SCALE });
}

// Format duration in seconds back to readable format
export function formatDuration(seconds: number): string {
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

// Parse CSV/TSV data with column mapping
export function parseCsvData(rawInput: string): { success: ParsedGameRun[], failed: number, errors: string[] } {
  const lines = rawInput.trim().split('\n');
  if (lines.length === 0) {
    return { success: [], failed: 0, errors: ['No data provided'] };
  }

  const success: ParsedGameRun[] = [];
  const errors: string[] = [];
  let failed = 0;

  // Parse header to determine delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  
  // Parse headers
  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/["']/g, ''));
  
  // Column mapping from CSV headers to our internal structure
  const columnMap: Record<string, string> = {
    'Date': 'date',
    'Time': 'time', 
    'Tier': 'Tier',
    'Wave': 'Wave',
    'Hrs': 'hours',
    'Min': 'minutes', 
    'Sec': 'seconds',
    'Duration': 'Real Time',
    'Coins': 'Coins Earned',
    'Cells': 'Cells Earned',
    'CellsPerHour': 'skip', // Computed field
    'CoinsPerHour': 'skip', // Computed field
    'CoinsPerDay': 'skip', // Computed field
    'Killed By': 'Killed By',
    'Notes': 'notes'
  };

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Split the line and clean values
      const values = line.split(delimiter).map(v => v.trim().replace(/["']/g, ''));
      
      // Allow for fewer columns than headers (missing trailing columns are OK)
      // Only error if we have MORE columns than expected
      if (values.length > headers.length) {
        errors.push(`Row ${i + 1}: Too many columns (expected max ${headers.length}, got ${values.length})`);
        failed++;
        continue;
      }

      // Build raw data object
      const rawData: Record<string, string> = {};
      let date = '';
      let time = '';
      let hours = '0';
      let minutes = '0';  
      let seconds = '0';
      let notes = '';

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = values[j] || ''; // Use empty string if value doesn't exist
        const mappedField = columnMap[header];

        if (mappedField === 'skip') continue;
        
        if (mappedField === 'date') {
          date = value;
        } else if (mappedField === 'time') {
          time = value;
        } else if (mappedField === 'hours') {
          hours = value || '0';
        } else if (mappedField === 'minutes') {
          minutes = value || '0';
        } else if (mappedField === 'seconds') {
          seconds = value || '0';
        } else if (mappedField === 'notes') {
          notes = value;
        } else if (mappedField) {
          rawData[mappedField] = value;
        }
      }

      // Create Real Time from hours/minutes/seconds 
      // Always use Hrs/Min/Sec if available, even if Duration is provided (Duration might be formatted differently)
      if (hours !== '0' || minutes !== '0' || seconds !== '0') {
        const parts = [];
        if (hours !== '0') parts.push(`${hours}h`);
        if (minutes !== '0') parts.push(`${minutes}m`);
        if (seconds !== '0') parts.push(`${seconds}s`);
        
        if (parts.length > 0) {
          rawData['Real Time'] = parts.join(' ');
        }
      }

      // Parse timestamp
      let timestamp: Date;
      try {
        if (date && time) {
          timestamp = new Date(`${date} ${time}`);
        } else if (date) {
          timestamp = new Date(date);
        } else {
          timestamp = new Date();
        }
        
        if (isNaN(timestamp.getTime())) {
          timestamp = new Date();
        }
      } catch {
        timestamp = new Date();
      }

      // Generate field structure for CSV imports
      const fields: Record<string, GameRunField> = {};
      const fieldsByOriginalKey = new Map<string, string>();
      
      for (const [originalKey, rawValue] of Object.entries(rawData)) {
        const camelKey = fieldUtilsToCamelCase(originalKey);
        const field = createGameRunField(originalKey, rawValue);
        
        fields[camelKey] = field;
        fieldsByOriginalKey.set(originalKey.toLowerCase(), camelKey);
      }
      
      // Add notes from CSV if provided
      if (notes) {
        fields.notes = {
          value: notes,
          rawValue: notes,
          displayValue: notes,
          originalKey: 'Notes',
          dataType: 'string'
        };
        fieldsByOriginalKey.set('notes', 'notes');
      }
      
      // Extract key stats from field structure
      const csvFieldKeyStats = extractKeyStatsFromFields(fields);

      const parsedRun: ParsedGameRun = {
        id: crypto.randomUUID(),
        timestamp,
        fields,
        _fieldsByOriginalKey: fieldsByOriginalKey,
        ...csvFieldKeyStats,
      };

      success.push(parsedRun);
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }

  return { success, failed, errors };
}
