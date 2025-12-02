/**
 * Coverage Summary Chart Component
 *
 * Displays a horizontal bar chart showing overall coverage percentages per metric.
 * Metrics are sorted by coverage percentage (highest at top).
 */

import { useMemo, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import type { MetricCoverage } from '../types'
import { sortMetricsByPercentage } from '../calculations/coverage-calculations'
import { getGradientConfig, type GradientConfig } from '../coverage-config'
import {
  CustomYAxisTick,
  BarLabel,
  type CustomYAxisTickProps,
} from './summary-chart-renderers'

interface CoverageSummaryChartProps {
  metrics: MetricCoverage[]
  highlightedMetric: string | null
  onMetricHover: (fieldName: string | null) => void
  yAxisMax?: number
}

export function CoverageSummaryChart({
  metrics,
  highlightedMetric,
  onMetricHover,
  yAxisMax = 100,
}: CoverageSummaryChartProps) {
  const sortedMetrics = useMemo(
    () => sortMetricsByPercentage(metrics),
    [metrics]
  )

  const gradientConfigs = useMemo<GradientConfig[]>(
    () => sortedMetrics.map(metric => getGradientConfig(metric.fieldName, metric.color)),
    [sortedMetrics]
  )

  const barHeight = 32
  const chartHeight = Math.max(300, sortedMetrics.length * barHeight + 40)

  const renderYAxisTick = useCallback(
    (props: CustomYAxisTickProps) => (
      <CustomYAxisTick
        {...props}
        metrics={sortedMetrics}
        highlightedMetric={highlightedMetric}
        onMetricHover={onMetricHover}
      />
    ),
    [sortedMetrics, highlightedMetric, onMetricHover]
  )

  const renderBarLabel = useCallback(
    (props: { x?: string | number; y?: string | number; width?: string | number; index?: number }) => (
      <BarLabel {...props} metrics={sortedMetrics} highlightedMetric={highlightedMetric} />
    ),
    [sortedMetrics, highlightedMetric]
  )

  if (metrics.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-400">
        No data available.
      </div>
    )
  }

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedMetrics}
          layout="vertical"
          margin={{ top: 5, right: 80, left: 5, bottom: 5 }}
          onMouseMove={(state) => {
            if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
              onMetricHover(sortedMetrics[state.activeTooltipIndex].fieldName)
            }
          }}
          onMouseLeave={() => onMetricHover(null)}
        >
          <defs>
            {gradientConfigs.map(config => (
              <linearGradient key={config.id} id={`bar-${config.id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={config.color} stopOpacity={config.startOpacity} />
                <stop offset="100%" stopColor={config.color} stopOpacity={config.endOpacity + 0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, yAxisMax]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={renderYAxisTick}
            tickLine={false}
            axisLine={{ stroke: '#475569' }}
            width={125}
          />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {sortedMetrics.map(metric => (
              <Cell
                key={metric.fieldName}
                fill={`url(#bar-gradient-${metric.fieldName})`}
                opacity={highlightedMetric === null ? 0.9 : highlightedMetric === metric.fieldName ? 0.9 : 0.3}
                style={{ cursor: 'pointer', transition: 'opacity 150ms ease-out' }}
              />
            ))}
            <LabelList dataKey="percentage" position="right" content={renderBarLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
