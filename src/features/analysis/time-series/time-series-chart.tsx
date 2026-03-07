import { useMemo } from 'react'
import { FormControl } from '@/components/ui'
import { useData } from '@/shared/domain/use-data'
import { Duration, type PeriodCountFilter } from '@/shared/domain/filters/types'
import { PeriodCountSelector } from '@/shared/domain/filters/period-count/period-count-selector'
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
  intervalCount: PeriodCountFilter
  onIntervalCountChange: (count: PeriodCountFilter) => void
  intervalCountOptions: number[]
  intervalLabel: string
  showRunTypeSelector: boolean
  runTypeFilter: RunTypeFilter
  onRunTypeChange?: (runType: RunTypeFilter) => void
  dataPointCount: number
  showTrendSelector: boolean
  trendWindow: TrendWindowValue
  onTrendWindowChange: (value: TrendWindowValue) => void
  percentChangeEnabled: boolean
  onPercentChangeToggle: (enabled: boolean) => void
}

function FilterControls({
  availablePeriodConfigs,
  selectedPeriod,
  onSelectPeriod,
  intervalCount,
  onIntervalCountChange,
  intervalCountOptions,
  intervalLabel,
  showRunTypeSelector,
  runTypeFilter,
  onRunTypeChange,
  dataPointCount,
  showTrendSelector,
  trendWindow,
  onTrendWindowChange,
  percentChangeEnabled,
  onPercentChangeToggle,
}: FilterControlsProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      {/* Left side: Duration selector + Interval selector */}
      <div className="flex flex-wrap items-end gap-4">
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

        <PeriodCountSelector
          selectedCount={intervalCount}
          onCountChange={onIntervalCountChange}
          countOptions={intervalCountOptions}
          label={intervalLabel}
          showAllOption={true}
          layout="vertical"
          accentColor="orange"
        />
      </div>

      {/* Right side: Run type selector + SMA selector + % Change toggle + Data points count */}
      <div className="flex flex-wrap items-end gap-4">
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
  defaultPeriod = Duration.PER_RUN,
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
    showTrendSelector,
    percentChangeEnabled,
    setPercentChangeEnabled,
    intervalCount,
    setIntervalCount,
    intervalCountOptions,
    intervalLabel,
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
          intervalCount={intervalCount}
          onIntervalCountChange={setIntervalCount}
          intervalCountOptions={intervalCountOptions}
          intervalLabel={intervalLabel}
          showRunTypeSelector={showRunTypeSelector}
          runTypeFilter={runTypeFilter}
          onRunTypeChange={onRunTypeChange}
          dataPointCount={chartData.length}
          showTrendSelector={showTrendSelector}
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
