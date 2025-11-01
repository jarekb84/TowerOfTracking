/**
 * Field Name Mapping Utilities
 *
 * Handles bidirectional mapping between:
 * - Display names (used in CSV headers, shown to users): "Armor Shards", "_Date"
 * - Code names (used internally in TypeScript): "armorShards", "_date"
 */

import { toCamelCase } from '@/features/analysis/shared/parsing/field-utils';
import { isLegacyField, getMigratedFieldName, INTERNAL_FIELD_MAPPINGS } from './internal-field-config';

/**
 * Represents both the display and code representations of a field
 */
export interface FieldNamePair {
  /** Display name (as shown in CSV headers): "Armor Shards" */
  displayName: string;
  /** Code name (camelCase for internal use): "armorShards" */
  codeName: string;
}

/**
 * Convert a CSV header to its code name (camelCase)
 * Handles:
 * - Underscore-prefixed internal fields: "_Date" → "_date"
 * - Legacy field migration: "Date" → "_date"
 * - Regular fields: "Armor Shards" → "armorShards"
 *
 * @param csvHeader - The CSV header string
 * @returns The camelCase code name
 */
export function csvHeaderToCodeName(csvHeader: string): string {
  // Handle underscore-prefixed headers (v2 internal fields)
  if (csvHeader.startsWith('_')) {
    const withoutUnderscore = csvHeader.substring(1);
    return '_' + toCamelCase(withoutUnderscore);
  }

  // Convert to camelCase
  let codeName = toCamelCase(csvHeader);

  // Apply legacy field migration if needed
  if (isLegacyField(codeName)) {
    const migratedName = getMigratedFieldName(codeName);
    if (migratedName) {
      codeName = migratedName;
    }
  }

  return codeName;
}

/**
 * Get the display name for a code name
 * For internal fields, uses INTERNAL_FIELD_MAPPINGS
 * For other fields, we'd need to look it up from actual data (not implemented yet)
 *
 * @param codeName - The camelCase code name
 * @returns The display name, or the code name if no mapping exists
 */
export function codeNameToDisplayName(codeName: string): string {
  // Check if it's an internal field
  if (codeName in INTERNAL_FIELD_MAPPINGS) {
    return INTERNAL_FIELD_MAPPINGS[codeName as keyof typeof INTERNAL_FIELD_MAPPINGS];
  }

  // For other fields, we don't have a reverse mapping
  // This would require parsing originalKey from stored data
  // For now, return the code name
  return codeName;
}

/**
 * Create a field name pair from a CSV header
 *
 * @param csvHeader - The CSV header string
 * @returns Object with both display and code names
 */
export function createFieldNamePair(csvHeader: string): FieldNamePair {
  return {
    displayName: csvHeader,
    codeName: csvHeaderToCodeName(csvHeader)
  };
}
