// Data Tracking Components
export { DataInput } from './components/data-input';
export { CsvImport } from './components/csv-import';
export { CsvExport } from './components/csv-export';
export { DataProvider } from './components/data-provider';
export { RunsTable } from './components/runs-table';
export { DeathsRadarChart } from './components/deaths-radar-chart';
export { TierStatsTable } from './components/tier-stats-table';
export { TimeSeriesChart } from './components/time-series-chart';

// Data Tracking Hooks
export { useData, useDataProvider, DataContext } from './hooks/use-data';

// Data Tracking Types
export type { 
  ParsedGameRun, 
  GameRunField,  
  RawGameRunData,
  GameRunFilters,
  RawClipboardData,
  CsvParseConfig,
  CsvParseResult,
  FieldMappingReport,
  CsvDelimiter
} from './types/game-run.types';

// Data Tracking Utilities
export { 
  parseGameRun, 
  formatNumber, 
  formatDuration 
} from './utils/data-parser';

// CSV Import/Export
export {
  parseGenericCsv,
  getDelimiterString,
  getSupportedFields
} from './utils/csv-parser';

export {
  exportToCsv,
  detectDelimiterConflicts,
  generateExportFilename,
  copyToClipboard,
  downloadAsFile
} from './utils/csv-exporter';

export type {
  CsvExportConfig,
  CsvExportResult,
  DelimiterConflict
} from './utils/csv-exporter';

// Field Utilities
export {
  createGameRunField,
  getFieldValue,
  getFieldDisplay,
  getFieldRaw,
  toCamelCase
} from './utils/field-utils';

export {
  prepareKilledByData,
  prepareRadarChartData,
  prepareTierStatsData,
  prepareTimeSeriesData,
  prepareWeeklyData,
  prepareMonthlyData,
  prepareYearlyData,
  formatLargeNumber,
  generateYAxisTicks,
  TIME_PERIOD_CONFIGS
} from './utils/chart-data';

export type {
  TierStatsData,
  TimePeriod,
  TimePeriodConfig,
  WeeklyAggregatePoint,
  MonthlyAggregatePoint,
  YearlyAggregatePoint
} from './utils/chart-data';