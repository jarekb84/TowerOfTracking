/**
 * Breakdown Sources - Shared Field Configuration
 *
 * Central configuration for field definitions used across Run Details,
 * Source Analysis, and other views that display field breakdowns.
 *
 * Usage:
 * ```typescript
 * import {
 *   DAMAGE_DEALT_CATEGORY,
 *   COINS_EARNED_CATEGORY,
 *   COIN_FIELD_ALIASES
 * } from '@/shared/domain/fields/breakdown-sources';
 * ```
 */


// Field arrays (for direct field iteration)
export { DAMAGE_FIELDS } from './damage-sources';
export { COIN_FIELDS } from './coin-sources';

// Alias utilities
export {
  buildFieldAliasMap,
  COIN_FIELD_ALIASES,
  DAMAGE_FIELD_ALIASES,
} from './field-aliases';

// Category configurations
import type { FieldCategory } from './types';
import { DAMAGE_FIELDS } from './damage-sources';
import { COIN_FIELDS } from './coin-sources';

/**
 * Damage Dealt category configuration
 *
 * 16 damage sources that contribute to total damage dealt.
 * Includes sources like Death Wave, Chain Lightning, Thorn, etc.
 */
export const DAMAGE_DEALT_CATEGORY: FieldCategory = {
  id: 'damageDealt',
  name: 'Damage Dealt',
  description: 'Breakdown of damage dealt by source',
  totalField: 'damageDealt',
  fields: DAMAGE_FIELDS,
};

/**
 * Coins Earned category configuration
 *
 * 11 coin sources that contribute to total coins earned.
 * Includes sources like Death Wave coins, Golden Tower, Spotlight, etc.
 *
 * Note: Cash is a separate currency and is NOT included here.
 */
export const COINS_EARNED_CATEGORY: FieldCategory = {
  id: 'coinsEarned',
  name: 'Coins Earned',
  description: 'Breakdown of coins earned by source',
  totalField: 'coinsEarned',
  perHourField: 'coinsPerHour',
  fields: COIN_FIELDS,
};

// Future categories will follow the same pattern:
// export const ENEMIES_DESTROYED_CATEGORY: FieldCategory = { ... };
// export const ENEMIES_AFFECTED_BY_CATEGORY: FieldCategory = { ... };
// export const UPGRADE_SHARDS_CATEGORY: FieldCategory = { ... };
