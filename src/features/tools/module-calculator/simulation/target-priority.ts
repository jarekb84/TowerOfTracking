/**
 * Target Priority Logic
 *
 * Shared priority-based target selection logic used by both Monte Carlo
 * simulation and manual practice mode. This ensures both implementations
 * use identical algorithms for determining which targets to roll for.
 */

// Note: Using relative import for Web Worker compatibility (path aliases don't resolve in worker bundles)
import { RARITY_ORDER } from '../../../../shared/domain/module-data';
import type { Rarity } from '../../../../shared/domain/module-data';
import type { SlotTarget } from '../types';

/**
 * Get targets belonging to the current priority group.
 *
 * Priority groups are identified by slot number ranges created during target expansion.
 * Same-priority effects share consecutive slot numbers and the same acceptable effects pool.
 *
 * This function returns all targets that share the minimum slot number's acceptable effects,
 * which represents the current priority group we should be rolling for.
 *
 * Example:
 * - Slots 1,2 accept [A,B] (priority group 1)
 * - Slot 3 accepts [C] (priority group 2)
 *
 * When slot 1 is filled with A, remaining targets are:
 * - Slot 2 accepts [B]
 * - Slot 3 accepts [C]
 *
 * Now slot 2 is the minimum, and we only roll for [B] until it's filled,
 * then move to slot 3 for [C].
 */
export function getCurrentPriorityTargets(targets: SlotTarget[]): SlotTarget[] {
  if (targets.length === 0) return [];

  const minSlotNumber = Math.min(...targets.map((t) => t.slotNumber));

  // Find all targets that are part of the same priority group as the minimum slot.
  // Same-priority targets have consecutive slot numbers AND share acceptable effects.
  // After effects are removed from the pool, they may have fewer effects but still
  // represent the same priority group.
  const minSlotTarget = targets.find((t) => t.slotNumber === minSlotNumber)!;
  const minSlotEffects = new Set(minSlotTarget.acceptableEffects);

  // A target is in the same priority group if it has overlapping acceptable effects
  // with the minimum slot target (they came from the same priority group originally)
  return targets.filter((t) => {
    // Always include the minimum slot
    if (t.slotNumber === minSlotNumber) return true;

    // Check if this target shares any acceptable effects with the min slot target
    // (indicating they were originally in the same priority group)
    return t.acceptableEffects.some((effect) => minSlotEffects.has(effect));
  });
}

/**
 * Remove a locked effect from all remaining targets' acceptable effects.
 *
 * When an effect is locked, it should no longer be considered for other slots.
 * This is critical for same-priority groups where multiple slots initially share
 * the same acceptable effects pool.
 *
 * Also removes any targets that now have empty acceptable effects (shouldn't happen
 * with proper target construction, but included for safety).
 */
export function removeLockedEffectFromTargets(
  targets: SlotTarget[],
  lockedEffectId: string
): SlotTarget[] {
  return targets
    .map((target) => ({
      ...target,
      acceptableEffects: target.acceptableEffects.filter((id) => id !== lockedEffectId),
    }))
    .filter((target) => target.acceptableEffects.length > 0);
}

/**
 * Build a map of effect ID to minimum required rarity across all targets.
 *
 * When an effect appears in multiple targets with different min rarities,
 * we use the lower (more permissive) minimum rarity.
 */
export function buildMinRarityMap(targets: SlotTarget[]): Map<string, Rarity> {
  const map = new Map<string, Rarity>();

  for (const target of targets) {
    for (const effectId of target.acceptableEffects) {
      const existing = map.get(effectId);
      if (!existing) {
        map.set(effectId, target.minRarity);
      } else {
        // Keep the lower minimum (more permissive)
        const existingIndex = RARITY_ORDER.indexOf(existing);
        const newIndex = RARITY_ORDER.indexOf(target.minRarity);
        if (newIndex < existingIndex) {
          map.set(effectId, target.minRarity);
        }
      }
    }
  }

  return map;
}

/**
 * Check if a target belongs to the current priority group.
 *
 * Used to determine if a hit should stop auto-rolling (only stop on
 * current priority hits, not future priority hits).
 */
export function isTargetInCurrentPriority(
  target: SlotTarget,
  allRemainingTargets: SlotTarget[]
): boolean {
  const currentPriorityTargets = getCurrentPriorityTargets(allRemainingTargets);
  return currentPriorityTargets.some((t) => t.slotNumber === target.slotNumber);
}
