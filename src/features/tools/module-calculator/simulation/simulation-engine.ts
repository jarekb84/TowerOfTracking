/**
 * Simulation Engine
 *
 * SINGLE SOURCE OF TRUTH for all rolling logic.
 * Both Monte Carlo simulation and manual practice mode use these primitives.
 *
 * This ensures identical behavior between:
 * - Monte Carlo running 10,000+ simulations
 * - Manual mode where user controls each step
 */

// Note: Using relative import for Web Worker compatibility
import type { Rarity } from '../../../../shared/domain/module-data';
import type { SlotTarget, PoolEntry } from '../types';
import {
  simulateRollFast,
  checkTargetMatch,
  removeEffectFromPreparedPool,
  type PreparedPool,
} from './pool-dynamics';
import {
  getCurrentPriorityTargets,
  removeLockedEffectFromTargets,
  buildMinRarityMap,
} from './target-priority';

// Re-export for consumers
export {  removeLockedEffectFromTargets, buildMinRarityMap };

/**
 * Result of rolling a single slot
 */
interface SlotRollResult {
  /** The effect that landed */
  entry: PoolEntry;
  /** Whether this entry matches any remaining target */
  isTargetMatch: boolean;
  /** The matched target, if any */
  matchedTarget: SlotTarget | null;
}

/**
 * Result of rolling all open slots in one round
 */
interface RollRoundResult {
  /** Results for each slot rolled */
  slotResults: SlotRollResult[];
  /** Whether any slot hit any remaining target */
  hasTargetHit: boolean;
  /** Whether any slot hit a target in the CURRENT priority group */
  hasCurrentPriorityHit: boolean;
  /** The first current-priority target that was hit, if any */
  firstPriorityHit: { entry: PoolEntry; target: SlotTarget } | null;
}

/**
 * Context for rolling operations - bundles common parameters
 */
interface RollContext {
  pool: PreparedPool;
  openSlotCount: number;
  remainingTargets: SlotTarget[];
  minRarityMap: Map<string, Rarity>;
}

interface PriorityContext {
  targets: SlotTarget[];
  minRarityMap: Map<string, Rarity>;
}

interface RollAccumulator {
  slotResults: SlotRollResult[];
  hasTargetHit: boolean;
  hasCurrentPriorityHit: boolean;
  firstPriorityHit: { entry: PoolEntry; target: SlotTarget } | null;
}

interface SlotRollContext {
  pool: PreparedPool;
  remainingTargets: SlotTarget[];
  minRarityMap: Map<string, Rarity>;
  priorityContext: PriorityContext;
}

/**
 * Process a single slot roll and update the accumulator
 */
function processSlotRoll(ctx: SlotRollContext, acc: RollAccumulator): void {
  const entry = simulateRollFast(ctx.pool, Math.random());
  const matchedTarget = checkTargetMatch(entry, ctx.remainingTargets, ctx.minRarityMap);
  const isTargetMatch = matchedTarget !== null;

  if (isTargetMatch) {
    acc.hasTargetHit = true;
    const priorityMatch = checkTargetMatch(
      entry,
      ctx.priorityContext.targets,
      ctx.priorityContext.minRarityMap
    );
    if (priorityMatch && !acc.firstPriorityHit) {
      acc.hasCurrentPriorityHit = true;
      acc.firstPriorityHit = { entry, target: priorityMatch };
    }
  }

  acc.slotResults.push({ entry, isTargetMatch, matchedTarget });
}

/**
 * Roll all open slots once.
 *
 * This is the CORE rolling primitive used by both Monte Carlo and manual mode.
 *
 * @param pool - The current effect pool to roll from
 * @param openSlotCount - Number of open slots to fill
 * @param remainingTargets - Targets still being rolled for
 * @param minRarityMap - Minimum rarity requirements per effect
 * @returns Results for each slot and aggregate hit information
 */
export function rollRound(
  pool: PreparedPool,
  openSlotCount: number,
  remainingTargets: SlotTarget[],
  minRarityMap: Map<string, Rarity>
): RollRoundResult {
  const emptyResult: RollRoundResult = {
    slotResults: [],
    hasTargetHit: false,
    hasCurrentPriorityHit: false,
    firstPriorityHit: null,
  };

  if (pool.entries.length === 0 || openSlotCount === 0) {
    return emptyResult;
  }

  const currentPriorityTargets = getCurrentPriorityTargets(remainingTargets);
  const slotRollCtx: SlotRollContext = {
    pool,
    remainingTargets,
    minRarityMap,
    priorityContext: {
      targets: currentPriorityTargets,
      minRarityMap: buildMinRarityMap(currentPriorityTargets),
    },
  };

  const acc: RollAccumulator = { ...emptyResult, slotResults: [] };

  for (let i = 0; i < openSlotCount; i++) {
    processSlotRoll(slotRollCtx, acc);
  }

  return acc;
}

/**
 * Roll rounds until a current-priority target is hit.
 *
 * Used by Monte Carlo for bulk simulation. Each call simulates rolling
 * until we hit something worth locking.
 *
 * @param context - Roll context containing pool, openSlotCount, remainingTargets, and minRarityMap
 * @param maxRounds - Safety limit to prevent infinite loops
 * @returns The hit result and number of rounds taken, or null if max reached
 */
export function rollUntilPriorityHit(
  context: RollContext,
  maxRounds: number = 1000000
): { entry: PoolEntry; target: SlotTarget; rounds: number } | null {
  const { pool, openSlotCount, remainingTargets, minRarityMap } = context;

  for (let round = 1; round <= maxRounds; round++) {
    const result = rollRound(pool, openSlotCount, remainingTargets, minRarityMap);

    if (result.firstPriorityHit) {
      return {
        entry: result.firstPriorityHit.entry,
        target: result.firstPriorityHit.target,
        rounds: round,
      };
    }
  }

  return null;
}

/**
 * Lock an effect, updating pool and remaining targets.
 *
 * This is the CORE locking primitive used by both Monte Carlo and manual mode.
 *
 * @param pool - Current pool
 * @param remainingTargets - Current remaining targets
 * @param effectId - Effect to lock
 * @param targetSlotNumber - The target slot that was filled (for target removal)
 * @returns Updated pool and remaining targets
 */
export function lockEffect(
  pool: PreparedPool,
  remainingTargets: SlotTarget[],
  effectId: string,
  targetSlotNumber: number
): { newPool: PreparedPool; newRemainingTargets: SlotTarget[] } {
  // Remove ALL rarities of this effect from pool
  const newPool = removeEffectFromPreparedPool(pool, effectId);

  // Remove this effect from all remaining targets' acceptable effects
  // Also remove the filled target slot
  const newRemainingTargets = removeLockedEffectFromTargets(
    remainingTargets.filter((t) => t.slotNumber !== targetSlotNumber),
    effectId
  );

  return { newPool, newRemainingTargets };
}

/**
 * Check if simulation is complete (all targets fulfilled or pool exhausted)
 */
export function isSimulationComplete(
  remainingTargets: SlotTarget[],
  pool: PreparedPool
): boolean {
  return remainingTargets.length === 0 || pool.entries.length === 0;
}
