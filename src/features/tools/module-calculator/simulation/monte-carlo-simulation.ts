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
  LockedEffect,
  SlotTarget,
  CostStatistics,
  HistogramBucket,
  PoolEntry,
} from '../types';
import {
  buildInitialPool,
  preparePool,
  simulateRollFast,
  removeFromPreparedPool,
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
 * Simulate a single complete reroll session
 *
 * Game mechanic: each roll costs shards based on current lock count.
 * - 0 locks: 10 shards/roll
 * - 1 lock: 40 shards/roll
 * - 2 locks: 160 shards/roll
 * - etc.
 *
 * Locking an effect is free - it just makes subsequent rolls more expensive.
 *
 * If preLockedEffects are provided, the simulation starts with those effects
 * already locked, affecting both the pool and the initial shard cost per roll.
 */
export function simulateSingleRun(config: CalculatorConfig): SimulationRun {
  // Start with pre-locked effects removed from pool
  const preLockedEffectIds = config.preLockedEffects.map((e) => e.effectId);
  const initialPool = buildInitialPool(config.moduleType, config.moduleRarity, [
    ...config.bannedEffects,
    ...preLockedEffectIds,
  ]);
  // Prepare pool once - cumulative probabilities are pre-computed
  let preparedPool = preparePool(initialPool);
  let remainingTargets = [...config.slotTargets];

  // Start with pre-locked effects count (affects shard cost per roll)
  const preLockedCount = config.preLockedEffects.length;
  const state = { lockOrder: [] as LockedEffect[], totalRolls: 0, totalShardCost: 0 };

  while (remainingTargets.length > 0 && preparedPool.entries.length > 0) {
    // Only roll for the current priority group (targets with minimum slot number)
    // This ensures sequential priorities are respected: we complete priority 1 before moving to priority 2
    const currentPriorityTargets = getCurrentPriorityTargets(remainingTargets);
    const currentPriorityMinRarity = buildMinRarityMap(currentPriorityTargets);

    const rollsForThisTarget = rollUntilTargetHitFast(preparedPool, currentPriorityTargets, currentPriorityMinRarity);
    if (!rollsForThisTarget) break;

    const { entry, target, rolls } = rollsForThisTarget;
    // Lock count includes pre-locked effects
    const currentLockCount = preLockedCount + state.lockOrder.length;
    const shardCostPerRoll = getLockCost(currentLockCount);

    state.totalRolls += rolls;
    state.totalShardCost += rolls * shardCostPerRoll;
    state.lockOrder.push({
      effectId: entry.effect.id,
      rarity: entry.rarity,
      slotNumber: target.slotNumber,
      rollsToAcquire: rolls,
      shardCostPerRoll,
    });

    // Re-prepare pool only when it changes (after locking an effect)
    preparedPool = removeFromPreparedPool(preparedPool, entry.effect.id, entry.rarity);
    // Remove the filled slot target, then remove the locked effect from all remaining targets
    remainingTargets = removeLockedEffectFromTargets(
      remainingTargets.filter((t) => t.slotNumber !== target.slotNumber),
      entry.effect.id
    );
  }

  return state;
}

/**
 * Roll until we hit a target using optimized binary search
 */
function rollUntilTargetHitFast(
  preparedPool: PreparedPool,
  targets: SlotTarget[],
  minRarityForEffect: Map<string, string>
): { entry: PoolEntry; target: SlotTarget; rolls: number } | null {
  let rolls = 0;
  const maxRolls = 1000000; // Safety limit

  while (rolls < maxRolls) {
    rolls++;
    const random = Math.random();
    const entry = simulateRollFast(preparedPool, random);

    const target = checkTargetMatch(
      entry,
      targets,
      minRarityForEffect as Map<string, import('../../../../shared/domain/module-data').Rarity>
    );

    if (target) {
      return { entry, target, rolls };
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
