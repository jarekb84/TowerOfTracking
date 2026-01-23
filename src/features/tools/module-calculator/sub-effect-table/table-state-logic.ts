/**
 * Table State Logic
 *
 * Pure functions for managing sub-effect selection state.
 */

import type { Rarity } from '@/shared/domain/module-data';
import { RARITY_ORDER } from '@/shared/domain/module-data';
import type { EffectSelection } from '../types';

/**
 * Create an empty selection for an effect
 */
export function createEmptySelection(effectId: string): EffectSelection {
  return {
    effectId,
    minRarity: null,
    targetSlots: [],
    isBanned: false,
    isLocked: false,
    lockedRarity: null,
  };
}

/**
 * Update the minimum rarity for an effect
 *
 * If clicking the same rarity that's already selected, clears it.
 * When setting a rarity and no target slots exist, auto-assigns the default slot (priority 1).
 *
 * @param selection - Current effect selection
 * @param rarity - The rarity to set as minimum
 * @param defaultSlot - Optional slot to auto-assign when first selecting a rarity (defaults to 1)
 */
export function toggleMinRarity(
  selection: EffectSelection,
  rarity: Rarity,
  defaultSlot: number = 1
): EffectSelection {
  // Clicking same rarity clears the selection
  if (selection.minRarity === rarity) {
    return { ...selection, minRarity: null };
  }

  // Setting a new rarity - auto-assign first slot if none assigned
  if (selection.targetSlots.length === 0) {
    return { ...selection, minRarity: rarity, targetSlots: [defaultSlot] };
  }

  return { ...selection, minRarity: rarity };
}

/**
 * Toggle a slot assignment for an effect
 */
export function toggleSlotAssignment(
  selection: EffectSelection,
  slotNumber: number
): EffectSelection {
  const hasSlot = selection.targetSlots.includes(slotNumber);

  if (hasSlot) {
    return {
      ...selection,
      targetSlots: selection.targetSlots.filter((s) => s !== slotNumber),
    };
  }

  return {
    ...selection,
    targetSlots: [...selection.targetSlots, slotNumber].sort((a, b) => a - b),
  };
}

/**
 * Toggle banned status for an effect
 */
export function toggleBanned(selection: EffectSelection): EffectSelection {
  return {
    ...selection,
    isBanned: !selection.isBanned,
    // Clear other settings when banning
    ...(selection.isBanned
      ? {}
      : { minRarity: null, targetSlots: [], isLocked: false, lockedRarity: null }),
  };
}

/**
 * Toggle locked status for an effect at a specific rarity
 *
 * @param selection - Current effect selection
 * @param rarity - The rarity to lock at
 * @param currentLockCount - Current number of locked effects across all selections
 * @param maxLocks - Maximum allowed locks (slotCount - 1)
 * @returns Updated selection, or original if lock limit would be exceeded
 */
export function toggleLocked(
  selection: EffectSelection,
  rarity: Rarity,
  currentLockCount: number,
  maxLocks: number
): EffectSelection {
  // If already locked at this rarity, unlock
  if (selection.isLocked && selection.lockedRarity === rarity) {
    return {
      ...selection,
      isLocked: false,
      lockedRarity: null,
    };
  }

  // If already locked at different rarity, just update the rarity
  if (selection.isLocked) {
    return {
      ...selection,
      lockedRarity: rarity,
    };
  }

  // Trying to add a new lock - check limit
  if (currentLockCount >= maxLocks) {
    return selection; // Can't lock more
  }

  // Lock the effect (clears targeting settings since it's already achieved)
  return {
    ...selection,
    isLocked: true,
    lockedRarity: rarity,
    minRarity: null,
    targetSlots: [],
  };
}

/**
 * Check if more effects can be locked
 */
export function canLockMore(currentLockCount: number, maxLocks: number): boolean {
  return currentLockCount < maxLocks;
}

/**
 * Count currently locked effects
 */
