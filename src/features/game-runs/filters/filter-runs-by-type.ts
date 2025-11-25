import { ParsedGameRun } from '@/shared/types/game-run.types'
import { RunTypeValue } from '@/shared/domain/run-types/types'

/**
 * Filter runs by run type.
 * Pure function for filtering runs based on their type.
 */
export function filterRunsByType(runs: ParsedGameRun[], runType: RunTypeValue): ParsedGameRun[] {
  return runs.filter(run => run.runType === runType)
}
