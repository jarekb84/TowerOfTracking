/**
 * Simulation Results Hook
 *
 * Manages the state for running simulations and displaying results.
 */

import { useState, useCallback } from 'react';
import type { CalculatorConfig, SimulationResults, ConfidenceLevel } from '../types';
import {
  createCancellableSimulation,
  estimateSimulationTime,
  type SimulationProgress,
} from '../simulation/simulation-worker';
import { createSimulationConfig } from '../simulation/monte-carlo-simulation';
import {
  DEFAULT_CONFIDENCE_LEVEL,
  getIterationsForLevel,
} from './confidence-level-logic';

interface UseSimulationResultsReturn {
  /** Current simulation results (null if not run yet) */
  results: SimulationResults | null;

  /** Whether simulation is currently running */
  isRunning: boolean;

  /** Progress of current simulation (0-100) */
  progress: number;

  /** Current confidence level */
  confidenceLevel: ConfidenceLevel;

  /** Set confidence level */
  setConfidenceLevel: (level: ConfidenceLevel) => void;

  /** Run the simulation with current config */
  runSimulation: (config: CalculatorConfig) => Promise<void>;

  /** Cancel the current simulation */
  cancelSimulation: () => void;

  /** Clear results */
  clearResults: () => void;

  /** Estimated time for simulation */
  estimatedTime: number | null;

  /** Error message if simulation failed */
  error: string | null;
}

const DEFAULT_SHARD_COST = 100;

/**
 * Build simulation configuration from calculator config and confidence level
 */
function buildSimulationSetup(config: CalculatorConfig, confidenceLevel: ConfidenceLevel) {
  const iterations = getIterationsForLevel(confidenceLevel);
  const simConfig = createSimulationConfig(config, iterations, DEFAULT_SHARD_COST);
  const { estimatedMs } = estimateSimulationTime(simConfig);
  const { run, cancel } = createCancellableSimulation(simConfig);
  return { simConfig, estimatedMs, run, cancel };
}

export function useSimulationResults(): UseSimulationResultsReturn {
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>(DEFAULT_CONFIDENCE_LEVEL);

  const runSimulation = useCallback(async (config: CalculatorConfig) => {
    if (config.slotTargets.length === 0) {
      setError('At least one target must be selected');
      return;
    }

    setError(null);
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    const { estimatedMs, run, cancel } = buildSimulationSetup(config, confidenceLevel);
    setEstimatedTime(estimatedMs);
    setCancelFn(() => cancel);

    // Yield to allow React to render the "running" state before starting simulation
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      const simulationResults = await run((progressUpdate: SimulationProgress) => {
        setProgress(progressUpdate.percentage);
      });

      if (simulationResults) {
        setResults(simulationResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setIsRunning(false);
      setProgress(100);
      setCancelFn(null);
    }
  }, [confidenceLevel]);

  const cancelSimulation = useCallback(() => {
    if (cancelFn) {
      cancelFn();
      setIsRunning(false);
      setProgress(0);
      setCancelFn(null);
    }
  }, [cancelFn]);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    results,
    isRunning,
    progress,
    confidenceLevel,
    setConfidenceLevel,
    runSimulation,
    cancelSimulation,
    clearResults,
    estimatedTime,
    error,
  };
}
