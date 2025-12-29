/**
 * Manual Mode Logic
 *
 * Orchestrates manual practice mode, providing state management for
 * user-controlled rolling sessions.
 *
 * All rolling logic is delegated to simulation-engine.ts (single source of truth).
 * This ensures manual mode behaves identically to Monte Carlo simulation.
 */

import type { Rarity, SubEffectConfig } from '@/shared/domain/module-data';
import { getSubEffectById } from '@/shared/domain/module-data';
import { getLockCost } from '@/shared/domain/module-data/modules/lock-costs';
import type { CalculatorConfig, PreLockedEffect } from '../types';
import { buildInitialPool, preparePool } from '../simulation/pool-dynamics';
import {
  rollRound,
  lockEffect,
  buildMinRarityMap,
  removeLockedEffectFromTargets,
} from '../simulation/simulation-engine';
import type {
  ManualSlot,
  ManualModeState,
  ShardMode,
  RollResult,
  CanRollResult,
  ManualModeConfig,
} from './types';

// Re-export for external consumers
export { buildMinRarityMap } from '../simulation/simulation-engine';

/**
 * Create a stub effect for pre-locked effects display.
 * Looks up the actual effect to get proper displayName.
 */
function createStubEffect(effectId: string): SubEffectConfig {
  const actualEffect = getSubEffectById(effectId);
  return {
    id: effectId,
    displayName: actualEffect?.displayName ?? effectId,
    moduleType: actualEffect?.moduleType ?? 'cannon',
    values: actualEffect?.values ?? {},
  } as SubEffectConfig;
}

/**
 * Create an empty slot
 */
function createEmptySlot(slotNumber: number): ManualSlot {
  return {
    slotNumber,
    effect: null,
    rarity: null,
    isLocked: false,
    isTargetMatch: false,
  };
}

/**
 * Initialize manual mode state from calculator configuration
 */
export function initializeManualMode(
  config: CalculatorConfig,
  shardMode: ShardMode,
  startingBalance: number
): ManualModeState {
  // Build initial pool excluding banned and pre-locked effects
  const preLockedEffectIds = config.preLockedEffects.map((e) => e.effectId);
  const excludedEffects = [...config.bannedEffects, ...preLockedEffectIds];

  const initialPool = buildInitialPool(
    config.moduleType,
    config.moduleRarity,
    excludedEffects
  );
  const pool = preparePool(initialPool);

  // Build min rarity map for target matching
  const minRarityMap = buildMinRarityMap(config.slotTargets);

  // Initialize slots
  const slots: ManualSlot[] = [];
  for (let i = 1; i <= config.slotCount; i++) {
    slots.push(createEmptySlot(i));
  }

  // Apply pre-locked effects to first slots
  const preLockedSlots = applyPreLockedEffects(slots, config.preLockedEffects, minRarityMap);

  // Initialize remaining targets from config
  // Pre-locked effects are removed from targets (same as simulation engine)
  let remainingTargets = [...config.slotTargets];
  for (const preLocked of config.preLockedEffects) {
    remainingTargets = removeLockedEffectFromTargets(remainingTargets, preLocked.effectId);
  }

  return {
    slots: preLockedSlots,
    pool,
    remainingTargets,
    rollCount: 0,
    shardMode,
    startingBalance,
    totalSpent: 0,
    isComplete: false,
    isAutoRolling: false,
    logEntries: [],
  };
}

/**
 * Apply pre-locked effects to the first available slots
 */
function applyPreLockedEffects(
  slots: ManualSlot[],
  preLockedEffects: PreLockedEffect[],
  minRarityMap: Map<string, Rarity>
): ManualSlot[] {
  if (preLockedEffects.length === 0) {
    return slots;
  }

  const result = [...slots];
  let slotIndex = 0;

  for (const preLocked of preLockedEffects) {
    if (slotIndex >= result.length) break;

    const isTargetMatch = minRarityMap.has(preLocked.effectId);

    result[slotIndex] = {
      ...result[slotIndex],
      effect: createStubEffect(preLocked.effectId),
      rarity: preLocked.rarity,
      isLocked: true,
      isTargetMatch,
    };
    slotIndex++;
  }

  return result;
}

