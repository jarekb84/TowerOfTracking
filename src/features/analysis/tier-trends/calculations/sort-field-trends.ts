import type { FieldTrendData } from '../types'

export type SortField = 'fieldName' | 'change'
export type SortDirection = 'asc' | 'desc'

/**
 * Sorts field trends by the specified field and direction.
 * Returns a new sorted array without mutating the original.
 */
export function sortFieldTrends(
  trends: FieldTrendData[],
  sortField: SortField,
  sortDirection: SortDirection
): FieldTrendData[] {
  return [...trends].sort((a, b) => {
    let aValue: number | string
    let bValue: number | string

    switch (sortField) {
      case 'fieldName':
        aValue = a.displayName.toLowerCase()
        bValue = b.displayName.toLowerCase()
        break
      case 'change':
        aValue = Math.abs(a.change.percent)
        bValue = Math.abs(b.change.percent)
        break
      default:
        return 0
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Computes the next sort state when a column header is clicked.
 * Toggles direction on same field, defaults to 'desc' on new field.
 */
export function getNextSortState(
  clickedField: SortField,
  currentField: SortField,
  currentDirection: SortDirection
): { sortField: SortField; sortDirection: SortDirection } {
  if (clickedField === currentField) {
    return {
      sortField: currentField,
      sortDirection: currentDirection === 'asc' ? 'desc' : 'asc',
    }
  }
  return { sortField: clickedField, sortDirection: 'desc' }
}
