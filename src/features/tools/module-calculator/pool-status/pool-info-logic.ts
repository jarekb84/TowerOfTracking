/**
 * Pool Info Logic
 *
 * Pure functions for calculating pool information including
 * effect count and total combinations available.
 */

import type { ModuleType, Rarity, SubEffectConfig } from '@/shared/domain/module-data';
import {
  getSubEffectsForModule,
  filterByModuleRarity,
  countPoolCombinations,
} from '@/shared/domain/module-data';

export interface PoolInfo {
  effectCount: number;
  combinationCount: number;
}

interface PoolCalculationParams {
  moduleType: ModuleType;
  moduleRarity: Rarity;
  bannedEffectIds: string[];
  lockedEffectIds: string[];
}

/**
 * Get the available effects in the pool after filtering out
 * banned and locked effects.
 */
export function getAvailablePoolEffects(params: PoolCalculationParams): SubEffectConfig[] {
  const { moduleType, moduleRarity, bannedEffectIds, lockedEffectIds } = params;

  const allEffects = getSubEffectsForModule(moduleType);

  const filteredEffects = allEffects.filter(
    (e) => !bannedEffectIds.includes(e.id) && !lockedEffectIds.includes(e.id)
  );

  return filterByModuleRarity(filteredEffects, moduleRarity);
}

/**
 * Calculate pool information including effect count and total combinations.
 */
export function getPoolInfo(params: PoolCalculationParams): PoolInfo {
  const availableEffects = getAvailablePoolEffects(params);
  const combinationCount = countPoolCombinations(availableEffects, params.moduleRarity);

  return {
    effectCount: availableEffects.length,
    combinationCount,
  };
}
