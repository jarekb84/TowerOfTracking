import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { ParsedGameRun } from '@/features/data-tracking/types/game-run.types'
import { ChartDataPoint, DailyAggregatePoint, DailyCellsAggregatePoint, WeeklyAggregatePoint, MonthlyAggregatePoint, YearlyAggregatePoint } from '@/features/analysis/time-series/chart-types'

// Generic function to group runs by a date key generator
export function groupRunsByDateKey(
  runs: ParsedGameRun[],
  getDateKey: (timestamp: Date) => string
): Map<string, ParsedGameRun[]> {
  const groups = new Map<string, ParsedGameRun[]>()
  
  runs.forEach(run => {
    const key = getDateKey(run.timestamp)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(run)
  })
  
  return groups
}

// Calculate aggregate statistics for a group of runs
export interface RunAggregates {
  totalCoins: number
  totalCells: number
  avgCoins: number
  avgCells: number
  runCount: number
}

export function calculateRunAggregates(runs: ParsedGameRun[]): RunAggregates {
  const totalCoins = runs.reduce((sum, run) => sum + run.coinsEarned, 0)
  const totalCells = runs.reduce((sum, run) => sum + run.cellsEarned, 0)
  const runCount = runs.length
  
  return {
    totalCoins,
    totalCells,
    avgCoins: runCount > 0 ? totalCoins / runCount : 0,
    avgCells: runCount > 0 ? totalCells / runCount : 0,
    runCount
  }
}

export function prepareCoinsPerRunData(runs: ParsedGameRun[]): ChartDataPoint[] {
  return runs
    .map(run => ({
      date: format(run.timestamp, 'MMM dd'),
      value: run.coinsEarned,
      timestamp: run.timestamp,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareCellsPerRunData(runs: ParsedGameRun[]): ChartDataPoint[] {
  return runs
    .map(run => ({
      date: format(run.timestamp, 'MMM dd'),
      value: run.cellsEarned,
      timestamp: run.timestamp,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareCoinsPerHourData(runs: ParsedGameRun[]): ChartDataPoint[] {
  return runs
    .filter(run => run.realTime && run.realTime > 0) // Filter out runs with invalid duration
    .map(run => ({
      date: format(run.timestamp, 'MMM dd'),
      value: (run.coinsEarned / run.realTime) * 3600, // Convert to per hour
      timestamp: run.timestamp,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareCellsPerHourData(runs: ParsedGameRun[]): ChartDataPoint[] {
  return runs
    .filter(run => run.realTime && run.realTime > 0) // Filter out runs with invalid duration
    .map(run => ({
      date: format(run.timestamp, 'MMM dd'),
      value: (run.cellsEarned / run.realTime) * 3600, // Convert to per hour
      timestamp: run.timestamp,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareCoinsPerDayData(runs: ParsedGameRun[]): DailyAggregatePoint[] {
  // Group runs by day using the shared function
  const dailyGroups = groupRunsByDateKey(
    runs,
    timestamp => format(startOfDay(timestamp), 'yyyy-MM-dd')
  )

  // Calculate daily aggregates
  const dailyData: DailyAggregatePoint[] = []

  dailyGroups.forEach((dayRuns) => {
    const totalCoins = dayRuns.reduce((sum, run) => sum + run.coinsEarned, 0)
    const runCount = dayRuns.length
    const avgCoins = totalCoins / runCount
    // Use startOfDay with the first run's timestamp to preserve the correct day
    const timestamp = startOfDay(dayRuns[0].timestamp)

    dailyData.push({
      date: format(timestamp, 'MMM dd'),
      totalCoins,
      runCount,
      avgCoins,
      timestamp,
    })
  })

  return dailyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareCellsPerDayData(runs: ParsedGameRun[]): DailyCellsAggregatePoint[] {
  // Group runs by day using the shared function
  const dailyGroups = groupRunsByDateKey(
    runs,
    timestamp => format(startOfDay(timestamp), 'yyyy-MM-dd')
  )

  // Calculate daily aggregates
  const dailyData: DailyCellsAggregatePoint[] = []

  dailyGroups.forEach((dayRuns) => {
    const totalCells = dayRuns.reduce((sum, run) => sum + run.cellsEarned, 0)
    const runCount = dayRuns.length
    const avgCells = totalCells / runCount
    // Use startOfDay with the first run's timestamp to preserve the correct day
    const timestamp = startOfDay(dayRuns[0].timestamp)

    dailyData.push({
      date: format(timestamp, 'MMM dd'),
      totalCells,
      runCount,
      avgCells,
      timestamp,
    })
  })

  return dailyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareWeeklyData(runs: ParsedGameRun[]): WeeklyAggregatePoint[] {
  // Group runs by week (starting Sunday) using the shared function
  const weeklyGroups = groupRunsByDateKey(
    runs,
    timestamp => format(startOfWeek(timestamp, { weekStartsOn: 0 }), 'yyyy-MM-dd')
  )

  // Calculate weekly aggregates
  const weeklyData: WeeklyAggregatePoint[] = []

  weeklyGroups.forEach((weekRuns) => {
    const aggregates = calculateRunAggregates(weekRuns)
    // Use startOfWeek with the first run's timestamp to preserve the correct week
    const timestamp = startOfWeek(weekRuns[0].timestamp, { weekStartsOn: 0 })

    weeklyData.push({
      date: format(timestamp, 'MMM dd'),
      ...aggregates,
      timestamp,
    })
  })

  return weeklyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareMonthlyData(runs: ParsedGameRun[]): MonthlyAggregatePoint[] {
  // Group runs by month using the shared function
  const monthlyGroups = groupRunsByDateKey(
    runs,
    timestamp => format(startOfMonth(timestamp), 'yyyy-MM')
  )

  // Calculate monthly aggregates
  const monthlyData: MonthlyAggregatePoint[] = []

  monthlyGroups.forEach((monthRuns) => {
    const aggregates = calculateRunAggregates(monthRuns)
    // Use startOfMonth with the first run's timestamp to preserve the correct month
    const timestamp = startOfMonth(monthRuns[0].timestamp)

    monthlyData.push({
      date: format(timestamp, 'MMM yyyy'),
      ...aggregates,
      timestamp,
    })
  })

  return monthlyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareYearlyData(runs: ParsedGameRun[]): YearlyAggregatePoint[] {
  // Group runs by year using the shared function
  const yearlyGroups = groupRunsByDateKey(
    runs,
    timestamp => format(startOfYear(timestamp), 'yyyy')
  )

  // Calculate yearly aggregates
  const yearlyData: YearlyAggregatePoint[] = []

  yearlyGroups.forEach((yearRuns, yearKey) => {
    const aggregates = calculateRunAggregates(yearRuns)
    // Use startOfYear with the first run's timestamp to preserve the correct year
    const timestamp = startOfYear(yearRuns[0].timestamp)

    yearlyData.push({
      date: yearKey,
      ...aggregates,
      timestamp,
    })
  })

  return yearlyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}