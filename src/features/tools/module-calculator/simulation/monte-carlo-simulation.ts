/**
 * Monte Carlo Simulation
 *
 * Runs multiple iterations using the simulation engine to generate
 * cost distributions for module rerolling.
 *
 * This file orchestrates simulations but delegates all rolling logic
 * to simulation-engine.ts (the single source of truth).
 */

// Note: Using relative import for Web Worker compatibility (path aliases don't resolve in worker bundles)
import { getLockCost } from '../../../../shared/domain/module-data';
import type {
  CalculatorConfig,
  SimulationConfig,
  SimulationResults,
  SimulationRun,
  CostStatistics,
  HistogramBucket,
  PoolEntry,
  SlotTarget,
} from '../types';
import { buildInitialPool, preparePool, type PreparedPool } from './pool-dynamics';
import {
  rollUntilPriorityHit,
  lockEffect,
  buildMinRarityMap,
  isSimulationComplete,
} from './simulation-engine';

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
 *
 * Uses the simulation engine for all rolling logic (single source of truth).
 */
export function simulateSingleRun(config: CalculatorConfig): SimulationRun {
  let pool = buildSimulationPool(config);
  let remainingTargets = [...config.slotTargets];
  const preLockedCount = config.preLockedEffects.length;
  const state: SimulationRun = { lockOrder: [], totalRolls: 0, totalShardCost: 0 };

  // Build the min rarity map once for the entire session
  const minRarityMap = buildMinRarityMap(config.slotTargets);

  while (!isSimulationComplete(remainingTargets, pool)) {
    const lockedCount = preLockedCount + state.lockOrder.length;
    const openSlots = config.slotCount - lockedCount;

    // Use the simulation engine's rollUntilPriorityHit
    // This is the SAME function manual mode uses
    const rollResult = rollUntilPriorityHit({
      pool,
      openSlotCount: openSlots,
      remainingTargets,
      minRarityMap,
    });

    if (!rollResult) break;

    const { entry, target, rounds } = rollResult;
    recordLockedEffect(state, {
      entry,
      target,
      rounds,
      shardCostPerRound: getLockCost(lockedCount),
    });

    // Use the simulation engine's lockEffect
    // This is the SAME function manual mode uses
    const lockResult = lockEffect(pool, remainingTargets, entry.effect.id, target.slotNumber);
    pool = lockResult.newPool;
    remainingTargets = lockResult.newRemainingTargets;
  }

  return state;
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
