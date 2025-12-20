/**
 * Simulation Worker
 *
 * Runs Monte Carlo simulations using Web Workers for true parallelization.
 * Falls back to single-threaded execution when Web Workers aren't available.
 */

import type { SimulationConfig, SimulationResults, SimulationRun } from '../types';
import { simulateSingleRun, calculateStatistics } from './monte-carlo-simulation';
import type { WorkerMessage, WorkerResponse, WorkerResult } from './simulation.worker';

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
 * Create a cancellable simulation runner (single-threaded fallback)
 */
function createCancellableSimulationSingleThread(config: SimulationConfig) {
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

/**
 * Check if Web Workers are available
 */
function isWebWorkerAvailable(): boolean {
  return typeof Worker !== 'undefined' && typeof window !== 'undefined';
}

/**
 * Get optimal worker count based on hardware
 */
function getOptimalWorkerCount(): number {
  if (typeof navigator === 'undefined') return 1;
  // Use up to 8 workers, leaving some cores for UI
  const cores = navigator.hardwareConcurrency || 4;
  return Math.min(Math.max(2, cores - 1), 8);
}

/**
 * Create a parallel simulation runner using Web Workers
 */
function createParallelSimulation(config: SimulationConfig) {
  const workers: Worker[] = [];
  let cancelled = false;

  const run = async (onProgress?: ProgressCallback): Promise<SimulationResults | null> => {
    const { calculatorConfig, iterations } = config;
    const workerCount = getOptimalWorkerCount();

    // Distribute iterations across workers
    const iterationsPerWorker = Math.ceil(iterations / workerCount);
    const workerProgress = new Map<number, number>();
    const workerResults: WorkerResult[] = [];

    return new Promise((resolve) => {
      let completedWorkers = 0;

      for (let i = 0; i < workerCount; i++) {
        // Calculate iterations for this worker (last worker may have fewer)
        const startIteration = i * iterationsPerWorker;
        const workerIterations = Math.min(iterationsPerWorker, iterations - startIteration);

        if (workerIterations <= 0) continue;

        // Create worker using Vite's worker import
        const worker = new Worker(
          new URL('./simulation.worker.ts', import.meta.url),
          { type: 'module' }
        );
        workers.push(worker);
        workerProgress.set(i, 0);

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          if (cancelled) return;

          const msg = event.data;

          if (msg.type === 'progress') {
            workerProgress.set(msg.workerId, msg.completed);
            if (onProgress) {
              const totalCompleted = Array.from(workerProgress.values()).reduce((a, b) => a + b, 0);
              onProgress({
                completed: totalCompleted,
                total: iterations,
                percentage: (totalCompleted / iterations) * 100,
              });
            }
          } else if (msg.type === 'result') {
            workerResults.push(msg);
            completedWorkers++;

            if (completedWorkers === workers.length) {
              // All workers done - aggregate results
              terminateWorkers();
              const allRuns = workerResults.flatMap((r) => r.runs);
              resolve(aggregateResults(allRuns));
            }
          }
        };

        worker.onerror = (error) => {
          console.error('Worker error:', error);
          terminateWorkers();
          resolve(null);
        };

        // Start worker
        const message: WorkerMessage = {
          type: 'run',
          config: calculatorConfig,
          iterations: workerIterations,
          workerId: i,
        };
        worker.postMessage(message);
      }
    });
  };

  const terminateWorkers = () => {
    workers.forEach((w) => w.terminate());
    workers.length = 0;
  };

  const cancel = () => {
    cancelled = true;
    terminateWorkers();
  };

  return { run, cancel };
}

/**
 * Create a cancellable simulation runner
 * Automatically uses Web Workers when available, falls back to single-threaded
 */
export function createCancellableSimulation(config: SimulationConfig) {
  // Use Web Workers for parallel execution when available
  if (isWebWorkerAvailable() && config.iterations >= 100) {
    return createParallelSimulation(config);
  }
  // Fall back to single-threaded for SSR or small iteration counts
  return createCancellableSimulationSingleThread(config);
}
