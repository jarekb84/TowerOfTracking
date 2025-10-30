/**
 * Field Type Detection Utilities
 *
 * Utilities for detecting whether fields are suitable for numerical
 * comparison and trend analysis in the tier trends feature.
 */

import type { GameRunField } from '../types/game-run.types';

/**
 * Known text-based fields that should be excluded from trend analysis
 * These are fields (both internal and game exports) that contain categorical/text data
 * and cannot be meaningfully compared numerically over time
 */
const TEXT_FIELDS = new Set([
  // Killed By field variants (game export)
  'killedBy',
  'killed_by',
  'Killed By',

  // Run Type field variants (internal and display)
  'runType',
  'run_type',
  'Run Type',
  '_runType',
  '_Run Type'
]);

/**
 * Fields that are not meaningful for trend analysis even if numerical
 */
const NON_TREND_FIELDS = new Set([
  'tier'
]);

/**
 * Check if a field is suitable for tier trends analysis
 *
 * A field is suitable if:
 * - It has a numerical or duration data type
 * - Its value is a number
 * - It's not a known text/categorical field (like "Killed By" or "Run Type")
 * - It's not a non-trend field (like tier)
 *
 * Note: Data type checking (number/duration) is sufficient to catch most
 * non-trendable fields including internal text fields like _notes.
 *
 * @param fieldName - The field name to check
 * @param field - The field data including type and value
 * @returns True if the field is suitable for trend analysis
 */
export function isTrendableField(
  fieldName: string,
  field: GameRunField
): boolean {
  // Must be numerical or duration type
  // This catches most non-trendable fields including internal text fields
  if (field.dataType !== 'number' && field.dataType !== 'duration') {
    return false;
  }

  // Value must actually be a number
  if (typeof field.value !== 'number') {
    return false;
  }

  // Exclude known text/categorical fields
  if (TEXT_FIELDS.has(fieldName)) {
    return false;
  }

  // Exclude non-trend fields
  if (NON_TREND_FIELDS.has(fieldName)) {
    return false;
  }

  return true;
}

/**
 * Check if a field is a known text/categorical field
 *
 * @param fieldName - The field name to check
 * @returns True if the field is a known text/categorical field
 */
export function isTextCategoricalField(fieldName: string): boolean {
  return TEXT_FIELDS.has(fieldName);
}

/**
 * Get a set of all excluded field names for tier trends
 * Useful for batch operations and debugging
 *
 * @returns Set of field names that should be excluded
 */
export function getExcludedTrendFields(): Set<string> {
  const excluded = new Set<string>();

  TEXT_FIELDS.forEach((field: string) => excluded.add(field));
  NON_TREND_FIELDS.forEach((field: string) => excluded.add(field));

  return excluded;
}
