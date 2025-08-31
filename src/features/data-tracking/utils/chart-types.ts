// Chart data types and interfaces
export interface ChartDataPoint {
  date: string
  value: number
  timestamp: Date
}

export interface DailyAggregatePoint {
  date: string
  totalCoins: number
  runCount: number
  avgCoins: number
  timestamp: Date
}

export interface DailyCellsAggregatePoint {
  date: string
  totalCells: number
  runCount: number
  avgCells: number
  timestamp: Date
}

export interface WeeklyAggregatePoint {
  date: string
  totalCoins: number
  totalCells: number
  runCount: number
  avgCoins: number
  avgCells: number
  timestamp: Date
}

export interface MonthlyAggregatePoint {
  date: string
  totalCoins: number
  totalCells: number
  runCount: number
  avgCoins: number
  avgCells: number
  timestamp: Date
}

export interface YearlyAggregatePoint {
  date: string
  totalCoins: number
  totalCells: number
  runCount: number
  avgCoins: number
  avgCells: number
  timestamp: Date
}

export type TimePeriod = 'hourly' | 'run' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface TimePeriodConfig {
  period: TimePeriod
  label: string
  color: string
  dateFormat: string
}

export interface KilledByData {
  killedBy: string
  count: number
  percentage: number
}

export interface TierKilledByData {
  tier: number
  killedByStats: KilledByData[]
  totalDeaths: number
}

export interface TierStatsData {
  tier: number
  maxWave: number
  maxDuration: number // in seconds
  maxCoins: number
  maxCoinsPerHour: number
  maxCells: number
  maxCellsPerHour: number
}

// Time period configurations - Enhanced color palette for better visual harmony
export const TIME_PERIOD_CONFIGS: TimePeriodConfig[] = [
  { period: 'hourly', label: 'Per Hour', color: '#ec4899', dateFormat: 'MMM dd' }, // Pink for granular data
  { period: 'run', label: 'Per Run', color: '#8b5cf6', dateFormat: 'MMM dd' }, // Purple for individual runs
  { period: 'daily', label: 'Daily', color: '#06d6a0', dateFormat: 'MMM dd' }, // Mint green for daily aggregation
  { period: 'weekly', label: 'Weekly', color: '#ffbe0b', dateFormat: 'MMM dd' }, // Golden yellow for weekly
  { period: 'monthly', label: 'Monthly', color: '#f72585', dateFormat: 'MMM yyyy' }, // Hot pink for monthly
  { period: 'yearly', label: 'Yearly', color: '#3a86ff', dateFormat: 'yyyy' } // Electric blue for yearly
]