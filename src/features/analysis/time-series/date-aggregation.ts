import { ParsedGameRun } from '@/shared/types/game-run.types'

/**
 * Shared date aggregation utilities
 * Used by both coin/cell aggregations and generic field aggregations
 */

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
interface RunAggregates {
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


export {
  prepareFieldPerRunData,
  prepareFieldPerHourData,
  prepareFieldPerDayData,
  prepareFieldPerWeekData,
  prepareFieldPerMonthData,
  prepareFieldPerYearData
} from './field-aggregation'
