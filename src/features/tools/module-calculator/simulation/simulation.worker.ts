/**
 * Simulation Web Worker
 *
 * Runs Monte Carlo simulations in a separate thread for true parallelization.
 * Each worker handles a batch of iterations independently.
 */

import { simulateSingleRun } from './monte-carlo-simulation';
import type { CalculatorConfig, SimulationRun } from '../types';

/** Message sent to worker to start simulation */
interface WorkerInput {
  type: 'run';
  config: CalculatorConfig;
  iterations: number;
  workerId: number;
}

/** Progress update from worker */
interface WorkerProgress {
  type: 'progress';
  workerId: number;
  completed: number;
  total: number;
}

/** Final results from worker */
export interface WorkerResult {
  type: 'result';
  workerId: number;
  runs: SimulationRun[];
  stats: {
    shardCosts: number[];
    rollCounts: number[];
  };
}

export type WorkerMessage = WorkerInput;
export type WorkerResponse = WorkerProgress | WorkerResult;

// Worker context
const ctx = self as unknown as Worker;

/** Chunk size for progress reporting */
const PROGRESS_CHUNK_SIZE = 100;

ctx.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  if (message.type === 'run') {
    runSimulationBatch(message);
  }
};

function runSimulationBatch(input: WorkerInput): void {
  const { config, iterations, workerId } = input;
  const runs: SimulationRun[] = [];
  const shardCosts: number[] = [];
  const rollCounts: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const run = simulateSingleRun(config);
    runs.push(run);
    shardCosts.push(run.totalShardCost);
    rollCounts.push(run.totalRolls);

    // Report progress periodically
    if ((i + 1) % PROGRESS_CHUNK_SIZE === 0 || i === iterations - 1) {
      const progressMsg: WorkerProgress = {
        type: 'progress',
        workerId,
        completed: i + 1,
        total: iterations,
      };
      ctx.postMessage(progressMsg);
    }
  }

  // Send final results
  const resultMsg: WorkerResult = {
    type: 'result',
    workerId,
    runs,
    stats: {
      shardCosts,
      rollCounts,
    },
  };
  ctx.postMessage(resultMsg);
}
