import { RunType, type RunTypeValue } from '@/shared/domain/run-types/types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'

/**
 * Formats run type for display in tier trends UI
 * Returns capitalized run type name or empty string for unknown types
 */
export function formatRunTypeDisplay(runType: RunTypeValue | undefined): string {
  if (!runType) return ''

  switch (runType) {
    case RunType.FARM:
      return 'Farm'
    case RunType.TOURNAMENT:
      return 'Tournament'
    case RunType.MILESTONE:
      return 'Milestone'
    default:
      return ''
  }
}

/**
 * Formats run type filter for display in tier trends UI
 * Handles both specific run types and 'all' filter
 */
export function formatRunTypeFilterDisplay(runType: RunTypeFilter): string {
  if (runType === 'all') return 'all'
  return formatRunTypeDisplay(runType).toLowerCase()
}
