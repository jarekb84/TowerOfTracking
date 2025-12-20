/**
 * Lock Costs
 *
 * Dice cost required to lock effects based on how many are already locked.
 * Costs increase exponentially as more effects are locked.
 */

import type { LockCost } from '../types';

/**
 * Dice costs by number of already-locked effects
 *
 * Lock count is the number of effects already locked (0-7).
 * Dice cost is what it costs to lock the next effect.
 */
const LOCK_COSTS: LockCost[] = [
  { lockCount: 0, diceCost: 10 },
  { lockCount: 1, diceCost: 40 },
  { lockCount: 2, diceCost: 160 },
  { lockCount: 3, diceCost: 500 },
  { lockCount: 4, diceCost: 1000 },
  { lockCount: 5, diceCost: 1600 },
  { lockCount: 6, diceCost: 2250 },
  { lockCount: 7, diceCost: 3000 },
];

/**
 * Lookup map for quick access by lock count
 */
const LOCK_COST_MAP: Record<number, number> = Object.fromEntries(
  LOCK_COSTS.map((cost) => [cost.lockCount, cost.diceCost])
);

/**
 * Get the dice cost to lock the next effect
 *
 * @param lockedCount - Number of effects already locked (0-7)
 * @returns Dice cost for the next lock
 */
export function getLockCost(lockedCount: number): number {
  if (lockedCount < 0) {
    return LOCK_COSTS[0].diceCost;
  }
  if (lockedCount >= LOCK_COSTS.length) {
    return LOCK_COSTS[LOCK_COSTS.length - 1].diceCost;
  }
  return LOCK_COST_MAP[lockedCount];
}

