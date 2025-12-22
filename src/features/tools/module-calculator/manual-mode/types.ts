/**
 * Manual Mode Types
 *
 * Types specific to the manual practice mode for module rolling.
 */

import type { Rarity, SubEffectConfig } from '@/shared/domain/module-data';
import type { PreparedPool } from '../simulation/pool-dynamics';
import type { SlotTarget } from '../types';

/**
 * A single slot in manual mode with its current effect and state
 */
export interface ManualSlot {
  /** Slot number (1-8) */
  slotNumber: number;

  /** Current effect in this slot (null = empty) */
  effect: SubEffectConfig | null;

  /** Rarity of the current effect (null = empty) */
  rarity: Rarity | null;

  /** Whether this slot is locked */
  isLocked: boolean;

  /** Whether this slot matches a target */
  isTargetMatch: boolean;
}

/**
 * Shard tracking mode
 * - budget: Start with balance, spend down (tracks remaining)
 * - accumulator: Start at 0, count up (tracks total spent)
 */
export type ShardMode = 'budget' | 'accumulator';

/**
 * Complete state for a manual mode session
 */
export interface ManualModeState {
  /** Current state of all 8 slots */
  slots: ManualSlot[];

  /** Current roll pool (effects remaining after locks) */
  pool: PreparedPool;

  /** Number of rolls performed */
  rollCount: number;

  /** Shard tracking mode */
  shardMode: ShardMode;

  /** Starting balance (for budget mode) */
  startingBalance: number;

  /** Total shards spent so far */
  totalSpent: number;

  /** Whether all targets have been acquired or pool is exhausted */
  isComplete: boolean;

  /** Whether auto-rolling is currently active */
  isAutoRolling: boolean;

  /** Log of notable rolls (filtered by minimum rarity) */
  logEntries: RollLogEntry[];
}

/**
 * Result of a roll operation
 */
export interface RollResult {
  /** Updated slot states */
  slots: ManualSlot[];

  /** Shard cost of this roll */
  shardCost: number;

  /** Whether any slot hit a target */
  hasTargetHit: boolean;

  /** Indexes of slots that were filled */
  filledSlotIndexes: number[];
}

/**
 * Result of checking if a roll is allowed
 */
export interface CanRollResult {
  /** Whether rolling is allowed */
  allowed: boolean;

  /** Reason for disallowing (null if allowed) */
  reason: string | null;
}

/**
 * Configuration passed to initialize manual mode
 */
export interface ManualModeConfig {
  /** Current slot targets from calculator config */
  targets: SlotTarget[];

  /** Minimum rarity required for each effect (effectId -> Rarity) */
  minRarityMap: Map<string, Rarity>;
}

/**
 * An effect in a roll log entry
 */
export interface RollLogEffect {
  effectId: string;
  name: string;
  rarity: Rarity;
  shortName: string;
}

/**
 * A single entry in the roll log
 */
export interface RollLogEntry {
  /** Roll number when this entry was logged */
  rollNumber: number;

  /** Total shards spent at time of roll */
  totalShards: number;

  /** Cost of this specific roll */
  rollCost: number;

  /** Effects that qualified for logging (met minimum rarity) */
  effects: RollLogEffect[];
}
