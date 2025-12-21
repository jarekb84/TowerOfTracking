/**
 * Monte Carlo Simulation
 *
 * Core simulation logic for estimating module reroll costs.
 * Runs multiple iterations to generate cost distributions.
 */

// Note: Using relative import for Web Worker compatibility (path aliases don't resolve in worker bundles)
import { getLockCost, RARITY_ORDER } from '../../../../shared/domain/module-data';
import type {
  CalculatorConfig,
  SimulationConfig,
  SimulationResults,
  SimulationRun,
  SlotTarget,
  CostStatistics,
  HistogramBucket,
  PoolEntry,
} from '../types';
import {
  buildInitialPool,
  preparePool,
  simulateRollFast,
  removeEffectFromPreparedPool,
  checkTargetMatch,
  type PreparedPool,
} from './pool-dynamics';

/** Number of histogram buckets for distribution chart */
const HISTOGRAM_BUCKET_COUNT = 20;

/**
 * Run the full Monte Carlo simulation
 */
export function runSimulation(config: SimulationConfig): SimulationResults {
  const { calculatorConfig, iterations } = config;
  const runs: SimulationRun[] = [];

  for (let i = 0; i < iterations; i++) {
    const run = simulateSingleRun(calculatorConfig);
    runs.push(run);
  }

  return aggregateResults(runs);
}

/**
 * Build the initial prepared pool for simulation, excluding banned and pre-locked effects
 */
function buildSimulationPool(config: CalculatorConfig): PreparedPool {
  const preLockedEffectIds = config.preLockedEffects.map((e) => e.effectId);
  const initialPool = buildInitialPool(config.moduleType, config.moduleRarity, [
    ...config.bannedEffects,
    ...preLockedEffectIds,
  ]);
  return preparePool(initialPool);
}

interface LockResult {
  entry: PoolEntry;
  target: SlotTarget;
  rounds: number;
  shardCostPerRound: number;
}

/**
 * Record a locked effect in the simulation state
 */
function recordLockedEffect(state: SimulationRun, result: LockResult): void {
  const { entry, target, rounds, shardCostPerRound } = result;
  state.totalRolls += rounds;
  state.totalShardCost += rounds * shardCostPerRound;
  state.lockOrder.push({
    effectId: entry.effect.id,
    rarity: entry.rarity,
    slotNumber: target.slotNumber,
    rollsToAcquire: rounds,
    shardCostPerRoll: shardCostPerRound,
  });
}

/**
 * Simulate a single complete reroll session
 *
 * Game mechanic: clicking "Roll" fills ALL open slots simultaneously and costs
 * shards based on current lock count:
 * - 0 locks: 10 shards/round
 * - 1 lock: 40 shards/round
 * - 2 locks: 160 shards/round
 * - etc.
 *
 * Each round, ALL open slots get random effects. If any effect matches a target,
 * the player locks it (locking is free, but makes subsequent rounds more expensive).
 *
 * When an effect is locked, ALL rarities of that effect are removed from the pool
 * (you can only have one of each effect type on a module).
 */
export function simulateSingleRun(config: CalculatorConfig): SimulationRun {
  let preparedPool = buildSimulationPool(config);
  let remainingTargets = [...config.slotTargets];
  const preLockedCount = config.preLockedEffects.length;
  const state: SimulationRun = { lockOrder: [], totalRolls: 0, totalShardCost: 0 };

  while (remainingTargets.length > 0 && preparedPool.entries.length > 0) {
    const currentPriorityTargets = getCurrentPriorityTargets(remainingTargets);
    const currentPriorityMinRarity = buildMinRarityMap(currentPriorityTargets);
    const lockedCount = preLockedCount + state.lockOrder.length;
    const openSlots = config.slotCount - lockedCount;

    const roundResult = rollRoundsUntilTargetHit(
      preparedPool,
      currentPriorityTargets,
      currentPriorityMinRarity,
      openSlots
    );
    if (!roundResult) break;

    const { entry, target, rounds } = roundResult;
    recordLockedEffect(state, { entry, target, rounds, shardCostPerRound: getLockCost(lockedCount) });

    preparedPool = removeEffectFromPreparedPool(preparedPool, entry.effect.id);
    remainingTargets = removeLockedEffectFromTargets(
      remainingTargets.filter((t) => t.slotNumber !== target.slotNumber),
      entry.effect.id
    );
  }

  return state;
}

