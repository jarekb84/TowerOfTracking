/**
 * Coverage Report View State Hook
 *
 * Manages filters, calculations, and cross-chart state for the Coverage Report feature.
 * Key difference from source-analysis: uses multi-select metrics instead of single category.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type {
  CoverageReportFilters,
  CoverageAnalysisData,
  CoverageFieldName,
} from './types'
import { DEFAULT_COVERAGE_FILTERS } from './types'
import { calculateCoverageAnalysis } from './calculations/period-grouping'
import { calculateYAxisMax } from './charts/chart-data-transforms'
import {
  useAvailableTiers,
  useAvailableDurations,
  Duration,
  getDefaultPeriodCount,
} from '@/shared/domain/filters'

interface UseCoverageReportOptions {
  runs: ParsedGameRun[]
  initialFilters?: Partial<CoverageReportFilters>
}

interface UseCoverageReportReturn {
  // Filter state
  filters: CoverageReportFilters
  toggleMetric: (fieldName: CoverageFieldName) => void
  setRunType: (runType: RunTypeFilter) => void
  setTier: (tier: number | 'all') => void
  setDuration: (duration: Duration) => void
  setPeriodCount: (count: number) => void

  // Analysis data
  analysisData: CoverageAnalysisData | null
  isLoading: boolean
  hasData: boolean

  // Cross-chart highlight state
  highlightedMetric: string | null
  setHighlightedMetric: (fieldName: string | null) => void

  // Y-axis scaling
  useRelativeYAxis: boolean
  setUseRelativeYAxis: (value: boolean) => void
  yAxisMax: number

  // Available options for filters
  availableTiers: number[]
  availableDurations: Duration[]
}

/**
 * D7: Filter out yearly duration - coverage analysis is more relevant at shorter time scales
 */
function filterSupportedDurations(durations: Duration[]): Duration[] {
  return durations.filter(d => d !== Duration.YEARLY)
}

/**
 * Main hook for Coverage Report view state
 */
export function useCoverageReport({
  runs,
  initialFilters = {},
}: UseCoverageReportOptions): UseCoverageReportReturn {
  // Filter state - merge defaults with initial filters
  const [filters, setFilters] = useState<CoverageReportFilters>(() => ({
    ...DEFAULT_COVERAGE_FILTERS,
    ...initialFilters,
    // Ensure selectedMetrics is a Set (in case initialFilters passed an array)
    selectedMetrics: initialFilters.selectedMetrics instanceof Set
      ? initialFilters.selectedMetrics
      : DEFAULT_COVERAGE_FILTERS.selectedMetrics,
  }))

  // Cross-chart highlight state
  const [highlightedMetric, setHighlightedMetric] = useState<string | null>(null)

  // Y-axis scaling state - default to true for better data visibility
  const [useRelativeYAxis, setUseRelativeYAxis] = useState(true)

  // Use unified hooks for available options
  const { tiers: availableTiers } = useAvailableTiers(runs, filters.runType)
  const { durations: rawDurations } = useAvailableDurations(runs)

  // D7: Filter out yearly duration
  const availableDurations = useMemo(
    () => filterSupportedDurations(rawDurations),
    [rawDurations]
  )

  // Auto-reset tier to 'all' when the selected tier is no longer available
  useEffect(() => {
    if (filters.tier !== 'all' && !availableTiers.includes(filters.tier)) {
      setFilters(prev => ({ ...prev, tier: 'all' }))
    }
  }, [availableTiers, filters.tier])

  // Auto-reset duration if yearly was selected but not supported (D7)
  useEffect(() => {
    if (filters.duration === Duration.YEARLY) {
      setFilters(prev => ({ ...prev, duration: Duration.DAILY }))
    }
  }, [filters.duration])

  // Calculate analysis data
  const analysisData = useMemo(() => {
    if (runs.length === 0) {
      return null
    }
    return calculateCoverageAnalysis(runs, filters)
  }, [runs, filters])

  // Toggle metric selection - prevents deselecting the last metric
  const toggleMetric = useCallback((fieldName: CoverageFieldName) => {
    setFilters(prev => {
      const newMetrics = new Set(prev.selectedMetrics)

      if (newMetrics.has(fieldName)) {
        // Prevent deselecting the last metric
        if (newMetrics.size === 1) {
          return prev // No change
        }
        newMetrics.delete(fieldName)
      } else {
        newMetrics.add(fieldName)
      }

      return { ...prev, selectedMetrics: newMetrics }
    })
  }, [])

  const setRunType = useCallback((runType: RunTypeFilter) => {
    setFilters(prev => ({ ...prev, runType }))
  }, [])

  const setTier = useCallback((tier: number | 'all') => {
    setFilters(prev => ({ ...prev, tier }))
  }, [])

  const setDuration = useCallback((duration: Duration) => {
    // D7: Prevent setting yearly duration
    if (duration === Duration.YEARLY) {
      return
    }
    // Reset period count to default for the new duration
    const newPeriodCount = getDefaultPeriodCount(duration)
    setFilters(prev => ({ ...prev, duration, periodCount: newPeriodCount }))
  }, [])

  const setPeriodCount = useCallback((count: number) => {
    setFilters(prev => ({
      ...prev,
      periodCount: Math.max(1, Math.min(50, count)),
    }))
  }, [])

  // Calculate Y-axis max based on data
  const yAxisMax = useMemo(
    () => calculateYAxisMax(analysisData?.periods ?? [], useRelativeYAxis),
    [useRelativeYAxis, analysisData]
  )

  // Derived state
  const hasData = analysisData !== null && analysisData.periods.length > 0

  return {
    // Filter state
    filters,
    toggleMetric,
    setRunType,
    setTier,
    setDuration,
    setPeriodCount,

    // Analysis data
    analysisData,
    isLoading: false, // Calculations are synchronous
    hasData,

    // Cross-chart highlight state
    highlightedMetric,
    setHighlightedMetric,

    // Y-axis scaling
    useRelativeYAxis,
    setUseRelativeYAxis,
    yAxisMax,

    // Available options
    availableTiers,
    availableDurations,
  }
}
