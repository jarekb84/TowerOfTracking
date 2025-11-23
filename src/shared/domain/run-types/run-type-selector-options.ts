import type { SelectionOption } from '@/components/ui'
import { RunType, RunTypeValue } from './types'
import { RunTypeFilter, getRunTypeDisplayLabel } from '@/features/analysis/shared/filtering/run-type-filter'
import { getRunTypeColor } from './run-type-display'

export type RunTypeSelectorMode = 'filter' | 'selection'

/**
 * Run type counts for display in selector
 */
export interface RunTypeCounts {
  [RunType.FARM]: number
  [RunType.TOURNAMENT]: number
  [RunType.MILESTONE]: number
  total: number
}

/**
 * Build run type option with optional count as badge
 */
function buildRunTypeOption(
  runType: RunTypeValue,
  counts?: RunTypeCounts
): SelectionOption<RunTypeFilter> {
  const count = counts ? counts[runType] : undefined
  return {
    value: runType,
    label: getRunTypeDisplayLabel(runType),
    color: getRunTypeColor(runType),
    icon: true,
    badge: count
  }
}

/**
 * Build "All Types" option with optional total count as badge
 */
function buildAllTypesOption(counts?: RunTypeCounts): SelectionOption<RunTypeFilter> {
  const count = counts ? counts.total : undefined
  return {
    value: 'all',
    label: 'All Types',
    color: '#6b7280',
    icon: true,
    badge: count
  }
}

/**
 * Gets the appropriate run type options based on the selector mode
 * - 'selection' mode: Excludes 'all' option (for creation forms)
 * - 'filter' mode: Includes all options (for filtering)
 *
 * @param mode - Selector mode
 * @param counts - Optional counts per run type for display
 */
export function getOptionsForMode(
  mode: RunTypeSelectorMode,
  counts?: RunTypeCounts
): Array<SelectionOption<RunTypeFilter>> {
  const options: Array<SelectionOption<RunTypeFilter>> = [
    buildRunTypeOption(RunType.FARM, counts),
    buildRunTypeOption(RunType.TOURNAMENT, counts),
    buildRunTypeOption(RunType.MILESTONE, counts)
  ]

  if (mode === 'filter') {
    options.push(buildAllTypesOption(counts))
  }

  return options
}
