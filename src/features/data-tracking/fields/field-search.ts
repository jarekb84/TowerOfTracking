import type { AvailableField } from '@/features/analysis/tier-stats/types'

/**
 * Check if a field matches the search term
 * Matches against both display name and field name (case-insensitive)
 */
export function matchesSearchTerm(field: AvailableField, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true

  const normalizedSearch = searchTerm.toLowerCase().trim()
  const displayNameMatch = field.displayName.toLowerCase().includes(normalizedSearch)
  const fieldNameMatch = field.fieldName.toLowerCase().includes(normalizedSearch)

  return displayNameMatch || fieldNameMatch
}

/**
 * Filter fields by search term
 * Returns all fields when search term is empty
 */
export function filterFieldsBySearch(
  fields: AvailableField[],
  searchTerm: string
): AvailableField[] {
  if (!searchTerm.trim()) return fields

  return fields.filter(field => matchesSearchTerm(field, searchTerm))
}

/**
 * Normalize search input (trim and lowercase)
 */
export function normalizeSearchTerm(input: string): string {
  return input.trim().toLowerCase()
}
