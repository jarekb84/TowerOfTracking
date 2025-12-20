/**
 * Pool Dynamics
 *
 * Manages the roll pool, handling effect removal when locked and
 * probability recalculation as the pool changes.
 */

import type { ModuleType, Rarity } from '@/shared/domain/module-data';
import {
  getSubEffectsForModule,
  getRarityProbability,
  getAvailableRarities,
  RARITY_ORDER,
} from '@/shared/domain/module-data';
import type { PoolEntry, SlotTarget } from '../types';

/**
 * A prepared pool with pre-computed cumulative probabilities for fast rolling.
 * Computing probabilities once and using binary search gives O(log n) per roll
 * instead of O(n) with the naive approach.
 */
export interface PreparedPool {
  /** The pool entries */
  entries: PoolEntry[];
  /** Cumulative probability thresholds for binary search (length = entries.length) */
  cumulativeProbs: number[];
}

/**
 * Build the initial roll pool for a module configuration
 *
 * @param moduleType - The type of module
 * @param moduleRarity - Maximum rarity cap from the module
 * @param bannedEffects - Effect IDs to exclude from pool
 */
export function buildInitialPool(
  moduleType: ModuleType,
  moduleRarity: Rarity,
  bannedEffects: string[]
): PoolEntry[] {
  const effects = getSubEffectsForModule(moduleType);
  const maxRarityIndex = RARITY_ORDER.indexOf(moduleRarity);
  const bannedSet = new Set(bannedEffects);
  const pool: PoolEntry[] = [];

  for (const effect of effects) {
    if (bannedSet.has(effect.id)) {
      continue;
    }

    const availableRarities = getAvailableRarities(effect);

    for (const rarity of availableRarities) {
      const rarityIndex = RARITY_ORDER.indexOf(rarity);
      if (rarityIndex <= maxRarityIndex) {
        pool.push({
          effect,
          rarity,
          baseProbability: getRarityProbability(rarity),
        });
      }
    }
  }

  return pool;
}

/**
 * Remove an effect-rarity combination from the pool
 *
 * When an effect is locked at a specific rarity, that exact combination
 * is removed from future rolls.
 */
export function removeFromPool(
  pool: PoolEntry[],
  effectId: string,
  rarity: Rarity
): PoolEntry[] {
  return pool.filter(
    (entry) => !(entry.effect.id === effectId && entry.rarity === rarity)
  );
}

/**
 * Remove all rarities of an effect from the pool
 *
 * Used when an effect is banned or fully locked.
 */
export function removeEffectFromPool(
  pool: PoolEntry[],
  effectId: string
): PoolEntry[] {
  return pool.filter((entry) => entry.effect.id !== effectId);
}

/**
 * Calculate normalized probabilities for the current pool
 *
 * After effects are removed, probabilities need to be renormalized
 * so they sum to 1.0.
 */
export function calculateNormalizedProbabilities(
  pool: PoolEntry[]
): Map<string, number> {
  const totalProbability = pool.reduce(
    (sum, entry) => sum + entry.baseProbability,
    0
  );

  const normalized = new Map<string, number>();

  for (const entry of pool) {
    const key = getPoolEntryKey(entry.effect.id, entry.rarity);
    normalized.set(key, entry.baseProbability / totalProbability);
  }

  return normalized;
}

/**
 * Generate a unique key for a pool entry
 */
export function getPoolEntryKey(effectId: string, rarity: Rarity): string {
  return `${effectId}:${rarity}`;
}

/**
 * Parse a pool entry key back to its components
 */
export function parsePoolEntryKey(key: string): { effectId: string; rarity: Rarity } {
  const [effectId, rarity] = key.split(':');
  return { effectId, rarity: rarity as Rarity };
}

/**
 * Simulate a single roll from the pool
 *
 * @param pool - Current roll pool
 * @param random - Random number between 0 and 1
 * @returns The pool entry that was rolled
 *
 * @deprecated Use preparePool + simulateRollFast for better performance
 */
export function simulateRoll(
  pool: PoolEntry[],
  random: number
): PoolEntry {
  const probabilities = calculateNormalizedProbabilities(pool);
  let cumulative = 0;

  for (const entry of pool) {
    const key = getPoolEntryKey(entry.effect.id, entry.rarity);
    const probability = probabilities.get(key) ?? 0;
    cumulative += probability;

    if (random < cumulative) {
      return entry;
    }
  }

  // Fallback to last entry (shouldn't happen with proper probabilities)
  return pool[pool.length - 1];
}

