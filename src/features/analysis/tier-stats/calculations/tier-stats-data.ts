import { ParsedGameRun } from '../../../data-tracking/types/game-run.types'
import { RunTypeFilter, filterRunsByType } from '@/features/analysis/shared/filtering/run-type-filter'

/**
 * Maximum performance stats for a single tier
 */
export interface TierStatsData {
  tier: number
  maxWave: number
  maxDuration: number // in seconds
  maxCoins: number
  maxCoinsPerHour: number
  maxCells: number
  maxCellsPerHour: number
}

/**
 * Prepares tier statistics data by computing maximum values per tier
 * Used for tier stats table showing best performance metrics
 */
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
