import type { TimePeriod } from '../chart-types'

/**
 * Period-specific trend window options.
 * Each array is the single source of truth for that period's valid values.
 */
const HOURLY_OPTIONS = [
  { value: 'none', label: 'No Trend' },
  { value: '6h', label: '6 hours' },
  { value: '12h', label: '12 hours' },
  { value: '24h', label: '24 hours' },
  { value: '48h', label: '48 hours' },
] as const

const RUN_OPTIONS = [
  { value: 'none', label: 'No Trend' },
  { value: '3r', label: '3 runs' },
  { value: '5r', label: '5 runs' },
  { value: '10r', label: '10 runs' },
] as const

const DAILY_OPTIONS = [
  { value: 'none', label: 'No Trend' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: '14d', label: '14 days' },
  { value: '21d', label: '21 days' },
] as const

const WEEKLY_OPTIONS = [
  { value: 'none', label: 'No Trend' },
  { value: '2w', label: '2 weeks' },
  { value: '3w', label: '3 weeks' },
  { value: '4w', label: '4 weeks' },
] as const

const MONTHLY_OPTIONS = [
  { value: 'none', label: 'No Trend' },
  { value: '2m', label: '2 months' },
  { value: '3m', label: '3 months' },
  { value: '4m', label: '4 months' },
] as const

const YEARLY_OPTIONS = [{ value: 'none', label: 'No Trend' }] as const

/**
 * Maps time periods to their trend window options.
 */
const OPTIONS_BY_PERIOD = {
  hourly: HOURLY_OPTIONS,
  run: RUN_OPTIONS,
  daily: DAILY_OPTIONS,
  weekly: WEEKLY_OPTIONS,
  monthly: MONTHLY_OPTIONS,
  yearly: YEARLY_OPTIONS,
} as const

/**
 * All valid trend window values derived from the option definitions.
 */
type HourlyValue = (typeof HOURLY_OPTIONS)[number]['value']
type RunValue = (typeof RUN_OPTIONS)[number]['value']
type DailyValue = (typeof DAILY_OPTIONS)[number]['value']
type WeeklyValue = (typeof WEEKLY_OPTIONS)[number]['value']
type MonthlyValue = (typeof MONTHLY_OPTIONS)[number]['value']

export type TrendWindowValue =
  | HourlyValue
  | RunValue
  | DailyValue
  | WeeklyValue
  | MonthlyValue

interface TrendWindowOption {
  readonly value: TrendWindowValue
  readonly label: string
}

/**
 * Get trend window options for a specific time period.
 */
export function getTrendWindowOptions(period: TimePeriod): readonly TrendWindowOption[] {
  return OPTIONS_BY_PERIOD[period]
}

/**
 * Get the default trend window value.
 */
export function getDefaultTrendWindow(): TrendWindowValue {
  return 'none'
}

/**
 * Maps TrendWindowValue to numeric window size for calculation.
 * Returns null for 'none' (no trend line).
 */
export function getWindowSize(value: TrendWindowValue): number | null {
  if (value === 'none') return null
  return parseInt(value.slice(0, -1), 10)
}

/**
 * Type guard to check if a value is a valid TrendWindowValue.
 * Validates against all period option definitions.
 */
export function isValidTrendWindowValue(value: unknown): value is TrendWindowValue {
  if (typeof value !== 'string') return false

  return Object.values(OPTIONS_BY_PERIOD).some((options) =>
    options.some((opt) => opt.value === value)
  )
}

/**
 * Check if a trend window value is valid for a given period.
 */
export function isValidForPeriod(value: TrendWindowValue, period: TimePeriod): boolean {
  const options = OPTIONS_BY_PERIOD[period]
  return options.some((opt) => opt.value === value)
}
