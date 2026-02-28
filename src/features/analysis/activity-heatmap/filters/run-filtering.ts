/**
 * Heatmap Run Filtering
 *
 * Pure function for filtering game runs by tier and run type before
 * building the activity heatmap grid. Reuses the shared filterRunsByType
 * utility for run type filtering.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { RunTypeValue } from '@/shared/domain/run-types/types'
import { filterRunsByType } from '@/features/analysis/shared/filtering/run-type-filter'

/** Filter parameters for the heatmap run filter */
interface HeatmapRunFilters {
  /** Tier number to filter by; 0 means all tiers */
  tier: number
  /** Run type to filter by; 'all' means all run types */
  runType: RunTypeValue | 'all'
}

/**
 * Filters runs by tier and run type for the activity heatmap.
 *
 * Applies tier filter (0 = all tiers) and run type filter ('all' = all types).
 * Reuses the shared filterRunsByType utility for run type filtering.
 *
 * @param runs - Array of parsed game runs to filter
 * @param filters - Tier and run type filter criteria
 * @returns Filtered array of runs matching both criteria
 */
export function filterHeatmapRuns(
  runs: ParsedGameRun[],
  filters: HeatmapRunFilters
): ParsedGameRun[] {
  // Apply run type filter using shared utility
  const typeFiltered = filterRunsByType(runs, filters.runType)

  // Apply tier filter (0 = all tiers)
  if (filters.tier === 0) {
    return typeFiltered
  }

  return typeFiltered.filter((run) => run.tier === filters.tier)
}
