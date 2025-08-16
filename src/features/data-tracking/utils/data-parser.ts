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
  RawGameRunData, 
  CamelCaseGameRunData, 
  ProcessedGameRunData,
  DataTransformResult,
  RawClipboardData
} from '../types/game-run.types';

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

// Convert property name to camelCase
export function toCamelCase(str: string): string {
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
    if (key === 'Game Time' || key === 'Real Time') {
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

// Calculate value per hour
export function calculatePerHour(value: number, durationInSeconds: number): number {
  if (durationInSeconds === 0) {
    return 0;
  }
  const hours = durationInSeconds / 3600;
  return value / hours;
}

// Main parsing function
export function parseGameRun(rawInput: string, customTimestamp?: Date): ParsedGameRun {
  try {
    const clipboardData = parseTabDelimitedData(rawInput);
    console.log('Parsed clipboard data:', clipboardData);
    
    const { camelCaseData, processedData } = transformGameRunData(clipboardData);
    console.log('Transformed data:', { camelCaseData, processedData });
    
    const keyStats = extractKeyStats(processedData);
    console.log('Key stats:', keyStats);
    
    // Raw data is just the clipboard data as-is
    const rawData: RawGameRunData = clipboardData;
    
    return {
      id: crypto.randomUUID(),
      timestamp: customTimestamp || new Date(),
      rawData: rawData as RawGameRunData,
      camelCaseData,
      processedData,
      ...keyStats,
    };
  } catch (error) {
    console.error('Error parsing game run:', error);
    throw error;
  }
}

// Format numbers back to human-readable format
export function formatNumber(value: number): string {
  if (value < 1000) return value.toString();
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
