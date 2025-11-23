/**
 * useAvailableTiers Hook
 *
 * React hook for calculating available tiers based on runs and optional run type filter.
 */

import { useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import {
  extractAvailableTiers,
  getAvailableTiersForRunType,
  countRunsPerTier
} from './tier-filter-logic'

interface UseAvailableTiersResult {
  /** Available tiers sorted highest first */
  tiers: number[]
  /** Count of runs for each tier */
  tierCounts: Map<number, number>
  /** Total count across all tiers */
  totalCount: number
}

/**
 * Hook to calculate available tiers from runs with optional run type filtering
 *
 * @param runs - Array of parsed game runs
 * @param runType - Optional run type filter ('all' includes all runs)
 * @returns Object containing available tiers, counts per tier, and total count
 */
export function useAvailableTiers(
  runs: ParsedGameRun[],
  runType: RunTypeFilter = 'all'
): UseAvailableTiersResult {
  return useMemo(() => {
    const tiers = runType === 'all'
      ? extractAvailableTiers(runs)
      : getAvailableTiersForRunType(runs, runType)

    const tierCounts = countRunsPerTier(runs, runType)

    let totalCount = 0
    for (const count of tierCounts.values()) {
      totalCount += count
    }

    return { tiers, tierCounts, totalCount }
  }, [runs, runType])
}
