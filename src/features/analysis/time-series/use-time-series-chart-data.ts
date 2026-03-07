import { useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration, type PeriodCountFilter } from '@/shared/domain/filters/types'
import { prepareTimeSeriesData, getAvailableTimePeriods } from './chart-data'
import type { TimePeriod, ChartDataPoint, TimePeriodConfig } from './chart-types'
import { generateYAxisTicks } from '@/features/analysis/shared/formatting/chart-formatters'
import {
  calculateMovingAverage,
  useMovingAverage,
  type TrendWindowValue,
} from './moving-average'
import { calculatePercentChange, usePercentChange } from './percent-change'
import {
  sliceToInterval,
  useIntervalSelector,
  useDurationSelector,
} from './interval-selector'

interface UseTimeSeriesChartDataResult {
  chartData: ChartDataPoint[]
  availablePeriodConfigs: TimePeriodConfig[]
  currentConfig: TimePeriodConfig
  selectedPeriod: TimePeriod
  setSelectedPeriod: (period: TimePeriod) => void
  yAxisTicks: number[]
  trendWindow: TrendWindowValue
  setTrendWindow: (value: TrendWindowValue) => void
  isAverageEnabled: boolean
  /** Whether trend selector should be shown (hidden for yearly -- insufficient data points) */
  showTrendSelector: boolean
  percentChangeEnabled: boolean
  setPercentChangeEnabled: (enabled: boolean) => void
  intervalCount: PeriodCountFilter
  setIntervalCount: (count: PeriodCountFilter) => void
  intervalCountOptions: number[]
  intervalLabel: string
}

/**
 * Custom hook that encapsulates all chart data preparation logic.
 * Handles period selection, interval slicing, moving average, and percent change calculations.
 */
export function useTimeSeriesChartData(
  filteredRuns: ParsedGameRun[],
  metric: string,
  defaultPeriod: TimePeriod
): UseTimeSeriesChartDataResult {
  // Get available periods based on data span
  const availablePeriodConfigs = useMemo(() => {
    return getAvailableTimePeriods(filteredRuns)
  }, [filteredRuns])

  // Duration selection with localStorage persistence and auto-reset
  const { selectedPeriod, setSelectedPeriod } = useDurationSelector(
    defaultPeriod,
    availablePeriodConfigs
  )

  const currentConfig =
    availablePeriodConfigs.find((config) => config.period === selectedPeriod) ||
    availablePeriodConfigs[0]

  // Interval selector state with localStorage persistence
  const {
    intervalCount,
    setIntervalCount,
    countOptions: intervalCountOptions,
    label: intervalLabel,
  } = useIntervalSelector(selectedPeriod, filteredRuns)

  // Moving average state with localStorage persistence (period-aware)
  const { trendWindow, setTrendWindow, windowSize, isEnabled: isAverageEnabled } =
    useMovingAverage(metric, selectedPeriod)

  // Percentage change state with localStorage persistence
  const { isEnabled: percentChangeEnabled, setEnabled: setPercentChangeEnabled } =
    usePercentChange(metric)

  const baseChartData = useMemo(() => {
    return prepareTimeSeriesData(filteredRuns, selectedPeriod, metric)
  }, [filteredRuns, selectedPeriod, metric])

  // Apply interval slicing, then moving average and percent change
  const chartData = useMemo(() => {
    let data = sliceToInterval(baseChartData, intervalCount)

    if (isAverageEnabled && windowSize !== null) {
      data = calculateMovingAverage(data, windowSize)
    }

    if (percentChangeEnabled) {
      data = calculatePercentChange(data)
    }

    return data
  }, [baseChartData, intervalCount, windowSize, isAverageEnabled, percentChangeEnabled])

  const yAxisTicks = useMemo(() => {
    if (chartData.length === 0) return []
    const maxValue = Math.max(...chartData.map((d) => d.value))
    return generateYAxisTicks(maxValue)
  }, [chartData])

  // Hide trend selector for yearly view (not enough data points for meaningful trends)
  const showTrendSelector = selectedPeriod !== Duration.YEARLY

  return {
    chartData,
    availablePeriodConfigs,
    currentConfig,
    selectedPeriod,
    setSelectedPeriod,
    yAxisTicks,
    trendWindow,
    setTrendWindow,
    isAverageEnabled,
    showTrendSelector,
    percentChangeEnabled,
    setPercentChangeEnabled,
    intervalCount,
    setIntervalCount,
    intervalCountOptions,
    intervalLabel,
  }
}
