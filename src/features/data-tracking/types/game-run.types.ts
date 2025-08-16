export interface ParsedGameRun {
  id: string;
  timestamp: Date;
  rawData: Record<string, string>;
  parsedData: Record<string, number | string | Date>;
  // Key stats for table display
  tier?: number;
  wave?: number;
  coins?: number;
  cash?: number;
  cells?: number;
  duration?: number; // in seconds
}

export interface GameRunFilters {
  searchTerm?: string;
  tierRange?: { min?: number; max?: number };
  dateRange?: { start?: Date; end?: Date };
}

export interface GameRunSortConfig {
  field: keyof ParsedGameRun;
  direction: 'asc' | 'desc';
}

export interface GameRunTableColumn {
  id: string;
  header: string;
  accessor: keyof ParsedGameRun;
  sortable?: boolean;
  formatter?: (value: unknown) => string;
}