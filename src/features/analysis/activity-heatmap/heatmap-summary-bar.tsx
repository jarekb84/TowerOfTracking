/**
 * Heatmap Summary Bar Component
 *
 * Displays key statistics for the current week's heatmap in a compact
 * horizontal bar with middot separators. Thin presentation shell — formatting
 * is delegated to summary-formatters.ts, co-located at the feature root.
 */

import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { HeatmapSummary } from './types'
import { buildSummaryEntries, buildRunTypeBreakdownEntries } from './summary-formatters'
import type { SummaryEntry, RunTypeBreakdownGroup } from './summary-formatters'

interface HeatmapSummaryBarProps {
  summary: HeatmapSummary
  activeHoursEnabled: boolean
  selectedRunType: RunTypeFilter
}

function SummaryEntryRow({ entries }: { entries: SummaryEntry[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {entries.map((entry, index) => (
        <span key={entry.label} className="flex items-baseline gap-1.5">
          {index > 0 && (
            <span className="text-slate-600" aria-hidden="true">&middot;</span>
          )}
          <span className="text-xs">{entry.label}</span>
          <span className="tabular-nums font-medium text-amber-400">{entry.value}</span>
        </span>
      ))}
    </div>
  )
}

function BreakdownGroup({ group }: { group: RunTypeBreakdownGroup }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: group.color }}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-slate-300">{group.label}</span>
      </span>
      {group.entries.map((entry) => (
        <span key={entry.label} className="flex items-baseline gap-1.5">
          <span className="text-slate-600" aria-hidden="true">&middot;</span>
          <span className="text-xs">{entry.label}</span>
          <span className="tabular-nums font-medium text-amber-400">{entry.value}</span>
        </span>
      ))}
    </div>
  )
}

export function HeatmapSummaryBar({ summary, activeHoursEnabled, selectedRunType }: HeatmapSummaryBarProps) {
  const entries = buildSummaryEntries(summary, activeHoursEnabled)
  const breakdownGroups = selectedRunType === 'all'
    ? buildRunTypeBreakdownEntries(summary)
    : []

  return (
    <div
      className="space-y-2 rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-sm text-slate-400"
      role="status"
      aria-live="polite"
      aria-label="Weekly summary statistics"
    >
      <SummaryEntryRow entries={entries} />

      {breakdownGroups.length > 0 && (
        <div className="space-y-1 border-t border-slate-700/30 pt-2">
          {breakdownGroups.map((group) => (
            <BreakdownGroup key={group.runType} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
