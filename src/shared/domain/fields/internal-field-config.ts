/**
 * Internal Field Configuration
 *
 * Legacy-rename helpers used by parsers and migrations at the storage
 * boundary. Field-level metadata (CSV headers, ordering, IS_INTERNAL_FIELD
 * membership) lives in the field graph at
 * `src/shared/domain/field-graph/catalog/internal-fields.edges.ts`. Internal
 * field ids are addressed via the named `*_NODE` exports in
 * `src/shared/domain/field-graph/catalog/fields.nodes.ts`.
 *
 * Migration footprint: `LEGACY_FIELD_MIGRATIONS` / `isLegacyField` /
 * `getMigratedFieldName` will be replaced by `RENAMED_FROM` edges + the
 * graph's `resolveFieldByAnyKey()` lookup in commit 10. Until then, parsers
 * and migrations call these helpers at the storage boundary and this file
 * disappears entirely once that cutover lands.
 */

import {
  _DATE_NODE,
  _NOTES_NODE,
  _RANK_NODE,
  _RUN_TYPE_NODE,
  _TIME_NODE,
} from '../field-graph/catalog/fields.nodes';

/**
 * Legacy field names that should be migrated to internal field names
 * Maps legacy name to canonical internal-field id
 */
export const LEGACY_FIELD_MIGRATIONS: Record<string, string> = {
  'date': _DATE_NODE.id,
  'time': _TIME_NODE.id,
  'notes': _NOTES_NODE.id,
  'runType': _RUN_TYPE_NODE.id,
  'run_type': _RUN_TYPE_NODE.id,
  'rank': _RANK_NODE.id,
  'placement': _RANK_NODE.id
};

/**
 * Check if a field name should be migrated to an internal field
 */
export function isLegacyField(fieldName: string): boolean {
  return fieldName in LEGACY_FIELD_MIGRATIONS;
}

/**
 * Get the internal field name for a legacy field
 */
export function getMigratedFieldName(legacyFieldName: string): string | undefined {
  return LEGACY_FIELD_MIGRATIONS[legacyFieldName];
}
