/**
 * Module Calculator Types
 *
 * Types specific to the Module Reroll Calculator feature.
 */

import type { ModuleType, Rarity, SubEffectConfig } from '@/shared/domain/module-data';

/**
 * Confidence level for simulation accuracy
 * - low: 100 iterations (fast, rough estimate)
 * - medium: 1,000 iterations (balanced)
 * - high: 10,000 iterations (accurate, slower)
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * Configuration for a confidence level option
 */
export interface ConfidenceLevelOption {
  value: ConfidenceLevel;
  label: string;
  iterations: number;
  description: string;
}

/**
 * A single roll pool entry representing an effect-rarity combination
 */
export interface PoolEntry {
  /** The sub-effect configuration */
  effect: SubEffectConfig;

  /** The rarity of this entry */
  rarity: Rarity;

  /** Base probability of rolling this entry (before pool adjustments) */
  baseProbability: number;
}

/**
 * Target configuration for a single slot
 */
export interface SlotTarget {
  /** Slot number (1-8) */
  slotNumber: number;

  /** Acceptable effects for this slot (effect IDs) */
  acceptableEffects: string[];

  /** Minimum acceptable rarity */
  minRarity: Rarity;
}

/**
 * Effect selection state in the UI
 */
export interface EffectSelection {
  /** Effect ID */
  effectId: string;

  /** Minimum rarity threshold (null = not targeting this effect) */
  minRarity: Rarity | null;

  /** Which slots this effect can fill (slot numbers) */
  targetSlots: number[];

  /** Whether this effect is banned from the pool */
  isBanned: boolean;

  /** Whether this effect is already locked on the module */
  isLocked: boolean;

  /** Rarity of the locked effect (if isLocked is true) */
  lockedRarity: Rarity | null;
}

/**
 * A pre-locked effect that already exists on the module
 */
export interface PreLockedEffect {
  /** Effect ID that is locked */
  effectId: string;

  /** Rarity of the locked effect */
  rarity: Rarity;
}

/**
 * Complete calculator configuration
 */
export interface CalculatorConfig {
  /** Module type being configured */
  moduleType: ModuleType;

  /** Module level (determines slot count) */
  moduleLevel: number;

  /** Module rarity (limits rollable sub-effect rarities) */
  moduleRarity: Rarity;

  /** Number of available slots */
  slotCount: number;

  /** Banned effect IDs (removed from pool via Lab Research) */
  bannedEffects: string[];

  /** Target configurations for each slot */
  slotTargets: SlotTarget[];

  /** Effects already locked on the module (simulation starts with these) */
  preLockedEffects: PreLockedEffect[];
}

/**
 * Result of a single simulation run
 */
export interface SimulationRun {
  /** Total rolls required to complete all targets */
  totalRolls: number;

  /** Total shard cost for this run (varies by lock count per roll) */
  totalShardCost: number;

  /** Order in which effects were locked */
  lockOrder: LockedEffect[];
}

/**
 * Record of a locked effect during simulation
 */
interface LockedEffect {
  /** Effect ID that was locked */
  effectId: string;

  /** Rarity that was locked */
  rarity: Rarity;

  /** Which slot this filled */
  slotNumber: number;

  /** Rolls it took to get this effect */
  rollsToAcquire: number;

  /** Shard cost per roll while acquiring this effect */
  shardCostPerRoll: number;
}

/**
 * Aggregated simulation results
 */
export interface SimulationResults {
  /** Number of simulation runs */
  runCount: number;

  /** Shard cost statistics */
  shardCost: CostStatistics;

  /** Roll count statistics */
  rollCount: CostStatistics;

  /** Histogram of shard costs for distribution chart */
  shardCostHistogram: HistogramBucket[];
}

/**
 * Statistical summary of a cost metric
 */
export interface CostStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  percentile10: number;
  percentile90: number;
  percentile95: number;
}

/**
 * Bucket for cost distribution histogram
 */
export interface HistogramBucket {
  /** Lower bound of the bucket (inclusive) */
  min: number;

  /** Upper bound of the bucket (exclusive) */
  max: number;

  /** Number of runs in this bucket */
  count: number;

  /** Percentage of total runs */
  percentage: number;
}

/**
 * Configuration for running a simulation
 */
export interface SimulationConfig {
  /** Calculator configuration */
  calculatorConfig: CalculatorConfig;

  /** Number of simulation iterations */
  iterations: number;

  /** Shard cost per roll (base cost, may vary by lock count) */
  shardCostPerRoll: number;
}
