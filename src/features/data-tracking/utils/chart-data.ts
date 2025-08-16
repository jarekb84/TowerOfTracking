import { format, startOfDay, isSameDay } from 'date-fns'
import { ParsedGameRun } from '../types/game-run.types'

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

export function prepareKilledByData(runs: ParsedGameRun[]): TierKilledByData[] {
  // Group runs by tier
  const tierGroups = new Map<number, ParsedGameRun[]>()
  
  runs.forEach(run => {
    if (run.tier && run.processedData.killedBy) {
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
      const killedBy = run.processedData.killedBy || 'Unknown'
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