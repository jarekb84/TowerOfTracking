/**
 * Coverage Timeline Chart Component
 *
 * Displays a GROUPED vertical bar chart showing coverage percentages over time.
 * Uses grouped bars (NOT stacked) because coverage metrics are independent.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { PeriodCoverageData, MetricCoverage } from '../types'
import { CoverageChartTooltip } from './coverage-chart-tooltip'
import { getGradientConfig, type GradientConfig } from '../coverage-config'
import { transformToChartData, buildTooltipEntries, getBarOpacity, type ChartDataPoint } from './chart-data-transforms'

interface CoverageTimelineChartProps {
  periods: PeriodCoverageData[]
  highlightedMetric: string | null
  onMetricHover: (fieldName: string | null) => void
  yAxisMax?: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: number
    color: string
    payload: ChartDataPoint
  }>
  label?: string
  periods: PeriodCoverageData[]
  highlightedMetric: string | null
}

function CustomTooltip({ active, payload, label, periods, highlightedMetric }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const period = periods.find(p => p.periodLabel === label)
  if (!period) return null

  return (
    <CoverageChartTooltip
      title={label}
      entries={buildTooltipEntries(period.metrics)}
      totalEnemies={period.totalEnemies}
      runCount={period.runCount}
      highlightedMetric={highlightedMetric}
    />
  )
}

/**
 * Custom legend that supports hover interactions
 */
interface LegendPayload {
  value: string
  id: string
  type: 'rect'
  color: string
  dataKey: string
}

interface CustomLegendProps {
  payload?: LegendPayload[]
  metrics: MetricCoverage[]
  highlightedMetric: string | null
  onMetricHover: (fieldName: string | null) => void
}

function CustomLegend({ payload, metrics, highlightedMetric, onMetricHover }: CustomLegendProps) {
  if (!payload) return null

  return (
    <div className="flex flex-wrap justify-center gap-2 mt-2">
      {payload.map((entry) => {
        const metric = metrics.find(m => m.fieldName === entry.dataKey)
        if (!metric) return null

        const isHighlighted = highlightedMetric === null || highlightedMetric === entry.dataKey

        return (
          <div
            key={entry.dataKey}
            className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded transition-all duration-150 hover:bg-slate-700/40"
            style={{
              opacity: isHighlighted ? 1 : 0.4,
            }}
            onMouseEnter={() => onMetricHover(entry.dataKey)}
            onMouseLeave={() => onMetricHover(null)}
          >
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-300">{metric.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function CoverageTimelineChart({
  periods,
  highlightedMetric,
  onMetricHover,
  yAxisMax = 100,
}: CoverageTimelineChartProps) {
  if (periods.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-slate-400">
        No data available for the selected filters.
      </div>
    )
  }

  const chartData = transformToChartData(periods)

  // Get metrics from the first period (all periods have the same metrics)
  const metrics = periods[0].metrics

  // Generate gradient configs for all metrics
  const gradientConfigs: GradientConfig[] = metrics.map(metric =>
    getGradientConfig(metric.fieldName, metric.color)
  )

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          onMouseLeave={() => onMetricHover(null)}
        >
          {/* SVG gradient definitions */}
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
                  stopColor={config.color}
                  stopOpacity={config.startOpacity}
                />
                <stop
                  offset="95%"
                  stopColor={config.color}
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
            domain={[0, yAxisMax]}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            content={<CustomTooltip periods={periods} highlightedMetric={highlightedMetric} />}
            cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }}
          />
          <Legend content={<CustomLegend metrics={metrics} highlightedMetric={highlightedMetric} onMetricHover={onMetricHover} />} />

          {/* D1: Grouped bars - NO stackId prop */}
          {metrics.map(metric => (
            <Bar
              key={metric.fieldName}
              dataKey={metric.fieldName}
              name={metric.label}
              fill={`url(#${gradientConfigs.find(g => g.id === `gradient-${metric.fieldName}`)?.id})`}
              stroke={metric.color}
              strokeWidth={1}
              radius={[2, 2, 0, 0]}
              fillOpacity={getBarOpacity(highlightedMetric, metric.fieldName, 'fill')}
              strokeOpacity={getBarOpacity(highlightedMetric, metric.fieldName, 'stroke')}
              onMouseEnter={() => onMetricHover(metric.fieldName)}
              style={{ transition: 'fill-opacity 150ms ease-out, stroke-opacity 150ms ease-out' }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