/**
 * Roll rounds until we hit a target, simulating multiple open slots per round.
 *
 * Each round, ALL open slots are filled with random effects from the pool.
 * If ANY of these effects matches a target, we return it.
 *
 * This accurately models the game where clicking "Roll" fills all open slots
 * simultaneously for a single shard cost.
 *
 * @param preparedPool - The pool to roll from
 * @param targets - Target effects we're looking for
 * @param minRarityForEffect - Minimum rarity requirements per effect
 * @param openSlots - Number of open slots that get filled each round
 * @returns The first matching effect found and number of rounds taken
 */
function rollRoundsUntilTargetHit(
  preparedPool: PreparedPool,
  targets: SlotTarget[],
  minRarityForEffect: Map<string, string>,
  openSlots: number
): { entry: PoolEntry; target: SlotTarget; rounds: number } | null {
  let rounds = 0;
  const maxRounds = 1000000; // Safety limit
  const effectiveSlots = Math.max(1, openSlots); // At least 1 slot

  while (rounds < maxRounds) {
    rounds++;

    // Roll ALL open slots in this round
    for (let slot = 0; slot < effectiveSlots; slot++) {
      const random = Math.random();
      const entry = simulateRollFast(preparedPool, random);

      const target = checkTargetMatch(
        entry,
        targets,
        minRarityForEffect as Map<string, import('../../../../shared/domain/module-data').Rarity>
      );

      // If any slot hits a target, we lock it and this round is done
      if (target) {
        return { entry, target, rounds };
      }
    }
  }

  return null;
}

/**
 * Build a map of effect ID to minimum required rarity across all targets
 */
function buildMinRarityMap(targets: SlotTarget[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const target of targets) {
    for (const effectId of target.acceptableEffects) {
      const existing = map.get(effectId);
      if (!existing) {
        map.set(effectId, target.minRarity);
      } else {
        // Keep the lower minimum (more permissive)
        const existingIndex = RARITY_ORDER.indexOf(
          existing as import('../../../../shared/domain/module-data').Rarity
        );
        const newIndex = RARITY_ORDER.indexOf(target.minRarity);
        if (newIndex < existingIndex) {
          map.set(effectId, target.minRarity);
        }
      }
    }
  }

  return map;
}

/**
 * Remove a locked effect from all remaining targets' acceptable effects.
 *
 * When an effect is locked, it should no longer be considered for other slots.
 * This is critical for same-priority groups where multiple slots initially share
 * the same acceptable effects pool.
 *
 * Also removes any targets that now have empty acceptable effects (shouldn't happen
 * with proper target construction, but included for safety).
 */
function removeLockedEffectFromTargets(
  targets: SlotTarget[],
  lockedEffectId: string
): SlotTarget[] {
  return targets
    .map((target) => ({
      ...target,
      acceptableEffects: target.acceptableEffects.filter((id) => id !== lockedEffectId),
    }))
    .filter((target) => target.acceptableEffects.length > 0);
}

/**
 * Get targets belonging to the current priority group.
 *
 * Priority groups are identified by slot number ranges created during target expansion.
 * Same-priority effects share consecutive slot numbers and the same acceptable effects pool.
 *
 * This function returns all targets that share the minimum slot number's acceptable effects,
 * which represents the current priority group we should be rolling for.
 *
 * Example:
 * - Slots 1,2 accept [A,B] (priority group 1)
 * - Slot 3 accepts [C] (priority group 2)
 *
 * When slot 1 is filled with A, remaining targets are:
 * - Slot 2 accepts [B]
 * - Slot 3 accepts [C]
 *
 * Now slot 2 is the minimum, and we only roll for [B] until it's filled,
 * then move to slot 3 for [C].
 */
