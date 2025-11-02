// Run type enumeration for type safety
enum RunType {
  FARM = 'farm',
  TOURNAMENT = 'tournament',
  MILESTONE = 'milestone'
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

// Tier Trends Analysis Types
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
