import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { ParsedGameRun } from '@/shared/types/game-run.types'
import {
  ChartDataPoint,
  TimePeriodConfig,
  TIME_PERIOD_CONFIGS
} from './chart-types'
import { Duration } from '@/shared/domain/filters/types'
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
 * Function to determine which time periods should be available based on data span
 * Optimized to use single pass through data for all period calculations
 */
export function getAvailableTimePeriods(runs: ParsedGameRun[]): TimePeriodConfig[] {
  if (runs.length === 0) {
    // Always show hourly and per run when no data
    return TIME_PERIOD_CONFIGS.filter(config =>
      config.period === Duration.HOURLY || config.period === Duration.PER_RUN
    )
  }

  // Single pass to collect all unique periods
  const uniqueDays = new Set<string>()
  const uniqueWeeks = new Set<string>()
  const uniqueMonths = new Set<string>()
  const uniqueYears = new Set<string>()

  runs.forEach(run => {
    const timestamp = run.timestamp
    uniqueDays.add(format(startOfDay(timestamp), 'yyyy-MM-dd'))
    uniqueWeeks.add(format(startOfWeek(timestamp, { weekStartsOn: 0 }), 'yyyy-MM-dd'))
    uniqueMonths.add(format(startOfMonth(timestamp), 'yyyy-MM'))
    uniqueYears.add(format(startOfYear(timestamp), 'yyyy'))
  })

  // Always include hourly and per run
  const availablePeriods: Duration[] = [Duration.HOURLY, Duration.PER_RUN]

  // Always show daily view if we have any data
  if (uniqueDays.size >= 1) {
    availablePeriods.push(Duration.DAILY)
  }

  // Always show weekly view if we have any data
  if (uniqueWeeks.size >= 1) {
    availablePeriods.push(Duration.WEEKLY)
  }

  // Always show monthly view if we have any data
  if (uniqueMonths.size >= 1) {
    availablePeriods.push(Duration.MONTHLY)
  }

  // Only show yearly view if we have data spanning multiple years
  if (uniqueYears.size > 1) {
    availablePeriods.push(Duration.YEARLY)
  }

  // Return configurations for available periods in original order
  return TIME_PERIOD_CONFIGS.filter(config =>
    availablePeriods.includes(config.period)
  )
}
