/**
 * Coverage Report View State Hook
 *
 * Manages filters, calculations, and cross-chart state for the Coverage Report feature.
 * Key difference from source-analysis: uses multi-select metrics instead of single category.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { PeriodCountFilter } from '@/shared/domain/filters/types'
import { clampPeriodCount } from '@/shared/domain/filters/period-count/period-count-logic'
import { usePeriodCountOptions } from '@/shared/domain/filters/period-count/use-period-count-options'
import { usePeriodCountFallback } from '@/shared/domain/filters/period-count/use-period-count-fallback'
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
import { usePersistedPageState } from '@/shared/persistence'

interface UseCoverageReportOptions {
  runs: ParsedGameRun[]
}

interface UseCoverageReportReturn {
  // Filter state
  filters: CoverageReportFilters
  toggleMetric: (fieldName: CoverageFieldName) => void
  setRunType: (runType: RunTypeFilter) => void
  setTier: (tier: number | 'all') => void
  setDuration: (duration: Duration) => void
  setPeriodCount: (count: PeriodCountFilter) => void

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
  periodCountOptions: number[]
  periodCountLabel: string
}

const PAGE_SCOPE = 'charts/coverage'

/**
 * Main hook for Coverage Report view state
 */
export function useCoverageReport({
  runs,
}: UseCoverageReportOptions): UseCoverageReportReturn {

  // Persisted filter state
  const [runType, setRunType] = usePersistedPageState<RunTypeFilter>(
    PAGE_SCOPE, 'runType', DEFAULT_COVERAGE_FILTERS.runType
  )
  const [tier, setTier] = usePersistedPageState<number | 'all'>(
    PAGE_SCOPE, 'tier', DEFAULT_COVERAGE_FILTERS.tier
  )
  const [duration, setDurationState] = usePersistedPageState<Duration>(
    PAGE_SCOPE, 'duration', DEFAULT_COVERAGE_FILTERS.duration
  )
  const [periodCount, setPeriodCountState] = usePersistedPageState<PeriodCountFilter>(
    PAGE_SCOPE, 'periodCount', DEFAULT_COVERAGE_FILTERS.periodCount
  )
  const [selectedMetricsArray, setSelectedMetricsArray] = usePersistedPageState<CoverageFieldName[]>(
    PAGE_SCOPE, 'selectedMetrics', [...DEFAULT_COVERAGE_FILTERS.selectedMetrics]
  )
  const [useRelativeYAxis, setUseRelativeYAxis] = usePersistedPageState<boolean>(
    PAGE_SCOPE, 'useRelativeYAxis', true
  )

  // Reconstruct filters object for downstream consumers
  const filters = useMemo<CoverageReportFilters>(() => ({
    runType, tier, duration, periodCount,
    selectedMetrics: new Set(selectedMetricsArray),
  }), [runType, tier, duration, periodCount, selectedMetricsArray])

  // Cross-chart highlight state (ephemeral)
  const [highlightedMetric, setHighlightedMetric] = useState<string | null>(null)

  // Use unified hooks for available options
  const { tiers: availableTiers } = useAvailableTiers(runs, filters.runType)
  const { durations: availableDurations } = useAvailableDurations(runs)

  // Data-aware period count options
  const { options: periodCountOptions, label: periodCountLabel } =
    usePeriodCountOptions(filters.duration, undefined, runs)

  // Auto-fallback when options change and current selection is no longer available
  usePeriodCountFallback(
    periodCount,
    periodCountOptions,
    setPeriodCountState
  )

  // Auto-reset tier to 'all' when the selected tier is no longer available
  useEffect(() => {
    if (tier !== 'all' && !availableTiers.includes(tier)) {
      setTier('all')
    }
  }, [availableTiers, tier, setTier])

  // Calculate analysis data
  const analysisData = useMemo(() => {
    if (runs.length === 0) {
      return null
    }
    return calculateCoverageAnalysis(runs, filters)
  }, [runs, filters])

  // Toggle metric selection - prevents deselecting the last metric
  const toggleMetric = useCallback((fieldName: CoverageFieldName) => {
    setSelectedMetricsArray(prev => {
      const currentSet = new Set(prev)

      if (currentSet.has(fieldName)) {
        if (currentSet.size === 1) {
          return prev // Prevent deselecting the last metric
        }
        currentSet.delete(fieldName)
      } else {
        currentSet.add(fieldName)
      }

      return [...currentSet]
    })
  }, [setSelectedMetricsArray])

  const setDuration = useCallback((d: Duration) => {
    setDurationState(d)
    setPeriodCountState(getDefaultPeriodCount(d))
  }, [setDurationState, setPeriodCountState])

  const setPeriodCount = useCallback((count: PeriodCountFilter) => {
    setPeriodCountState(clampPeriodCount(count))
  }, [setPeriodCountState])

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
    periodCountOptions,
    periodCountLabel,
  }
}
