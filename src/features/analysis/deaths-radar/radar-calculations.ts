import { ParsedGameRun } from '../../../data-tracking/types/game-run.types'
import { getFieldValue } from '@/features/analysis/shared/parsing/field-utils'
import { RunTypeFilter, filterRunsByType } from '@/features/analysis/shared/filtering/run-type-filter'
import { KilledByData, TierKilledByData } from '../../time-series/chart-types'

// Radar chart data point with dynamic tier keys
export interface RadarChartDataPoint {
  killedBy: string
  [key: string]: string | number  // Dynamic tier keys like "tier1", "tier2", etc.
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
export function prepareRadarChartData(tierData: TierKilledByData[]): RadarChartDataPoint[] {
  // Get all unique death causes across all tiers
  const allDeathCauses = new Set<string>()
  tierData.forEach(tier => {
    tier.killedByStats.forEach(stat => {
      allDeathCauses.add(stat.killedBy)
    })
  })

  // Create radar chart data points
  return Array.from(allDeathCauses).map(deathCause => {
    const dataPoint: RadarChartDataPoint = { killedBy: deathCause }

    tierData.forEach(tier => {
      const stat = tier.killedByStats.find(s => s.killedBy === deathCause)
      dataPoint[`tier${tier.tier}`] = stat ? stat.percentage : 0
    })

    return dataPoint
  })
}
