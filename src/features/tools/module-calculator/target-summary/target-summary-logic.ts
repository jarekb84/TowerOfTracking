/**
 * Target Summary Logic
 *
 * Pure functions for generating summary text from slot targets.
 */

import type { SlotTarget } from '../types';
import type { Rarity } from '@/shared/domain/module-data';
import { RARITY_CONFIG_MAP, getSubEffectById } from '@/shared/domain/module-data';

/**
 * Format a single slot target into a summary string
 */
export function formatSlotSummary(target: SlotTarget): string {
  const effectNames = target.acceptableEffects
    .map((id) => {
      const effect = getSubEffectById(id);
      return effect?.displayName ?? id;
    });

  const rarityText = formatRarityThreshold(target.minRarity);

  if (effectNames.length === 1) {
    return `${effectNames[0]} (${rarityText})`;
  }

  if (effectNames.length <= 3) {
    return `${effectNames.join(' OR ')} (${rarityText})`;
  }

  return `Any of ${effectNames.length} effects (${rarityText})`;
}

/**
 * Format a rarity as a threshold (e.g., "Legendary+")
 */
export function formatRarityThreshold(rarity: Rarity): string {
  const config = RARITY_CONFIG_MAP[rarity];
  return rarity === 'ancestral' ? config.displayName : `${config.displayName}+`;
}

/**
 * Generate a full summary of all targets
 */
export function generateTargetSummary(targets: SlotTarget[]): string[] {
  return targets.map(
    (target) => `Slot ${target.slotNumber}: ${formatSlotSummary(target)}`
  );
}

/**
 * Get a list of banned effect names
 */
function getBannedEffectNames(bannedIds: string[]): string[] {
  return bannedIds.map((id) => {
    const effect = getSubEffectById(id);
    return effect?.displayName ?? id;
  });
}

/**
 * Format banned effects as a comma-separated string
 */
export function formatBannedEffects(bannedIds: string[]): string {
  const names = getBannedEffectNames(bannedIds);
  if (names.length === 0) {
    return 'None';
  }
  return names.join(', ');
}

/**
 * Count unfilled slots (slots without targets)
 */
export function countUnfilledSlots(
  targets: SlotTarget[],
  totalSlots: number
): number {
  const filledSlots = new Set(targets.map((t) => t.slotNumber));
  return totalSlots - filledSlots.size;
}

/**
 * Get slot numbers that don't have targets
 */
export function getUnfilledSlots(
  targets: SlotTarget[],
  totalSlots: number
): number[] {
  const filledSlots = new Set(targets.map((t) => t.slotNumber));
  const unfilled: number[] = [];

  for (let i = 1; i <= totalSlots; i++) {
    if (!filledSlots.has(i)) {
      unfilled.push(i);
    }
  }

  return unfilled;
}

/**
 * Check if configuration is complete (all slots filled)
 */
export function isConfigurationComplete(
  targets: SlotTarget[],
  totalSlots: number
): boolean {
  return targets.length === totalSlots;
}

/**
 * Validate targets configuration
 */
export function validateTargets(
  targets: SlotTarget[],
  totalSlots: number
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (targets.length === 0) {
    warnings.push('No targets selected');
  }

  const unfilledCount = countUnfilledSlots(targets, totalSlots);
  if (unfilledCount > 0 && targets.length > 0) {
    warnings.push(`${unfilledCount} slot(s) without targets`);
  }

  return {
    isValid: targets.length > 0,
    warnings,
  };
}

/**
 * Generate collapsed header summary for Target Summary panel
 * Format: "2 locked | 1 target | 3 banned | Pool: 101" or "No targets"
 */
export function generateCollapsedSummary(
  lockedCount: number,
  targetCount: number,
  bannedCount: number,
  poolSize: number
): string {
  if (lockedCount === 0 && targetCount === 0) {
    return 'No targets';
  }

  const parts: string[] = [];

  if (lockedCount > 0) {
    parts.push(`${lockedCount} locked`);
  }

  if (targetCount > 0) {
    parts.push(`${targetCount} target${targetCount !== 1 ? 's' : ''}`);
  }

  if (bannedCount > 0) {
    parts.push(`${bannedCount} banned`);
  }

  parts.push(`Pool: ${poolSize.toLocaleString()}`);

  return parts.join(' | ');
}
