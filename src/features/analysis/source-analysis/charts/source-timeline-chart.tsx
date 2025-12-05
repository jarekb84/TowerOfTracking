/**
 * Source Timeline Chart Component
 *
 * Displays a stacked area chart showing how source proportions evolve over time.
 * Sources are sorted by total proportion with highest percentage at the BOTTOM of the stack.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { PeriodSourceBreakdown, SourceSummaryValue } from '../types'
import { SourceChartTooltip } from './source-chart-tooltip'
import { getGradientConfig, type GradientConfig } from '../category-config'
import { sortSourcesByValue } from '../calculations/source-extraction'

interface SourceTimelineChartProps {
  periods: PeriodSourceBreakdown[]
  sortedSources: SourceSummaryValue[]
  highlightedSource: string | null
  onSourceHover: (fieldName: string | null) => void
}

interface ChartDataPoint {
  periodLabel: string
  [fieldName: string]: number | string
}

/**
 * Transform periods data into stacked area chart format
 */
function transformToChartData(periods: PeriodSourceBreakdown[]): ChartDataPoint[] {
  return periods.map(period => {
    const point: ChartDataPoint = { periodLabel: period.periodLabel }
    for (const source of period.sources) {
      point[source.fieldName] = source.percentage
    }
    return point
  })
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: number
    color: string
    payload: ChartDataPoint & { [key: string]: { value: number; displayName: string } }
  }>
  label?: string
  periods: PeriodSourceBreakdown[]
  highlightedSource: string | null
}

function CustomTooltip({ active, payload, label, periods, highlightedSource }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const period = periods.find(p => p.periodLabel === label)
  if (!period) return null

  // Use period.sources directly instead of Recharts payload
  // This ensures ALL sources with data are shown, not just those in payload
  // Sort by actual value (not percentage) for stable ordering
  const sourcesWithData = sortSourcesByValue(period.sources).filter(source => source.value > 0)

  const entries = sourcesWithData.map(source => ({
    displayName: source.displayName,
    color: source.color,
    value: source.value,
    percentage: source.percentage,
    fieldName: source.fieldName,
  }))

  return (
    <SourceChartTooltip
      title={label}
      entries={entries}
      dataPointCount={period.runCount}
      periodTotal={period.total}
      highlightedSource={highlightedSource}
      runInfo={period.runInfo}
    />
  )
}

export function SourceTimelineChart({
  periods,
  sortedSources,
  highlightedSource,
  onSourceHover,
}: SourceTimelineChartProps) {
  const chartData = transformToChartData(periods)
  // sortedSources is already sorted by percentage descending (highest first).
  // In Recharts stacked areas, items rendered first appear at the bottom,
  // so highest percentage sources will appear at the bottom (most visible/prominent).

  if (periods.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-slate-400">
        No data available for the selected filters.
      </div>
    )
  }

  // Generate gradient configs for all sources
  const gradientConfigs: GradientConfig[] = sortedSources.map(source =>
    getGradientConfig(source.fieldName, source.color)
  )

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          onMouseLeave={() => onSourceHover(null)}
        >
          {/* SVG gradient definitions for visual depth */}
          <defs>
            {gradientConfigs.map(config => (
              <linearGradient
                key={config.id}
                id={config.id}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={config.startColor}
                  stopOpacity={config.startOpacity}
                />
                <stop
                  offset="95%"
                  stopColor={config.endColor}
                  stopOpacity={config.endOpacity}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="periodLabel"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
          />
          <YAxis
            domain={[0, 100]}
            allowDataOverflow={true}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip periods={periods} highlightedSource={highlightedSource} />} />
          {sortedSources.map(source => (
            <Area
              key={source.fieldName}
              type="monotone"
              dataKey={source.fieldName}
              stackId="sources"
              stroke={source.color}
              fill={`url(#gradient-${source.fieldName})`}
              fillOpacity={
                highlightedSource === null
                  ? 1
                  : highlightedSource === source.fieldName
                    ? 1
                    : 0.2
              }
              strokeOpacity={0.8}
              strokeWidth={highlightedSource === source.fieldName ? 2 : 1}
              onMouseEnter={() => onSourceHover(source.fieldName)}
              style={{ transition: 'fill-opacity 150ms ease-out, stroke-opacity 150ms ease-out' }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
