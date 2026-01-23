/**
 * Banned Effects Logic
 *
 * Pure functions for calculating banned effects information.
 */

import { getSubEffectById, getAvailableRarities } from '@/shared/domain/module-data';

export interface BannedEffectsInfo {
  effectNames: string[];
  effectCount: number;
  combinationsRemoved: number;
}

/**
 * Get display information about banned effects including
 * effect names and the total number of pool combinations removed.
 */
export function getBannedEffectsInfo(bannedEffectIds: string[]): BannedEffectsInfo {
  const effectNames: string[] = [];
  let combinationsRemoved = 0;

  for (const id of bannedEffectIds) {
    const effect = getSubEffectById(id);
    if (effect) {
      effectNames.push(effect.displayName);
      combinationsRemoved += getAvailableRarities(effect).length;
    } else {
      effectNames.push(id);
    }
  }

  return {
    effectNames,
    effectCount: bannedEffectIds.length,
    combinationsRemoved,
  };
}
