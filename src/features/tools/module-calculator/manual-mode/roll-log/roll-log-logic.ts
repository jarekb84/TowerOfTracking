/**
 * Roll Log Logic
 *
 * Pure functions for managing the roll log in manual mode.
 * Handles filtering qualifying effects, creating log entries, and enforcing limits.
 */

import type { Rarity } from '@/shared/domain/module-data';
import { RARITY_CONFIG_MAP } from '@/shared/domain/module-data';
import { isAtLeastAsRare } from '@/shared/domain/module-data/rarities/rarity-utils';
import type { ManualSlot, RollLogEntry, RollLogEffect } from '../types';

/**
 * Maximum number of log entries to retain
 */
export const MAX_LOG_ENTRIES = 500;

/**
 * Filter slots to extract effects that meet the minimum rarity threshold.
 * Only includes filled slots (non-null effect and rarity).
 */
export function filterQualifyingEffects(
  slots: ManualSlot[],
  filledSlotIndexes: number[],
  minRarity: Rarity
): RollLogEffect[] {
  const qualifying: RollLogEffect[] = [];

  for (const index of filledSlotIndexes) {
    const slot = slots[index];
    if (!slot?.effect || !slot.rarity) continue;

    if (isAtLeastAsRare(slot.rarity, minRarity)) {
      qualifying.push({
        effectId: slot.effect.id,
        name: slot.effect.displayName,
        rarity: slot.rarity,
        shortName: RARITY_CONFIG_MAP[slot.rarity].shortName,
        isTargetMatch: slot.isTargetMatch,
      });
    }
  }

  return qualifying;
}

/**
 * Check if a roll should be logged based on whether any effect meets the threshold.
 */
export function shouldLogRoll(
  slots: ManualSlot[],
  filledSlotIndexes: number[],
  minRarity: Rarity,
  logEnabled: boolean
): boolean {
  if (!logEnabled) return false;
  if (filledSlotIndexes.length === 0) return false;

  for (const index of filledSlotIndexes) {
    const slot = slots[index];
    if (!slot?.rarity) continue;

    if (isAtLeastAsRare(slot.rarity, minRarity)) {
      return true;
    }
  }

  return false;
}

/**
 * Create a log entry from roll data.
 */
export function createLogEntry(
  rollNumber: number,
  totalShards: number,
  rollCost: number,
  effects: RollLogEffect[]
): RollLogEntry {
  return {
    rollNumber,
    totalShards,
    rollCost,
    effects,
  };
}

/**
 * Add a log entry to the beginning of the entries array.
 * Enforces the maximum entry limit by removing oldest entries.
 */
export function addLogEntry(
  entries: RollLogEntry[],
  entry: RollLogEntry,
  maxEntries: number = MAX_LOG_ENTRIES
): RollLogEntry[] {
  const updated = [entry, ...entries];

  if (updated.length > maxEntries) {
    return updated.slice(0, maxEntries);
  }

  return updated;
}

/**
 * Parameters for processing a roll for logging
 */
interface ProcessRollForLoggingParams {
  slots: ManualSlot[];
  filledSlotIndexes: number[];
  rollNumber: number;
  totalSpent: number;
  rollCost: number;
  logEntries: RollLogEntry[];
  minimumLogRarity: Rarity;
  logEnabled: boolean;
}

/**
 * Process a roll result and add a log entry if it qualifies.
 * Returns updated log entries array (unchanged if roll doesn't qualify).
 */
export function processRollForLogging(params: ProcessRollForLoggingParams): RollLogEntry[] {
  const {
    slots,
    filledSlotIndexes,
    rollNumber,
    totalSpent,
    rollCost,
    logEntries,
    minimumLogRarity,
    logEnabled,
  } = params;

  if (!shouldLogRoll(slots, filledSlotIndexes, minimumLogRarity, logEnabled)) {
    return logEntries;
  }

  const qualifyingEffects = filterQualifyingEffects(slots, filledSlotIndexes, minimumLogRarity);
  const entry = createLogEntry(rollNumber, totalSpent, rollCost, qualifyingEffects);
  return addLogEntry(logEntries, entry);
}

/**
 * Generate collapsed header summary for Roll Log panel
 * Format: "12 entries | Latest: Legendary Critical" or "Empty"
 */
export function generateRollLogSummary(entries: RollLogEntry[]): string {
  if (entries.length === 0) {
    return 'Empty';
  }

  const entryCount = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;

  // Get the latest entry's highest rarity effect
  const latestEntry = entries[0];
  if (latestEntry.effects.length === 0) {
    return entryCount;
  }

  // Find the highest rarity effect in the latest entry
  const highestRarityEffect = latestEntry.effects.reduce((highest, current) => {
    const currentConfig = RARITY_CONFIG_MAP[current.rarity];
    const highestConfig = RARITY_CONFIG_MAP[highest.rarity];
    return currentConfig.sortOrder > highestConfig.sortOrder ? current : highest;
  });

  const rarityName = RARITY_CONFIG_MAP[highestRarityEffect.rarity].displayName;
  return `${entryCount} | Latest: ${rarityName}`;
}
