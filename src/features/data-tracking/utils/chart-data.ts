import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { ParsedGameRun } from '../types/game-run.types'
import { getFieldValue } from './field-utils'
import { RunTypeFilter, filterRunsByType } from './run-type-filter'

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

export function prepareCoinsPerRunData(runs: ParsedGameRun[]): ChartDataPoint[] {
  return runs
    .map(run => ({
      date: format(run.timestamp, 'MMM dd'),
      value: run.coinsEarned,
      timestamp: run.timestamp,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareCoinsPerDayData(runs: ParsedGameRun[]): DailyAggregatePoint[] {
  const dailyGroups = new Map<string, ParsedGameRun[]>()

  // Group runs by day
  runs.forEach(run => {
    const dayKey = format(startOfDay(run.timestamp), 'yyyy-MM-dd')
    if (!dailyGroups.has(dayKey)) {
      dailyGroups.set(dayKey, [])
    }
    dailyGroups.get(dayKey)!.push(run)
  })

  // Calculate daily aggregates
  const dailyData: DailyAggregatePoint[] = []

  dailyGroups.forEach((dayRuns, dayKey) => {
    const totalCoins = dayRuns.reduce((sum, run) => sum + run.coinsEarned, 0)
    const runCount = dayRuns.length
    const avgCoins = totalCoins / runCount
    const timestamp = new Date(dayKey)

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

export function prepareCellsPerDayData(runs: ParsedGameRun[]): DailyCellsAggregatePoint[] {
  const dailyGroups = new Map<string, ParsedGameRun[]>()

  // Group runs by day
  runs.forEach(run => {
    const dayKey = format(startOfDay(run.timestamp), 'yyyy-MM-dd')
    if (!dailyGroups.has(dayKey)) {
      dailyGroups.set(dayKey, [])
    }
    dailyGroups.get(dayKey)!.push(run)
  })

  // Calculate daily aggregates
  const dailyData: DailyCellsAggregatePoint[] = []

  dailyGroups.forEach((dayRuns, dayKey) => {
    const totalCells = dayRuns.reduce((sum, run) => sum + run.cellsEarned, 0)
    const runCount = dayRuns.length
    const avgCells = totalCells / runCount
    const timestamp = new Date(dayKey)

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

// Format large numbers for Y-axis (like 100B, 1.5T, etc.)
export function formatLargeNumber(value: number): string {
  if (value >= 1e15) {
    return `${(value / 1e15).toFixed(1)}Q`
  } else if (value >= 1e12) {
    return `${(value / 1e12).toFixed(1)}T`
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`
  }
  return value.toString()
}

// Generate nice Y-axis ticks for large numbers
export function generateYAxisTicks(maxValue: number): number[] {
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)))
  const normalizedMax = maxValue / magnitude

  let step: number
  if (normalizedMax <= 2) {
    step = 0.5 * magnitude
  } else if (normalizedMax <= 5) {
    step = 1 * magnitude
  } else {
    step = 2 * magnitude
  }

  const ticks: number[] = []
  for (let i = 0; i <= Math.ceil(maxValue / step); i++) {
    ticks.push(i * step)
  }

  return ticks
}

export function prepareKilledByData(runs: ParsedGameRun[], runTypeFilter: RunTypeFilter = 'all'): TierKilledByData[] {
  // Filter runs by type first
  const filteredRuns = filterRunsByType(runs, runTypeFilter);

  // Group runs by tier
  const tierGroups = new Map<number, ParsedGameRun[]>()

  filteredRuns.forEach(run => {
    const killedBy = getFieldValue<string>(run, 'killedBy');
    if (run.tier && killedBy) {
      if (!tierGroups.has(run.tier)) {
        tierGroups.set(run.tier, [])
      }
      tierGroups.get(run.tier)!.push(run)
    }
  })

  // Process each tier's killed-by data
  const tierData: TierKilledByData[] = []

  tierGroups.forEach((tierRuns, tier) => {
    // Count deaths by type
    const deathCounts = new Map<string, number>()

    tierRuns.forEach(run => {
      const killedBy = getFieldValue<string>(run, 'killedBy') || 'Unknown'
      deathCounts.set(killedBy, (deathCounts.get(killedBy) || 0) + 1)
    })

    const totalDeaths = tierRuns.length

    // Convert to percentage-based data for radar chart
    const killedByStats: KilledByData[] = Array.from(deathCounts.entries())
      .map(([killedBy, count]) => ({
        killedBy,
        count,
        percentage: (count / totalDeaths) * 100
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending

    tierData.push({
      tier,
      killedByStats,
      totalDeaths
    })
  })

  return tierData.sort((a, b) => a.tier - b.tier)
}

// Prepare radar chart data by combining all tiers' top death causes
export function prepareRadarChartData(tierData: TierKilledByData[]): any[] {
  // Get all unique death causes across all tiers
  const allDeathCauses = new Set<string>()
  tierData.forEach(tier => {
    tier.killedByStats.forEach(stat => {
      allDeathCauses.add(stat.killedBy)
    })
  })

  // Create radar chart data points
  return Array.from(allDeathCauses).map(deathCause => {
    const dataPoint: any = { killedBy: deathCause }

    tierData.forEach(tier => {
      const stat = tier.killedByStats.find(s => s.killedBy === deathCause)
      dataPoint[`tier${tier.tier}`] = stat ? stat.percentage : 0
    })

    return dataPoint
  })
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

export function prepareTierStatsData(runs: ParsedGameRun[], runTypeFilter: RunTypeFilter = 'all'): TierStatsData[] {
  // Filter runs by type first
  const filteredRuns = filterRunsByType(runs, runTypeFilter);

  // Group runs by tier
  const tierGroups = new Map<number, ParsedGameRun[]>()

  filteredRuns.forEach(run => {
    if (run.tier) {
      if (!tierGroups.has(run.tier)) {
        tierGroups.set(run.tier, [])
      }
      tierGroups.get(run.tier)!.push(run)
    }
  })

  // Calculate max stats for each tier
  const tierStats: TierStatsData[] = []

  tierGroups.forEach((tierRuns, tier) => {
    let maxWave = 0
    let maxDuration = 0
    let maxCoins = 0
    let maxCoinsPerHour = 0
    let maxCells = 0
    let maxCellsPerHour = 0

    tierRuns.forEach(run => {
      // Max wave
      if (run.wave && run.wave > maxWave) {
        maxWave = run.wave
      }

      // Max duration (using realTime field)
      if (run.realTime && run.realTime > maxDuration) {
        maxDuration = run.realTime
      }

      // Max coins
      if (run.coinsEarned && run.coinsEarned > maxCoins) {
        maxCoins = run.coinsEarned
      }

      // Max coins per hour
      if (run.realTime && run.coinsEarned && run.realTime > 0) {
        const coinsPerHour = (run.coinsEarned / run.realTime) * 3600
        if (coinsPerHour > maxCoinsPerHour) {
          maxCoinsPerHour = coinsPerHour
        }
      }

      // Max cells
      if (run.cellsEarned && run.cellsEarned > maxCells) {
        maxCells = run.cellsEarned
      }

      // Max cells per hour
      if (run.realTime && run.cellsEarned && run.realTime > 0) {
        const cellsPerHour = (run.cellsEarned / run.realTime) * 3600
        if (cellsPerHour > maxCellsPerHour) {
          maxCellsPerHour = cellsPerHour
        }
      }
    })

    tierStats.push({
      tier,
      maxWave,
      maxDuration,
      maxCoins,
      maxCoinsPerHour,
      maxCells,
      maxCellsPerHour
    })
  })

  return tierStats.sort((a, b) => b.tier - a.tier) // Sort highest tier first
}

// Time period configurations
export const TIME_PERIOD_CONFIGS: TimePeriodConfig[] = [
  { period: 'hourly', label: 'Per Hour', color: '#ec4899', dateFormat: 'MMM dd' },
  { period: 'run', label: 'Per Run', color: '#8b5cf6', dateFormat: 'MMM dd' },
  { period: 'daily', label: 'Daily', color: '#10b981', dateFormat: 'MMM dd' },
  { period: 'weekly', label: 'Weekly', color: '#f59e0b', dateFormat: 'MMM dd' },
  { period: 'monthly', label: 'Monthly', color: '#ef4444', dateFormat: 'MMM yyyy' },
  { period: 'yearly', label: 'Yearly', color: '#3b82f6', dateFormat: 'yyyy' }
]

// Generic function to prepare data for any time period
export function prepareTimeSeriesData(
  runs: ParsedGameRun[],
  period: TimePeriod,
  metric: 'coins' | 'cells'
): ChartDataPoint[] {
  switch (period) {
    case 'hourly':
      return metric === 'coins' ? prepareCoinsPerHourData(runs) : prepareCellsPerHourData(runs)
    case 'run':
      return metric === 'coins' ? prepareCoinsPerRunData(runs) : prepareCellsPerRunData(runs)
    case 'daily':
      if (metric === 'coins') {
        const dailyData = prepareCoinsPerDayData(runs)
        return dailyData.map(point => ({
          date: point.date,
          value: point.totalCoins,
          timestamp: point.timestamp
        }))
      } else {
        const dailyData = prepareCellsPerDayData(runs)
        return dailyData.map(point => ({
          date: point.date,
          value: point.totalCells,
          timestamp: point.timestamp
        }))
      }
    case 'weekly': {
      const weeklyData = prepareWeeklyData(runs)
      return weeklyData.map(point => ({
        date: point.date,
        value: metric === 'coins' ? point.totalCoins : point.totalCells,
        timestamp: point.timestamp
      }))
    }
    case 'monthly': {
      const monthlyData = prepareMonthlyData(runs)
      return monthlyData.map(point => ({
        date: point.date,
        value: metric === 'coins' ? point.totalCoins : point.totalCells,
        timestamp: point.timestamp
      }))
    }
    case 'yearly': {
      const yearlyData = prepareYearlyData(runs)
      return yearlyData.map(point => ({
        date: point.date,
        value: metric === 'coins' ? point.totalCoins : point.totalCells,
        timestamp: point.timestamp
      }))
    }
    default:
      return []
  }
}

export function prepareWeeklyData(runs: ParsedGameRun[]): WeeklyAggregatePoint[] {
  const weeklyGroups = new Map<string, ParsedGameRun[]>()

  // Group runs by week (starting Monday)
  runs.forEach(run => {
    const weekStart = startOfWeek(run.timestamp, { weekStartsOn: 1 })
    const weekKey = format(weekStart, 'yyyy-MM-dd')
    if (!weeklyGroups.has(weekKey)) {
      weeklyGroups.set(weekKey, [])
    }
    weeklyGroups.get(weekKey)!.push(run)
  })

  // Calculate weekly aggregates
  const weeklyData: WeeklyAggregatePoint[] = []

  weeklyGroups.forEach((weekRuns, weekKey) => {
    const totalCoins = weekRuns.reduce((sum, run) => sum + run.coinsEarned, 0)
    const totalCells = weekRuns.reduce((sum, run) => sum + run.cellsEarned, 0)
    const runCount = weekRuns.length
    const avgCoins = totalCoins / runCount
    const avgCells = totalCells / runCount
    const timestamp = new Date(weekKey)

    weeklyData.push({
      date: format(timestamp, 'MMM dd'),
      totalCoins,
      totalCells,
      runCount,
      avgCoins,
      avgCells,
      timestamp,
    })
  })

  return weeklyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareMonthlyData(runs: ParsedGameRun[]): MonthlyAggregatePoint[] {
  const monthlyGroups = new Map<string, ParsedGameRun[]>()

  // Group runs by month
  runs.forEach(run => {
    const monthStart = startOfMonth(run.timestamp)
    const monthKey = format(monthStart, 'yyyy-MM')
    if (!monthlyGroups.has(monthKey)) {
      monthlyGroups.set(monthKey, [])
    }
    monthlyGroups.get(monthKey)!.push(run)
  })

  // Calculate monthly aggregates
  const monthlyData: MonthlyAggregatePoint[] = []

  monthlyGroups.forEach((monthRuns, monthKey) => {
    const totalCoins = monthRuns.reduce((sum, run) => sum + run.coinsEarned, 0)
    const totalCells = monthRuns.reduce((sum, run) => sum + run.cellsEarned, 0)
    const runCount = monthRuns.length
    const avgCoins = totalCoins / runCount
    const avgCells = totalCells / runCount
    const timestamp = new Date(monthKey + '-01')

    monthlyData.push({
      date: format(timestamp, 'MMM yyyy'),
      totalCoins,
      totalCells,
      runCount,
      avgCoins,
      avgCells,
      timestamp,
    })
  })

  return monthlyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

export function prepareYearlyData(runs: ParsedGameRun[]): YearlyAggregatePoint[] {
  const yearlyGroups = new Map<string, ParsedGameRun[]>()

  // Group runs by year
  runs.forEach(run => {
    const yearStart = startOfYear(run.timestamp)
    const yearKey = format(yearStart, 'yyyy')
    if (!yearlyGroups.has(yearKey)) {
      yearlyGroups.set(yearKey, [])
    }
    yearlyGroups.get(yearKey)!.push(run)
  })

  // Calculate yearly aggregates
  const yearlyData: YearlyAggregatePoint[] = []

  yearlyGroups.forEach((yearRuns, yearKey) => {
    const totalCoins = yearRuns.reduce((sum, run) => sum + run.coinsEarned, 0)
    const totalCells = yearRuns.reduce((sum, run) => sum + run.cellsEarned, 0)
    const runCount = yearRuns.length
    const avgCoins = totalCoins / runCount
    const avgCells = totalCells / runCount
    const timestamp = new Date(yearKey + '-01-01')

    yearlyData.push({
      date: yearKey,
      totalCoins,
      totalCells,
      runCount,
      avgCoins,
      avgCells,
      timestamp,
    })
  })

  return yearlyData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

// Function to determine which time periods should be available based on data span
export function getAvailableTimePeriods(runs: ParsedGameRun[]): TimePeriodConfig[] {
  if (runs.length === 0) {
    // Always show hourly and per run when no data
    return TIME_PERIOD_CONFIGS.filter(config =>
      config.period === 'hourly' || config.period === 'run'
    )
  }

  // Group runs by day, week, month, year to check for multiple periods
  const uniqueDays = new Set(
    runs.map(run => format(startOfDay(run.timestamp), 'yyyy-MM-dd'))
  )
  const uniqueWeeks = new Set(
    runs.map(run => format(startOfWeek(run.timestamp, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
  )
  const uniqueMonths = new Set(
    runs.map(run => format(startOfMonth(run.timestamp), 'yyyy-MM'))
  )
  const uniqueYears = new Set(
    runs.map(run => format(startOfYear(run.timestamp), 'yyyy'))
  )

  // Always include hourly and per run
  const availablePeriods: TimePeriod[] = ['hourly', 'run']

  if (uniqueDays.size > 1) {
    availablePeriods.push('daily')
  }


  if (uniqueWeeks.size > 1) {
    availablePeriods.push('weekly')
  }


  if (uniqueMonths.size > 1) {
    availablePeriods.push('monthly')
  }


  if (uniqueYears.size > 1) {
    availablePeriods.push('yearly')
  }

  // Return configurations for available periods in original order
  return TIME_PERIOD_CONFIGS.filter(config =>
    availablePeriods.includes(config.period)
  )
}