function getCurrentPriorityTargets(targets: SlotTarget[]): SlotTarget[] {
  if (targets.length === 0) return [];

  const minSlotNumber = Math.min(...targets.map((t) => t.slotNumber));

  // Find all targets that are part of the same priority group as the minimum slot.
  // Same-priority targets have consecutive slot numbers AND share acceptable effects.
  // After effects are removed from the pool, they may have fewer effects but still
  // represent the same priority group.
  const minSlotTarget = targets.find((t) => t.slotNumber === minSlotNumber)!;
  const minSlotEffects = new Set(minSlotTarget.acceptableEffects);

  // A target is in the same priority group if it has overlapping acceptable effects
  // with the minimum slot target (they came from the same priority group originally)
  return targets.filter((t) => {
    // Always include the minimum slot
    if (t.slotNumber === minSlotNumber) return true;

    // Check if this target shares any acceptable effects with the min slot target
    // (indicating they were originally in the same priority group)
    return t.acceptableEffects.some((effect) => minSlotEffects.has(effect));
  });
}

/**
 * Aggregate multiple simulation runs into summary statistics
 */
function aggregateResults(runs: SimulationRun[]): SimulationResults {
  const shardCosts = runs.map((r) => r.totalShardCost);
  const rollCounts = runs.map((r) => r.totalRolls);
  const shardCostStats = calculateStatistics(shardCosts);

  return {
    runCount: runs.length,
    shardCost: shardCostStats,
    rollCount: calculateStatistics(rollCounts),
    shardCostHistogram: buildHistogram(shardCosts, shardCostStats),
  };
}

/**
 * Calculate statistics for a set of values
 */
export function calculateStatistics(values: number[]): CostStatistics {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      percentile10: 0,
      percentile90: 0,
      percentile95: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
    median: getPercentile(sorted, 50),
    percentile10: getPercentile(sorted, 10),
    percentile90: getPercentile(sorted, 90),
    percentile95: getPercentile(sorted, 95),
  };
}

/**
 * Get a specific percentile from a sorted array
 */
function getPercentile(sorted: number[], percentile: number): number {
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  const fraction = index - lower;
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

/**
 * Build a histogram of values
 *
 * Uses the 95th percentile as the upper bound for bucket sizing to provide
 * better resolution in the meaningful range. Values above p95 are included
 * in the last bucket.
 */
function buildHistogram(values: number[], stats: CostStatistics): HistogramBucket[] {
  if (values.length === 0) {
    return [];
  }

  // Use p95 as effective max for bucket sizing (better resolution for the 95% of runs)
  const min = stats.min;
  const effectiveMax = stats.percentile95;
  const range = effectiveMax - min;
  const bucketSize = range / HISTOGRAM_BUCKET_COUNT || 1;

  const buckets: HistogramBucket[] = [];

  for (let i = 0; i < HISTOGRAM_BUCKET_COUNT; i++) {
    const bucketMin = min + i * bucketSize;
    const bucketMax = min + (i + 1) * bucketSize;
    // Last bucket includes all values >= bucketMin (including outliers above p95)
    const isLastBucket = i === HISTOGRAM_BUCKET_COUNT - 1;
    const count = values.filter(
      (v) => v >= bucketMin && (isLastBucket ? true : v < bucketMax)
    ).length;

    buckets.push({
      min: bucketMin,
      max: isLastBucket ? stats.max : bucketMax,
      count,
      percentage: (count / values.length) * 100,
    });
  }

  return buckets;
}

/**
 * Create a simulation configuration with defaults
 *
 * Note: shardCostPerRoll is kept for API compatibility but is no longer used.
 * The actual cost per roll is determined dynamically by the lock count.
 */
export function createSimulationConfig(
  calculatorConfig: CalculatorConfig,
  iterations: number = 10000,
  shardCostPerRoll: number = 100
): SimulationConfig {
  return {
    calculatorConfig,
    iterations,
    shardCostPerRoll,
  };
}
