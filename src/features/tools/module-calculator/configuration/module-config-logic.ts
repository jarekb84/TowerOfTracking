/**
 * Module Configuration Logic
 *
 * Pure functions for validating and managing module configuration state.
 */

import type { ModuleType, Rarity } from '@/shared/domain/module-data';
import {
  getSlotsForLevel,
  isValidModuleLevel,
  RARITY_ORDER,
  MIN_MODULE_LEVEL,
} from '@/shared/domain/module-data';
import type { CalculatorConfig, SlotTarget, EffectSelection, PreLockedEffect } from '../types';

/** Minimum module rarity that allows sub-effect rolling */
const MIN_ROLLABLE_MODULE_RARITY: Rarity = 'rare';

/** Module rarities that support sub-effect rolling */
export const ROLLABLE_MODULE_RARITIES: Rarity[] = RARITY_ORDER.filter(
  (r) => RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf(MIN_ROLLABLE_MODULE_RARITY)
);

/**
 * Validate a module level value
 */
export function validateModuleLevel(level: number): {
  isValid: boolean;
  error?: string;
  normalizedLevel: number;
} {
  if (!Number.isFinite(level)) {
    return {
      isValid: false,
      error: 'Level must be a valid number',
      normalizedLevel: MIN_MODULE_LEVEL,
    };
  }

  const normalizedLevel = Math.max(MIN_MODULE_LEVEL, Math.round(level));

  if (!isValidModuleLevel(normalizedLevel)) {
    return {
      isValid: false,
      error: `Level must be at least ${MIN_MODULE_LEVEL}`,
      normalizedLevel: MIN_MODULE_LEVEL,
    };
  }

  return {
    isValid: true,
    normalizedLevel,
  };
}

/**
 * Check if a module rarity allows sub-effect rolling
 */
export function isRollableModuleRarity(rarity: Rarity): boolean {
  return ROLLABLE_MODULE_RARITIES.includes(rarity);
}

/**
 * Calculate available slots when module level changes
 */
export function calculateSlotsForLevel(level: number): number {
  const { normalizedLevel } = validateModuleLevel(level);
  return getSlotsForLevel(normalizedLevel);
}

/**
 * Create a default calculator configuration
 */
export function createDefaultConfig(moduleType: ModuleType = 'cannon'): CalculatorConfig {
  return {
    moduleType,
    moduleLevel: 141,
    moduleRarity: 'ancestral',
    slotCount: getSlotsForLevel(141),
    bannedEffects: [],
    slotTargets: [],
    preLockedEffects: [],
  };
}

/**
 * Update configuration when module type changes
 *
 * Clears selections since effects change between module types.
 */
export function updateModuleType(
  config: CalculatorConfig,
  moduleType: ModuleType
): CalculatorConfig {
  return {
    ...config,
    moduleType,
    bannedEffects: [],
    slotTargets: [],
    preLockedEffects: [],
  };
}

/**
 * Update configuration when module level changes
 *
 * Adjusts slot count and removes targets for invalid slots.
 */
export function updateModuleLevel(
  config: CalculatorConfig,
  level: number
): CalculatorConfig {
  const { normalizedLevel } = validateModuleLevel(level);
  const newSlotCount = getSlotsForLevel(normalizedLevel);

  // Filter out targets for slots that no longer exist
  const validTargets = config.slotTargets.filter(
    (target) => target.slotNumber <= newSlotCount
  );

  return {
    ...config,
    moduleLevel: normalizedLevel,
    slotCount: newSlotCount,
    slotTargets: validTargets,
  };
}

/**
 * Update configuration when module rarity changes
 *
 * May need to adjust target rarities if they exceed the new cap.
 */
export function updateModuleRarity(
  config: CalculatorConfig,
  moduleRarity: Rarity
): CalculatorConfig {
  const maxRarityIndex = RARITY_ORDER.indexOf(moduleRarity);

  // Adjust any target rarities that exceed the new module rarity
  const adjustedTargets = config.slotTargets.map((target) => {
    const targetRarityIndex = RARITY_ORDER.indexOf(target.minRarity);
    if (targetRarityIndex > maxRarityIndex) {
      return { ...target, minRarity: moduleRarity };
    }
    return target;
  });

  return {
    ...config,
    moduleRarity,
    slotTargets: adjustedTargets,
  };
}

/**
 * Convert effect selections to slot targets
 */
export function selectionsToSlotTargets(
  selections: EffectSelection[]
): SlotTarget[] {
  // Group selections by slot number
  const slotMap = new Map<number, { effects: string[]; minRarity: Rarity }>();

  for (const selection of selections) {
    if (selection.isBanned || !selection.minRarity) {
      continue;
    }

    for (const slotNumber of selection.targetSlots) {
      const existing = slotMap.get(slotNumber);
      if (existing) {
        existing.effects.push(selection.effectId);
        // Keep the lowest (most permissive) min rarity
        if (
          RARITY_ORDER.indexOf(selection.minRarity) <
          RARITY_ORDER.indexOf(existing.minRarity)
        ) {
          existing.minRarity = selection.minRarity;
        }
      } else {
        slotMap.set(slotNumber, {
          effects: [selection.effectId],
          minRarity: selection.minRarity,
        });
      }
    }
  }

  // Convert to SlotTarget array
  const targets: SlotTarget[] = [];
  slotMap.forEach((value, slotNumber) => {
    targets.push({
      slotNumber,
      acceptableEffects: value.effects,
      minRarity: value.minRarity,
    });
  });

  return targets.sort((a, b) => a.slotNumber - b.slotNumber);
}

/**
 * Extract banned effect IDs from selections
 */
export function selectionsToBannedEffects(selections: EffectSelection[]): string[] {
  return selections.filter((s) => s.isBanned).map((s) => s.effectId);
}

/**
 * Extract pre-locked effects from selections
 */
export function selectionsToPreLockedEffects(selections: EffectSelection[]): PreLockedEffect[] {
  return selections
    .filter((s) => s.isLocked && s.lockedRarity !== null)
    .map((s) => ({
      effectId: s.effectId,
      rarity: s.lockedRarity!,
    }));
}

/**
 * Validate configuration is ready for simulation
 */
export function validateConfigForSimulation(config: CalculatorConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.slotTargets.length === 0) {
    errors.push('At least one target must be selected');
  }

  if (config.slotTargets.length > config.slotCount) {
    errors.push('More targets than available slots');
  }

  // Check for duplicate slot numbers
  const slotNumbers = config.slotTargets.map((t) => t.slotNumber);
  const uniqueSlots = new Set(slotNumbers);
  if (uniqueSlots.size !== slotNumbers.length) {
    errors.push('Multiple targets for the same slot');
  }

  // Check for empty acceptable effects
  const emptyTargets = config.slotTargets.filter(
    (t) => t.acceptableEffects.length === 0
  );
  if (emptyTargets.length > 0) {
    errors.push('Some slots have no acceptable effects');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
