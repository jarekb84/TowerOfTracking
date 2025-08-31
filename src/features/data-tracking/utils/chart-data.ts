import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { ParsedGameRun } from '../types/game-run.types'
import { getFieldValue } from './field-utils'
import { RunTypeFilter, filterRunsByType } from './run-type-filter'
import { 
  ChartDataPoint, 
  TimePeriod, 
  TimePeriodConfig, 
  TIME_PERIOD_CONFIGS,
  KilledByData,
  TierKilledByData,
  TierStatsData 
} from './chart-types'
import {
  prepareCoinsPerRunData,
  prepareCoinsPerDayData,
  prepareCellsPerRunData,
  prepareCoinsPerHourData,
  prepareCellsPerHourData,
  prepareCellsPerDayData,
  prepareWeeklyData,
  prepareMonthlyData,
  prepareYearlyData
} from './date-aggregation'

// Re-export for backward compatibility
export * from './chart-types'
export * from './chart-formatters'
export {
  prepareCoinsPerRunData,
  prepareCoinsPerDayData,
  prepareCellsPerRunData,
  prepareCoinsPerHourData,
  prepareCellsPerHourData,
  prepareCellsPerDayData,
  prepareWeeklyData,
  prepareMonthlyData,
  prepareYearlyData
} from './date-aggregation'

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

// Function to determine which time periods should be available based on data span
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