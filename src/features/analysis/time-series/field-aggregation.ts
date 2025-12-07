import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { ParsedGameRun } from '@/shared/types/game-run.types'
import { ChartDataPoint } from '@/features/analysis/time-series/chart-types'
import { extractFieldValue } from './field-extraction'
import { groupRunsByDateKey } from './date-aggregation'
import {
  formatDisplayMonthDay,
  formatDisplayMonth,
} from '@/shared/formatting/date-formatters'
import {
  calculateWeeklyDailyAverage,
  calculateMonthlyDailyAverage,
} from './daily-average'

/**
 * Field aggregation functions
 * Support any numeric field from ParsedGameRun for flexible analytics
 */

/**
 * Function to prepare per-run data for any field
 * Includes run context info (tier, wave, duration, timestamp) for enhanced tooltips
 */
export function prepareFieldPerRunData(
  runs: ParsedGameRun[],
  fieldKey: string
): ChartDataPoint[] {
  return runs
    .map(run => {
      const value = extractFieldValue(run, fieldKey)
      return {
        date: formatDisplayMonthDay(run.timestamp),
        value: value ?? 0,
        timestamp: run.timestamp,
        runInfo: {
          tier: run.tier,
          wave: run.wave,
          realTime: run.realTime,
          timestamp: run.timestamp,
        },
      }
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Function to prepare per-hour data for any field
 */
export function prepareFieldPerHourData(
  runs: ParsedGameRun[],
  fieldKey: string
): ChartDataPoint[] {
  return runs
    .filter(run => run.realTime && run.realTime > 0)
    .map(run => {
      const value = extractFieldValue(run, fieldKey)
      const hourlyRate = ((value ?? 0) / run.realTime) * 3600
      return {
        date: formatDisplayMonthDay(run.timestamp),
        value: hourlyRate,
        timestamp: run.timestamp,
      }
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Function to prepare daily aggregated data for any field
 */
export function prepareFieldPerDayData(
  runs: ParsedGameRun[],
  fieldKey: string
): ChartDataPoint[] {
  const dailyGroups = groupRunsByDateKey(
    runs,
    timestamp => format(startOfDay(timestamp), 'yyyy-MM-dd')
  )

  const dailyData: ChartDataPoint[] = []

  dailyGroups.forEach((dayRuns) => {
    const total = dayRuns.reduce((sum, run) => {
      const value = extractFieldValue(run, fieldKey)
      return sum + (value ?? 0)
    }, 0)
    const timestamp = startOfDay(dayRuns[0].timestamp)

    dailyData.push({
      date: formatDisplayMonthDay(timestamp),
      value: total,
      timestamp,
    })
  })

  return dailyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Function to prepare weekly aggregated data for any field
 * Includes daily average calculation for tooltip display
 */
export function prepareFieldPerWeekData(
  runs: ParsedGameRun[],
  fieldKey: string
): ChartDataPoint[] {
  const weeklyGroups = groupRunsByDateKey(
    runs,
    timestamp => format(startOfWeek(timestamp, { weekStartsOn: 0 }), 'yyyy-MM-dd')
  )

  const weeklyData: ChartDataPoint[] = []

  weeklyGroups.forEach((weekRuns) => {
    const total = weekRuns.reduce((sum, run) => {
      const value = extractFieldValue(run, fieldKey)
      return sum + (value ?? 0)
    }, 0)
    const timestamp = startOfWeek(weekRuns[0].timestamp, { weekStartsOn: 0 })
    const periodInfo = calculateWeeklyDailyAverage(total, timestamp)

    weeklyData.push({
      date: formatDisplayMonthDay(timestamp),
      value: total,
      timestamp,
      periodInfo,
    })
  })

  return weeklyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Function to prepare monthly aggregated data for any field
 * Includes daily average calculation for tooltip display
 */
export function prepareFieldPerMonthData(
  runs: ParsedGameRun[],
  fieldKey: string
): ChartDataPoint[] {
  const monthlyGroups = groupRunsByDateKey(
    runs,
    timestamp => format(startOfMonth(timestamp), 'yyyy-MM')
  )

  const monthlyData: ChartDataPoint[] = []

  monthlyGroups.forEach((monthRuns) => {
    const total = monthRuns.reduce((sum, run) => {
      const value = extractFieldValue(run, fieldKey)
      return sum + (value ?? 0)
    }, 0)
    const timestamp = startOfMonth(monthRuns[0].timestamp)
    const periodInfo = calculateMonthlyDailyAverage(total, timestamp)

    monthlyData.push({
      date: `${formatDisplayMonth(timestamp)} ${timestamp.getFullYear()}`,
      value: total,
      timestamp,
      periodInfo,
    })
  })

  return monthlyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

/**
 * Function to prepare yearly aggregated data for any field
 */
export function prepareFieldPerYearData(
  runs: ParsedGameRun[],
  fieldKey: string
): ChartDataPoint[] {
  const yearlyGroups = groupRunsByDateKey(
    runs,
    timestamp => format(startOfYear(timestamp), 'yyyy')
  )

  const yearlyData: ChartDataPoint[] = []

  yearlyGroups.forEach((yearRuns, yearKey) => {
    const total = yearRuns.reduce((sum, run) => {
      const value = extractFieldValue(run, fieldKey)
      return sum + (value ?? 0)
    }, 0)
    const timestamp = startOfYear(yearRuns[0].timestamp)

    yearlyData.push({
      date: yearKey,
      value: total,
      timestamp,
    })
  })

  return yearlyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}
