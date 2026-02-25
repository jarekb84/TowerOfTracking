/**
 * Heatmap Statistics
 *
 * Pure functions that compute coverage metrics and summary statistics
 * from a HeatmapGrid. These functions analyze the 7x24 grid to produce
 * aggregate metrics like overall coverage, daily breakdowns, active hours
 * analysis, run type distributions, and time accounting.
 *
 * All functions are deterministic with no side effects.
 */

import type { HeatmapGrid, HeatmapSummary, ActiveHoursConfig, RunTypeStats } from '../types'

const HOURS_PER_DAY = 24
const DAYS_PER_WEEK = 7
const TOTAL_CELLS = DAYS_PER_WEEK * HOURS_PER_DAY // 168
const SECONDS_PER_HOUR = 3600

/**
 * Calculates the average totalCoverage across all 168 cells in the grid.
 *
 * @param grid - The heatmap grid to analyze
 * @returns Overall coverage fraction (0-1)
 */
export function calculateOverallCoverage(grid: HeatmapGrid): number {
  let sum = 0
  for (const dayCells of grid.days) {
    for (const cell of dayCells) {
      sum += cell.totalCoverage
    }
  }
  return sum / TOTAL_CELLS
}

/**
 * Calculates average coverage for each day of the week.
 * Returns an array of 7 values where index 0=Sunday through 6=Saturday.
 * Each value is the average totalCoverage of that day's 24 hour cells.
 *
 * @param grid - The heatmap grid to analyze
 * @returns Array of 7 daily coverage fractions (each 0-1)
 */
export function calculateDailyCoverage(grid: HeatmapGrid): number[] {
  return grid.days.map((dayCells) => {
    const daySum = dayCells.reduce((sum, cell) => sum + cell.totalCoverage, 0)
    return daySum / HOURS_PER_DAY
  })
}

/**
 * Checks whether a given hour falls within an active hours window.
 * Handles both standard ranges (e.g., 8-23) and overnight ranges (e.g., 22-6).
 *
 * @param hour - The hour to check (0-23)
 * @param startHour - Start of active window (inclusive)
 * @param endHour - End of active window (exclusive)
 * @returns Whether the hour is within the active window
 */
export function isHourInActiveWindow(hour: number, startHour: number, endHour: number): boolean {
  if (startHour < endHour) {
    // Standard range: e.g., 8-23 means hours [8, 23)
    return hour >= startHour && hour < endHour
  }
  // Overnight range: e.g., 22-6 means hours [22, 24) and [0, 6)
  return hour >= startHour || hour < endHour
}

/**
 * Counts the number of hours in the active window.
 *
 * @param startHour - Start of active window (inclusive)
 * @param endHour - End of active window (exclusive)
 * @returns Number of hours in the active window
 */
function countActiveHours(startHour: number, endHour: number): number {
  if (startHour < endHour) {
    return endHour - startHour
  }
  // Overnight: hours from startHour to 24, plus hours from 0 to endHour
  return (HOURS_PER_DAY - startHour) + endHour
}

/**
 * Calculates average totalCoverage only for cells within the active hours window.
 * Supports both standard (e.g., 8-23) and overnight (e.g., 22-6) ranges.
 *
 * @param grid - The heatmap grid to analyze
 * @param startHour - Start of active window (inclusive, 0-23)
 * @param endHour - End of active window (exclusive, 0-23)
 * @returns Active hours coverage fraction (0-1)
 */
export function calculateActiveHoursCoverage(
  grid: HeatmapGrid,
  startHour: number,
  endHour: number
): number {
  const activeHourCount = countActiveHours(startHour, endHour)
  if (activeHourCount === 0) return 0

  let sum = 0
  for (const dayCells of grid.days) {
    for (const cell of dayCells) {
      if (isHourInActiveWindow(cell.hour, startHour, endHour)) {
        sum += cell.totalCoverage
      }
    }
  }

  const totalActiveCells = DAYS_PER_WEEK * activeHourCount
  return sum / totalActiveCells
}

/**
 * Calculates the fraction of total segment coverage each run type represents.
 * Values are normalized so they sum to 1.0.
 *
 * @param grid - The heatmap grid to analyze
 * @returns Record mapping run type to its fraction of total coverage (values sum to 1.0)
 *
 * @example
 * // If farm segments cover 60% and tournament segments cover 40%:
 * // Returns { farm: 0.6, tournament: 0.4 }
 */
export function calculateRunTypeBreakdown(grid: HeatmapGrid): Record<string, number> {
  const coverageByType: Record<string, number> = {}
  let totalCoverage = 0

  for (const dayCells of grid.days) {
    for (const cell of dayCells) {
      for (const segment of cell.segments) {
        const segmentCoverage = segment.endFraction - segment.startFraction
        coverageByType[segment.runType] = (coverageByType[segment.runType] ?? 0) + segmentCoverage
        totalCoverage += segmentCoverage
      }
    }
  }

  if (totalCoverage === 0) return {}

  // Normalize so values sum to 1.0
  const breakdown: Record<string, number> = {}
  for (const [runType, coverage] of Object.entries(coverageByType)) {
    breakdown[runType] = coverage / totalCoverage
  }

  return breakdown
}

