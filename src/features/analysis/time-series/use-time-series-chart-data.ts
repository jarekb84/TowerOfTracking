import { useState, useMemo, useEffect } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { prepareTimeSeriesData, getAvailableTimePeriods } from './chart-data'
import type { TimePeriod, ChartDataPoint, TimePeriodConfig } from './chart-types'
import { generateYAxisTicks } from '@/features/analysis/shared/formatting/chart-formatters'
import {
  calculateMovingAverage,
  useMovingAverage,
  type MovingAveragePeriod,
} from './moving-average'
import { calculatePercentChange, usePercentChange } from './percent-change'

interface UseTimeSeriesChartDataResult {
  chartData: ChartDataPoint[]
  availablePeriodConfigs: TimePeriodConfig[]
  currentConfig: TimePeriodConfig
  selectedPeriod: TimePeriod
  setSelectedPeriod: (period: TimePeriod) => void
  yAxisTicks: number[]
  averagePeriod: MovingAveragePeriod
  setAveragePeriod: (period: MovingAveragePeriod) => void
  isAverageEnabled: boolean
  percentChangeEnabled: boolean
  setPercentChangeEnabled: (enabled: boolean) => void
}

/**
 * Custom hook that encapsulates all chart data preparation logic.
 * Handles period selection, moving average, and percent change calculations.
 */
export function useTimeSeriesChartData(
  filteredRuns: ParsedGameRun[],
  metric: string,
  defaultPeriod: TimePeriod
): UseTimeSeriesChartDataResult {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(defaultPeriod)

  // Moving average state with localStorage persistence
  const { averagePeriod, setAveragePeriod, isAverageEnabled } = useMovingAverage(metric)

  // Percentage change state with localStorage persistence
  const { isEnabled: percentChangeEnabled, setEnabled: setPercentChangeEnabled } = usePercentChange(metric)

  // Get available periods based on data span
  const availablePeriodConfigs = useMemo(() => {
    return getAvailableTimePeriods(filteredRuns)
  }, [filteredRuns])

  // Reset period if current selection is not available
  useEffect(() => {
    const isCurrentPeriodAvailable = availablePeriodConfigs.some(
      (config) => config.period === selectedPeriod
    )
    if (!isCurrentPeriodAvailable && availablePeriodConfigs.length > 0) {
      setSelectedPeriod(availablePeriodConfigs[0].period)
    }
  }, [availablePeriodConfigs, selectedPeriod])

  const currentConfig =
    availablePeriodConfigs.find((config) => config.period === selectedPeriod) ||
    availablePeriodConfigs[0]

  const baseChartData = useMemo(() => {
    return prepareTimeSeriesData(filteredRuns, selectedPeriod, metric)
  }, [filteredRuns, selectedPeriod, metric])

  // Apply optional calculations: moving average and percent change
  const chartData = useMemo(() => {
    let data = baseChartData

    if (isAverageEnabled) {
      data = calculateMovingAverage(data, averagePeriod as number)
    }

    if (percentChangeEnabled) {
      data = calculatePercentChange(data)
    }

    return data
  }, [baseChartData, averagePeriod, isAverageEnabled, percentChangeEnabled])

  const yAxisTicks = useMemo(() => {
    if (chartData.length === 0) return []
    const maxValue = Math.max(...chartData.map((d) => d.value))
    return generateYAxisTicks(maxValue)
  }, [chartData])

  return {
    chartData,
    availablePeriodConfigs,
    currentConfig,
    selectedPeriod,
    setSelectedPeriod,
    yAxisTicks,
    averagePeriod,
    setAveragePeriod,
    isAverageEnabled,
    percentChangeEnabled,
    setPercentChangeEnabled,
  }
}
