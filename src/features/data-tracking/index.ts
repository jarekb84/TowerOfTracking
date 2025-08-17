// Data Tracking Components
export { DataInput } from './components/data-input';
export { CsvImport } from './components/csv-import';
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
  RawClipboardData
} from './types/game-run.types';

// Data Tracking Utilities
export { 
  parseGameRun, 
  parseCsvData,
  formatNumber, 
  formatDuration 
} from './utils/data-parser';

// Field Utilities
export {
  createGameRunField,
  findField,
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