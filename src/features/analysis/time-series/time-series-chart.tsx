import { useState, useMemo, useEffect } from 'react'
import { Area, ComposedChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartContainer, FormControl } from '@/components/ui'
import { useData } from '@/shared/domain/use-data'
import { prepareTimeSeriesData, getAvailableTimePeriods } from './chart-data'
import type { TimePeriod, TimePeriodConfig } from './chart-types'
import { formatLargeNumber, generateYAxisTicks } from '@/features/analysis/shared/formatting/chart-formatters'
import { filterRunsByType, type RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import { RunType } from '@/shared/domain/run-types/types'
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector'
import { TimeSeriesHeader } from './time-series-header'
import { PeriodSelectorButton } from './period-selector-button'
import { DataPointsCount } from './data-points-count'
import { TimeSeriesChartTooltip } from './time-series-tooltip'
import { MovingAverageSelector } from './moving-average/moving-average-selector'
import { calculateMovingAverage } from './moving-average/moving-average-calculation'
import type { MovingAveragePeriod } from './moving-average/moving-average-types'
import { useMovingAverage } from './moving-average/use-moving-average'

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

const chartConfig = {
  value: {
    label: 'Value',
  },
}

interface FilterControlsProps {
  availablePeriodConfigs: TimePeriodConfig[]
  selectedPeriod: TimePeriod
  onSelectPeriod: (period: TimePeriod) => void
  showRunTypeSelector: boolean
  runTypeFilter: RunTypeFilter
  onRunTypeChange?: (runType: RunTypeFilter) => void
  dataPointCount: number
  averagePeriod: MovingAveragePeriod
  onAveragePeriodChange: (period: MovingAveragePeriod) => void
}

function FilterControls({
  availablePeriodConfigs,
  selectedPeriod,
  onSelectPeriod,
  showRunTypeSelector,
  runTypeFilter,
  onRunTypeChange,
  dataPointCount,
  averagePeriod,
  onAveragePeriodChange,
}: FilterControlsProps) {
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

      {/* Right side: Run type selector + SMA selector + Data points count */}
      <div className="flex items-end gap-4">
        {showRunTypeSelector && onRunTypeChange && (
          <RunTypeSelector
            selectedType={runTypeFilter}
            onTypeChange={onRunTypeChange}
            layout="vertical"
          />
        )}

        {/* Moving average trend line selector */}
        <MovingAverageSelector value={averagePeriod} onChange={onAveragePeriodChange} />

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
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(defaultPeriod)

  // Moving average state with localStorage persistence
  const { averagePeriod, setAveragePeriod, isAverageEnabled } = useMovingAverage(metric)

  // Get available periods based on data span
  const availablePeriodConfigs = useMemo(() => {
    return getAvailableTimePeriods(filteredRuns)
  }, [filteredRuns])

  // Reset period if current selection is not available
  useEffect(() => {
    const isCurrentPeriodAvailable = availablePeriodConfigs.some(config => config.period === selectedPeriod)
    if (!isCurrentPeriodAvailable && availablePeriodConfigs.length > 0) {
      setSelectedPeriod(availablePeriodConfigs[0].period)
    }
  }, [availablePeriodConfigs, selectedPeriod])

  const currentConfig = availablePeriodConfigs.find(config => config.period === selectedPeriod) || availablePeriodConfigs[0]

  const baseChartData = useMemo(() => {
    return prepareTimeSeriesData(filteredRuns, selectedPeriod, metric)
  }, [filteredRuns, selectedPeriod, metric])

  // Apply moving average calculation if a period is selected
  const chartData = useMemo(() => {
    if (!isAverageEnabled) {
      return baseChartData
    }
    // Type narrowing: isAverageEnabled guarantees averagePeriod is a number (3, 5, or 10)
    return calculateMovingAverage(baseChartData, averagePeriod as number)
  }, [baseChartData, averagePeriod, isAverageEnabled])

  const yAxisTicks = useMemo(() => {
    if (chartData.length === 0) return []
    const maxValue = Math.max(...chartData.map(d => d.value))
    return generateYAxisTicks(maxValue)
  }, [chartData])

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
          averagePeriod={averagePeriod}
          onAveragePeriodChange={setAveragePeriod}
        />
      </div>

      {/* Chart */}
      <div className="transition-all duration-300 ease-in-out">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
          <defs>
            <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0.05}/>
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickMargin={8}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickFormatter={formatter}
            ticks={yAxisTicks}
            domain={[0, 'dataMax']}
            tickMargin={8}
          />

          <Tooltip
            content={
              <TimeSeriesChartTooltip
                periodLabel={currentConfig.label}
                metricLabel={tooltipLabel ?? title ?? ''}
                formatter={formatter}
                isHourlyPeriod={selectedPeriod === 'hourly'}
                accentColor={currentConfig.color}
                showTrendLine={isAverageEnabled}
              />
            }
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={currentConfig.color}
            fill={`url(#gradient-${metric})`}
            strokeWidth={2}
            dot={{ fill: currentConfig.color, strokeWidth: 0, r: 4 }}
            activeDot={{
              r: 6,
              stroke: currentConfig.color,
              strokeWidth: 2,
              fill: '#1e293b',
              filter: `drop-shadow(0 0 6px ${currentConfig.color}50)`
            }}
          />

          {/* Moving average trend line - only rendered when enabled */}
          {isAverageEnabled && (
            <Line
              type="monotone"
              dataKey="movingAverage"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeOpacity={0.7}
              dot={false}
              activeDot={{
                r: 4,
                stroke: '#f97316',
                strokeWidth: 2,
                fill: '#1e293b',
              }}
              connectNulls={false}
            />
          )}
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  )
}
