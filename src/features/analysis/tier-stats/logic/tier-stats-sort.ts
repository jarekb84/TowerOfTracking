import type { DynamicTierStats, TierStatsColumn } from '../types'
import { getCellValue } from './tier-stats-calculator'

/**
 * Get the value to use for sorting a tier stats row by a specific column
 * Prioritizes hourly rate when enabled, falls back to aggregate value
 */
export function getSortValue(
  tierStats: DynamicTierStats,
  column: TierStatsColumn
): number {
  // Special case: tier column sorts by tier number
  if (column.id === 'tier') {
    return tierStats.tier
  }

  // If hourly rate is enabled for this column, prioritize it
  if (column.showHourlyRate) {
    const hourlyValue = getCellValue(tierStats, column.fieldName, true)
    if (hourlyValue !== null) {
      return hourlyValue
    }
  }

  // Fall back to aggregate value
  const aggregateValue = getCellValue(tierStats, column.fieldName, false)
  return aggregateValue ?? -Infinity
}

/**
 * Sort tier stats by a specific column
 * Returns a new sorted array
 */
export function sortTierStats(
  tierStats: DynamicTierStats[],
  column: TierStatsColumn,
  direction: 'asc' | 'desc'
): DynamicTierStats[] {
  return [...tierStats].sort((a, b) => {
    const aValue = getSortValue(a, column)
    const bValue = getSortValue(b, column)

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Sort tier stats by tier column
 * Always sorts by tier number regardless of column config
 */
export function sortByTier(
  tierStats: DynamicTierStats[],
  direction: 'asc' | 'desc'
): DynamicTierStats[] {
  return [...tierStats].sort((a, b) => {
    return direction === 'asc' ? a.tier - b.tier : b.tier - a.tier
  })
}
