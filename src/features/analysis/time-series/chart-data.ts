import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { ParsedGameRun } from '@/shared/types/game-run.types'
import {
  ChartDataPoint,
  TimePeriod,
  TimePeriodConfig,
  TIME_PERIOD_CONFIGS
} from './chart-types'
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
  period: TimePeriod,
  metric: string
): ChartDataPoint[] {
  switch (period) {
    case 'hourly':
      return prepareFieldPerHourData(runs, metric)
    case 'run':
      return prepareFieldPerRunData(runs, metric)
    case 'daily':
      return prepareFieldPerDayData(runs, metric)
    case 'weekly':
      return prepareFieldPerWeekData(runs, metric)
    case 'monthly':
      return prepareFieldPerMonthData(runs, metric)
    case 'yearly':
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
      config.period === 'hourly' || config.period === 'run'
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
  const availablePeriods: TimePeriod[] = ['hourly', 'run']

  // Always show daily view if we have any data
  if (uniqueDays.size >= 1) {
    availablePeriods.push('daily')
  }

  // Always show weekly view if we have any data
  if (uniqueWeeks.size >= 1) {
    availablePeriods.push('weekly')
  }

  // Always show monthly view if we have any data
  if (uniqueMonths.size >= 1) {
    availablePeriods.push('monthly')
  }

  // Only show yearly view if we have data spanning multiple years
  if (uniqueYears.size > 1) {
    availablePeriods.push('yearly')
  }

  // Return configurations for available periods in original order
  return TIME_PERIOD_CONFIGS.filter(config =>
    availablePeriods.includes(config.period)
  )
}
