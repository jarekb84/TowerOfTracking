/**
 * Manual Mode State Queries
 *
 * Pure functions for querying and deriving values from manual mode state.
 * These are simple getters and predicates that don't mutate state.
 */

import { getLockCost } from '@/shared/domain/module-data/modules/lock-costs';
import type { SlotTarget } from '../types';
import type { ManualModeState } from './types';

/**
 * Get the current roll cost based on locked count
 */
export function getCurrentRollCost(state: ManualModeState): number {
  const lockedCount = state.slots.filter((s) => s.isLocked).length;
  return getLockCost(lockedCount);
}

/**
 * Get the current balance (for display)
 */
export function getCurrentBalance(state: ManualModeState): number {
  if (state.shardMode === 'budget') {
    return state.startingBalance - state.totalSpent;
  }
  return state.totalSpent;
}

/**
 * Get the balance status for UI display
 */
export function getBalanceStatus(
  state: ManualModeState
): 'normal' | 'warning' | 'critical' {
  if (state.shardMode !== 'budget') {
    return 'normal';
  }

  const balance = getCurrentBalance(state);
  const rollCost = getCurrentRollCost(state);

  if (balance < rollCost) {
    return 'critical';
  }

  const warningThreshold = state.startingBalance * 0.2;
  if (balance < warningThreshold) {
    return 'warning';
  }

  return 'normal';
}

/**
 * Count the number of open (unlocked) slots
 */
export function countOpenSlots(state: ManualModeState): number {
  return state.slots.filter((s) => !s.isLocked).length;
}

/**
 * Count the number of locked slots
 */
export function countLockedSlots(state: ManualModeState): number {
  return state.slots.filter((s) => s.isLocked).length;
}

/**
 * Get remaining pool size
 */
export function getPoolSize(state: ManualModeState): number {
  return state.pool.entries.length;
}

/**
 * Mark the session as complete
 */
export function markComplete(state: ManualModeState): ManualModeState {
  return {
    ...state,
    isComplete: true,
    isAutoRolling: false,
  };
}

/**
 * Toggle auto-rolling state
 */
export function setAutoRolling(
  state: ManualModeState,
  isAutoRolling: boolean
): ManualModeState {
  return {
    ...state,
    isAutoRolling,
  };
}

/**
 * Get count of unique target effects that haven't been acquired yet
 */
export function countUnfulfilledTargetEffects(
  state: ManualModeState,
  targets: SlotTarget[]
): number {
  // Collect all unique effect IDs from all targets
  const allTargetEffects = new Set<string>();
  for (const target of targets) {
    for (const effectId of target.acceptableEffects) {
      allTargetEffects.add(effectId);
    }
  }

  // Get locked effect IDs
  const lockedEffectIds = new Set<string>();
  for (const slot of state.slots) {
    if (slot.isLocked && slot.effect) {
      lockedEffectIds.add(slot.effect.id);
    }
  }

  // Count unfulfilled target effects
  let unfulfilledCount = 0;
  for (const effectId of allTargetEffects) {
    if (!lockedEffectIds.has(effectId)) {
      unfulfilledCount++;
    }
  }

  return unfulfilledCount;
}
