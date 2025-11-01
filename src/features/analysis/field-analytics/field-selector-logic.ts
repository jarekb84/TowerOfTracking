import type { FieldOption } from './field-selector'

/**
 * Filter field options based on search term using case-insensitive substring matching
 */
export function filterFieldOptions(
  fields: FieldOption[],
  searchTerm: string
): FieldOption[] {
  const trimmedTerm = searchTerm.trim().toLowerCase()

  if (trimmedTerm.length === 0) {
    return fields
  }

  return fields.filter(field =>
    field.label.toLowerCase().includes(trimmedTerm) ||
    field.value.toLowerCase().includes(trimmedTerm)
  )
}
