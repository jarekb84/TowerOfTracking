import { useState, useMemo, useEffect } from 'react'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui'
import { useData } from '@/shared/domain/use-data'
import { prepareTimeSeriesData, getAvailableTimePeriods } from './chart-data'
import { TimePeriod } from './chart-types'
import { formatLargeNumber, generateYAxisTicks } from '@/features/analysis/shared/formatting/chart-formatters'
import { getFarmingRuns } from '@/features/analysis/shared/filtering/run-type-filter'
import { TimeSeriesHeader } from './time-series-header'
import { PeriodSelectorButton } from './period-selector-button'
import { DataPointsIndicator } from './data-points-indicator'

interface TimeSeriesChartProps {
  metric: string
  title?: string
  subtitle?: string
  /** Label shown in tooltip. Defaults to title if not provided. */
  tooltipLabel?: string
  defaultPeriod?: TimePeriod
  showFarmingOnly?: boolean
  valueFormatter?: (value: number) => string
}

const chartConfig = {
  value: {
    label: 'Value',
  },
}

export function TimeSeriesChart({
  metric,
  title,
  subtitle,
  tooltipLabel,
  defaultPeriod = 'run',
  showFarmingOnly = false,
  valueFormatter
}: TimeSeriesChartProps) {
  const { runs } = useData()

  // Use provided formatter or locale-aware default (formatLargeNumber reads from locale store)
  // Wrap formatLargeNumber to ignore extra arguments from chart library (like index)
  const formatter = valueFormatter ?? ((value: number) => formatLargeNumber(value))

  // Filter runs based on showFarmingOnly prop
  const filteredRuns = useMemo(() => {
    return showFarmingOnly ? getFarmingRuns(runs) : runs
  }, [runs, showFarmingOnly])
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(defaultPeriod)

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

  const chartData = useMemo(() => {
    return prepareTimeSeriesData(filteredRuns, selectedPeriod, metric)
  }, [filteredRuns, selectedPeriod, metric])

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

  return (
    <div className="space-y-4">
      {/* Header with period selector */}
      <div className="space-y-4">
        {title && (
          <TimeSeriesHeader
            title={title}
            subtitle={subtitle}
            currentConfig={currentConfig}
            dataPointCount={chartData.length}
            showFarmingOnly={showFarmingOnly}
          />
        )}

        {/* Period selector with data point count when no title */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {availablePeriodConfigs.map((config) => (
              <PeriodSelectorButton
                key={config.period}
                config={config}
                isSelected={selectedPeriod === config.period}
                onSelect={setSelectedPeriod}
              />
            ))}
          </div>
          {!title && (
            <DataPointsIndicator
              dataPointCount={chartData.length}
              showFarmingOnly={showFarmingOnly}
            />
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="transition-all duration-300 ease-in-out">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <AreaChart
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

          <ChartTooltip
            content={<ChartTooltipContent
              formatter={(value) => {
                const formattedValue = formatter(Number(value))
                const suffix = selectedPeriod === 'hourly' ? '/hour' : ''
                return [`${formattedValue}${suffix} `, tooltipLabel ?? title]
              }}
              labelFormatter={(label) => `${currentConfig.label}: ${label}`}
              className="bg-slate-800/95 border-slate-600 backdrop-blur-sm shadow-lg shadow-black/20"
              style={{
                borderColor: `color-mix(in srgb, ${currentConfig.color} 40%, transparent)`
              }}
            />}
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
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}
