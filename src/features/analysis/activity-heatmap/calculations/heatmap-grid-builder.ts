/**
 * Heatmap Grid Builder
 *
 * Pure functions that transform ParsedGameRun data into a 7x24 HeatmapGrid.
 * Each cell represents one hour of one day, with segments showing which
 * portions of the hour were occupied by game runs.
 *
 * Algorithm:
 * 1. For each run, derive its start/end time range
 * 2. Clip the range to the target week
 * 3. Distribute the clipped range across hour cells as fractional segments
 * 4. Calculate total coverage for each cell
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { RunTypeValue } from '@/shared/domain/run-types/types'
import type { HeatmapSegment, HeatmapCell, HeatmapGrid } from '../types'
import { getWeekEnd, getDayIndex } from '../week-utils'
import { formatWeekOfLabel } from '@/shared/formatting/date-formatters'

/**
 * Derives the start and end time of a game run.
 * Start time is calculated by subtracting the run duration from the end timestamp.
 *
 * @param run - The parsed game run
 * @returns Object with start and end dates
 */
export function getRunTimeRange(run: ParsedGameRun): { start: Date; end: Date } {
  const end = run.timestamp
  const start = new Date(end.getTime() - run.realTime * 1000)
  return { start, end }
}

/**
 * Clips a run's time range to the boundaries of a given week.
 * Returns null if the run does not overlap the week at all.
 *
 * @param runStart - Start time of the run
 * @param runEnd - End time of the run
 * @param weekStart - Sunday 00:00:00.000 of the week
 * @param weekEnd - Saturday 23:59:59.999 of the week
 * @returns Clipped start/end or null if no overlap
 */
export function clipRunToWeek(
  runStart: Date,
  runEnd: Date,
  weekStart: Date,
  weekEnd: Date
): { clippedStart: Date; clippedEnd: Date } | null {
  // No overlap if run ends before week starts or starts after week ends
  if (runEnd.getTime() <= weekStart.getTime() || runStart.getTime() > weekEnd.getTime()) {
    return null
  }

  const clippedStart = runStart.getTime() < weekStart.getTime() ? weekStart : runStart
  const clippedEnd = runEnd.getTime() > weekEnd.getTime() ? weekEnd : runEnd

  return { clippedStart, clippedEnd }
}

/** Run metadata needed to create segments during hour distribution */
interface RunSegmentInfo {
  clippedStart: Date
  clippedEnd: Date
  runType: RunTypeValue
  tier: number
  runId: string
}

/**
 * Distributes a clipped run across the hour cells it touches.
 * For each hour, calculates the fractional start and end position (0-1).
 *
 * @param info - Clipped time range and run metadata
 * @returns Array of hour entries with dayIndex, hour, and segment data
 *
 * @example
 * // Run from 14:30 to 16:15 produces:
 * // hour 14: startFraction=0.5, endFraction=1.0
 * // hour 15: startFraction=0.0, endFraction=1.0
 * // hour 16: startFraction=0.0, endFraction=0.25
 */
export function distributeRunToHours(
  info: RunSegmentInfo
): Array<{ dayIndex: number; hour: number; segment: HeatmapSegment }> {
  const { clippedStart, clippedEnd, runType, tier, runId } = info
  const results: Array<{ dayIndex: number; hour: number; segment: HeatmapSegment }> = []

  // Walk hour-by-hour from clippedStart to clippedEnd
  const cursor = new Date(clippedStart)
  cursor.setMinutes(0, 0, 0) // Snap to start of the hour containing clippedStart

  while (cursor.getTime() < clippedEnd.getTime()) {
    const hourStart = new Date(cursor)
    const hourEnd = new Date(cursor)
    hourEnd.setHours(hourEnd.getHours() + 1) // Start of next hour

    // Calculate fractional overlap within this hour
    const overlapStart = Math.max(clippedStart.getTime(), hourStart.getTime())
    const overlapEnd = Math.min(clippedEnd.getTime(), hourEnd.getTime())

    if (overlapEnd > overlapStart) {
      const hourDuration = hourEnd.getTime() - hourStart.getTime() // Always 3600000ms
      const startFraction = (overlapStart - hourStart.getTime()) / hourDuration
      const endFraction = (overlapEnd - hourStart.getTime()) / hourDuration

      results.push({
        dayIndex: getDayIndex(hourStart),
        hour: hourStart.getHours(),
        segment: {
          startFraction,
          endFraction,
          runType,
          tier,
          runId,
        },
      })
    }

    // Advance cursor to the next hour
    cursor.setHours(cursor.getHours() + 1)
  }

  return results
}

/**
 * Calculates total coverage for a cell by summing segment durations.
 * Clamped to a maximum of 1.0.
 *
 * @param segments - Array of segments in the cell
 * @returns Total coverage fraction (0-1)
 */
export function calculateCellCoverage(segments: HeatmapSegment[]): number {
  if (segments.length === 0) return 0

  const total = segments.reduce(
    (sum, segment) => sum + (segment.endFraction - segment.startFraction),
    0
  )

  return Math.min(total, 1.0)
}

/**
 * Builds the complete 7x24 HeatmapGrid for a given week from game run data.
 *
 * @param runs - All parsed game runs (will be filtered to the target week)
 * @param weekStart - Sunday 00:00:00.000 of the target week
 * @returns Complete HeatmapGrid with segments distributed across cells
 */
export function buildHeatmapGrid(runs: ParsedGameRun[], weekStart: Date): HeatmapGrid {
  const weekEnd = getWeekEnd(weekStart)

  // Initialize empty 7x24 grid
  const days: HeatmapCell[][] = Array.from({ length: 7 }, (_, dayIndex) => {
    const dayDate = new Date(weekStart)
    dayDate.setDate(dayDate.getDate() + dayIndex)

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      dayIndex,
      date: new Date(dayDate),
      segments: [],
      totalCoverage: 0,
    }))
  })

  // Distribute each run's time range across the grid
  for (const run of runs) {
    const { start, end } = getRunTimeRange(run)
    const clipped = clipRunToWeek(start, end, weekStart, weekEnd)
    if (!clipped) continue

    const hourEntries = distributeRunToHours({
      clippedStart: clipped.clippedStart,
      clippedEnd: clipped.clippedEnd,
      runType: run.runType,
      tier: run.tier,
      runId: run.id,
    })

    for (const entry of hourEntries) {
      days[entry.dayIndex][entry.hour].segments.push(entry.segment)
    }
  }

  // Calculate total coverage for each cell
  for (const dayCells of days) {
    for (const cell of dayCells) {
      cell.totalCoverage = calculateCellCoverage(cell.segments)
    }
  }

  const weekLabel = formatWeekOfLabel(weekStart)

  return {
    weekStart,
    weekEnd,
    days,
    weekLabel,
  }
}
