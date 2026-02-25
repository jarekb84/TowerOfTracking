import { describe, it, expect, vi } from 'vitest'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { RunTypeValue } from '@/shared/domain/run-types/types'
import {
  getRunTimeRange,
  clipRunToWeek,
  distributeRunToHours,
  calculateCellCoverage,
  buildHeatmapGrid,
} from './heatmap-grid-builder'

// ---------------------------------------------------------------------------
// Mock formatWeekOfLabel to avoid locale store dependency in unit tests
// ---------------------------------------------------------------------------
vi.mock('@/shared/formatting/date-formatters', () => ({
  formatWeekOfLabel: (date: Date) => {
    const m = date.getMonth() + 1
    const d = date.getDate()
    return `Week of ${m}/${d}`
  },
}))

// ---------------------------------------------------------------------------
// Test helper
// ---------------------------------------------------------------------------

let nextId = 1

/**
 * Creates a minimal ParsedGameRun for testing the grid builder.
 *
 * @param overrides.endTime   - The run's end timestamp
 * @param overrides.durationSeconds - Duration in seconds (used as realTime)
 * @param overrides.runType   - Defaults to 'farm'
 * @param overrides.tier      - Defaults to 11
 * @param overrides.id        - Auto-generated if omitted
 */
function createTestRun(overrides: {
  endTime: Date
  durationSeconds: number
  runType?: RunTypeValue
  tier?: number
  id?: string
}): ParsedGameRun {
  const id = overrides.id ?? `test-run-${nextId++}`
  const tier = overrides.tier ?? 11
  const runType = overrides.runType ?? 'farm'
  const realTime = overrides.durationSeconds

  return {
    id,
    timestamp: overrides.endTime,
    fields: {},
    tier,
    wave: 100,
    coinsEarned: 0,
    cellsEarned: 0,
    realTime,
    runType,
  } as ParsedGameRun
}

// ---------------------------------------------------------------------------
// Shared week boundaries: Sun 2026-02-22 to Sat 2026-02-28
// ---------------------------------------------------------------------------
// 2026-02-22 is a Sunday
const WEEK_START = new Date(2026, 1, 22, 0, 0, 0, 0) // Sun Feb 22
const WEEK_END = new Date(2026, 1, 28, 23, 59, 59, 999) // Sat Feb 28

/**
 * Helper to create a local Date for the test week.
 * dayOffset: 0=Sun, 1=Mon, 2=Tue, ... 6=Sat
 */