/**
 * Calculates per-run-type statistics including absolute coverage, active seconds,
 * and unique run count.
 *
 * Coverage is calculated as an absolute fraction of the 168-cell week (not relative
 * to total coverage). Each segment's fractional coverage within its cell is summed
 * and divided by total cells.
 *
 * @param grid - The heatmap grid to analyze
 * @returns Record mapping run type to its stats (coverage, activeSeconds, runCount)
 */
export function calculateRunTypeStats(grid: HeatmapGrid): Record<string, RunTypeStats> {
  const coverageByType: Record<string, number> = {}
  const runIdsByType: Record<string, Set<string>> = {}

  for (const dayCells of grid.days) {
    for (const cell of dayCells) {
      for (const segment of cell.segments) {
        const segmentCoverage = segment.endFraction - segment.startFraction
        const runType = segment.runType

        coverageByType[runType] = (coverageByType[runType] ?? 0) + segmentCoverage

        if (!runIdsByType[runType]) {
          runIdsByType[runType] = new Set()
        }
        runIdsByType[runType].add(segment.runId)
      }
    }
  }

  const stats: Record<string, RunTypeStats> = {}
  for (const [runType, totalSegmentCoverage] of Object.entries(coverageByType)) {
    stats[runType] = {
      coverage: totalSegmentCoverage / TOTAL_CELLS,
      activeSeconds: totalSegmentCoverage * SECONDS_PER_HOUR,
      runCount: runIdsByType[runType]?.size ?? 0,
    }
  }

  return stats
}

/**
 * Calculates the total number of seconds of active play time across the grid.
 * Each cell represents 1 hour, so coverage * 3600 = seconds active in that hour.
 *
 * @param grid - The heatmap grid to analyze
 * @returns Total active seconds across all cells
 */
export function calculateTotalActiveSeconds(grid: HeatmapGrid): number {
  let total = 0
  for (const dayCells of grid.days) {
    for (const cell of dayCells) {
      total += cell.totalCoverage * SECONDS_PER_HOUR
    }
  }
  return total
}

/**
 * Calculates total idle (uncovered) seconds within the relevant time window.
 * If active hours are enabled, only counts idle time within the active hours window.
 * If active hours are disabled, counts idle time across all 168 hours.
 *
 * @param grid - The heatmap grid to analyze
 * @param activeHours - Active hours configuration
 * @returns Total idle seconds within the relevant window
 */
export function calculateTotalIdleSeconds(
  grid: HeatmapGrid,
  activeHours: ActiveHoursConfig
): number {
  let total = 0

  for (const dayCells of grid.days) {
    for (const cell of dayCells) {
      if (activeHours.enabled) {
        if (isHourInActiveWindow(cell.hour, activeHours.startHour, activeHours.endHour)) {
          total += (1 - cell.totalCoverage) * SECONDS_PER_HOUR
        }
      } else {
        total += (1 - cell.totalCoverage) * SECONDS_PER_HOUR
      }
    }
  }

  return total
}

/**
 * Counts the number of unique runs represented in the grid.
 * A run that spans multiple cells is counted only once.
 *
 * @param grid - The heatmap grid to analyze
 * @returns Number of unique run IDs across all segments
 */
export function countRuns(grid: HeatmapGrid): number {
  const runIds = new Set<string>()

  for (const dayCells of grid.days) {
    for (const cell of dayCells) {
      for (const segment of cell.segments) {
        runIds.add(segment.runId)
      }
    }
  }

  return runIds.size
}

/**
 * Main entry point: computes all summary statistics from a heatmap grid.
 * Delegates to individual calculation functions for each metric.
 *
 * @param grid - The heatmap grid to analyze
 * @param activeHours - Active hours configuration for window-based calculations
 * @returns Complete HeatmapSummary with all coverage metrics
 */
export function calculateHeatmapSummary(
  grid: HeatmapGrid,
  activeHours: ActiveHoursConfig
): HeatmapSummary {
  const overallCoverage = calculateOverallCoverage(grid)

  return {
    overallCoverage,
    dailyCoverage: calculateDailyCoverage(grid),
    activeHoursCoverage: activeHours.enabled
      ? calculateActiveHoursCoverage(grid, activeHours.startHour, activeHours.endHour)
      : overallCoverage,
    runTypeBreakdown: calculateRunTypeBreakdown(grid),
    runTypeStats: calculateRunTypeStats(grid),
    totalActiveSeconds: calculateTotalActiveSeconds(grid),
    totalIdleSeconds: calculateTotalIdleSeconds(grid, activeHours),
    runCount: countRuns(grid),
  }
}