/**
 * Prepare a pool for fast rolling by pre-computing cumulative probabilities.
 * Call this once when the pool is created or modified, then use simulateRollFast.
 */
export function preparePool(pool: PoolEntry[]): PreparedPool {
  if (pool.length === 0) {
    return { entries: [], cumulativeProbs: [] };
  }

  const totalProbability = pool.reduce(
    (sum, entry) => sum + entry.baseProbability,
    0
  );

  const cumulativeProbs: number[] = [];
  let cumulative = 0;

  for (const entry of pool) {
    cumulative += entry.baseProbability / totalProbability;
    cumulativeProbs.push(cumulative);
  }

  // Ensure last value is exactly 1.0 to handle floating point errors
  cumulativeProbs[cumulativeProbs.length - 1] = 1.0;

  return { entries: pool, cumulativeProbs };
}

/**
 * Fast roll using binary search on pre-computed cumulative probabilities.
 * O(log n) instead of O(n) per roll.
 */
export function simulateRollFast(
  preparedPool: PreparedPool,
  random: number
): PoolEntry {
  const { entries, cumulativeProbs } = preparedPool;

  if (entries.length === 0) {
    throw new Error('Cannot roll from empty pool');
  }

  // Binary search for the first cumulative probability >= random
  let left = 0;
  let right = cumulativeProbs.length - 1;

  while (left < right) {
    const mid = (left + right) >>> 1; // Unsigned right shift for fast floor division
    if (cumulativeProbs[mid] < random) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return entries[left];
}

/**
 * Remove an entry from a prepared pool and return a new prepared pool.
 * More efficient than rebuilding from scratch.
 */
export function removeFromPreparedPool(
  preparedPool: PreparedPool,
  effectId: string,
  rarity: Rarity
): PreparedPool {
  const newEntries = preparedPool.entries.filter(
    (entry) => !(entry.effect.id === effectId && entry.rarity === rarity)
  );
  return preparePool(newEntries);
}

/**
 * Check if a rolled entry satisfies any of the remaining targets
 */
export function checkTargetMatch(
  entry: PoolEntry,
  targets: SlotTarget[],
  minRarityForEffect: Map<string, Rarity>
): SlotTarget | null {
  const effectMinRarity = minRarityForEffect.get(entry.effect.id);

  if (!effectMinRarity) {
    return null;
  }

  const entryRarityIndex = RARITY_ORDER.indexOf(entry.rarity);
  const minRarityIndex = RARITY_ORDER.indexOf(effectMinRarity);

  if (entryRarityIndex < minRarityIndex) {
    return null;
  }

  // Find the first target slot that accepts this effect
  for (const target of targets) {
    if (target.acceptableEffects.includes(entry.effect.id)) {
      const targetMinIndex = RARITY_ORDER.indexOf(target.minRarity);
      if (entryRarityIndex >= targetMinIndex) {
        return target;
      }
    }
  }

  return null;
}

/**
 * Calculate the probability of hitting any target in the current pool
 */
export function calculateTargetHitProbability(
  pool: PoolEntry[],
  targets: SlotTarget[],
  minRarityForEffect: Map<string, Rarity>
): number {
  const probabilities = calculateNormalizedProbabilities(pool);
  let hitProbability = 0;

  for (const entry of pool) {
    const match = checkTargetMatch(entry, targets, minRarityForEffect);
    if (match) {
      const key = getPoolEntryKey(entry.effect.id, entry.rarity);
      hitProbability += probabilities.get(key) ?? 0;
    }
  }

  return hitProbability;
}

/**
 * Get pool size (number of effect-rarity combinations)
 */
export function getPoolSize(pool: PoolEntry[]): number {
  return pool.length;
}

/**
 * Group pool entries by effect
 */
export function groupPoolByEffect(
  pool: PoolEntry[]
): Map<string, PoolEntry[]> {
  const groups = new Map<string, PoolEntry[]>();

  for (const entry of pool) {
    const existing = groups.get(entry.effect.id) ?? [];
    existing.push(entry);
    groups.set(entry.effect.id, existing);
  }

  return groups;
}