function weekDate(dayOffset: number, hour: number, minute = 0, second = 0): Date {
  return new Date(2026, 1, 22 + dayOffset, hour, minute, second)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('heatmap-grid-builder', () => {
  // -------------------------------------------------------------------------
  // getRunTimeRange
  // -------------------------------------------------------------------------
  describe('getRunTimeRange', () => {
    it('should derive start from timestamp minus realTime in seconds', () => {
      const endTime = new Date(2026, 1, 23, 14, 0, 0) // Mon 14:00
      const run = createTestRun({ endTime, durationSeconds: 3600 }) // 1 hour

      const { start, end } = getRunTimeRange(run)

      expect(end).toEqual(endTime)
      expect(start).toEqual(new Date(2026, 1, 23, 13, 0, 0)) // Mon 13:00
    })

    it('should handle very short durations', () => {
      const endTime = new Date(2026, 1, 23, 12, 0, 30) // 12:00:30
      const run = createTestRun({ endTime, durationSeconds: 30 })

      const { start } = getRunTimeRange(run)

      expect(start).toEqual(new Date(2026, 1, 23, 12, 0, 0))
    })
  })

  // -------------------------------------------------------------------------
  // clipRunToWeek
  // -------------------------------------------------------------------------
  describe('clipRunToWeek', () => {
    it('should return null for run entirely before the week', () => {
      const runStart = new Date(2026, 1, 20, 10, 0, 0) // Friday before
      const runEnd = new Date(2026, 1, 20, 12, 0, 0)

      expect(clipRunToWeek(runStart, runEnd, WEEK_START, WEEK_END)).toBeNull()
    })

    it('should return null for run entirely after the week', () => {
      const runStart = new Date(2026, 2, 1, 10, 0, 0) // Sunday after
      const runEnd = new Date(2026, 2, 1, 12, 0, 0)

      expect(clipRunToWeek(runStart, runEnd, WEEK_START, WEEK_END)).toBeNull()
    })

    it('should return null when run ends exactly at week start', () => {
      // Run end equals weekStart boundary (no actual overlap)
      const runStart = new Date(2026, 1, 21, 22, 0, 0) // Sat before
      const runEnd = new Date(2026, 1, 22, 0, 0, 0, 0) // Exactly Sun 00:00:00.000

      expect(clipRunToWeek(runStart, runEnd, WEEK_START, WEEK_END)).toBeNull()
    })

    it('should clip run starting before week to weekStart', () => {
      const runStart = new Date(2026, 1, 21, 20, 0, 0) // Saturday before, 20:00
      const runEnd = new Date(2026, 1, 22, 3, 0, 0) // Sun 03:00

      const result = clipRunToWeek(runStart, runEnd, WEEK_START, WEEK_END)

      expect(result).not.toBeNull()
      expect(result!.clippedStart).toEqual(WEEK_START)
      expect(result!.clippedEnd).toEqual(runEnd)
    })

    it('should clip run ending after week to weekEnd', () => {
      const runStart = new Date(2026, 1, 28, 22, 0, 0) // Sat 22:00
      const runEnd = new Date(2026, 2, 1, 3, 0, 0) // Sun after, 03:00

      const result = clipRunToWeek(runStart, runEnd, WEEK_START, WEEK_END)

      expect(result).not.toBeNull()
      expect(result!.clippedStart).toEqual(runStart)
      expect(result!.clippedEnd).toEqual(WEEK_END)
    })

    it('should return exact boundaries for run fully within week', () => {
      const runStart = weekDate(3, 10, 0) // Wed 10:00
      const runEnd = weekDate(3, 12, 0) // Wed 12:00

      const result = clipRunToWeek(runStart, runEnd, WEEK_START, WEEK_END)

      expect(result).not.toBeNull()
      expect(result!.clippedStart).toEqual(runStart)
      expect(result!.clippedEnd).toEqual(runEnd)
    })
  })

  // -------------------------------------------------------------------------
  // distributeRunToHours
  // -------------------------------------------------------------------------
  describe('distributeRunToHours', () => {
    it('should handle a run within a single hour', () => {
      const start = weekDate(1, 14, 15) // Mon 14:15
      const end = weekDate(1, 14, 45) // Mon 14:45

      const entries = distributeRunToHours({ clippedStart: start, clippedEnd: end, runType: 'farm', tier: 11, runId: 'r1' })

      expect(entries).toHaveLength(1)
      expect(entries[0].dayIndex).toBe(1) // Monday
      expect(entries[0].hour).toBe(14)
      expect(entries[0].segment.startFraction).toBeCloseTo(0.25, 5)
      expect(entries[0].segment.endFraction).toBeCloseTo(0.75, 5)
      expect(entries[0].segment.runType).toBe('farm')
      expect(entries[0].segment.tier).toBe(11)
      expect(entries[0].segment.runId).toBe('r1')
    })

    it('should split a run spanning two hours', () => {
      const start = weekDate(1, 10, 45) // Mon 10:45
      const end = weekDate(1, 11, 15) // Mon 11:15

      const entries = distributeRunToHours({ clippedStart: start, clippedEnd: end, runType: 'tournament', tier: 8, runId: 'r2' })

      expect(entries).toHaveLength(2)

      // Hour 10: 10:45 - 11:00
      expect(entries[0].hour).toBe(10)
      expect(entries[0].segment.startFraction).toBeCloseTo(0.75, 5)
      expect(entries[0].segment.endFraction).toBeCloseTo(1.0, 5)

      // Hour 11: 11:00 - 11:15
      expect(entries[1].hour).toBe(11)
      expect(entries[1].segment.startFraction).toBeCloseTo(0.0, 5)
      expect(entries[1].segment.endFraction).toBeCloseTo(0.25, 5)
    })

    it('should handle a run spanning three hours', () => {
      const start = weekDate(1, 14, 30) // Mon 14:30
      const end = weekDate(1, 16, 15) // Mon 16:15

      const entries = distributeRunToHours({ clippedStart: start, clippedEnd: end, runType: 'farm', tier: 11, runId: 'r3' })

      expect(entries).toHaveLength(3)

      // Hour 14: 14:30 - 15:00 → startFraction=0.5, endFraction=1.0
      expect(entries[0].hour).toBe(14)
      expect(entries[0].segment.startFraction).toBeCloseTo(0.5, 5)
      expect(entries[0].segment.endFraction).toBeCloseTo(1.0, 5)

      // Hour 15: full hour → startFraction=0.0, endFraction=1.0
      expect(entries[1].hour).toBe(15)
      expect(entries[1].segment.startFraction).toBeCloseTo(0.0, 5)
      expect(entries[1].segment.endFraction).toBeCloseTo(1.0, 5)

      // Hour 16: 16:00 - 16:15 → startFraction=0.0, endFraction=0.25
      expect(entries[2].hour).toBe(16)
      expect(entries[2].segment.startFraction).toBeCloseTo(0.0, 5)
      expect(entries[2].segment.endFraction).toBeCloseTo(0.25, 5)
    })

    it('should cross midnight boundary correctly', () => {
      const start = weekDate(0, 23, 30) // Sun 23:30
      const end = weekDate(1, 0, 30) // Mon 00:30

      const entries = distributeRunToHours({ clippedStart: start, clippedEnd: end, runType: 'farm', tier: 11, runId: 'r4' })

      expect(entries).toHaveLength(2)

      // Sun hour 23: 23:30 - 00:00
      expect(entries[0].dayIndex).toBe(0) // Sunday
      expect(entries[0].hour).toBe(23)
      expect(entries[0].segment.startFraction).toBeCloseTo(0.5, 5)
      expect(entries[0].segment.endFraction).toBeCloseTo(1.0, 5)

      // Mon hour 0: 00:00 - 00:30
      expect(entries[1].dayIndex).toBe(1) // Monday
      expect(entries[1].hour).toBe(0)
      expect(entries[1].segment.startFraction).toBeCloseTo(0.0, 5)
      expect(entries[1].segment.endFraction).toBeCloseTo(0.5, 5)
    })
  })

  // -------------------------------------------------------------------------
  // calculateCellCoverage
  // -------------------------------------------------------------------------
  describe('calculateCellCoverage', () => {
    it('should return 0 for empty segments', () => {
      expect(calculateCellCoverage([])).toBe(0)
    })

    it('should calculate coverage for a single segment', () => {
      const coverage = calculateCellCoverage([
        { startFraction: 0.25, endFraction: 0.75, runType: 'farm', tier: 11, runId: 'r1' },
      ])
      expect(coverage).toBeCloseTo(0.5, 5)
    })

    it('should sum coverage of multiple non-overlapping segments', () => {
      const coverage = calculateCellCoverage([
        { startFraction: 0.0, endFraction: 0.25, runType: 'farm', tier: 11, runId: 'r1' },
        { startFraction: 0.5, endFraction: 0.75, runType: 'tournament', tier: 8, runId: 'r2' },
      ])
      expect(coverage).toBeCloseTo(0.5, 5)
    })

    it('should clamp coverage to 1.0 when segments exceed an hour', () => {
      const coverage = calculateCellCoverage([
        { startFraction: 0.0, endFraction: 0.6, runType: 'farm', tier: 11, runId: 'r1' },
        { startFraction: 0.3, endFraction: 0.9, runType: 'farm', tier: 11, runId: 'r2' },
      ])
      // 0.6 + 0.6 = 1.2, clamped to 1.0
      expect(coverage).toBe(1.0)
    })

    it('should handle full-hour segment', () => {
      const coverage = calculateCellCoverage([
        { startFraction: 0.0, endFraction: 1.0, runType: 'farm', tier: 11, runId: 'r1' },
      ])
      expect(coverage).toBe(1.0)
    })
  })

  // -------------------------------------------------------------------------
  // buildHeatmapGrid - integration tests
  // -------------------------------------------------------------------------
  describe('buildHeatmapGrid', () => {
    it('should return empty grid with correct structure for no runs', () => {
      const grid = buildHeatmapGrid([], WEEK_START)

      // 7 days x 24 hours
      expect(grid.days).toHaveLength(7)
      for (let day = 0; day < 7; day++) {
        expect(grid.days[day]).toHaveLength(24)
        for (let hour = 0; hour < 24; hour++) {
          const cell = grid.days[day][hour]
          expect(cell.dayIndex).toBe(day)
          expect(cell.hour).toBe(hour)
          expect(cell.segments).toHaveLength(0)
          expect(cell.totalCoverage).toBe(0)
        }
      }

      expect(grid.weekStart).toEqual(WEEK_START)
      expect(grid.weekEnd).toEqual(WEEK_END)
      expect(grid.weekLabel).toBe('Week of 2/22')
    })

    it('should place a single run within one hour', () => {
      // Mon 14:15 - 14:45 (30 minutes)
      const run = createTestRun({
        endTime: weekDate(1, 14, 45),
        durationSeconds: 30 * 60,
        id: 'single-hour',
      })

      const grid = buildHeatmapGrid([run], WEEK_START)
      const cell = grid.days[1][14] // Mon hour 14

      expect(cell.segments).toHaveLength(1)
      expect(cell.segments[0].startFraction).toBeCloseTo(0.25, 5)
      expect(cell.segments[0].endFraction).toBeCloseTo(0.75, 5)
      expect(cell.totalCoverage).toBeCloseTo(0.5, 5)

      // Adjacent cells should be empty
      expect(grid.days[1][13].segments).toHaveLength(0)
      expect(grid.days[1][15].segments).toHaveLength(0)
    })

    it('should split a run spanning two hours', () => {
      // Mon 10:45 - 11:15 (30 min)
      const run = createTestRun({
        endTime: weekDate(1, 11, 15),
        durationSeconds: 30 * 60,
        id: 'two-hours',
      })

      const grid = buildHeatmapGrid([run], WEEK_START)

      // Hour 10: 10:45 - 11:00
      const cell10 = grid.days[1][10]
      expect(cell10.segments).toHaveLength(1)
      expect(cell10.segments[0].startFraction).toBeCloseTo(0.75, 5)
      expect(cell10.segments[0].endFraction).toBeCloseTo(1.0, 5)
      expect(cell10.totalCoverage).toBeCloseTo(0.25, 5)

      // Hour 11: 11:00 - 11:15
      const cell11 = grid.days[1][11]
      expect(cell11.segments).toHaveLength(1)
      expect(cell11.segments[0].startFraction).toBeCloseTo(0.0, 5)
      expect(cell11.segments[0].endFraction).toBeCloseTo(0.25, 5)
      expect(cell11.totalCoverage).toBeCloseTo(0.25, 5)
    })

    it('should handle a run spanning midnight', () => {
      // Sun 23:30 - Mon 00:30 (1 hour)
      const run = createTestRun({
        endTime: weekDate(1, 0, 30), // Mon 00:30
        durationSeconds: 60 * 60,
        id: 'midnight',
      })

      const grid = buildHeatmapGrid([run], WEEK_START)

      // Sun hour 23
      const sunCell = grid.days[0][23]
      expect(sunCell.segments).toHaveLength(1)
      expect(sunCell.segments[0].startFraction).toBeCloseTo(0.5, 5)
      expect(sunCell.segments[0].endFraction).toBeCloseTo(1.0, 5)

      // Mon hour 0
      const monCell = grid.days[1][0]
      expect(monCell.segments).toHaveLength(1)
      expect(monCell.segments[0].startFraction).toBeCloseTo(0.0, 5)
      expect(monCell.segments[0].endFraction).toBeCloseTo(0.5, 5)
    })

    it('should handle a run spanning multiple days', () => {
      // Tue 22:00 - Thu 02:00 (28 hours)
      const run = createTestRun({
        endTime: weekDate(4, 2, 0), // Thu 02:00
        durationSeconds: 28 * 3600,
        id: 'multi-day',
      })

      const grid = buildHeatmapGrid([run], WEEK_START)

      // Tue (dayIndex=2) hours 22, 23 should have full coverage
      expect(grid.days[2][22].totalCoverage).toBeCloseTo(1.0, 5)
      expect(grid.days[2][23].totalCoverage).toBeCloseTo(1.0, 5)

      // Wed (dayIndex=3) all 24 hours should have full coverage
      for (let h = 0; h < 24; h++) {
        expect(grid.days[3][h].totalCoverage).toBeCloseTo(1.0, 5)
      }

      // Thu (dayIndex=4) hours 0, 1 should have full coverage
      expect(grid.days[4][0].totalCoverage).toBeCloseTo(1.0, 5)
      expect(grid.days[4][1].totalCoverage).toBeCloseTo(1.0, 5)

      // Thu hour 2 should be empty (run ends at exactly 02:00)
      expect(grid.days[4][2].segments).toHaveLength(0)

      // Tue hour 21 should be empty
      expect(grid.days[2][21].segments).toHaveLength(0)

      // Total filled cells: 2 (Tue) + 24 (Wed) + 2 (Thu) = 28
      let filledCount = 0
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          if (grid.days[d][h].segments.length > 0) filledCount++
        }
      }
      expect(filledCount).toBe(28)
    })

    it('should clip a run starting before the week to weekStart', () => {
      // Run starts Saturday before (Feb 21, 20:00) and ends Sunday 03:00
      // Duration = 7 hours = 25200s
      const run = createTestRun({
        endTime: weekDate(0, 3, 0), // Sun 03:00
        durationSeconds: 7 * 3600, // 7 hours (starts Sat 20:00)
        id: 'clip-start',
      })

      const grid = buildHeatmapGrid([run], WEEK_START)

      // Only Sun 00:00 - 03:00 should appear (3 hours)
      expect(grid.days[0][0].totalCoverage).toBeCloseTo(1.0, 5)
      expect(grid.days[0][1].totalCoverage).toBeCloseTo(1.0, 5)
      expect(grid.days[0][2].totalCoverage).toBeCloseTo(1.0, 5)
      expect(grid.days[0][3].segments).toHaveLength(0)

      // Sun hour 0 should start at fraction 0.0 (clipped to weekStart)
      expect(grid.days[0][0].segments[0].startFraction).toBeCloseTo(0.0, 5)
    })

    it('should clip a run ending after the week to weekEnd', () => {
      // Sat 22:00 to Sun next week 03:00 (5 hours)
      const run = createTestRun({
        endTime: new Date(2026, 2, 1, 3, 0, 0), // Sun Mar 1 03:00 (next week)
        durationSeconds: 5 * 3600,
        id: 'clip-end',
      })

      const grid = buildHeatmapGrid([run], WEEK_START)

      // Sat (dayIndex=6) hours 22, 23 should have segments
      expect(grid.days[6][22].totalCoverage).toBeCloseTo(1.0, 5)
      expect(grid.days[6][23].totalCoverage).toBeCloseTo(1.0, 5)

      // Hour 23 segment should end at 1.0 (or close, clipped to 23:59:59.999)
      const lastSegment = grid.days[6][23].segments[0]
      expect(lastSegment.endFraction).toBeGreaterThan(0.99)
    })

    it('should produce no segments for a run entirely outside the week', () => {
      // Run on the following Monday
      const run = createTestRun({
        endTime: new Date(2026, 2, 2, 14, 0, 0), // Mon Mar 2
        durationSeconds: 3600,
        id: 'outside',
      })

      const grid = buildHeatmapGrid([run], WEEK_START)

      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          expect(grid.days[d][h].segments).toHaveLength(0)
        }
      }
    })

    it('should place multiple runs in the same hour as separate segments', () => {
      // Run 1: Mon 14:00 - 14:20 (20 min)
      const run1 = createTestRun({
        endTime: weekDate(1, 14, 20),
        durationSeconds: 20 * 60,
        id: 'multi-1',
      })

      // Run 2: Mon 14:40 - 15:00 (20 min)
      const run2 = createTestRun({
        endTime: weekDate(1, 15, 0),
        durationSeconds: 20 * 60,
        id: 'multi-2',
        runType: 'tournament',
      })

      const grid = buildHeatmapGrid([run1, run2], WEEK_START)
      const cell = grid.days[1][14]

      expect(cell.segments).toHaveLength(2)

      // First segment: 14:00 - 14:20
      const seg1 = cell.segments.find((s) => s.runId === 'multi-1')!
      expect(seg1.startFraction).toBeCloseTo(0.0, 5)
      expect(seg1.endFraction).toBeCloseTo(1 / 3, 5) // 20/60

      // Second segment: 14:40 - 15:00
      const seg2 = cell.segments.find((s) => s.runId === 'multi-2')!
      expect(seg2.startFraction).toBeCloseTo(2 / 3, 5) // 40/60
      expect(seg2.endFraction).toBeCloseTo(1.0, 5)

      // Total coverage: 20min + 20min = 40/60
      expect(cell.totalCoverage).toBeCloseTo(2 / 3, 5)
    })

    it('should handle a very short run (30 seconds)', () => {
      // Mon 12:00:00 - 12:00:30
      const run = createTestRun({
        endTime: weekDate(1, 12, 0, 30),
        durationSeconds: 30,
        id: 'tiny',
      })

      const grid = buildHeatmapGrid([run], WEEK_START)
      const cell = grid.days[1][12]

      expect(cell.segments).toHaveLength(1)
      expect(cell.segments[0].startFraction).toBeCloseTo(0.0, 5)
      // 30 seconds / 3600 seconds = 0.00833...
      expect(cell.segments[0].endFraction).toBeCloseTo(30 / 3600, 5)
      expect(cell.totalCoverage).toBeCloseTo(30 / 3600, 5)
    })

    it('should fill all 168 cells for a full-week run', () => {
      // Run spanning entire week: Sun 00:00 to Sat 23:59:59.999
      const runEnd = new Date(2026, 2, 2, 12, 0, 0) // Well past week end
      const runDuration = 10 * 24 * 3600 // 10 days in seconds (will be clipped)

      const run = createTestRun({
        endTime: runEnd,
        durationSeconds: runDuration,
        id: 'full-week',
      })

      const grid = buildHeatmapGrid([run], WEEK_START)

      let allCellsFilled = true
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          const cell = grid.days[d][h]
          if (cell.segments.length === 0) {
            allCellsFilled = false
          }
          // All complete hours should have coverage of 1.0
          // The last hour (Sat 23:xx) may be slightly less due to weekEnd = 23:59:59.999
          if (d < 6 || h < 23) {
            expect(cell.totalCoverage).toBeCloseTo(1.0, 3)
          }
        }
      }

      expect(allCellsFilled).toBe(true)

      // Sat hour 23 should have near-full coverage (59 min 59.999s / 60 min)
      const lastCell = grid.days[6][23]
      expect(lastCell.totalCoverage).toBeGreaterThan(0.99)
    })

    it('should set correct date for each day in the grid', () => {
      const grid = buildHeatmapGrid([], WEEK_START)

      // dayIndex 0 = Sunday Feb 22
      expect(grid.days[0][0].date.getDate()).toBe(22)
      expect(grid.days[0][0].date.getMonth()).toBe(1) // February

      // dayIndex 1 = Monday Feb 23
      expect(grid.days[1][0].date.getDate()).toBe(23)

      // dayIndex 6 = Saturday Feb 28
      expect(grid.days[6][0].date.getDate()).toBe(28)
      expect(grid.days[6][0].date.getMonth()).toBe(1) // February
    })

    it('should preserve run metadata (runType, tier, runId) in segments', () => {
      const run = createTestRun({
        endTime: weekDate(4, 15, 30), // Thu 15:30
        durationSeconds: 30 * 60,
        runType: 'tournament',
        tier: 5,
        id: 'metadata-check',
      })

      const grid = buildHeatmapGrid([run], WEEK_START)
      const cell = grid.days[4][15] // Thu hour 15

      expect(cell.segments).toHaveLength(1)
      expect(cell.segments[0].runType).toBe('tournament')
      expect(cell.segments[0].tier).toBe(5)
      expect(cell.segments[0].runId).toBe('metadata-check')
    })

    it('should generate correct weekLabel', () => {
      const grid = buildHeatmapGrid([], WEEK_START)

      expect(grid.weekLabel).toBe('Week of 2/22')
    })
  })
})
