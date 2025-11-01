import { RunType, type RunTypeValue } from '@/shared/domain/run-types/types'
import { TrendsDuration } from './types'
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

/**
 * Formats duration type for display in tier trends UI
 * Returns singular or plural form based on count
 */
export function formatDurationDisplay(duration: TrendsDuration, count: number): string {
  const isPlural = count !== 1

  switch (duration) {
    case TrendsDuration.PER_RUN:
      return isPlural ? 'Runs' : 'Run'
    case TrendsDuration.DAILY:
      return isPlural ? 'Days' : 'Day'
    case TrendsDuration.WEEKLY:
      return isPlural ? 'Weeks' : 'Week'
    case TrendsDuration.MONTHLY:
      return isPlural ? 'Months' : 'Month'
    case TrendsDuration.YEARLY:
      return isPlural ? 'Years' : 'Year'
    default:
      return ''
  }
}

/**
 * Formats complete period summary for tier trends header
 * Example: "Last 4 Runs - Farm Mode"
 */
export function formatPeriodSummary(
  periodCount: number,
  duration: TrendsDuration,
  runType: RunTypeFilter
): string {
  const durationText = formatDurationDisplay(duration, periodCount)

  if (runType === 'all') {
    return `Last ${periodCount} ${durationText} - All Runs`
  }

  const runTypeText = formatRunTypeDisplay(runType)
  return `Last ${periodCount} ${durationText} - ${runTypeText} Mode`
}
