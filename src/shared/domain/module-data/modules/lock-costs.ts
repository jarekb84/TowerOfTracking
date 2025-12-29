/**
 * Lock Costs
 *
 * Shard cost required to lock effects based on how many are already locked.
 * Costs increase exponentially as more effects are locked.
 */

import type { LockCost } from '../types';

/**
 * Shard costs by number of already-locked effects
 *
 * Lock count is the number of effects already locked (0-7).
 * Shard cost is what it costs to lock the next effect.
 */
const LOCK_COSTS: LockCost[] = [
  { lockCount: 0, shardCost: 10 },
  { lockCount: 1, shardCost: 40 },
  { lockCount: 2, shardCost: 160 },
  { lockCount: 3, shardCost: 500 },
  { lockCount: 4, shardCost: 1000 },
  { lockCount: 5, shardCost: 1600 },
  { lockCount: 6, shardCost: 2250 },
  { lockCount: 7, shardCost: 3000 },
];

/**
 * Lookup map for quick access by lock count
 */
const LOCK_COST_MAP: Record<number, number> = Object.fromEntries(
  LOCK_COSTS.map((cost) => [cost.lockCount, cost.shardCost])
);

/**
 * Get the shard cost to lock the next effect
 *
 * @param lockedCount - Number of effects already locked (0-7)
 * @returns Shard cost for the next lock
 */
export function getLockCost(lockedCount: number): number {
  if (lockedCount < 0) {
    return LOCK_COSTS[0].shardCost;
  }
  if (lockedCount >= LOCK_COSTS.length) {
    return LOCK_COSTS[LOCK_COSTS.length - 1].shardCost;
  }
  return LOCK_COST_MAP[lockedCount];
}

