/**
 * Internal Field Configuration
 *
 * Centralized configuration for all app-generated internal fields.
 * Internal fields use underscore prefix (_) to distinguish from game fields.
 *
 * When adding new internal fields:
 * 1. Add to INTERNAL_FIELD_NAMES constant
 * 2. Add to INTERNAL_FIELD_MAPPINGS
 * 3. Add to INTERNAL_FIELD_ORDER if ordering is important
 * 4. Use createInternalField() from field-utils.ts to create field instances
 */

/**
 * Type-safe internal field names
 * These are the camelCase field names used internally in the application
 */
export const INTERNAL_FIELD_NAMES = {
  DATE: '_date',
  TIME: '_time',
  NOTES: '_notes',
  RUN_TYPE: '_runType',
  RANK: '_rank'
} as const;

/**
 * Type representing valid internal field names
 */
export type InternalFieldName = typeof INTERNAL_FIELD_NAMES[keyof typeof INTERNAL_FIELD_NAMES];

/**
 * Mapping from internal field names to their display names
 * Used for CSV export headers
 * NOTE: Headers use underscore prefix to clearly distinguish from potential game fields
 */
export const INTERNAL_FIELD_MAPPINGS: Record<InternalFieldName, string> = {
  [INTERNAL_FIELD_NAMES.DATE]: '_Date',
  [INTERNAL_FIELD_NAMES.TIME]: '_Time',
  [INTERNAL_FIELD_NAMES.NOTES]: '_Notes',
  [INTERNAL_FIELD_NAMES.RUN_TYPE]: '_Run Type',
  [INTERNAL_FIELD_NAMES.RANK]: '_Rank'
};

/**
 * Ordered list of internal fields for CSV export
 * These appear first in CSV exports before game fields
 */
export const INTERNAL_FIELD_ORDER: readonly InternalFieldName[] = [
  INTERNAL_FIELD_NAMES.DATE,
  INTERNAL_FIELD_NAMES.TIME,
  INTERNAL_FIELD_NAMES.NOTES,
  INTERNAL_FIELD_NAMES.RUN_TYPE,
  INTERNAL_FIELD_NAMES.RANK
] as const;

/**
 * Legacy field names that should be migrated to internal field names
 * Maps legacy name to new internal name
 */
export const LEGACY_FIELD_MIGRATIONS: Record<string, InternalFieldName> = {
  'date': INTERNAL_FIELD_NAMES.DATE,
  'time': INTERNAL_FIELD_NAMES.TIME,
  'notes': INTERNAL_FIELD_NAMES.NOTES,
  'runType': INTERNAL_FIELD_NAMES.RUN_TYPE,
  'run_type': INTERNAL_FIELD_NAMES.RUN_TYPE,
  'rank': INTERNAL_FIELD_NAMES.RANK,
  'placement': INTERNAL_FIELD_NAMES.RANK
};

/**
 * Check if a field name is an internal field
 *
 * @param fieldName - Field name to check
 * @returns True if the field is an internal field
 */
export function isInternalField(fieldName: string): fieldName is InternalFieldName {
  const internalFieldValues = Object.values(INTERNAL_FIELD_NAMES) as string[];
  return internalFieldValues.includes(fieldName);
}

/**
 * Check if a field name should be migrated to an internal field
 *
 * @param fieldName - Field name to check
 * @returns True if the field should be migrated
 */
export function isLegacyField(fieldName: string): boolean {
  return fieldName in LEGACY_FIELD_MIGRATIONS;
}

/**
 * Get the internal field name for a legacy field
 *
 * @param legacyFieldName - Legacy field name
 * @returns Internal field name or undefined if not a legacy field
 */
export function getMigratedFieldName(legacyFieldName: string): InternalFieldName | undefined {
  return LEGACY_FIELD_MIGRATIONS[legacyFieldName];
}

/**
 * Get all internal field names as a set for O(1) lookup
 */
export function getInternalFieldNamesSet(): Set<string> {
  return new Set(Object.values(INTERNAL_FIELD_NAMES));
}
