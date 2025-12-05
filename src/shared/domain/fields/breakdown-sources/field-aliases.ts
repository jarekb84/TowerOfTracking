/**
 * Field Alias Utilities
 *
 * Utilities for building and working with field alias maps.
 * Used by Source Analysis to handle data variations (e.g., casing differences).
 */

import type { FieldConfig } from './types';
import { DAMAGE_FIELDS } from './damage-sources';
import { COIN_FIELDS } from './coin-sources';

/**
 * Build a lookup map of field aliases from field configurations
 *
 * Returns a map where keys are canonical field names and values are
 * arrays of alternative names that should resolve to the same field.
 *
 * @example
 * // Input: [{ fieldName: 'coinsFromBlackHole', aliases: ['coinsFromBlackhole'] }]
 * // Output: { coinsFromBlackHole: ['coinsFromBlackhole'] }
 */
export function buildFieldAliasMap(
  fields: FieldConfig[]
): Record<string, string[]> {
  return fields.reduce(
    (map, field) => {
      if (field.aliases?.length) {
        map[field.fieldName] = field.aliases;
      }
      return map;
    },
    {} as Record<string, string[]>
  );
}

/**
 * Pre-built alias map for coin fields
 *
 * Includes aliases for:
 * - coinsFromBlackHole → coinsFromBlackhole (casing variation)
 * - coinsFromOrbs → coinsFromOrb (singular/plural variation)
 */
export const COIN_FIELD_ALIASES = buildFieldAliasMap(COIN_FIELDS);

/**
 * Pre-built alias map for damage fields
 *
 * Currently empty, but ready for future aliases if needed.
 */
export const DAMAGE_FIELD_ALIASES = buildFieldAliasMap(DAMAGE_FIELDS);
