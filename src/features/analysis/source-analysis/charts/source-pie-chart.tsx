/**
 * Source Pie Chart Component
 *
 * Displays a pie chart showing overall source breakdown across all periods.
 * Slices are ordered by size (largest first, clockwise).
 */

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { SourceSummaryValue } from '../types'
import { sortByPercentageDescending } from '../calculations/source-extraction'
import { getGradientConfig } from '../category-config'
import { formatLargeNumber } from '@/shared/formatting/number-scale'

interface SourcePieChartProps {
  sources: SourceSummaryValue[]
  highlightedSource: string | null
  onSourceHover: (fieldName: string | null) => void
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: SourceSummaryValue
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  const source = payload[0].payload

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-lg">
      <div className="text-sm text-slate-200 font-medium mb-1">
        {source.displayName}
      </div>
      <div className="text-sm">
        <span className="text-slate-400">{formatLargeNumber(source.totalValue)}</span>
        <span className="text-slate-200 font-semibold ml-2">{source.percentage.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export function SourcePieChart({
  sources,
  highlightedSource,
  onSourceHover,
}: SourcePieChartProps) {
  if (sources.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-400">
        No data available.
      </div>
    )
  }

  // Sort sources by percentage descending for display
  const sortedSources = sortByPercentageDescending(sources)

  // Generate gradient configs for all sources
  const gradientConfigs = sortedSources.map(source =>
    getGradientConfig(source.fieldName, source.color)
  )

  return (
    <div className="w-[300px] h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart onMouseLeave={() => onSourceHover(null)}>
          {/* Linear gradient definitions - top-left to bottom-right for consistent lighting */}
          <defs>
            {gradientConfigs.map(config => (
              <linearGradient
                key={config.id}
                id={`pie-${config.id}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={config.startColor}
                  stopOpacity={config.startOpacity}
                />
                <stop
                  offset="100%"
                  stopColor={config.endColor}
                  stopOpacity={config.endOpacity}
                />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={sortedSources}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={140}
            paddingAngle={1}
            dataKey="percentage"
            nameKey="displayName"
            minAngle={2}
          >
            {sortedSources.map(source => (
              <Cell
                key={source.fieldName}
                fill={`url(#pie-gradient-${source.fieldName})`}
                stroke={highlightedSource === source.fieldName ? '#fff' : source.color}
                strokeWidth={highlightedSource === source.fieldName ? 2 : 1}
                opacity={
                  highlightedSource === null
                    ? 1
                    : highlightedSource === source.fieldName
                      ? 1
                      : 0.3
                }
                onMouseEnter={() => onSourceHover(source.fieldName)}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 150ms ease-out',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
