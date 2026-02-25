import { describe, it, expect } from 'vitest'
import type { HeatmapGrid, HeatmapCell, HeatmapSegment, ActiveHoursConfig } from '../types'
import {
  calculateOverallCoverage,
  calculateDailyCoverage,
  calculateActiveHoursCoverage,
  calculateRunTypeBreakdown,
  calculateRunTypeStats,
  calculateTotalActiveSeconds,
  calculateTotalIdleSeconds,
  countRuns,
  calculateHeatmapSummary,
  isHourInActiveWindow,
} from './heatmap-statistics'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Creates a 7x24 empty HeatmapGrid with zero coverage in all cells. */
function createEmptyGrid(): HeatmapGrid {
  const weekStart = new Date(2026, 1, 22) // Sunday Feb 22
  const weekEnd = new Date(2026, 1, 28, 23, 59, 59, 999) // Saturday Feb 28
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
  return { weekStart, weekEnd, days, weekLabel: 'Week of Feb 22' }
}

/** Sets a single cell's coverage. Returns the cell for optional chaining (e.g. setting segments). */
function setCellCoverage(
  grid: HeatmapGrid,
  dayIndex: number,
  hour: number,
  totalCoverage: number
): HeatmapCell {
  const cell = grid.days[dayIndex][hour]
  cell.totalCoverage = totalCoverage
  return cell
}

/** Creates a simple segment for testing. */
function createSegment(overrides: Partial<HeatmapSegment> & { runId: string }): HeatmapSegment {
  return {
    startFraction: 0,
    endFraction: 1,
    runType: 'farm',
    tier: 11,
    ...overrides,
  }
}

