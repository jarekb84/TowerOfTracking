/**
 * Shared Chart Tooltip Component for Coverage Report
 *
 * Provides consistent tooltip styling across timeline and summary charts.
 * Shows metric name, affected count, and coverage percentage.
 * For per-run periods, displays enhanced run context (tier, wave, duration, date/time).
 */

import { formatLargeNumber, formatPercentage } from '@/shared/formatting/number-scale'
import { RunInfoHeader } from '@/features/analysis/shared/tooltips/run-info-header'
import type { CoverageRunInfo } from '../types'

interface CoverageTooltipEntry {
  label: string
  color: string
  affectedCount: number
  percentage: number
  fieldName: string
}

interface CoverageChartTooltipProps {
  title?: string
  entries: CoverageTooltipEntry[]
  /** Whether to show zero coverage metrics in the tooltip */
  showZeroValues?: boolean
  /** Total enemies in this period */
  totalEnemies?: number
  /** Number of runs in this period */
  runCount?: number
  /** Currently highlighted metric field name for emphasis */
  highlightedMetric?: string | null
  /** Optional run info for per-run periods */
  runInfo?: CoverageRunInfo
}

interface TooltipHeaderProps {
  title?: string
  totalEnemies?: number
  runCount?: number
  runInfo?: CoverageRunInfo
}

/**
 * Renders the per-run header with run context information
 */
function PerRunHeader({ runInfo, totalEnemies }: { runInfo: CoverageRunInfo; totalEnemies?: number }) {
  return (
    <div className="mb-2.5 pb-2.5 border-b border-slate-700/50">
      <RunInfoHeader runInfo={runInfo} />
      {totalEnemies !== undefined && (
        <div className="text-xs text-slate-300 mt-2 pt-2 border-t border-slate-700/30">
          {formatLargeNumber(totalEnemies)} enemies
        </div>
      )}
    </div>
  )
}

/**
 * Renders the standard aggregated period header
 */
function AggregatedHeader({ title, totalEnemies, runCount }: Omit<TooltipHeaderProps, 'runInfo'>) {
  return (
    <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-slate-700/50">
      {title && <p className="text-slate-200 font-medium">{title}</p>}
      <div className="flex items-center gap-3 text-xs">
        {totalEnemies !== undefined && (
          <span className="text-slate-300">
            {formatLargeNumber(totalEnemies)} enemies
          </span>
        )}
        {runCount !== undefined && (
          <span className="text-slate-400">
            {runCount} {runCount === 1 ? 'run' : 'runs'}
          </span>
        )}
      </div>
    </div>
  )
}

function TooltipHeader({ title, totalEnemies, runCount, runInfo }: TooltipHeaderProps) {
  if (runInfo) {
    return <PerRunHeader runInfo={runInfo} totalEnemies={totalEnemies} />
  }

  const hasAggregatedHeader = title || runCount !== undefined || totalEnemies !== undefined
  if (!hasAggregatedHeader) return null

  return <AggregatedHeader title={title} totalEnemies={totalEnemies} runCount={runCount} />
}

interface TooltipEntryRowProps {
  entry: CoverageTooltipEntry
  isHighlighted: boolean
}

function TooltipEntryRow({ entry, isHighlighted }: TooltipEntryRowProps) {
  return (
    <div
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
        {entry.label}
      </span>
      <span className="text-slate-400 tabular-nums">
        {formatLargeNumber(entry.affectedCount)}
      </span>
      <span className="text-slate-200 font-medium tabular-nums w-14 text-right">
        {formatPercentage(entry.percentage)}
      </span>
    </div>
  )
}

function isEntryHighlighted(
  entry: CoverageTooltipEntry,
  highlightedMetric: string | null | undefined
): boolean {
  return highlightedMetric === null ||
    highlightedMetric === undefined ||
    entry.fieldName === highlightedMetric
}

export function CoverageChartTooltip({
  title,
  entries,
  showZeroValues = false,
  totalEnemies,
  runCount,
  highlightedMetric,
  runInfo,
}: CoverageChartTooltipProps) {
  const filteredEntries = showZeroValues
    ? entries
    : entries.filter(entry => entry.percentage > 0)

  if (filteredEntries.length === 0) {
    return null
  }

  return (
    <div className="bg-slate-900/95 border border-slate-600/80 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <TooltipHeader
        title={title}
        totalEnemies={totalEnemies}
        runCount={runCount}
        runInfo={runInfo}
      />
      <div className="space-y-1.5">
        {filteredEntries.map(entry => (
          <TooltipEntryRow
            key={entry.fieldName}
            entry={entry}
            isHighlighted={isEntryHighlighted(entry, highlightedMetric)}
          />
        ))}
      </div>
    </div>
  )
}
