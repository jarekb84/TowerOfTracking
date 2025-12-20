/**
 * Rarity Utilities
 *
 * Pure functions for comparing, filtering, and working with rarities.
 */

import type { Rarity } from '../types';
import { RARITY_CONFIG_MAP, RARITY_ORDER } from './rarity-config';

/**
 * Compare two rarities for sorting
 * Returns negative if a < b, positive if a > b, zero if equal
 */
export function compareRarities(a: Rarity, b: Rarity): number {
  return RARITY_CONFIG_MAP[a].sortOrder - RARITY_CONFIG_MAP[b].sortOrder;
}

/**
 * Check if rarity a is less common (higher tier) than rarity b
 */
export function isRarerThan(a: Rarity, b: Rarity): boolean {
  return RARITY_CONFIG_MAP[a].sortOrder > RARITY_CONFIG_MAP[b].sortOrder;
}

/**
 * Check if rarity a is at least as rare as rarity b
 */
export function isAtLeastAsRare(a: Rarity, b: Rarity): boolean {
  return RARITY_CONFIG_MAP[a].sortOrder >= RARITY_CONFIG_MAP[b].sortOrder;
}

/**
 * Get all rarities at or above the specified minimum
 */
export function getRaritiesAtOrAbove(minRarity: Rarity): Rarity[] {
  const minOrder = RARITY_CONFIG_MAP[minRarity].sortOrder;
  return RARITY_ORDER.filter((r) => RARITY_CONFIG_MAP[r].sortOrder >= minOrder);
}

/**
 * Get all rarities at or below the specified maximum
 */
export function getRaritiesAtOrBelow(maxRarity: Rarity): Rarity[] {
  const maxOrder = RARITY_CONFIG_MAP[maxRarity].sortOrder;
  return RARITY_ORDER.filter((r) => RARITY_CONFIG_MAP[r].sortOrder <= maxOrder);
}

/**
 * Get the next higher rarity tier, or null if already at ancestral
 */
export function getNextHigherRarity(rarity: Rarity): Rarity | null {
  const currentIndex = RARITY_ORDER.indexOf(rarity);
  if (currentIndex === -1 || currentIndex === RARITY_ORDER.length - 1) {
    return null;
  }
  return RARITY_ORDER[currentIndex + 1];
}

/**
 * Get the next lower rarity tier, or null if already at common
 */
export function getNextLowerRarity(rarity: Rarity): Rarity | null {
  const currentIndex = RARITY_ORDER.indexOf(rarity);
  if (currentIndex <= 0) {
    return null;
  }
  return RARITY_ORDER[currentIndex - 1];
}

/**
 * Calculate cumulative probability for rolling at least this rarity
 */
export function getCumulativeProbability(minRarity: Rarity): number {
  const raritiesAbove = getRaritiesAtOrAbove(minRarity);
  return raritiesAbove.reduce((sum, r) => sum + RARITY_CONFIG_MAP[r].probability, 0);
}
