/**
 * Renderers for Coverage Summary Chart
 *
 * Extracted components for Y-axis ticks and bar labels
 * to keep the main chart component within line limits.
 */

import type { MetricCoverage } from '../types'
import { formatLargeNumber, formatPercentage } from '@/shared/formatting/number-scale'

export interface CustomYAxisTickProps {
  x: number
  y: number
  payload: {
    value: string
  }
  metrics: MetricCoverage[]
  highlightedMetric: string | null
  onMetricHover: (fieldName: string | null) => void
}

export function CustomYAxisTick({ x, y, payload, metrics, highlightedMetric, onMetricHover }: CustomYAxisTickProps) {
  const metric = metrics.find(m => m.label === payload.value)
  const isHighlighted = highlightedMetric === null || highlightedMetric === metric?.fieldName

  return (
    <g
      transform={`translate(${x},${y})`}
      onMouseEnter={() => metric && onMetricHover(metric.fieldName)}
      style={{ cursor: 'pointer' }}
    >
      {/* Invisible wider hit area for easier hovering */}
      <rect
        x={-125}
        y={-12}
        width={125}
        height={24}
        fill="transparent"
      />
      {metric && (
        <circle
          cx={-110}
          cy={0}
          r={4}
          fill={metric.color}
          style={{
            opacity: isHighlighted ? 1 : 0.4,
            transition: 'opacity 150ms ease-out',
          }}
        />
      )}
      <text
        x={-5}
        y={0}
        dy={4}
        textAnchor="end"
        fill={isHighlighted ? '#e2e8f0' : '#64748b'}
        fontSize={11}
        style={{ transition: 'fill 150ms ease-out' }}
      >
        {payload.value}
      </text>
    </g>
  )
}

interface BarLabelProps {
  x?: string | number
  y?: string | number
  width?: string | number
  index?: number
  metrics: MetricCoverage[]
  highlightedMetric: string | null
}

export function BarLabel({ x, y, width, index, metrics, highlightedMetric }: BarLabelProps) {
  const metric = metrics[index as number]
  if (!metric) return null

  const xPos = Number(x) + Number(width) + 8
  const yPos = Number(y)

  const isHighlighted = highlightedMetric === null || highlightedMetric === metric.fieldName
  const opacity = isHighlighted ? 1 : 0.3

  return (
    <text
      x={xPos}
      y={yPos}
      dy={12}
      fontSize={12}
      style={{ opacity, transition: 'opacity 150ms ease-out' }}
    >
      <tspan fill="#94a3b8">{formatLargeNumber(metric.affectedCount)}</tspan>
      <tspan dx={6} fill="#e2e8f0" fontWeight={500}>
        {formatPercentage(metric.percentage)}
      </tspan>
    </text>
  )
}
