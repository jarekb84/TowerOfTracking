import { useMemo } from 'react'
import type { ParsedGameRun, TierTrendsFilters } from '../types/game-run.types'
import { calculateTierTrends } from '../utils/tier-trends'
import type { RunTypeFilter } from '../utils/run-type-filter'

/**
 * Manages derived view state for tier trends analysis component
 * Determines what should be displayed based on data availability
 */
export function useTierTrendsViewState(
  runs: ParsedGameRun[],
  filters: TierTrendsFilters,
  runTypeFilter: RunTypeFilter,
  availableTiers: number[]
) {
  // Calculate trends data
  const trendsData = useMemo(() => {
    if (availableTiers.length === 0) return null
    return calculateTierTrends(runs, filters, runTypeFilter)
  }, [runs, filters, runTypeFilter, availableTiers])

  // Determine view state
  const viewState = useMemo(() => {
    if (availableTiers.length === 0) {
      return { type: 'no-data' as const, trendsData: null }
    }
    if (!trendsData) {
      return { type: 'loading' as const, trendsData: null }
    }
    return { type: 'ready' as const, trendsData }
  }, [availableTiers.length, trendsData])

  return viewState
}
