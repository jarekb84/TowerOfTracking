/**
 * Module Calculator Hook
 *
 * Main orchestration hook that combines configuration, table state,
 * and simulation results.
 */

import { useCallback, useMemo, useEffect } from 'react';
import type { ModuleType } from '@/shared/domain/module-data';
import type { CalculatorConfig } from './types';
import { useModuleConfig } from './configuration/use-module-config';
import { useSubEffectTable } from './sub-effect-table/use-sub-effect-table';
import { useSimulationResults } from './results/use-simulation-results';

interface UseModuleCalculatorResult {
  /** Module configuration state and handlers */
  config: ReturnType<typeof useModuleConfig>;

  /** Sub-effect table state and handlers */
  table: ReturnType<typeof useSubEffectTable>;

  /** Simulation results state and handlers */
  simulation: ReturnType<typeof useSimulationResults>;

  /** Combined calculator configuration for simulation */
  calculatorConfig: CalculatorConfig;

  /** Run simulation with current configuration */
  runSimulation: () => Promise<void>;

  /** Clear all state and start fresh */
  reset: () => void;
}

export function useModuleCalculator(
  initialModuleType: ModuleType = 'cannon'
): UseModuleCalculatorResult {
  const config = useModuleConfig(initialModuleType);
  const table = useSubEffectTable(
    config.config.moduleType,
    config.config.moduleRarity,
    config.config.slotCount
  );
  const simulation = useSimulationResults();

  // Build the complete calculator config from current state
  const calculatorConfig = useMemo<CalculatorConfig>(() => ({
    moduleType: config.config.moduleType,
    moduleLevel: config.config.moduleLevel,
    moduleRarity: config.config.moduleRarity,
    slotCount: config.config.slotCount,
    bannedEffects: table.bannedEffects,
    slotTargets: table.slotTargets,
    preLockedEffects: table.preLockedEffects,
  }), [
    config.config.moduleType,
    config.config.moduleLevel,
    config.config.moduleRarity,
    config.config.slotCount,
    table.bannedEffects,
    table.slotTargets,
    table.preLockedEffects,
  ]);

  // Sync banned effects and slot targets to config
  useEffect(() => {
    config.setBannedEffects(table.bannedEffects);
  }, [table.bannedEffects, config.setBannedEffects]);

  useEffect(() => {
    config.setSlotTargets(table.slotTargets);
  }, [table.slotTargets, config.setSlotTargets]);

  // Run simulation with current config
  const runSimulation = useCallback(async () => {
    await simulation.runSimulation(calculatorConfig);
  }, [simulation, calculatorConfig]);

  // Reset all state
  const reset = useCallback(() => {
    table.clearAllSelections();
    simulation.clearResults();
  }, [table, simulation]);

  // Clear selections when module type changes
  useEffect(() => {
    table.clearAllSelections();
    simulation.clearResults();
  }, [config.config.moduleType]);

  return {
    config,
    table,
    simulation,
    calculatorConfig,
    runSimulation,
    reset,
  };
}
