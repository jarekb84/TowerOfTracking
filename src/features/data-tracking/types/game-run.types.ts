// Raw data structure as pasted from clipboard (flexible to handle any property names)
export type RawGameRunData = Record<string, string>;

// Run type enumeration for type safety
export enum RunType {
  FARM = 'farm',
  TOURNAMENT = 'tournament'
}

// Type alias for backwards compatibility and union types
export type RunTypeValue = `${RunType}`;


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
  readonly runType: RunTypeValue;
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

// Tier Trends Analysis Types
export interface TierTrendsFilters {
  tier: number;
  changeThresholdPercent: number; // Only show fields with changes above this threshold
  duration: 'per-run' | 'daily' | 'weekly' | 'monthly'; // Time span for analysis
  quantity: number; // Number of periods to analyze (2-7)
  aggregationType?: 'sum' | 'min' | 'max' | 'average'; // Only used when duration is not 'per-run'
}

export interface FieldTrendData {
  fieldName: string;
  displayName: string;
  dataType: GameRunField['dataType'];
  values: number[]; // Values from oldest to newest run
  change: {
    absolute: number; // Absolute change from first to last
    percent: number; // Percentage change from first to last
    direction: 'up' | 'down' | 'stable'; // Trend direction
  };
  trendType: 'linear' | 'upward' | 'downward' | 'volatile' | 'stable';
  significance: 'high' | 'medium' | 'low'; // Based on change threshold
}

export interface ComparisonColumn {
  header: string; // Display header
  subHeader?: string; // Optional second line for header
  values: Record<string, number>; // fieldName -> value mapping
}

export interface TierTrendsData {
  tier: number;
  periodCount: number; // How many periods were actually analyzed
  periodLabels: string[]; // Labels for each period (newest to oldest)
  comparisonColumns: ComparisonColumn[]; // Dynamic comparison columns (2-7)
  fieldTrends: FieldTrendData[];
  summary: {
    totalFields: number;
    fieldsChanged: number; // Replaces significantChanges
    topGainers: FieldTrendData[]; // Top 3 fields with highest positive change
    topDecliners: FieldTrendData[]; // Top 3 fields with highest negative change
  };
}
