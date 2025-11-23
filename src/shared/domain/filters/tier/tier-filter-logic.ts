/**
 * Tier Filter Logic
 *
 * Pure functions for calculating available tiers and formatting tier labels.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import { filterRunsByType } from '@/features/analysis/shared/filtering/run-type-filter'

/**
 * Extract unique tiers from runs, sorted highest first
 * Note: Uses parseInt to handle tier values with suffixes (e.g., "8+", "11+")
 * from older tournament data formats
 */
export function extractAvailableTiers(runs: ParsedGameRun[]): number[] {
  const tiers = new Set<number>()
  for (const run of runs) {
    // Use parseInt to extract numeric portion from values like "8+" or "11+"
    const tier = typeof run.tier === 'number' ? run.tier : parseInt(String(run.tier), 10)
    if (!Number.isNaN(tier) && tier > 0) {
      tiers.add(tier)
    }
  }
  return Array.from(tiers).sort((a, b) => b - a)
}

/**
 * Get available tiers after applying run type filter
 */
export function getAvailableTiersForRunType(
  runs: ParsedGameRun[],
  runType: RunTypeFilter
): number[] {
  const filteredRuns = filterRunsByType(runs, runType)
  return extractAvailableTiers(filteredRuns)
}

/**
 * Count runs per tier, optionally filtered by run type
 * Note: Uses parseInt to handle tier values with suffixes (e.g., "8+", "11+")
 * from older tournament data formats
 */
export function countRunsPerTier(
  runs: ParsedGameRun[],
  runType: RunTypeFilter = 'all'
): Map<number, number> {
  const filteredRuns = filterRunsByType(runs, runType)
  const counts = new Map<number, number>()

  for (const run of filteredRuns) {
    // Use parseInt to extract numeric portion from values like "8+" or "11+"
    const tier = typeof run.tier === 'number' ? run.tier : parseInt(String(run.tier), 10)
    if (!Number.isNaN(tier) && tier > 0) {
      counts.set(tier, (counts.get(tier) ?? 0) + 1)
    }
  }

  return counts
}

/**
 * Format tier label in abbreviated format (T14, T13, etc.)
 */
export function formatTierLabel(tier: number): string {
  return `T${tier}`
}

/**
 * Type adapter: Convert null-based tier value to TierFilter ('all' | number)
 *
 * Some features use null to represent "all tiers" while the unified
 * TierSelector uses the string 'all'. This adapter handles the conversion.
 */
export function nullToAllTierAdapter(tier: number | null): number | 'all' {
  return tier === null ? 'all' : tier
}

/**
 * Type adapter: Convert TierFilter back to null-based representation
 */
export function allToNullTierAdapter(tier: number | 'all'): number | null {
  return tier === 'all' ? null : tier
}

/**
 * Type adapter: Convert zero-based tier value to TierFilter ('all' | number)
 *
 * Some features use 0 to represent "all tiers" while the unified
 * TierSelector uses the string 'all'. This adapter handles the conversion.
 */
export function zeroToAllTierAdapter(tier: number): number | 'all' {
  return tier === 0 ? 'all' : tier
}

/**
 * Type adapter: Convert TierFilter back to zero-based representation
 */
export function allToZeroTierAdapter(tier: number | 'all'): number {
  return tier === 'all' ? 0 : tier
}
