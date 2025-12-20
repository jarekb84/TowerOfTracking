/**
 * Slot Unlock Rules
 *
 * Defines the level thresholds for unlocking module slots.
 * Module level determines how many sub-effect slots are available.
 */

import type { SlotUnlockThreshold } from '../types';

/**
 * Slot unlock thresholds by module level
 *
 * Level ranges are inclusive on both ends.
 * Uses Infinity for the unbounded upper limit.
 */
const SLOT_UNLOCK_THRESHOLDS: SlotUnlockThreshold[] = [
  { minLevel: 1, maxLevel: 40, slots: 2 },
  { minLevel: 41, maxLevel: 100, slots: 3 },
  { minLevel: 101, maxLevel: 140, slots: 4 },
  { minLevel: 141, maxLevel: 160, slots: 5 },
  { minLevel: 161, maxLevel: 200, slots: 6 },
  { minLevel: 201, maxLevel: 240, slots: 7 },
  { minLevel: 241, maxLevel: Infinity, slots: 8 },
];

/** Minimum valid module level */
export const MIN_MODULE_LEVEL = 1;

/** Maximum number of slots possible */
export const MAX_SLOTS = 8;

/**
 * Get the number of slots available for a given module level
 *
 * @param level - Module level (1+)
 * @returns Number of available slots (2-8)
 */
export function getSlotsForLevel(level: number): number {
  if (level < MIN_MODULE_LEVEL) {
    return SLOT_UNLOCK_THRESHOLDS[0].slots;
  }

  const threshold = SLOT_UNLOCK_THRESHOLDS.find(
    (t) => level >= t.minLevel && level <= t.maxLevel
  );

  return threshold?.slots ?? MAX_SLOTS;
}

/**
 * Get the minimum level required for a given number of slots
 *
 * @param slots - Desired number of slots (2-8)
 * @returns Minimum level required, or null if invalid slot count
 */
export function getMinLevelForSlots(slots: number): number | null {
  const threshold = SLOT_UNLOCK_THRESHOLDS.find((t) => t.slots === slots);
  return threshold?.minLevel ?? null;
}

/**
 * Get all available slot counts
 */
export function getAvailableSlotCounts(): number[] {
  return SLOT_UNLOCK_THRESHOLDS.map((t) => t.slots);
}

/**
 * Check if a level is valid
 */
export function isValidModuleLevel(level: number): boolean {
  return Number.isInteger(level) && level >= MIN_MODULE_LEVEL;
}
