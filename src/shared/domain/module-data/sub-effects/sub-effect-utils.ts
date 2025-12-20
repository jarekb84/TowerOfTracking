/**
 * Sub-Effect Utilities
 *
 * Pure functions for filtering, querying, and working with sub-effects.
 */

import type { Rarity, SubEffectConfig } from '../types';
import { RARITY_ORDER } from '../rarities/rarity-config';
import { isAtLeastAsRare } from '../rarities/rarity-utils';

/**
 * Get all rarities that are available for a specific sub-effect
 */
export function getAvailableRarities(effect: SubEffectConfig): Rarity[] {
  return RARITY_ORDER.filter((rarity) => effect.values[rarity] !== null);
}

/**
 * Check if a sub-effect has a specific rarity available
 */
export function hasRarity(effect: SubEffectConfig, rarity: Rarity): boolean {
  return effect.values[rarity] !== null;
}

/**
 * Get the lowest (most common) available rarity for a sub-effect
 */
export function getLowestRarity(effect: SubEffectConfig): Rarity | null {
  const available = getAvailableRarities(effect);
  return available.length > 0 ? available[0] : null;
}

/**
 * Get the highest (most rare) available rarity for a sub-effect
 */
export function getHighestRarity(effect: SubEffectConfig): Rarity | null {
  const available = getAvailableRarities(effect);
  return available.length > 0 ? available[available.length - 1] : null;
}

/**
 * Check if a sub-effect can be targeted at a specific minimum rarity
 *
 * An effect can be targeted if it has at least one rarity at or above
 * the specified minimum that is also at or below the max module rarity.
 */
export function canTargetAtRarity(
  effect: SubEffectConfig,
  minRarity: Rarity,
  maxModuleRarity: Rarity = 'ancestral'
): boolean {
  return getAvailableRarities(effect).some(
    (r) => isAtLeastAsRare(r, minRarity) && !isRarityAbove(r, maxModuleRarity)
  );
}

/**
 * Check if rarity a is strictly above rarity b
 */
function isRarityAbove(a: Rarity, b: Rarity): boolean {
  return RARITY_ORDER.indexOf(a) > RARITY_ORDER.indexOf(b);
}

/**
 * Get rarities available for targeting (at or above min, at or below max)
 */
export function getTargetableRarities(
  effect: SubEffectConfig,
  minRarity: Rarity,
  maxModuleRarity: Rarity = 'ancestral'
): Rarity[] {
  return getAvailableRarities(effect).filter(
    (r) => isAtLeastAsRare(r, minRarity) && !isRarityAbove(r, maxModuleRarity)
  );
}

/**
 * Filter sub-effects to only those available at a given module rarity
 *
 * An effect is available if it has at least one rarity at or below
 * the module's rarity cap.
 */
export function filterByModuleRarity(
  effects: SubEffectConfig[],
  maxModuleRarity: Rarity
): SubEffectConfig[] {
  return effects.filter((effect) => {
    const availableRarities = getAvailableRarities(effect);
    return availableRarities.some((r) => !isRarityAbove(r, maxModuleRarity));
  });
}

/**
 * Get the value for a specific rarity, or null if not available
 */
export function getValueAtRarity(
  effect: SubEffectConfig,
  rarity: Rarity
): string | number | null {
  return effect.values[rarity];
}

/**
 * Format a sub-effect value with its unit for display
 */
export function formatEffectValue(
  effect: SubEffectConfig,
  rarity: Rarity
): string {
  const value = effect.values[rarity];

  if (value === null) {
    return '—';
  }

  const unit = effect.unit ?? '';
  const sign = typeof value === 'number' && value > 0 ? '+' : '';

  return `${sign}${value}${unit}`;
}

/**
 * Count how many rarity-effect combinations exist in a pool
 */
export function countPoolCombinations(
  effects: SubEffectConfig[],
  maxModuleRarity: Rarity = 'ancestral'
): number {
  let count = 0;

  for (const effect of effects) {
    for (const rarity of getAvailableRarities(effect)) {
      if (!isRarityAbove(rarity, maxModuleRarity)) {
        count++;
      }
    }
  }

  return count;
}
