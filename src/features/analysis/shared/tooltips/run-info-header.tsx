/**
 * Shared Run Info Header Component for Chart Tooltips
 *
 * Displays run context (tier, wave, duration, date/time) in a consistent format
 * across all chart tooltips that show per-run data points.
 *
 * Visual hierarchy:
 * - Tier/Wave: Prominent, uses accent color when provided
 * - Duration | Timestamp: Secondary info on single line, muted color
 */

import {
  formatTierWaveHeader,
  formatDurationHoursMinutes,
  formatTimestampDisplay,
} from '@/shared/formatting/run-display-formatters'
import type { ParsedGameRun } from '@/shared/types/game-run.types'

/**
 * Shared run info interface for chart tooltips across all analytics features.
 *
 * Used by:
 * - TimeSeriesChart (Source Analytics)
 * - CoverageTimelineChart (Coverage Report)
 */
export interface RunInfo {
  tier: number
  wave: number
  /** Duration in seconds */
  realTime: number
  timestamp: Date
}

interface RunInfoHeaderProps {
  /** Run information to display */
  runInfo: RunInfo
  /** Optional accent color for tier/wave text */
  accentColor?: string
}

/**
 * Renders run context information in chart tooltips.
 *
 * Used by:
 * - TimeSeriesTooltip (Source Analytics)
 * - CoverageChartTooltip (Coverage Report)
 */
export function RunInfoHeader({ runInfo, accentColor }: RunInfoHeaderProps) {
  return (
    <div className="space-y-1">
      {/* Tier/Wave - prominent with optional accent styling */}
      <div
        className="text-sm font-semibold"
        style={{ color: accentColor ?? 'rgb(241 245 249)' }}
      >
        {formatTierWaveHeader(runInfo.tier, runInfo.wave)}
      </div>
      {/* Duration and timestamp - secondary info on single line */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>{formatDurationHoursMinutes(runInfo.realTime)}</span>
        <span className="text-slate-600">|</span>
        <span>{formatTimestampDisplay(runInfo.timestamp)}</span>
      </div>
    </div>
  )
}

/**
 * Extract run info from a ParsedGameRun for tooltip display.
 * Used by period-grouping calculations to populate per-run data points.
 */
export function extractRunInfo(run: ParsedGameRun): RunInfo {
  return {
    tier: run.tier,
    wave: run.wave,
    realTime: run.realTime,
    timestamp: run.timestamp,
  }
}
