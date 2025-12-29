/**
 * Module Data Types
 *
 * Core type definitions for the module system used across
 * the Module Reroll Calculator and future module-related features.
 */

/** Available rarity tiers for sub-effects */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ancestral';

/** Module types available in the game */
export type ModuleType = 'cannon' | 'armor' | 'generator' | 'core';

/**
 * Configuration for a rarity tier
 */
export interface RarityConfig {
  /** Rarity identifier */
  id: Rarity;

  /** Full display name (e.g., "Legendary") */
  displayName: string;

  /** Single-letter abbreviation (e.g., "L") */
  shortName: string;

  /** Roll probability (0-1, e.g., 0.025 for 2.5%) */
  probability: number;

  /** Hex color for UI display */
  color: string;

  /** Numeric order for sorting (lower = more common) */
  sortOrder: number;
}

/**
 * Configuration for a module type
 */
export interface ModuleTypeConfig {
  /** Module type identifier */
  id: ModuleType;

  /** Full display name (e.g., "Cannon") */
  displayName: string;

  /** Brief description of the module's purpose */
  description: string;

  /** Hex color for UI display */
  color: string;
}

/**
 * Sub-effect rarity values
 *
 * Maps each rarity to its value. null indicates the rarity
 * is not available for this sub-effect.
 */
type SubEffectValues = Record<Rarity, string | number | null>;

/**
 * Configuration for a single sub-effect
 */
export interface SubEffectConfig {
  /** Unique identifier (e.g., 'attackSpeed') */
  id: string;

  /** Display name (e.g., 'Attack Speed') */
  displayName: string;

  /** Which module type this effect belongs to */
  moduleType: ModuleType;

  /** Unit suffix for display (e.g., '%', 'm', 's', 'x') */
  unit?: string;

  /** Values at each rarity tier (null = not available) */
  values: SubEffectValues;
}

/**
 * Mapping of module level ranges to available slots
 */
export interface SlotUnlockThreshold {
  /** Minimum level (inclusive) */
  minLevel: number;

  /** Maximum level (inclusive, use Infinity for unbounded) */
  maxLevel: number;

  /** Number of slots available at this level range */
  slots: number;
}

/**
 * Shard cost for locking effects
 */
export interface LockCost {
  /** Number of already-locked effects (0-7) */
  lockCount: number;

  /** Shards required for the next lock */
  shardCost: number;
}