export function countLockedEffects(selections: EffectSelection[]): number {
  return selections.filter((s) => s.isLocked).length;
}

/**
 * Get all locked effects with their rarities
 */
export function getLockedEffects(
  selections: EffectSelection[]
): Array<{ effectId: string; rarity: Rarity }> {
  return selections
    .filter((s) => s.isLocked && s.lockedRarity !== null)
    .map((s) => ({ effectId: s.effectId, rarity: s.lockedRarity! }));
}

/**
 * Check if a rarity is at or above the minimum threshold
 */
export function isRaritySelected(
  selection: EffectSelection,
  rarity: Rarity
): boolean {
  if (!selection.minRarity) {
    return false;
  }

  const minIndex = RARITY_ORDER.indexOf(selection.minRarity);
  const rarityIndex = RARITY_ORDER.indexOf(rarity);

  return rarityIndex >= minIndex;
}

/**
 * Check if a rarity is the exact minimum threshold
 */
export function isMinimumRarity(
  selection: EffectSelection,
  rarity: Rarity
): boolean {
  return selection.minRarity === rarity;
}

/**
 * Check if a slot is assigned to this effect
 */
export function isSlotAssigned(
  selection: EffectSelection,
  slotNumber: number
): boolean {
  return selection.targetSlots.includes(slotNumber);
}

/**
 * Get all effects that have a specific slot assigned
 */
export function getEffectsForSlot(
  selections: EffectSelection[],
  slotNumber: number
): EffectSelection[] {
  return selections.filter(
    (s) => !s.isBanned && s.minRarity && s.targetSlots.includes(slotNumber)
  );
}

/**
 * Get the minimum rarity across all effects assigned to a slot
 */
export function getSlotMinRarity(
  selections: EffectSelection[],
  slotNumber: number
): Rarity | null {
  const slotEffects = getEffectsForSlot(selections, slotNumber);

  if (slotEffects.length === 0) {
    return null;
  }

  let minIndex = RARITY_ORDER.length;

  for (const effect of slotEffects) {
    if (effect.minRarity) {
      const index = RARITY_ORDER.indexOf(effect.minRarity);
      if (index < minIndex) {
        minIndex = index;
      }
    }
  }

  return minIndex < RARITY_ORDER.length ? RARITY_ORDER[minIndex] : null;
}

/**
 * Clear all selections for an effect (but keep banned status)
 */
export function clearSelection(selection: EffectSelection): EffectSelection {
  return {
    ...selection,
    minRarity: null,
    targetSlots: [],
    isLocked: false,
    lockedRarity: null,
  };
}

/**
 * Validate that a selection is properly configured
 */
export function isValidSelection(selection: EffectSelection): boolean {
  if (selection.isBanned) {
    return true; // Banned effects are always valid
  }

  // If min rarity is set, must have at least one slot
  if (selection.minRarity && selection.targetSlots.length === 0) {
    return false;
  }

  // If slots are assigned, must have min rarity
  if (selection.targetSlots.length > 0 && !selection.minRarity) {
    return false;
  }

  return true;
}

/**
 * Count how many effects are targeting each slot
 */
export function countEffectsPerSlot(
  selections: EffectSelection[],
  slotCount: number
): Map<number, number> {
  const counts = new Map<number, number>();

  for (let i = 1; i <= slotCount; i++) {
    counts.set(i, getEffectsForSlot(selections, i).length);
  }

  return counts;
}

/**
 * Get summary text for an effect's configuration
 */
export function getSelectionSummary(selection: EffectSelection): string {
  if (selection.isBanned) {
    return 'Banned';
  }

  if (!selection.minRarity) {
    return '';
  }

  const rarityText = `${selection.minRarity.charAt(0).toUpperCase()}${selection.minRarity.slice(1)}+`;
  const slotsText =
    selection.targetSlots.length > 0
      ? `Slots: ${selection.targetSlots.join(', ')}`
      : 'No slots';

  return `${rarityText} - ${slotsText}`;
}
