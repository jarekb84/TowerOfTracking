/**
 * Simulation Worker
 *
 * Runs Monte Carlo simulations in chunks to keep the UI responsive.
 * Each chunk yields to the event loop, allowing React to update progress.
 *
 * Note: This is NOT a true Web Worker (which would run in a separate thread).
 * For true parallelization, a dedicated worker file would be needed.
 */

import type { SimulationConfig, SimulationResults, SimulationRun } from '../types';
import { simulateSingleRun, calculateStatistics } from './monte-carlo-simulation';

/** Number of iterations per chunk to allow UI updates */
const CHUNK_SIZE = 500;

/** Minimum delay between chunks (ms) */
const CHUNK_DELAY = 0;

export interface SimulationProgress {
  completed: number;
  total: number;
  percentage: number;
}

type ProgressCallback = (progress: SimulationProgress) => void;

/**
 * Aggregate simulation runs into results
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
 * Build histogram for cost distribution
 * Uses p95 as the effective max for bucket sizing
 */
function buildHistogram(
  values: number[],
  stats: ReturnType<typeof calculateStatistics>
): SimulationResults['shardCostHistogram'] {
  if (values.length === 0) {
    return [];
  }

  const bucketCount = 20;
  const min = stats.min;
  const effectiveMax = stats.percentile95;
  const range = effectiveMax - min;
  const bucketSize = range / bucketCount || 1;

  const buckets = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + i * bucketSize;
    const bucketMax = min + (i + 1) * bucketSize;
    const isLastBucket = i === bucketCount - 1;
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
 * Sleep utility for async chunking
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Estimate simulation time based on configuration
 */
export function estimateSimulationTime(config: SimulationConfig): {
  estimatedMs: number;
  isLongRunning: boolean;
} {
  // Rough estimate: ~0.1ms per iteration for simple configs
  // More targets = more time
  const targetCount = config.calculatorConfig.slotTargets.length;
  const baseTimePerIteration = 0.1;
  const targetMultiplier = 1 + (targetCount * 0.2);

  const estimatedMs = config.iterations * baseTimePerIteration * targetMultiplier;
  const isLongRunning = estimatedMs > 1000; // More than 1 second

  return { estimatedMs, isLongRunning };
}

/**
 * Create a cancellable simulation runner
 */
export function createCancellableSimulation(config: SimulationConfig) {
  let cancelled = false;

  const run = async (onProgress?: ProgressCallback): Promise<SimulationResults | null> => {
    const { calculatorConfig, iterations } = config;
    const runs: SimulationRun[] = [];

    let completed = 0;

    while (completed < iterations && !cancelled) {
      const chunkSize = Math.min(CHUNK_SIZE, iterations - completed);

      for (let i = 0; i < chunkSize && !cancelled; i++) {
        const run = simulateSingleRun(calculatorConfig);
        runs.push(run);
      }

      completed += chunkSize;

      if (onProgress && !cancelled) {
        onProgress({
          completed,
          total: iterations,
          percentage: (completed / iterations) * 100,
        });
      }

      if (completed < iterations && !cancelled) {
        await sleep(CHUNK_DELAY);
      }
    }

    if (cancelled) {
      return null;
    }

    return aggregateResults(runs);
  };

  const cancel = () => {
    cancelled = true;
  };

  return { run, cancel };
}
