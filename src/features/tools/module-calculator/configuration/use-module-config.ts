/**
 * Module Configuration Hook
 *
 * Manages the state for module configuration including
 * module type, level, rarity, and validation.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ModuleType, Rarity } from '@/shared/domain/module-data';
import type { CalculatorConfig, SlotTarget } from '../types';
import {
  createDefaultConfig,
  updateModuleType,
  updateModuleLevel,
  updateModuleRarity,
  validateConfigForSimulation,
  ROLLABLE_MODULE_RARITIES,
} from './module-config-logic';

/**
 * Initial configuration values for persistence
 */
export interface InitialModuleConfigValues {
  moduleType: ModuleType;
  moduleLevel: number;
  moduleRarity: Rarity;
}

interface UseModuleConfigResult {
  /** Current configuration */
  config: CalculatorConfig;

  /** Change module type (clears selections) */
  setModuleType: (moduleType: ModuleType) => void;

  /** Change module level */
  setModuleLevel: (level: number) => void;

  /** Change module rarity */
  setModuleRarity: (rarity: Rarity) => void;

  /** Update banned effects list */
  setBannedEffects: (effectIds: string[]) => void;

  /** Update slot targets */
  setSlotTargets: (targets: SlotTarget[]) => void;

  /** Validation result */
  validation: {
    isValid: boolean;
    errors: string[];
  };

  /** Available module rarities for rolling */
  availableRarities: Rarity[];

  /** Available slot numbers based on level */
  availableSlots: number[];
}

export function useModuleConfig(
  initialModuleType: ModuleType = 'cannon',
  initialValues?: InitialModuleConfigValues
): UseModuleConfigResult {
  const [config, setConfig] = useState<CalculatorConfig>(() => {
    if (initialValues) {
      const baseConfig = createDefaultConfig(initialValues.moduleType);
      return updateModuleRarity(
        updateModuleLevel(baseConfig, initialValues.moduleLevel),
        initialValues.moduleRarity
      );
    }
    return createDefaultConfig(initialModuleType);
  });

  const setModuleType = useCallback((moduleType: ModuleType) => {
    setConfig((prev) => updateModuleType(prev, moduleType));
  }, []);

  const setModuleLevel = useCallback((level: number) => {
    setConfig((prev) => updateModuleLevel(prev, level));
  }, []);

  const setModuleRarity = useCallback((rarity: Rarity) => {
    setConfig((prev) => updateModuleRarity(prev, rarity));
  }, []);

  const setBannedEffects = useCallback((effectIds: string[]) => {
    setConfig((prev) => ({
      ...prev,
      bannedEffects: effectIds,
    }));
  }, []);

  const setSlotTargets = useCallback((targets: SlotTarget[]) => {
    setConfig((prev) => ({
      ...prev,
      slotTargets: targets,
    }));
  }, []);

  const validation = useMemo(
    () => validateConfigForSimulation(config),
    [config]
  );

  const availableSlots = useMemo(() => {
    const slots: number[] = [];
    for (let i = 1; i <= config.slotCount; i++) {
      slots.push(i);
    }
    return slots;
  }, [config.slotCount]);

  return {
    config,
    setModuleType,
    setModuleLevel,
    setModuleRarity,
    setBannedEffects,
    setSlotTargets,
    validation,
    availableRarities: ROLLABLE_MODULE_RARITIES,
    availableSlots,
  };
}