/**
 * Execute a roll, filling all open (unlocked) slots.
 *
 * Uses the simulation engine's rollRound - the SAME function Monte Carlo uses.
 * This ensures identical rolling behavior between manual mode and simulations.
 */
export function executeRoll(
  state: ManualModeState,
  modeConfig: ManualModeConfig
): { newState: ManualModeState; result: RollResult } {
  const { minRarityMap } = modeConfig;

  // Find open (unlocked) slots
  const openSlotIndexes = state.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => !slot.isLocked)
    .map(({ index }) => index);

  if (openSlotIndexes.length === 0) {
    return {
      newState: state,
      result: {
        slots: state.slots,
        shardCost: 0,
        hasTargetHit: false,
        hasCurrentPriorityHit: false,
        filledSlotIndexes: [],
      },
    };
  }

  // Calculate roll cost based on locked count
  const lockedCount = state.slots.filter((s) => s.isLocked).length;
  const shardCost = getLockCost(lockedCount);

  // Use the simulation engine's rollRound - SAME function as Monte Carlo
  const rollResult = rollRound(
    state.pool,
    openSlotIndexes.length,
    state.remainingTargets,
    minRarityMap
  );

  // Map the engine results to slot state
  const newSlots = [...state.slots];
  for (let i = 0; i < openSlotIndexes.length; i++) {
    const slotIndex = openSlotIndexes[i];
    const slotResult = rollResult.slotResults[i];

    if (slotResult) {
      newSlots[slotIndex] = {
        slotNumber: slotIndex + 1,
        effect: slotResult.entry.effect,
        rarity: slotResult.entry.rarity,
        isLocked: false,
        isTargetMatch: slotResult.isTargetMatch,
      };
    }
  }

  const newState: ManualModeState = {
    ...state,
    slots: newSlots,
    rollCount: state.rollCount + 1,
    totalSpent: state.totalSpent + shardCost,
  };

  return {
    newState,
    result: {
      slots: newSlots,
      shardCost,
      hasTargetHit: rollResult.hasTargetHit,
      hasCurrentPriorityHit: rollResult.hasCurrentPriorityHit,
      filledSlotIndexes: openSlotIndexes,
    },
  };
}

/**
 * Lock a slot, removing the effect from the pool and updating remaining targets.
 *
 * Uses the simulation engine's lockEffect - the SAME function Monte Carlo uses.
 */
export function lockSlot(
  state: ManualModeState,
  slotNumber: number
): ManualModeState {
  const slotIndex = slotNumber - 1;
  const slot = state.slots[slotIndex];

  if (!slot?.effect || slot.isLocked) {
    return state;
  }

  // Find the target slot number for this effect (if it's a target)
  const matchedTarget = state.remainingTargets.find((t) =>
    t.acceptableEffects.includes(slot.effect!.id)
  );
  const targetSlotNumber = matchedTarget?.slotNumber ?? slotNumber;

  // Use the simulation engine's lockEffect - SAME function as Monte Carlo
  const { newPool, newRemainingTargets } = lockEffect(
    state.pool,
    state.remainingTargets,
    slot.effect.id,
    targetSlotNumber
  );

  const newSlots = state.slots.map((s, i) =>
    i === slotIndex ? { ...s, isLocked: true } : s
  );

  return {
    ...state,
    slots: newSlots,
    pool: newPool,
    remainingTargets: newRemainingTargets,
  };
}

/**
 * Unlock a slot, restoring the effect to the pool and remaining targets.
 */
