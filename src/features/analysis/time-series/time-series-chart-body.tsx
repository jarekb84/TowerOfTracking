import { Area, ComposedChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/ui'
import type { ChartDataPoint, TimePeriodConfig } from './chart-types'
import { TimeSeriesChartTooltip } from './time-series-tooltip'

const chartConfig = { value: { label: 'Value' } }
const AXIS_STYLE = { fontSize: 12, fill: '#94a3b8' }
/** Cyan axis style at reduced opacity for subtlety - matches overlay line opacity */
const PERCENT_AXIS_STYLE = { fontSize: 12, fill: 'rgba(34, 211, 238, 0.7)' }
const MOVING_AVG_DOT = { r: 4, stroke: '#f97316', strokeWidth: 2, fill: '#1e293b' }
const PERCENT_DOT = { r: 4, stroke: '#22d3ee', strokeWidth: 2, fill: '#1e293b' }
const formatPercent = (value: number) => `${value.toFixed(0)}%`

interface TimeSeriesChartBodyProps {
  chartData: ChartDataPoint[]
  metric: string
  currentConfig: TimePeriodConfig
  yAxisTicks: number[]
  formatter: (value: number) => string
  selectedPeriod: string
  tooltipLabel: string
  isAverageEnabled: boolean
  percentChangeEnabled: boolean
}

/** Renders the Recharts chart with all overlays. Extracted to reduce parent complexity. */
export function TimeSeriesChartBody({
  chartData, metric, currentConfig, yAxisTicks, formatter,
  selectedPeriod, tooltipLabel, isAverageEnabled, percentChangeEnabled,
}: TimeSeriesChartBodyProps) {
  const { color } = currentConfig
  const activeDot = {
    r: 6, stroke: color, strokeWidth: 2, fill: '#1e293b',
    filter: `drop-shadow(0 0 6px ${color}50)`,
  }

  return (
    <div className="transition-all duration-300 ease-in-out">
      <ChartContainer config={chartConfig} className="h-[400px] w-full">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: percentChangeEnabled ? 60 : 20, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={AXIS_STYLE} tickMargin={8} />
          <YAxis
            yAxisId="primary" axisLine={false} tickLine={false} tick={AXIS_STYLE}
            tickFormatter={formatter} ticks={yAxisTicks} domain={[0, 'dataMax']} tickMargin={8}
          />

          {percentChangeEnabled && (
            <YAxis
              yAxisId="percent" orientation="right" axisLine={false} tickLine={false}
              tick={PERCENT_AXIS_STYLE} tickFormatter={formatPercent}
              domain={['auto', 'auto']} tickMargin={8}
            />
          )}

          <Tooltip
            content={
              <TimeSeriesChartTooltip
                periodLabel={currentConfig.label} metricLabel={tooltipLabel}
                formatter={formatter} isHourlyPeriod={selectedPeriod === 'hourly'}
                accentColor={color} showTrendLine={isAverageEnabled}
                showPercentChange={percentChangeEnabled}
              />
            }
          />

          <Area
            type="monotone" dataKey="value" yAxisId="primary" stroke={color}
            fill={`url(#gradient-${metric})`} strokeWidth={2}
            dot={{ fill: color, strokeWidth: 0, r: 4 }} activeDot={activeDot}
          />

          {isAverageEnabled && (
            <Line
              type="monotone" dataKey="movingAverage" yAxisId="primary" stroke="#f97316"
              strokeWidth={2} strokeDasharray="6 4" strokeOpacity={0.7}
              dot={false} activeDot={MOVING_AVG_DOT} connectNulls={false}
            />
          )}

          {percentChangeEnabled && (
            <Line
              type="monotone" dataKey="percentChange" yAxisId="percent" stroke="#22d3ee"
              strokeWidth={2} strokeDasharray="4 2" strokeOpacity={0.7}
              dot={false} activeDot={PERCENT_DOT} connectNulls={true}
            />
          )}
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}
