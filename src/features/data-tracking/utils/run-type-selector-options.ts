import type { SelectionOption } from '../../../components/ui'
import { RunType } from '../types/game-run.types'
import { RunTypeFilter, getRunTypeDisplayLabel } from './run-type-filter'

export type RunTypeSelectorMode = 'filter' | 'selection'

const ALL_RUN_TYPE_OPTIONS: Array<SelectionOption<RunTypeFilter>> = [
  { value: RunType.FARM, label: getRunTypeDisplayLabel(RunType.FARM), color: '#10b981', icon: true },
  { value: RunType.TOURNAMENT, label: getRunTypeDisplayLabel(RunType.TOURNAMENT), color: '#f59e0b', icon: true },
  { value: RunType.MILESTONE, label: getRunTypeDisplayLabel(RunType.MILESTONE), color: '#8b5cf6', icon: true },
  { value: 'all', label: 'All Types', color: '#6b7280', icon: true },
] as const

/**
 * Gets the appropriate run type options based on the selector mode
 * - 'selection' mode: Excludes 'all' option (for creation forms)
 * - 'filter' mode: Includes all options (for filtering)
 */
export function getOptionsForMode(mode: RunTypeSelectorMode): Array<SelectionOption<RunTypeFilter>> {
  if (mode === 'selection') {
    return ALL_RUN_TYPE_OPTIONS.filter(option => option.value !== 'all')
  }
  return ALL_RUN_TYPE_OPTIONS
}
