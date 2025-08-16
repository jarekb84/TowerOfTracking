// Data Tracking Components
export { DataInput } from './components/data-input';
export { CsvImport } from './components/csv-import';
export { DataProvider } from './components/data-provider';
export { RunsTable } from './components/runs-table';
export { CoinsPerRunChart } from './components/coins-per-run-chart';
export { CoinsPerDayChart } from './components/coins-per-day-chart';
export { CellsPerRunChart } from './components/cells-per-run-chart';
export { CellsPerDayChart } from './components/cells-per-day-chart';
export { DeathsRadarChart } from './components/deaths-radar-chart';

// Data Tracking Hooks
export { useData, useDataProvider, DataContext } from './hooks/use-data';

// Data Tracking Types
export type { 
  ParsedGameRun, 
  RawGameRunData, 
  CamelCaseGameRunData, 
  ProcessedGameRunData,
  GameRunFilters, 
  GameRunSortConfig, 
  GameRunTableColumn,
  DataTransformResult,
  RawClipboardData
} from './types/game-run.types';

// Data Tracking Utilities
export { 
  parseGameRun, 
  parseCsvData,
  parseDuration, 
  parseShorthandNumber, 
  parseTabDelimitedData, 
  transformGameRunData,
  toCamelCase,
  extractKeyStats, 
  formatNumber, 
  formatDuration 
} from './utils/data-parser';

export {
  prepareCoinsPerRunData,
  prepareCoinsPerDayData,
  prepareCellsPerRunData,
  prepareCellsPerDayData,
  prepareKilledByData,
  prepareRadarChartData,
  formatLargeNumber,
  generateYAxisTicks
} from './utils/chart-data';