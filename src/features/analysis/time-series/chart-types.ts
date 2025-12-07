// Chart data types and interfaces

// Re-export shared RunInfo type for consumers of this module
export type { RunInfo } from '@/features/analysis/shared/tooltips/run-info-header'
import type { RunInfo } from '@/features/analysis/shared/tooltips/run-info-header'

export interface PeriodInfo {
  /** Daily average for this period */
  dailyAverage: number
  /** Number of days used in calculation */
  daysInPeriod: number
}

export interface ChartDataPoint {
  date: string
  value: number
  timestamp: Date
  /** Optional run info for per-run data points */
  runInfo?: RunInfo
  /** Optional period info for weekly/monthly daily averages */
  periodInfo?: PeriodInfo
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

// Time period configurations - Enhanced color palette for better visual harmony
export const TIME_PERIOD_CONFIGS: TimePeriodConfig[] = [
  { period: 'hourly', label: 'Per Hour', color: '#ec4899', dateFormat: 'MMM dd' }, // Pink for granular data
  { period: 'run', label: 'Per Run', color: '#8b5cf6', dateFormat: 'MMM dd' }, // Purple for individual runs
  { period: 'daily', label: 'Daily', color: '#06d6a0', dateFormat: 'MMM dd' }, // Mint green for daily aggregation
  { period: 'weekly', label: 'Weekly', color: '#ffbe0b', dateFormat: 'MMM dd' }, // Golden yellow for weekly
  { period: 'monthly', label: 'Monthly', color: '#f72585', dateFormat: 'MMM yyyy' }, // Hot pink for monthly
  { period: 'yearly', label: 'Yearly', color: '#3a86ff', dateFormat: 'yyyy' } // Electric blue for yearly
]