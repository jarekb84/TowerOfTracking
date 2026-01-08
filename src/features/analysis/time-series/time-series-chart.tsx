import { useMemo } from 'react'
import { FormControl } from '@/components/ui'
import { useData } from '@/shared/domain/use-data'
import type { TimePeriod, TimePeriodConfig } from './chart-types'
import { formatLargeNumber } from '@/features/analysis/shared/formatting/chart-formatters'
import { filterRunsByType, type RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import { RunType } from '@/shared/domain/run-types/types'
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector'
import { TimeSeriesHeader } from './time-series-header'
import { PeriodSelectorButton } from './period-selector-button'
import { DataPointsCount } from './data-points-count'
import { MovingAverageSelector, type TrendWindowValue } from './moving-average'
import { PercentChangeToggle } from './percent-change'
import { useTimeSeriesChartData } from './use-time-series-chart-data'
import { TimeSeriesChartBody } from './time-series-chart-body'

interface TimeSeriesChartProps {
  metric: string
  title?: string
  subtitle?: string
  /** Label shown in tooltip. Defaults to title if not provided. */
  tooltipLabel?: string
  defaultPeriod?: TimePeriod
  /** Filter runs by type. Defaults to 'farm' for backwards compatibility. */
  runTypeFilter?: RunTypeFilter
  /** Callback when run type changes. If provided, enables the run type selector. */
  onRunTypeChange?: (runType: RunTypeFilter) => void
  valueFormatter?: (value: number) => string
}


interface FilterControlsProps {
  availablePeriodConfigs: TimePeriodConfig[]
  selectedPeriod: TimePeriod
  onSelectPeriod: (period: TimePeriod) => void
  showRunTypeSelector: boolean
  runTypeFilter: RunTypeFilter
  onRunTypeChange?: (runType: RunTypeFilter) => void
  dataPointCount: number
  trendWindow: TrendWindowValue
  onTrendWindowChange: (value: TrendWindowValue) => void
  percentChangeEnabled: boolean
  onPercentChangeToggle: (enabled: boolean) => void
}

function FilterControls({
  availablePeriodConfigs,
  selectedPeriod,
  onSelectPeriod,
  showRunTypeSelector,
  runTypeFilter,
  onRunTypeChange,
  dataPointCount,
  trendWindow,
  onTrendWindowChange,
  percentChangeEnabled,
  onPercentChangeToggle,
}: FilterControlsProps) {
  // Hide trend selector for yearly view (not enough data points for meaningful trends)
  const showTrendSelector = selectedPeriod !== 'yearly'

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      {/* Left side: Duration selector */}
      <FormControl label="Duration" layout="vertical">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {availablePeriodConfigs.map((config) => (
            <PeriodSelectorButton
              key={config.period}
              config={config}
              isSelected={selectedPeriod === config.period}
              onSelect={onSelectPeriod}
            />
          ))}
        </div>
      </FormControl>

      {/* Right side: Run type selector + SMA selector + % Change toggle + Data points count */}
      <div className="flex items-end gap-4">
        {showRunTypeSelector && onRunTypeChange && (
          <RunTypeSelector
            selectedType={runTypeFilter}
            onTypeChange={onRunTypeChange}
            layout="vertical"
          />
        )}

        {/* Moving average trend line selector - hidden for yearly view */}
        {showTrendSelector && (
          <MovingAverageSelector
            value={trendWindow}
            period={selectedPeriod}
            onChange={onTrendWindowChange}
          />
        )}

        {/* Percentage change overlay toggle */}
        <PercentChangeToggle
          enabled={percentChangeEnabled}
          onToggle={onPercentChangeToggle}
        />

        {/* Data points indicator - aligned with controls */}
        <DataPointsCount count={dataPointCount} />
      </div>
    </div>
  )
}

export function TimeSeriesChart({
  metric,
  title,
  subtitle,
  tooltipLabel,
  defaultPeriod = 'run',
  runTypeFilter = RunType.FARM,
  onRunTypeChange,
  valueFormatter
}: TimeSeriesChartProps) {
  const { runs } = useData()

  // Use provided formatter or locale-aware default (formatLargeNumber reads from locale store)
  // Wrap formatLargeNumber to ignore extra arguments from chart library (like index)
  const formatter = valueFormatter ?? ((value: number) => formatLargeNumber(value))

  // Filter runs based on runTypeFilter prop
  const filteredRuns = useMemo(() => {
    return filterRunsByType(runs, runTypeFilter)
  }, [runs, runTypeFilter])

  // Use custom hook for all chart data preparation
  const {
    chartData,
    availablePeriodConfigs,
    currentConfig,
    selectedPeriod,
    setSelectedPeriod,
    yAxisTicks,
    trendWindow,
    setTrendWindow,
    isAverageEnabled,
    percentChangeEnabled,
    setPercentChangeEnabled,
  } = useTimeSeriesChartData(filteredRuns, metric, defaultPeriod)

  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No {metric} data available. Import some game runs to see the analysis.
      </div>
    )
  }

  // Show run type selector when callback is provided
  const showRunTypeSelector = Boolean(onRunTypeChange)

  return (
    <div className="space-y-4">
      {/* Header with period selector */}
      <div className="space-y-4">
        {title && (
          <TimeSeriesHeader
            title={title}
            subtitle={subtitle}
            currentConfig={currentConfig}
          />
        )}

        <FilterControls
          availablePeriodConfigs={availablePeriodConfigs}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
          showRunTypeSelector={showRunTypeSelector}
          runTypeFilter={runTypeFilter}
          onRunTypeChange={onRunTypeChange}
          dataPointCount={chartData.length}
          trendWindow={trendWindow}
          onTrendWindowChange={setTrendWindow}
          percentChangeEnabled={percentChangeEnabled}
          onPercentChangeToggle={setPercentChangeEnabled}
        />
      </div>

      <TimeSeriesChartBody
        chartData={chartData}
        metric={metric}
        currentConfig={currentConfig}
        yAxisTicks={yAxisTicks}
        formatter={formatter}
        selectedPeriod={selectedPeriod}
        tooltipLabel={tooltipLabel ?? title ?? ''}
        isAverageEnabled={isAverageEnabled}
        percentChangeEnabled={percentChangeEnabled}
      />
    </div>
  )
}