export function unlockSlot(
  state: ManualModeState,
  slotNumber: number,
  config: CalculatorConfig
): ManualModeState {
  const slotIndex = slotNumber - 1;
  const slot = state.slots[slotIndex];

  if (!slot?.isLocked || !slot.effect) {
    return state;
  }

  // Rebuild pool to include the unlocked effect
  const preLockedEffectIds = config.preLockedEffects.map((e) => e.effectId);
  const currentlyLockedEffectIds = state.slots
    .filter((s, i) => s.isLocked && i !== slotIndex && s.effect)
    .map((s) => s.effect!.id);

  const excludedEffects = [
    ...config.bannedEffects,
    ...preLockedEffectIds,
    ...currentlyLockedEffectIds,
  ];

  const newPoolEntries = buildInitialPool(
    config.moduleType,
    config.moduleRarity,
    excludedEffects
  );
  const newPool = preparePool(newPoolEntries);

  // Recalculate remaining targets from original config
  let newRemainingTargets = [...config.slotTargets];

  // Remove pre-locked effects
  for (const preLocked of config.preLockedEffects) {
    newRemainingTargets = removeLockedEffectFromTargets(newRemainingTargets, preLocked.effectId);
  }

  // Remove currently locked effects (excluding the one being unlocked)
  for (const effectId of currentlyLockedEffectIds) {
    newRemainingTargets = removeLockedEffectFromTargets(newRemainingTargets, effectId);
  }

  const newSlots = state.slots.map((s, i) =>
    i === slotIndex ? { ...s, isLocked: false } : s
  );

  return {
    ...state,
    slots: newSlots,
    pool: newPool,
    remainingTargets: newRemainingTargets,
  };
}

/**
 * Check if a manual roll is allowed.
 */
export function canRoll(state: ManualModeState): CanRollResult {
  const openSlots = state.slots.filter((s) => !s.isLocked);
  if (openSlots.length === 0) {
    return { allowed: false, reason: 'All slots are locked' };
  }

  if (state.pool.entries.length === 0) {
    return { allowed: false, reason: 'Effect pool is exhausted' };
  }

  if (state.shardMode === 'budget') {
    const lockedCount = state.slots.filter((s) => s.isLocked).length;
    const rollCost = getLockCost(lockedCount);
    const currentBalance = state.startingBalance - state.totalSpent;

    if (currentBalance < rollCost) {
      return { allowed: false, reason: 'Insufficient shard balance' };
    }
  }

  return { allowed: true, reason: null };
}

/**
 * Check if auto-roll should be allowed.
 */
export function canAutoRoll(
  state: ManualModeState,
  targets: import('../types').SlotTarget[]
): CanRollResult {
  const basicCheck = canRoll(state);
  if (!basicCheck.allowed) {
    return basicCheck;
  }

  if (targets.length === 0) {
    return { allowed: false, reason: 'No targets configured' };
  }

  const unfulfilledCount = countUnfulfilledTargetEffects(state, targets);
  if (unfulfilledCount === 0) {
    return { allowed: false, reason: 'All targets acquired' };
  }

  return { allowed: true, reason: null };
}

/**
 * Check if all targets have been acquired
 */
export function checkCompletion(
  state: ManualModeState,
  targets: import('../types').SlotTarget[]
): boolean {
  if (targets.length === 0) {
    return false;
  }

  if (state.pool.entries.length === 0) {
    return true;
  }

  return countUnfulfilledTargetEffects(state, targets) === 0;
}

// Re-export state queries
export {
  getCurrentRollCost,
  getCurrentBalance,
  getBalanceStatus,
  countOpenSlots,
  countLockedSlots,
  getPoolSize,
  markComplete,
  setAutoRolling,
  countUnfulfilledTargetEffects,
} from './state-queries';

// Re-export target sync functions
export {
  getLockedEffectIds,
  areTargetsEqual,
  syncRemainingTargetsWithConfig,
} from './target-sync';

import { countUnfulfilledTargetEffects } from './state-queries';
