/**
 * Activity Heatmap Type Definitions
 *
 * Type definitions for the Activity Heatmap analysis feature.
 * The heatmap displays a 24x7 grid (7 days Sun-Sat x 24 hours)
 * showing when game runs occurred during a given week.
 */

import type { RunTypeValue } from '@/shared/domain/run-types/types'

/** A single time segment within an hour cell */
export interface HeatmapSegment {
  startFraction: number // 0-1, position within the hour
  endFraction: number // 0-1, position within the hour
  runType: RunTypeValue
  tier: number
  runId: string
}

/** Data for a single cell in the 24x7 grid */
export interface HeatmapCell {
  hour: number // 0-23
  dayIndex: number // 0=Sun, 1=Mon, ... 6=Sat
  date: Date // actual calendar date for this cell
  segments: HeatmapSegment[]
  totalCoverage: number // 0-1, sum of segment coverage
}

/** The complete 24x7 grid for one week */
export interface HeatmapGrid {
  weekStart: Date // Sunday 00:00:00
  weekEnd: Date // Saturday 23:59:59.999
  days: HeatmapCell[][] // days[dayIndex][hourIndex] - 7 arrays of 24 cells
  weekLabel: string
}

/** Week navigation info */
export interface WeekInfo {
  weekStart: Date
  weekLabel: string
}

/** Active hours user configuration (persisted to localStorage) */
export interface ActiveHoursConfig {
  startHour: number // 0-23
  endHour: number // 0-23 (exclusive)
  enabled: boolean
}

/** Per-run-type statistics for breakdown display */
export interface RunTypeStats {
  coverage: number // absolute coverage fraction of 168-cell week (0-1)
  activeSeconds: number // total play time seconds for this type
  runCount: number // number of unique runs of this type
}

/** Summary statistics for one week */
export interface HeatmapSummary {
  overallCoverage: number // 0-1
  dailyCoverage: number[] // 7 values (Sun-Sat), each 0-1
  activeHoursCoverage: number // 0-1
  runTypeBreakdown: Record<string, number> // fraction per run type
  runTypeStats: Record<string, RunTypeStats> // per-type coverage, time, runs
  totalActiveSeconds: number
  totalIdleSeconds: number
  runCount: number
}

export const DEFAULT_ACTIVE_HOURS: ActiveHoursConfig = {
  startHour: 8,
  endHour: 23,
  enabled: false,
}
