// Data Tracking Components
export { DataInput } from '../data-import/manual-entry/data-input';
export { DataInputErrorBoundary } from '../data-import/manual-entry/data-input-error-boundary';
export { CsvImport } from '../data-import/csv-import/csv-import';
export { CsvExport } from '../data-export/csv-export/csv-export';
export { DataProvider } from './components/data-provider';
export { DataSettings } from '../settings/data-settings/data-settings';
export { MigrationAlert } from '../settings/data-settings/migration-alert';
export { RunsTable } from '../game-runs/runs-table';
export { TabbedRunsTable } from '../game-runs/table/tabbed-runs-table';
export { DeathsRadarChart } from '../analysis/deaths-radar/deaths-radar-chart';
export { TierStatsTable } from '../analysis/tier-stats/tier-stats-table';
export { TimeSeriesChart } from '../analysis/time-series/time-series-chart';
export { TierTrendsAnalysis } from '../analysis/tier-trends/tier-trends-analysis';
export { RunTypeSelector } from './components/run-type-selector';
export { FarmingOnlyIndicator } from './components/farming-only-indicator';

// Data Tracking Hooks
export { useData, useDataProvider, DataContext } from './hooks/use-data';
export { useDataSettings } from '../settings/data-settings/use-data-settings';
export { useFileImport } from '../data-import/csv-import/input/csv-file-upload';
export { useGlobalDataInput } from '../data-import/manual-entry/use-global-data-input';
export { GlobalDataInputProvider } from '../data-import/global-data-input-provider';
export { useChartNavigation } from '../navigation/hooks/use-chart-navigation';
export { useRunsNavigation } from './hooks/use-runs-navigation';
export type { ChartType } from '../navigation/hooks/use-chart-navigation';
export type { RunsTabType } from './hooks/use-runs-navigation';

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
// NOTE: Utilities moved to analysis/shared - import directly from there
// export { parseGameRun, formatNumber, formatDuration } from '@/features/analysis/shared/parsing/data-parser';
// export { createGameRunField, getFieldValue, getFieldDisplay, getFieldRaw, toCamelCase } from '@/features/analysis/shared/parsing/field-utils';

// CSV Import/Export
export {
  parseGenericCsv,
  getDelimiterString,
  getSupportedFields
} from '../data-import/csv-import/csv-parser';

export {
  exportToCsv,
  detectDelimiterConflicts,
  generateExportFilename,
  copyToClipboard,
  downloadAsFile
} from '../data-export/csv-export/csv-exporter';

export type {
  CsvExportConfig,
  CsvExportResult,
  DelimiterConflict
} from '../data-export/csv-export/csv-exporter';

export {
  saveRunsToStorage,
  loadRunsFromStorage,
  runsToStorageCsv,
  storageCsvToRuns
} from '../data-import/csv-import/csv-persistence';

// Time series functions
export {
  prepareTimeSeriesData,
} from '../analysis/time-series/chart-data';

// Radar chart functions
export {
  prepareKilledByData,
  prepareRadarChartData,
} from '../analysis/deaths-radar/radar-calculations';

// Tier stats functions
export {
  prepareTierStatsData,
} from '../analysis/tier-stats/calculations/tier-stats-data';

// Date aggregation functions
// NOTE: Utilities moved to analysis/time-series/logic - import directly from there
// export { prepareWeeklyData, prepareMonthlyData, prepareYearlyData } from '@/features/analysis/time-series/logic/date-aggregation';

// Chart formatting functions
// NOTE: Utilities moved to analysis/shared - import directly from there
// export { formatLargeNumber, generateYAxisTicks } from '@/features/analysis/shared/formatting/chart-formatters';

// Time period configurations
export {
  TIME_PERIOD_CONFIGS
} from '../analysis/time-series/chart-types';

export {
  calculateTierTrends,
  getAvailableTiersForTrends,
  formatFieldDisplayName,
  generateSparklinePath
} from '../analysis/tier-trends/calculations/tier-trends-calculations';

export {
  createInitialFormState,
  createInitialDateTimeState,
  formatTimeFromDate,
  createDateTimeFromComponents
} from '../data-import/manual-entry/data-input-state';

// Run type filter functions
// NOTE: Utilities moved to analysis/shared - import directly from there
// export { filterRunsByType, getFarmingRuns, getTournamentRuns, isFarmingRun, determineRunType, getRunTypeDisplayLabel } from '@/features/analysis/shared/filtering/run-type-filter';
// export type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter';

// Time series types
export type {
  TimePeriod,
  TimePeriodConfig,
} from '../analysis/time-series/chart-types';

// Tier stats types
export type {
  TierStatsData,
} from '../analysis/tier-stats/calculations/tier-stats-data';

// Date aggregation types
// NOTE: Types moved to analysis/time-series/logic - import directly from there
// export type { WeeklyAggregatePoint, MonthlyAggregatePoint, YearlyAggregatePoint } from '@/features/analysis/time-series/logic/date-aggregation';