/** Creates a full-coverage grid (all 168 cells at 100%). */
function createFullGrid(): HeatmapGrid {
  const grid = createEmptyGrid()
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      setCellCoverage(grid, d, h, 1.0).segments = [
        createSegment({ runId: 'full-run', startFraction: 0, endFraction: 1 }),
      ]
    }
  }
  return grid
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('heatmap-statistics', () => {
  // -------------------------------------------------------------------------
  // calculateOverallCoverage
  // -------------------------------------------------------------------------
  describe('calculateOverallCoverage', () => {
    it('should return 0 for an empty grid', () => {
      const grid = createEmptyGrid()

      expect(calculateOverallCoverage(grid)).toBe(0)
    })

    it('should return correct average when one cell has 50% coverage', () => {
      const grid = createEmptyGrid()
      setCellCoverage(grid, 0, 0, 0.5)

      // 0.5 / 168
      expect(calculateOverallCoverage(grid)).toBeCloseTo(0.5 / 168, 10)
    })

    it('should return 1.0 for a full coverage grid', () => {
      const grid = createFullGrid()

      expect(calculateOverallCoverage(grid)).toBeCloseTo(1.0, 10)
    })

    it('should correctly average partial coverage across multiple cells', () => {
      const grid = createEmptyGrid()
      // Set 4 cells to 0.5 coverage each
      setCellCoverage(grid, 0, 0, 0.5)
      setCellCoverage(grid, 1, 12, 0.5)
      setCellCoverage(grid, 3, 8, 0.5)
      setCellCoverage(grid, 6, 23, 0.5)

      // (0.5 * 4) / 168 = 2.0 / 168
      expect(calculateOverallCoverage(grid)).toBeCloseTo(2.0 / 168, 10)
    })
  })

  // -------------------------------------------------------------------------
  // calculateDailyCoverage
  // -------------------------------------------------------------------------
  describe('calculateDailyCoverage', () => {
    it('should return 7 zeros for an empty grid', () => {
      const grid = createEmptyGrid()
      const result = calculateDailyCoverage(grid)

      expect(result).toHaveLength(7)
      expect(result).toEqual([0, 0, 0, 0, 0, 0, 0])
    })

    it('should return correct average for a day with mixed coverage', () => {
      const grid = createEmptyGrid()
      // Sunday: set 4 hours at 0.5 coverage, rest at 0
      setCellCoverage(grid, 0, 8, 0.5)
      setCellCoverage(grid, 0, 9, 0.5)
      setCellCoverage(grid, 0, 10, 0.5)
      setCellCoverage(grid, 0, 11, 0.5)

      const result = calculateDailyCoverage(grid)

      // Sunday average: (4 * 0.5) / 24 = 2/24
      expect(result[0]).toBeCloseTo(2 / 24, 10)
      // All other days should be 0
      for (let d = 1; d < 7; d++) {
        expect(result[d]).toBe(0)
      }
    })

    it('should return correct values per day independently', () => {
      const grid = createEmptyGrid()
      // Sunday: all 24 hours at full coverage
      for (let h = 0; h < 24; h++) {
        setCellCoverage(grid, 0, h, 1.0)
      }
      // Tuesday: all 24 hours at 50%
      for (let h = 0; h < 24; h++) {
        setCellCoverage(grid, 2, h, 0.5)
      }
      // Saturday: 12 hours at 100%
      for (let h = 0; h < 12; h++) {
        setCellCoverage(grid, 6, h, 1.0)
      }

      const result = calculateDailyCoverage(grid)

      expect(result[0]).toBeCloseTo(1.0, 10) // Sunday
      expect(result[1]).toBe(0) // Monday
      expect(result[2]).toBeCloseTo(0.5, 10) // Tuesday
      expect(result[3]).toBe(0) // Wednesday
      expect(result[4]).toBe(0) // Thursday
      expect(result[5]).toBe(0) // Friday
      expect(result[6]).toBeCloseTo(0.5, 10) // Saturday (12/24)
    })
  })

  // -------------------------------------------------------------------------
  // calculateActiveHoursCoverage
  // -------------------------------------------------------------------------
  describe('calculateActiveHoursCoverage', () => {
    it('should average only hours within standard range (8-23)', () => {
      const grid = createEmptyGrid()
      // Set hours 8-22 (15 hours) to full coverage on Sunday
      for (let h = 8; h < 23; h++) {
        setCellCoverage(grid, 0, h, 1.0)
      }

      const result = calculateActiveHoursCoverage(grid, 8, 23)

      // Active hours: 8-22 (15 hours per day), total active cells: 15 * 7 = 105
      // Only Sunday has coverage: 15 cells at 1.0
      expect(result).toBeCloseTo(15 / 105, 10)
    })

    it('should handle overnight range (22-6) correctly', () => {
      const grid = createEmptyGrid()
      // Set hours 22-23 and 0-5 on Sunday (8 hours total active window per day)
      setCellCoverage(grid, 0, 22, 1.0)
      setCellCoverage(grid, 0, 23, 1.0)
      for (let h = 0; h < 6; h++) {
        setCellCoverage(grid, 0, h, 1.0)
      }

      const result = calculateActiveHoursCoverage(grid, 22, 6)

      // Active hours: 22-23 (2 hours) + 0-5 (6 hours) = 8 hours per day
      // Total active cells: 8 * 7 = 56
      // Sunday has 8 cells at 1.0
      expect(result).toBeCloseTo(8 / 56, 10)
    })

    it('should handle single hour range', () => {
      const grid = createEmptyGrid()
      // Set hour 12 on all days to 0.5 coverage
      for (let d = 0; d < 7; d++) {
        setCellCoverage(grid, d, 12, 0.5)
      }

      const result = calculateActiveHoursCoverage(grid, 12, 13)

      // Active hours: 12-12 (1 hour), total active cells: 1 * 7 = 7
      // All 7 cells at 0.5
      expect(result).toBeCloseTo(0.5, 10)
    })

    it('should exclude hours outside the active window', () => {
      const grid = createEmptyGrid()
      // Set hour 7 (outside 8-23 window) to full coverage on all days
      for (let d = 0; d < 7; d++) {
        setCellCoverage(grid, d, 7, 1.0)
      }

      const result = calculateActiveHoursCoverage(grid, 8, 23)

      // No coverage within active window
      expect(result).toBe(0)
    })

    it('should return 0 for empty grid regardless of window', () => {
      const grid = createEmptyGrid()

      expect(calculateActiveHoursCoverage(grid, 8, 23)).toBe(0)
      expect(calculateActiveHoursCoverage(grid, 22, 6)).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // calculateRunTypeBreakdown
  // -------------------------------------------------------------------------
  describe('calculateRunTypeBreakdown', () => {
    it('should return empty object for empty grid', () => {
      const grid = createEmptyGrid()

      expect(calculateRunTypeBreakdown(grid)).toEqual({})
    })

    it('should return { runType: 1.0 } for single run type', () => {
      const grid = createEmptyGrid()
      setCellCoverage(grid, 0, 10, 0.5).segments = [
        createSegment({ runId: 'r1', runType: 'farm', startFraction: 0, endFraction: 0.5 }),
      ]

      const result = calculateRunTypeBreakdown(grid)

      expect(result).toEqual({ farm: 1.0 })
    })

    it('should return normalized fractions for multiple run types', () => {
      const grid = createEmptyGrid()
      // Farm segment: 0.6 coverage
      // Tournament segment: 0.4 coverage
      setCellCoverage(grid, 0, 10, 1.0).segments = [
        createSegment({ runId: 'r1', runType: 'farm', startFraction: 0, endFraction: 0.6 }),
        createSegment({
          runId: 'r2',
          runType: 'tournament',
          startFraction: 0.6,
          endFraction: 1.0,
        }),
      ]

      const result = calculateRunTypeBreakdown(grid)

      expect(result.farm).toBeCloseTo(0.6, 10)
      expect(result.tournament).toBeCloseTo(0.4, 10)
    })

    it('should aggregate across multiple cells', () => {
      const grid = createEmptyGrid()
      // Cell 1: farm covers 0.5
      setCellCoverage(grid, 0, 10, 0.5).segments = [
        createSegment({ runId: 'r1', runType: 'farm', startFraction: 0, endFraction: 0.5 }),
      ]
      // Cell 2: tournament covers 0.5
      setCellCoverage(grid, 1, 14, 0.5).segments = [
        createSegment({
          runId: 'r2',
          runType: 'tournament',
          startFraction: 0,
          endFraction: 0.5,
        }),
      ]

      const result = calculateRunTypeBreakdown(grid)

      // Equal coverage -> 50/50
      expect(result.farm).toBeCloseTo(0.5, 10)
      expect(result.tournament).toBeCloseTo(0.5, 10)
    })

    it('should handle three run types with correct proportions', () => {
      const grid = createEmptyGrid()
      // farm: 0.5, tournament: 0.3, milestone: 0.2
      setCellCoverage(grid, 0, 10, 1.0).segments = [
        createSegment({ runId: 'r1', runType: 'farm', startFraction: 0, endFraction: 0.5 }),
        createSegment({
          runId: 'r2',
          runType: 'tournament',
          startFraction: 0.5,
          endFraction: 0.8,
        }),
        createSegment({
          runId: 'r3',
          runType: 'milestone',
          startFraction: 0.8,
          endFraction: 1.0,
        }),
      ]

      const result = calculateRunTypeBreakdown(grid)

      expect(result.farm).toBeCloseTo(0.5, 10)
      expect(result.tournament).toBeCloseTo(0.3, 10)
      expect(result.milestone).toBeCloseTo(0.2, 10)
    })
  })

  // -------------------------------------------------------------------------
  // calculateRunTypeStats
  // -------------------------------------------------------------------------
  describe('calculateRunTypeStats', () => {
    it('should return empty object for empty grid', () => {
      const grid = createEmptyGrid()

      expect(calculateRunTypeStats(grid)).toEqual({})
    })

    it('should return absolute coverage fraction of 168-cell week', () => {
      const grid = createEmptyGrid()
      // One cell with farm covering 0.5
      setCellCoverage(grid, 0, 10, 0.5).segments = [
        createSegment({ runId: 'r1', runType: 'farm', startFraction: 0, endFraction: 0.5 }),
      ]

      const result = calculateRunTypeStats(grid)

      // coverage = 0.5 / 168 (absolute fraction of 168 cells)
      expect(result.farm.coverage).toBeCloseTo(0.5 / 168, 10)
      // activeSeconds = 0.5 * 3600 = 1800
      expect(result.farm.activeSeconds).toBeCloseTo(1800, 5)
      expect(result.farm.runCount).toBe(1)
    })

    it('should compute separate stats for multiple run types', () => {
      const grid = createEmptyGrid()
      // Farm: 0.6 in one cell
      setCellCoverage(grid, 0, 10, 1.0).segments = [
        createSegment({ runId: 'r1', runType: 'farm', startFraction: 0, endFraction: 0.6 }),
        createSegment({
          runId: 'r2',
          runType: 'tournament',
          startFraction: 0.6,
          endFraction: 1.0,
        }),
      ]

      const result = calculateRunTypeStats(grid)

      // Farm: coverage = 0.6 / 168, activeSeconds = 0.6 * 3600
      expect(result.farm.coverage).toBeCloseTo(0.6 / 168, 10)
      expect(result.farm.activeSeconds).toBeCloseTo(0.6 * 3600, 5)
      expect(result.farm.runCount).toBe(1)

      // Tournament: coverage = 0.4 / 168, activeSeconds = 0.4 * 3600
      expect(result.tournament.coverage).toBeCloseTo(0.4 / 168, 10)
      expect(result.tournament.activeSeconds).toBeCloseTo(0.4 * 3600, 5)
      expect(result.tournament.runCount).toBe(1)
    })

    it('should aggregate across multiple cells and deduplicate run IDs', () => {
      const grid = createEmptyGrid()
      // Same farm run spans two cells
      setCellCoverage(grid, 0, 10, 0.5).segments = [
        createSegment({ runId: 'r1', runType: 'farm', startFraction: 0.5, endFraction: 1.0 }),
      ]
      setCellCoverage(grid, 0, 11, 0.25).segments = [
        createSegment({ runId: 'r1', runType: 'farm', startFraction: 0, endFraction: 0.25 }),
      ]
      // Different tournament run in another cell
      setCellCoverage(grid, 2, 14, 0.5).segments = [
        createSegment({
          runId: 'r2',
          runType: 'tournament',
          startFraction: 0,
          endFraction: 0.5,
        }),
      ]

      const result = calculateRunTypeStats(grid)

      // Farm: 0.5 + 0.25 = 0.75 total segment coverage
      expect(result.farm.coverage).toBeCloseTo(0.75 / 168, 10)
      expect(result.farm.activeSeconds).toBeCloseTo(0.75 * 3600, 5)
      expect(result.farm.runCount).toBe(1) // run-1 counted once

      // Tournament: 0.5 total segment coverage
      expect(result.tournament.coverage).toBeCloseTo(0.5 / 168, 10)
      expect(result.tournament.activeSeconds).toBeCloseTo(0.5 * 3600, 5)
      expect(result.tournament.runCount).toBe(1)
    })

    it('should count multiple unique runs per type', () => {
      const grid = createEmptyGrid()
      setCellCoverage(grid, 0, 10, 0.5).segments = [
        createSegment({ runId: 'r1', runType: 'farm', startFraction: 0, endFraction: 0.25 }),
        createSegment({ runId: 'r2', runType: 'farm', startFraction: 0.25, endFraction: 0.5 }),
      ]

      const result = calculateRunTypeStats(grid)

      expect(result.farm.runCount).toBe(2)
    })
  })

  // -------------------------------------------------------------------------
  // calculateTotalActiveSeconds
  // -------------------------------------------------------------------------
  describe('calculateTotalActiveSeconds', () => {
    it('should return 0 for empty grid', () => {
      const grid = createEmptyGrid()

      expect(calculateTotalActiveSeconds(grid)).toBe(0)
    })

    it('should return 1800 for a single cell at 50% coverage', () => {
      const grid = createEmptyGrid()
      setCellCoverage(grid, 0, 0, 0.5)

      expect(calculateTotalActiveSeconds(grid)).toBeCloseTo(1800, 5)
    })

    it('should return 168 * 3600 for full coverage grid', () => {
      const grid = createFullGrid()

      expect(calculateTotalActiveSeconds(grid)).toBeCloseTo(168 * 3600, 5)
    })

    it('should sum across multiple cells correctly', () => {
      const grid = createEmptyGrid()
      setCellCoverage(grid, 0, 0, 0.25) // 900 seconds
      setCellCoverage(grid, 3, 12, 0.75) // 2700 seconds

      expect(calculateTotalActiveSeconds(grid)).toBeCloseTo(3600, 5) // 900 + 2700
    })
  })

  // -------------------------------------------------------------------------
  // calculateTotalIdleSeconds
  // -------------------------------------------------------------------------
  describe('calculateTotalIdleSeconds', () => {
    const activeHoursEnabled: ActiveHoursConfig = {
      startHour: 8,
      endHour: 23,
      enabled: true,
    }

    const activeHoursDisabled: ActiveHoursConfig = {
      startHour: 8,
      endHour: 23,
      enabled: false,
    }

    it('should count idle across all 168 hours when active hours disabled', () => {
      const grid = createEmptyGrid()

      const result = calculateTotalIdleSeconds(grid, activeHoursDisabled)

      // All 168 cells are fully idle
      expect(result).toBeCloseTo(168 * 3600, 5)
    })

    it('should return 0 idle for full coverage grid with disabled active hours', () => {
      const grid = createFullGrid()

      const result = calculateTotalIdleSeconds(grid, activeHoursDisabled)

      expect(result).toBeCloseTo(0, 5)
    })

    it('should only count idle within active window when enabled', () => {
      const grid = createEmptyGrid()

      const result = calculateTotalIdleSeconds(grid, activeHoursEnabled)

      // Active hours 8-22 = 15 hours/day, 7 days = 105 cells, all idle
      expect(result).toBeCloseTo(105 * 3600, 5)
    })

    it('should subtract coverage from idle within active window', () => {
      const grid = createEmptyGrid()
      // Set hour 10 on Sunday to 50% coverage (within 8-23 window)
      setCellCoverage(grid, 0, 10, 0.5)

      const result = calculateTotalIdleSeconds(grid, activeHoursEnabled)

      // 105 cells idle, but one cell is only 50% idle
      // Total: (104 * 3600) + (0.5 * 3600) = 104.5 * 3600
      expect(result).toBeCloseTo(104.5 * 3600, 5)
    })

    it('should not count hours outside active window in idle calculation', () => {
      const grid = createEmptyGrid()
      // Set hour 3 (outside 8-23 window) to 0 coverage
      // This should NOT contribute to idle time when active hours are enabled

      const idleWithActiveHours = calculateTotalIdleSeconds(grid, activeHoursEnabled)
      // Should only count 15 hours/day * 7 days = 105 hours of idle
      expect(idleWithActiveHours).toBeCloseTo(105 * 3600, 5)
    })

    it('should handle overnight active hours window', () => {
      const overnightConfig: ActiveHoursConfig = {
        startHour: 22,
        endHour: 6,
        enabled: true,
      }
      const grid = createEmptyGrid()

      const result = calculateTotalIdleSeconds(grid, overnightConfig)

      // Overnight window: hours 22-23 (2) + 0-5 (6) = 8 hours/day
      // 8 * 7 = 56 cells of idle
      expect(result).toBeCloseTo(56 * 3600, 5)
    })
  })

  // -------------------------------------------------------------------------
  // countRuns
  // -------------------------------------------------------------------------
  describe('countRuns', () => {
    it('should return 0 for empty grid', () => {
      const grid = createEmptyGrid()

      expect(countRuns(grid)).toBe(0)
    })

    it('should count segments with the same runId only once', () => {
      const grid = createEmptyGrid()
      // Same run spanning two hours
      setCellCoverage(grid, 0, 10, 0.5).segments = [
        createSegment({ runId: 'run-1', startFraction: 0.5, endFraction: 1.0 }),
      ]
      setCellCoverage(grid, 0, 11, 0.25).segments = [
        createSegment({ runId: 'run-1', startFraction: 0, endFraction: 0.25 }),
      ]

      expect(countRuns(grid)).toBe(1)
    })

    it('should count multiple different runIds correctly', () => {
      const grid = createEmptyGrid()
      setCellCoverage(grid, 0, 10, 0.5).segments = [
        createSegment({ runId: 'run-1', startFraction: 0, endFraction: 0.5 }),
      ]
      setCellCoverage(grid, 0, 14, 0.3).segments = [
        createSegment({ runId: 'run-2', startFraction: 0, endFraction: 0.3 }),
      ]
      setCellCoverage(grid, 2, 8, 0.75).segments = [
        createSegment({ runId: 'run-3', startFraction: 0, endFraction: 0.75 }),
      ]

      expect(countRuns(grid)).toBe(3)
    })

    it('should handle multiple segments in the same cell with different runIds', () => {
      const grid = createEmptyGrid()
      setCellCoverage(grid, 0, 10, 0.8).segments = [
        createSegment({ runId: 'run-1', startFraction: 0, endFraction: 0.4 }),
        createSegment({ runId: 'run-2', startFraction: 0.4, endFraction: 0.8 }),
      ]

      expect(countRuns(grid)).toBe(2)
    })

    it('should deduplicate runIds across multiple cells and days', () => {
      const grid = createEmptyGrid()
      // run-1 appears in 3 cells across 2 days
      setCellCoverage(grid, 0, 22, 0.5).segments = [
        createSegment({ runId: 'run-1', startFraction: 0.5, endFraction: 1.0 }),
      ]
      setCellCoverage(grid, 0, 23, 1.0).segments = [
        createSegment({ runId: 'run-1', startFraction: 0, endFraction: 1.0 }),
      ]
      setCellCoverage(grid, 1, 0, 0.25).segments = [
        createSegment({ runId: 'run-1', startFraction: 0, endFraction: 0.25 }),
      ]
      // run-2 in one cell
      setCellCoverage(grid, 3, 12, 0.5).segments = [
        createSegment({ runId: 'run-2', startFraction: 0, endFraction: 0.5 }),
      ]

      expect(countRuns(grid)).toBe(2)
    })
  })

  // -------------------------------------------------------------------------
  // calculateHeatmapSummary - integration test
  // -------------------------------------------------------------------------
  describe('calculateHeatmapSummary', () => {
    it('should compute all summary fields from a grid with known data', () => {
      const grid = createEmptyGrid()

      // Sunday hour 10: farm run covers 60% of the hour
      setCellCoverage(grid, 0, 10, 0.6).segments = [
        createSegment({ runId: 'farm-1', runType: 'farm', startFraction: 0, endFraction: 0.6 }),
      ]
      // Sunday hour 11: farm run covers 40%
      setCellCoverage(grid, 0, 11, 0.4).segments = [
        createSegment({ runId: 'farm-1', runType: 'farm', startFraction: 0, endFraction: 0.4 }),
      ]
      // Tuesday hour 14: tournament run covers 50%
      setCellCoverage(grid, 2, 14, 0.5).segments = [
        createSegment({
          runId: 'tourn-1',
          runType: 'tournament',
          startFraction: 0.25,
          endFraction: 0.75,
        }),
      ]

      const activeHours: ActiveHoursConfig = {
        startHour: 8,
        endHour: 23,
        enabled: true,
      }

      const summary = calculateHeatmapSummary(grid, activeHours)

      // overallCoverage: (0.6 + 0.4 + 0.5) / 168
      expect(summary.overallCoverage).toBeCloseTo(1.5 / 168, 10)

      // dailyCoverage: Sun = (0.6 + 0.4)/24, Tue = 0.5/24, rest = 0
      expect(summary.dailyCoverage).toHaveLength(7)
      expect(summary.dailyCoverage[0]).toBeCloseTo(1.0 / 24, 10) // Sunday
      expect(summary.dailyCoverage[1]).toBe(0) // Monday
      expect(summary.dailyCoverage[2]).toBeCloseTo(0.5 / 24, 10) // Tuesday
      expect(summary.dailyCoverage[3]).toBe(0) // Wednesday
      expect(summary.dailyCoverage[4]).toBe(0) // Thursday
      expect(summary.dailyCoverage[5]).toBe(0) // Friday
      expect(summary.dailyCoverage[6]).toBe(0) // Saturday

      // activeHoursCoverage: active window 8-22 (15 hours/day, 105 cells)
      // All three populated cells (hours 10, 11, 14) fall within [8,23)
      expect(summary.activeHoursCoverage).toBeCloseTo(1.5 / 105, 10)

      // runTypeBreakdown: farm = (0.6 + 0.4) / (0.6 + 0.4 + 0.5), tournament = 0.5 / 1.5
      expect(summary.runTypeBreakdown.farm).toBeCloseTo(1.0 / 1.5, 10)
      expect(summary.runTypeBreakdown.tournament).toBeCloseTo(0.5 / 1.5, 10)

      // totalActiveSeconds: (0.6 + 0.4 + 0.5) * 3600 = 5400
      expect(summary.totalActiveSeconds).toBeCloseTo(5400, 5)

      // totalIdleSeconds: 105 active cells, 3 have partial coverage
      // (105 - 0.6 - 0.4 - 0.5) * 3600 = 103.5 * 3600
      expect(summary.totalIdleSeconds).toBeCloseTo(103.5 * 3600, 5)

      // runTypeStats: per-type absolute coverage and run counts
      expect(summary.runTypeStats.farm.coverage).toBeCloseTo(1.0 / 168, 10)
      expect(summary.runTypeStats.farm.activeSeconds).toBeCloseTo(1.0 * 3600, 5)
      expect(summary.runTypeStats.farm.runCount).toBe(1)
      expect(summary.runTypeStats.tournament.coverage).toBeCloseTo(0.5 / 168, 10)
      expect(summary.runTypeStats.tournament.activeSeconds).toBeCloseTo(0.5 * 3600, 5)
      expect(summary.runTypeStats.tournament.runCount).toBe(1)

      // runCount: 2 unique runs (farm-1, tourn-1)
      expect(summary.runCount).toBe(2)
    })

    it('should use overallCoverage for activeHoursCoverage when disabled', () => {
      const grid = createEmptyGrid()
      setCellCoverage(grid, 0, 3, 1.0).segments = [
        createSegment({ runId: 'r1', startFraction: 0, endFraction: 1.0 }),
      ]

      const activeHoursDisabled: ActiveHoursConfig = {
        startHour: 8,
        endHour: 23,
        enabled: false,
      }

      const summary = calculateHeatmapSummary(grid, activeHoursDisabled)

      // When disabled, activeHoursCoverage should equal overallCoverage
      expect(summary.activeHoursCoverage).toBe(summary.overallCoverage)
      expect(summary.activeHoursCoverage).toBeCloseTo(1 / 168, 10)
    })

    it('should return zero summary for empty grid', () => {
      const grid = createEmptyGrid()
      const activeHours: ActiveHoursConfig = {
        startHour: 8,
        endHour: 23,
        enabled: true,
      }

      const summary = calculateHeatmapSummary(grid, activeHours)

      expect(summary.overallCoverage).toBe(0)
      expect(summary.dailyCoverage).toEqual([0, 0, 0, 0, 0, 0, 0])
      expect(summary.activeHoursCoverage).toBe(0)
      expect(summary.runTypeBreakdown).toEqual({})
      expect(summary.runTypeStats).toEqual({})
      expect(summary.totalActiveSeconds).toBe(0)
      // 15 hours/day * 7 days = 105 active cells, all idle
      expect(summary.totalIdleSeconds).toBeCloseTo(105 * 3600, 5)
      expect(summary.runCount).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // isHourInActiveWindow
  // -------------------------------------------------------------------------
  describe('isHourInActiveWindow', () => {
    describe('standard range (startHour < endHour)', () => {
      it('should return true for hour within range', () => {
        expect(isHourInActiveWindow(10, 8, 23)).toBe(true)
      })

      it('should return false for hour outside range', () => {
        expect(isHourInActiveWindow(5, 8, 23)).toBe(false)
      })

      it('should include startHour (inclusive)', () => {
        expect(isHourInActiveWindow(8, 8, 23)).toBe(true)
      })

      it('should exclude endHour (exclusive)', () => {
        expect(isHourInActiveWindow(23, 8, 23)).toBe(false)
      })
    })

    describe('overnight range (startHour >= endHour)', () => {
      it('should return true for hour after startHour', () => {
        expect(isHourInActiveWindow(23, 22, 6)).toBe(true)
      })

      it('should return true for hour before endHour', () => {
        expect(isHourInActiveWindow(3, 22, 6)).toBe(true)
      })

      it('should return false for hour in the gap', () => {
        expect(isHourInActiveWindow(10, 22, 6)).toBe(false)
      })

      it('should include startHour (inclusive)', () => {
        expect(isHourInActiveWindow(22, 22, 6)).toBe(true)
      })

      it('should exclude endHour (exclusive)', () => {
        expect(isHourInActiveWindow(6, 22, 6)).toBe(false)
      })
    })
  })
})
