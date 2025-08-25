import { ParsedGameRun, RunType, RunTypeValue } from '../types/game-run.types'

export type RunTypeFilter = 'farming' | 'tournament' | 'milestone' | 'all'

/**
 * Centralized function to determine run type from tier string
 * This is the single source of truth for run type detection
 */
export function determineRunType(tierRawValue: string): RunTypeValue {
  return /\+/.test(tierRawValue) ? RunType.TOURNAMENT : RunType.FARM
}

/**
 * Get display label for run type
 */
export function getRunTypeDisplayLabel(runType: RunTypeValue): string {
  switch (runType) {
    case RunType.TOURNAMENT:
      return 'Tournament'
    case RunType.FARM:
      return 'Farm'
    case RunType.MILESTONE:
      return 'Milestone'
    default:
      return 'Unknown'
  }
}

/**
 * Filter runs by run type
 */
export function filterRunsByType(runs: ParsedGameRun[], runType: RunTypeFilter): ParsedGameRun[] {
  if (runType === 'all') {
    return runs
  }
  
  return runs.filter(run => {
    // Map filter values to run type enum values
    let targetRunType: RunTypeValue
    switch (runType) {
      case 'farming':
        targetRunType = RunType.FARM
        break
      case 'tournament':
        targetRunType = RunType.TOURNAMENT
        break
      case 'milestone':
        targetRunType = RunType.MILESTONE
        break
      default:
        return false
    }
    return run.runType === targetRunType
  })
}

/**
 * Check if a run is a farming run
 */
export function isFarmingRun(run: ParsedGameRun): boolean {
  return run.runType === RunType.FARM
}

/**
 * Get farming runs only
 */
export function getFarmingRuns(runs: ParsedGameRun[]): ParsedGameRun[] {
  return runs.filter(isFarmingRun)
}

/**
 * Get tournament runs only
 */
export function getTournamentRuns(runs: ParsedGameRun[]): ParsedGameRun[] {
  return runs.filter(run => run.runType === RunType.TOURNAMENT)
}

/**
 * Check if a run is a milestone run
 */
export function isMilestoneRun(run: ParsedGameRun): boolean {
  return run.runType === RunType.MILESTONE
}

/**
 * Get milestone runs only
 */
export function getMilestoneRuns(runs: ParsedGameRun[]): ParsedGameRun[] {
  return runs.filter(isMilestoneRun)
}