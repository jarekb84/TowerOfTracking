import type { TierStatsColumnConfig } from '@/features/analysis/tier-stats/types'

/**
 * Reorder columns by moving an item from one index to another
 * Returns a new array with the reordered columns
 */
export function reorderColumns(
  columns: TierStatsColumnConfig[],
  fromIndex: number,
  toIndex: number
): TierStatsColumnConfig[] {
  // Validate indices
  if (
    fromIndex < 0 ||
    fromIndex >= columns.length ||
    toIndex < 0 ||
    toIndex >= columns.length
  ) {
    return columns
  }

  // No-op if indices are the same
  if (fromIndex === toIndex) {
    return columns
  }

  const result = [...columns]
  const [removed] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, removed)

  return result
}

/**
 * Find the index of a column by field name
 * Returns -1 if not found
 */
export function findColumnIndex(
  columns: TierStatsColumnConfig[],
  fieldName: string
): number {
  return columns.findIndex(col => col.fieldName === fieldName)
}
