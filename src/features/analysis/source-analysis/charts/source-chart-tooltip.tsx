/**
 * Shared Chart Tooltip Component for Source Analysis
 *
 * Provides consistent tooltip styling across timeline, pie, and bar charts.
 * Shows source name, value, and percentage in that order per PRD requirements.
 */

import { formatLargeNumber, formatPercentage } from '@/shared/formatting/number-scale'

interface SourceTooltipEntry {
  displayName: string
  color: string
  value: number
  percentage: number
  /** Field name for matching with highlighted source */
  fieldName?: string
}

interface SourceChartTooltipProps {
  title?: string
  entries: SourceTooltipEntry[]
  /** Whether to show zero values in the tooltip */
  showZeroValues?: boolean
  /** Optional count of data points (e.g., runs) included in this period */
  dataPointCount?: number
  /** Total value for the period (sum of all sources) */
  periodTotal?: number
  /** Currently highlighted source field name for emphasis */
  highlightedSource?: string | null
}

export function SourceChartTooltip({
  title,
  entries,
  showZeroValues = false,
  dataPointCount,
  periodTotal,
  highlightedSource,
}: SourceChartTooltipProps) {
  const filteredEntries = showZeroValues
    ? entries
    : entries.filter(entry => entry.value > 0 || entry.percentage > 0)

  if (filteredEntries.length === 0) {
    return null
  }

  return (
    <div className="bg-slate-900/95 border border-slate-600/80 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      {(title || dataPointCount !== undefined || periodTotal !== undefined) && (
        <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-slate-700/50">
          {title && <p className="text-slate-200 font-medium">{title}</p>}
          <div className="flex items-center gap-3 text-xs">
            {periodTotal !== undefined && (
              <span className="text-slate-300">
                {formatLargeNumber(periodTotal)} total
              </span>
            )}
            {dataPointCount !== undefined && (
              <span className="text-slate-400">
                {dataPointCount} {dataPointCount === 1 ? 'run' : 'runs'}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        {filteredEntries.map(entry => {
          // Determine if this entry is highlighted (or no highlight active)
          const isHighlighted = highlightedSource === null ||
            highlightedSource === undefined ||
            entry.fieldName === highlightedSource

          return (
            <div
              key={entry.displayName}
              className="flex items-center gap-2 text-sm"
              style={{
                opacity: isHighlighted ? 1 : 0.4,
                transition: 'opacity 150ms ease-out',
              }}
            >
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300 flex-1 min-w-0 truncate">
                {entry.displayName}
              </span>
              <span className="text-slate-400 tabular-nums">
                {formatLargeNumber(entry.value)}
              </span>
              <span className="text-slate-200 font-medium tabular-nums w-14 text-right">
                {formatPercentage(entry.percentage)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
