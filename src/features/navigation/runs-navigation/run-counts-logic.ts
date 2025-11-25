import { ParsedGameRun } from '@/shared/types/game-run.types'
import { RunType, RunTypeValue } from '@/shared/domain/run-types/types'

/**
 * Run counts by run type.
 */
type RunCounts = Record<RunTypeValue, number>

/**
 * Compute the count of runs for each run type.
 * Pure function for computing run counts from a list of runs.
 */
export function computeRunCounts(runs: ParsedGameRun[]): RunCounts {
  return {
    [RunType.FARM]: runs.filter(run => run.runType === RunType.FARM).length,
    [RunType.TOURNAMENT]: runs.filter(run => run.runType === RunType.TOURNAMENT).length,
    [RunType.MILESTONE]: runs.filter(run => run.runType === RunType.MILESTONE).length,
  }
}
