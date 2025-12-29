/**
 * Target Sync Logic
 *
 * Functions for syncing remainingTargets with config changes during
 * an active manual mode session.
 */

import type { SlotTarget } from '../types';
import { removeLockedEffectFromTargets } from '../simulation/simulation-engine';
import type { ManualModeState } from './types';

/**
 * Extract locked effect IDs from current state.
 *
 * Used to preserve which effects should remain excluded when
 * syncing remainingTargets with config changes.
 */
export function getLockedEffectIds(state: ManualModeState): Set<string> {
  const lockedIds = new Set<string>();
  for (const slot of state.slots) {
    if (slot.isLocked && slot.effect) {
      lockedIds.add(slot.effect.id);
    }
  }
  return lockedIds;
}

/**
 * Check if two target arrays are equal.
 *
 * Used to prevent infinite loops when syncing - only update state
 * if there's an actual difference.
 */
export function areTargetsEqual(a: SlotTarget[], b: SlotTarget[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i].slotNumber !== b[i].slotNumber) return false;
    if (a[i].minRarity !== b[i].minRarity) return false;
    if (a[i].acceptableEffects.length !== b[i].acceptableEffects.length) return false;

    for (let j = 0; j < a[i].acceptableEffects.length; j++) {
      if (a[i].acceptableEffects[j] !== b[i].acceptableEffects[j]) return false;
    }
  }

  return true;
}

/**
 * Sync remainingTargets with current config.slotTargets.
 *
 * When the user changes target configuration mid-run (e.g., changing minRarity),
 * this rebuilds remainingTargets from the fresh config while preserving
 * which effects are already locked.
 *
 * Uses the same rebuild approach as unlockSlot() for consistency.
 */
export function syncRemainingTargetsWithConfig(
  newSlotTargets: SlotTarget[],
  lockedEffectIds: Set<string>,
  preLockedEffectIds: string[]
): SlotTarget[] {
  // Start from fresh config targets
  let synced = [...newSlotTargets];

  // Remove pre-locked effects (they're always excluded from targets)
  for (const effectId of preLockedEffectIds) {
    synced = removeLockedEffectFromTargets(synced, effectId);
  }

  // Remove all user-locked effects
  for (const effectId of lockedEffectIds) {
    synced = removeLockedEffectFromTargets(synced, effectId);
  }

  return synced;
}
