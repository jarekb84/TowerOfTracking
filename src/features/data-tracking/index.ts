// Data Tracking Components
export { DataInput } from './components/data-input';
export { CsvImport } from './components/csv-import';
export { CsvExport } from './components/csv-export';
export { DataProvider } from './components/data-provider';
export { DataSettings } from './components/data-settings';
export { RunsTable } from './components/runs-table';
export { TabbedRunsTable } from './components/runs-table/tabbed-runs-table';
export { DeathsRadarChart } from './components/deaths-radar-chart';
export { TierStatsTable } from './components/tier-stats-table';
export { TimeSeriesChart } from './components/time-series-chart';
export { TierTrendsAnalysis } from './components/tier-trends-analysis';
export { RunTypeSelector } from './components/run-type-selector';
export { FarmingOnlyIndicator } from './components/farming-only-indicator';

// Data Tracking Hooks
export { useData, useDataProvider, DataContext } from './hooks/use-data';
export { useDataSettings } from './hooks/use-data-settings';
export { useFileImport } from './hooks/use-file-import';

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
  CsvDelimiter,
  TierTrendsFilters,
  TierTrendsData,
  FieldTrendData,
  RunTypeValue
} from './types/game-run.types';

export { RunType } from './types/game-run.types';

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

export {
  saveRunsToStorage,
  loadRunsFromStorage,
  runsToStorageCsv,
  storageCsvToRuns
} from './utils/csv-persistence';

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

export {
  calculateTierTrends,
  getAvailableTiersForTrends,
  formatFieldDisplayName,
  generateSparklinePath
} from './utils/tier-trends';

export {
  filterRunsByType,
  getFarmingRuns,
  getTournamentRuns,
  isFarmingRun,
  determineRunType,
  getRunTypeDisplayLabel
} from './utils/run-type-filter';

export type {
  RunTypeFilter
} from './utils/run-type-filter';

export type {
  TierStatsData,
  TimePeriod,
  TimePeriodConfig,
  WeeklyAggregatePoint,
  MonthlyAggregatePoint,
  YearlyAggregatePoint
} from './utils/chart-data';