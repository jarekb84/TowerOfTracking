/**
 * Summary Formatters
 *
 * Pure functions for formatting heatmap summary statistics for display.
 */

import { formatDurationHoursMinutes } from '@/shared/formatting/run-display-formatters'
import { formatPercentage } from '@/shared/formatting/number-scale'
import { getRunTypeDisplayLabel } from '@/features/analysis/shared/filtering/run-type-filter'
import { getRunTypeColor } from '@/shared/domain/run-types/run-type-display'
import type { RunTypeValue } from '@/shared/domain/run-types/types'
import type { HeatmapSegment, HeatmapSummary } from './types'

/**
 * Format a coverage fraction (0-1) as a locale-aware percentage string.
 * Delegates to the shared formatPercentage utility for locale-aware number formatting.
 *
 * @example
 *   formatCoveragePercent(0.5)  // "50%" (en-US) or "50%" (de-DE)
 *   formatCoveragePercent(0.003) // "0%" (rounded to 0 decimals)
 */
export function formatCoveragePercent(coverage: number): string {
  return formatPercentage(coverage * 100, 0)
}

/** Format total seconds as a human-readable duration */
export function formatTotalDuration(seconds: number): string {
  return formatDurationHoursMinutes(seconds)
}

/** Build an array of summary stat entries for rendering */
export function buildSummaryEntries(summary: HeatmapSummary, activeHoursEnabled: boolean): SummaryEntry[] {
  const entries: SummaryEntry[] = [
    {
      label: 'Overall Coverage',
      value: formatCoveragePercent(summary.overallCoverage),
    },
    {
      label: 'Total Play Time',
      value: formatTotalDuration(summary.totalActiveSeconds),
    },
    {
      label: 'Idle Time',
      value: formatTotalDuration(summary.totalIdleSeconds),
    },
    {
      label: 'Runs This Week',
      value: String(summary.runCount),
    },
  ]

  if (activeHoursEnabled) {
    entries.push({
      label: 'Active Hours Coverage',
      value: formatCoveragePercent(summary.activeHoursCoverage),
    })
  }

  return entries
}

export interface SummaryEntry {
  label: string
  value: string
}

export interface RunTypeBreakdownGroup {
  runType: string
  label: string
  color: string
  entries: SummaryEntry[]
}

/**
 * Build per-run-type breakdown groups for display below the overall summary.
 * Each group contains coverage, play time, and run count for one run type.
 * Only returns groups when there are 2+ run types present.
 *
 * @param summary - The heatmap summary with per-type stats
 * @returns Array of breakdown groups sorted by run type label, or empty if single type
 */
export function buildRunTypeBreakdownEntries(summary: HeatmapSummary): RunTypeBreakdownGroup[] {
  const runTypes = Object.keys(summary.runTypeStats)
  if (runTypes.length < 2) return []

  return runTypes
    .map((runType) => {
      const stats = summary.runTypeStats[runType]
      return {
        runType,
        label: getRunTypeDisplayLabel(runType as RunTypeValue),
        color: getRunTypeColor(runType as RunTypeValue),
        entries: [
          { label: 'Coverage', value: formatCoveragePercent(stats.coverage) },
          { label: 'Play Time', value: formatTotalDuration(stats.activeSeconds) },
          { label: 'Runs', value: String(stats.runCount) },
        ],
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Returns a copy of segments sorted by startFraction ascending.
 * Used by the tooltip to display segments in chronological order.
 *
 * @param segments - Array of heatmap segments to sort
 * @returns New array sorted by startFraction (ascending)
 */
export function sortSegmentsByTime(segments: HeatmapSegment[]): HeatmapSegment[] {
  return [...segments].sort((a, b) => a.startFraction - b.startFraction)
}

/**
 * Format a fraction (0-1) within an hour to a minute display.
 * Used by the cell tooltip to show segment time ranges.
 *
 * @example
 *   formatMinuteDisplay(0)    // ":00"
 *   formatMinuteDisplay(0.5)  // ":30"
 *   formatMinuteDisplay(0.75) // ":45"
 */
export function formatMinuteDisplay(fraction: number): string {
  const minutes = Math.min(Math.round(fraction * 60), 59)
  return `:${String(minutes).padStart(2, '0')}`
}
