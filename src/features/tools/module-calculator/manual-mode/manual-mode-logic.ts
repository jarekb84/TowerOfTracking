/**
 * Manual Mode Logic
 *
 * Pure functions for managing manual mode state, rolling, and locking.
 * State query utilities are in state-utils.ts.
 */

import type { Rarity, SubEffectConfig } from '@/shared/domain/module-data';
import { getLockCost } from '@/shared/domain/module-data/modules/lock-costs';
import type { CalculatorConfig, SlotTarget, PreLockedEffect } from '../types';
import {
  buildInitialPool,
  preparePool,
  simulateRollFast,
  removeEffectFromPreparedPool,
  checkTargetMatch,
} from '../simulation/pool-dynamics';
import type {
  ManualSlot,
  ManualModeState,
  ShardMode,
  RollResult,
  CanRollResult,
  ManualModeConfig,
} from './types';

/**
 * Create a stub effect for pre-locked effects display.
 * The actual effect config would be resolved from the module data.
 */
function createStubEffect(effectId: string): SubEffectConfig {
  return {
    id: effectId,
    displayName: effectId,
    moduleType: 'cannon',
    values: {},
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
 * Build the minimum rarity map from slot targets
 */
export function buildMinRarityMap(targets: SlotTarget[]): Map<string, Rarity> {
  const map = new Map<string, Rarity>();

  for (const target of targets) {
    for (const effectId of target.acceptableEffects) {
      // Use the lowest min rarity if effect appears in multiple slots
      const existing = map.get(effectId);
      if (!existing || target.minRarity < existing) {
        map.set(effectId, target.minRarity);
      }
    }
  }

  return map;
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

  // Initialize slots - pre-locked effects start as locked
  const slots: ManualSlot[] = [];
  for (let i = 1; i <= config.slotCount; i++) {
    const preLocked = config.preLockedEffects.find(
      (_, idx) => idx + 1 === i && config.preLockedEffects.length > 0
    );

    if (preLocked) {
      // This is a simplification - pre-locked effects should fill first slots
      slots.push(createEmptySlot(i));
    } else {
      slots.push(createEmptySlot(i));
    }
  }

  // Apply pre-locked effects to first slots
  const preLockedSlots = applyPreLockedEffects(slots, config.preLockedEffects, minRarityMap);

  return {
    slots: preLockedSlots,
    pool,
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

    // Check if this pre-locked effect matches any target
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
 * Execute a roll, filling all open (unlocked) slots
 */
// eslint-disable-next-line max-statements
export function executeRoll(
  state: ManualModeState,
  modeConfig: ManualModeConfig
): { newState: ManualModeState; result: RollResult } {
  const { targets, minRarityMap } = modeConfig;

  // Find open (unlocked) slots
  const openSlotIndexes = state.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => !slot.isLocked)
    .map(({ index }) => index);

  if (openSlotIndexes.length === 0) {
    // All slots locked - no roll needed
    return {
      newState: state,
      result: {
        slots: state.slots,
        shardCost: 0,
        hasTargetHit: false,
        filledSlotIndexes: [],
      },
    };
  }

  // Calculate roll cost based on locked count
  const lockedCount = state.slots.filter((s) => s.isLocked).length;
  const shardCost = getLockCost(lockedCount);

  // Roll for each open slot
  const newSlots = [...state.slots];
  let hasTargetHit = false;
  const currentPool = state.pool;

  for (const slotIndex of openSlotIndexes) {
    if (currentPool.entries.length === 0) {
      // Pool exhausted - leave slot empty
      newSlots[slotIndex] = {
        ...newSlots[slotIndex],
        effect: null,
        rarity: null,
        isTargetMatch: false,
      };
      continue;
    }

    const random = Math.random();
    const entry = simulateRollFast(currentPool, random);

    // Check if this roll matches a target
    const matchedTarget = checkTargetMatch(entry, targets, minRarityMap);
    const isTargetMatch = matchedTarget !== null;

    if (isTargetMatch) {
      hasTargetHit = true;
    }

    newSlots[slotIndex] = {
      slotNumber: slotIndex + 1,
      effect: entry.effect,
      rarity: entry.rarity,
      isLocked: false,
      isTargetMatch,
    };
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
      hasTargetHit,
      filledSlotIndexes: openSlotIndexes,
    },
  };
}

/**
 * Lock a slot, removing the effect from the pool
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

  // Remove ALL rarities of this effect from pool
  const newPool = removeEffectFromPreparedPool(state.pool, slot.effect.id);

  const newSlots = state.slots.map((s, i) =>
    i === slotIndex ? { ...s, isLocked: true } : s
  );

  return {
    ...state,
    slots: newSlots,
    pool: newPool,
  };
}

/**
 * Unlock a slot, restoring the effect to the pool
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

  const newSlots = state.slots.map((s, i) =>
    i === slotIndex ? { ...s, isLocked: false } : s
  );

  return {
    ...state,
    slots: newSlots,
    pool: newPool,
  };
}

/**
 * Check if a manual roll is allowed.
 * Note: Manual rolls are allowed even after session is "complete" (all targets acquired).
 * The completion state is informational only - users can continue rolling.
 */
export function canRoll(state: ManualModeState): CanRollResult {
  // Check if all slots are locked
  const openSlots = state.slots.filter((s) => !s.isLocked);
  if (openSlots.length === 0) {
    return { allowed: false, reason: 'All slots are locked' };
  }

  // Check if pool is exhausted
  if (state.pool.entries.length === 0) {
    return { allowed: false, reason: 'Effect pool is exhausted' };
  }

  // Check budget mode balance
  if (state.shardMode === 'budget') {
    const lockedCount = state.slots.filter((s) => s.isLocked).length;
    const rollCost = getLockCost(lockedCount);
    const currentBalance = state.startingBalance - state.totalSpent;

    if (currentBalance < rollCost) {
      return { allowed: false, reason: 'Insufficient shard balance' };
    }
  }

  // Removed isComplete check - allow manual rolls even after targets acquired
  return { allowed: true, reason: null };
}

/**
 * Check if auto-roll should be allowed.
 * Auto-roll requires active targets that haven't been acquired yet.
 */
export function canAutoRoll(
  state: ManualModeState,
  targets: SlotTarget[]
): CanRollResult {
  // First check if basic rolling is allowed
  const basicCheck = canRoll(state);
  if (!basicCheck.allowed) {
    return basicCheck;
  }

  // Auto-roll requires unfulfilled targets
  if (targets.length === 0) {
    return { allowed: false, reason: 'No targets configured' };
  }

  // Check if all unique target effects have been acquired
  const unfulfilledCount = countUnfulfilledTargetEffects(state, targets);
  if (unfulfilledCount === 0) {
    return { allowed: false, reason: 'All targets acquired' };
  }

  return { allowed: true, reason: null };
}

// Re-export state queries for convenient access
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

// Import for local use
import { countUnfulfilledTargetEffects } from './state-queries';

/**
 * Check if all targets have been acquired
 */
export function checkCompletion(
  state: ManualModeState,
  targets: SlotTarget[]
): boolean {
  if (targets.length === 0) {
    return false;
  }

  // Check if pool is exhausted
  if (state.pool.entries.length === 0) {
    return true;
  }

  // Complete when all unique target effects have been locked
  return countUnfulfilledTargetEffects(state, targets) === 0;
}
