import { ParsedGameRun } from '@/shared/types/game-run.types'
import {
  ChartDataPoint,
  TimePeriodConfig,
  TIME_PERIOD_CONFIGS
} from './chart-types'
import { Duration } from '@/shared/domain/filters/types'
import { getAvailableDurations } from '@/shared/domain/filters/duration/duration-filter-logic'
import {
  prepareFieldPerRunData,
  prepareFieldPerHourData,
  prepareFieldPerDayData,
  prepareFieldPerWeekData,
  prepareFieldPerMonthData,
  prepareFieldPerYearData
} from './date-aggregation'

/**
 * Generic function to prepare data for any time period
 * Transforms aggregated data into common ChartDataPoint format
 */
export function prepareTimeSeriesData(
  runs: ParsedGameRun[],
  period: Duration,
  metric: string
): ChartDataPoint[] {
  switch (period) {
    case Duration.HOURLY:
      return prepareFieldPerHourData(runs, metric)
    case Duration.PER_RUN:
      return prepareFieldPerRunData(runs, metric)
    case Duration.DAILY:
      return prepareFieldPerDayData(runs, metric)
    case Duration.WEEKLY:
      return prepareFieldPerWeekData(runs, metric)
    case Duration.MONTHLY:
      return prepareFieldPerMonthData(runs, metric)
    case Duration.YEARLY:
      return prepareFieldPerYearData(runs, metric)
    default:
      return []
  }
}

/**
 * Determine which time periods should be available based on data span.
 * Delegates to shared getAvailableDurations() for consistent logic.
 */
export function getAvailableTimePeriods(runs: ParsedGameRun[]): TimePeriodConfig[] {
  const availableDurations = getAvailableDurations(runs)
  return TIME_PERIOD_CONFIGS.filter(config => availableDurations.includes(config.period))
}
