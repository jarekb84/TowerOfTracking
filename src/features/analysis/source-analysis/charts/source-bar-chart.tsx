/**
 * Source Bar Chart Component
 *
 * Displays a horizontal bar chart showing source breakdown with percentages.
 * Sources are sorted with highest percentage at the TOP.
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
import type { SourceSummaryValue } from '../types'
import { sortByPercentageDescending } from '../calculations/source-extraction'
import { getGradientConfig, type GradientConfig } from '../category-config'
import { formatLargeNumber } from '@/shared/formatting/number-scale'

interface SourceBarChartProps {
  sources: SourceSummaryValue[]
  highlightedSource: string | null
  onSourceHover: (fieldName: string | null) => void
}

interface CustomYAxisTickProps {
  x: number
  y: number
  payload: {
    value: string
  }
  sources: SourceSummaryValue[]
  highlightedSource: string | null
  onSourceHover: (fieldName: string | null) => void
}

function CustomYAxisTick({ x, y, payload, sources, highlightedSource, onSourceHover }: CustomYAxisTickProps) {
  const source = sources.find(s => s.displayName === payload.value)
  const isHighlighted = highlightedSource === null || highlightedSource === source?.fieldName

  return (
    <g
      transform={`translate(${x},${y})`}
      onMouseEnter={() => source && onSourceHover(source.fieldName)}
      style={{ cursor: 'pointer' }}
    >
      {/* Invisible wider hit area for easier hovering on labels */}
      <rect
        x={-100}
        y={-12}
        width={100}
        height={24}
        fill="transparent"
      />
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

/**
 * Custom bar label showing raw value and percentage
 * Extracted as stable component to prevent re-renders on hover state changes
 */
interface BarLabelProps {
  x?: string | number
  y?: string | number
  width?: string | number
  index?: number
  sources: SourceSummaryValue[]
  highlightedSource: string | null
}

function BarLabel({ x, y, width, index, sources, highlightedSource }: BarLabelProps) {
  const source = sources[index as number]
  if (!source) return null

  const xPos = Number(x) + Number(width) + 8
  const yPos = Number(y)

  // Apply same highlight/subdued effect as the bars
  const isHighlighted = highlightedSource === null || highlightedSource === source.fieldName
  const opacity = isHighlighted ? 1 : 0.3

  return (
    <text
      x={xPos}
      y={yPos}
      dy={12}
      fontSize={12}
      style={{ opacity, transition: 'opacity 150ms ease-out' }}
    >
      <tspan fill="#94a3b8">{formatLargeNumber(source.totalValue)}</tspan>
      <tspan dx={6} fill="#e2e8f0" fontWeight={500}>
        {source.percentage.toFixed(1)}%
      </tspan>
    </text>
  )
}

export function SourceBarChart({
  sources,
  highlightedSource,
  onSourceHover,
}: SourceBarChartProps) {
  // Memoize sorted sources to prevent label re-renders on hover state changes
  const sortedSources = useMemo(
    () => sortByPercentageDescending(sources),
    [sources]
  )

  // Memoize gradient configs
  const gradientConfigs = useMemo<GradientConfig[]>(
    () => sortedSources.map(source => getGradientConfig(source.fieldName, source.color)),
    [sortedSources]
  )

  if (sources.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-400">
        No data available.
      </div>
    )
  }

  // Calculate dynamic height based on number of sources
  // Minimum height 300px matches pie chart for visual balance across categories
  const barHeight = 32
  const chartHeight = Math.max(300, sortedSources.length * barHeight + 40)

  // Memoize render functions to prevent Recharts from re-mounting elements
  const renderYAxisTick = useCallback(
    (props: CustomYAxisTickProps) => (
      <CustomYAxisTick
        {...props}
        sources={sortedSources}
        highlightedSource={highlightedSource}
        onSourceHover={onSourceHover}
      />
    ),
    [sortedSources, highlightedSource, onSourceHover]
  )

  const renderBarLabel = useCallback(
    (props: { x?: string | number; y?: string | number; width?: string | number; index?: number }) => (
      <BarLabel {...props} sources={sortedSources} highlightedSource={highlightedSource} />
    ),
    [sortedSources, highlightedSource]
  )

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedSources}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
          onMouseMove={(state) => {
            // Use Recharts' built-in row detection (same as tooltip mechanism)
            if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
              onSourceHover(sortedSources[state.activeTooltipIndex].fieldName)
            }
          }}
          onMouseLeave={() => onSourceHover(null)}
        >
          {/* SVG horizontal gradient definitions for visual depth */}
          <defs>
            {gradientConfigs.map(config => (
              <linearGradient
                key={config.id}
                id={`bar-${config.id}`}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor={config.startColor}
                  stopOpacity={config.startOpacity}
                />
                <stop
                  offset="100%"
                  stopColor={config.endColor}
                  stopOpacity={config.endOpacity + 0.1}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={renderYAxisTick}
            tickLine={false}
            axisLine={{ stroke: '#475569' }}
            width={130}
          />
          <Bar
            dataKey="percentage"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            {sortedSources.map(source => (
              <Cell
                key={source.fieldName}
                fill={`url(#bar-gradient-${source.fieldName})`}
                opacity={
                  highlightedSource === null
                    ? 1
                    : highlightedSource === source.fieldName
                      ? 1
                      : 0.3
                }
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 150ms ease-out',
                }}
              />
            ))}
            <LabelList
              dataKey="percentage"
              position="right"
              content={renderBarLabel}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
