// Raw data structure as pasted from clipboard (flexible to handle any property names)
export type RawGameRunData = Record<string, string>;


// Main game run interface with enhanced field structure
export interface ParsedGameRun {
  id: string;
  timestamp: Date;
  
  // Single data source with rich field objects
  fields: Record<string, GameRunField>;
  
  // Cached computed properties for performance
  readonly tier: number;
  readonly wave: number;
  readonly coinsEarned: number;
  readonly cellsEarned: number;
  readonly realTime: number;
  readonly runType: 'farm' | 'tournament';
}

export interface GameRunFilters {
  searchTerm?: string;
  tierRange?: { min?: number; max?: number };
  dateRange?: { start?: Date; end?: Date };
}

// Type for raw clipboard input
export type RawClipboardData = Record<string, string>;

// NEW: Enhanced field interface for single source of truth
export interface GameRunField {
  // Computed values for analytics
  value: number | string | Date;
  
  // Display formats
  rawValue: string;           // Original clipboard value
  displayValue: string;       // Formatted for display (70.5B, 2h 45m)
  
  // Metadata
  originalKey: string;        // Original clipboard key
  dataType: 'number' | 'duration' | 'string' | 'date';
}
// Number suffixes for parsing
export type NumberSuffix = 'K' | 'M' | 'B' | 'T' | 'Q' | 'q' | 'S' | 's' | 'O';

// Duration format types
export type DurationUnit = 'd' | 'h' | 'm' | 's';
export type DurationString = string; // Format: "1d 13h 24m 51s"

// Generic CSV Parser Types
export interface CsvParseConfig {
  delimiter?: string;
  supportedFields: string[];
  skipUnknownFields?: boolean;
}

export interface CsvParseResult {
  success: ParsedGameRun[];
  failed: number;
  errors: string[];
  fieldMappingReport: FieldMappingReport;
}

export interface FieldMappingReport {
  mappedFields: Array<{ 
    csvHeader: string; 
    camelCase: string; 
    supported: boolean;
  }>;
  unsupportedFields: string[];
  skippedFields: string[];
}

export type CsvDelimiter = 'tab' | 'comma' | 'semicolon' | 'custom';
