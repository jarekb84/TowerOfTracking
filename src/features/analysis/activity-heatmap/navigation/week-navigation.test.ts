/**
 * Week Navigation Tests
 *
 * Tests for week navigation pure functions used by the activity heatmap.
 */

import { describe, it, expect, vi } from 'vitest'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import {
  deriveAvailableWeeks,
  getDefaultWeek,
  canNavigateNext,
  canNavigatePrev,
  getRunsForWeek,
} from './week-navigation'

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
 * Creates a minimal ParsedGameRun for testing week navigation.
 *
 * @param endTime - The run's end timestamp
 * @param durationSeconds - Duration in seconds (used as realTime)
 * @param overrides - Optional field overrides
 */
function createTestRun(
  endTime: Date,
  durationSeconds: number,
  overrides?: Partial<ParsedGameRun>
): ParsedGameRun {
  const defaults = {
    id: `test-run-${nextId++}`,
    timestamp: endTime,
    realTime: durationSeconds,
    tier: 1,
    wave: 100,
    coinsEarned: 1000,
    cellsEarned: 10,
    runType: 'farm' as const,
    fields: {},
  }
  return { ...defaults, ...overrides } as ParsedGameRun
}

// ---------------------------------------------------------------------------
// Shared week boundaries (Sunday-based)
// ---------------------------------------------------------------------------
// 2026-02-22 is a Sunday
// Week 1: Sun Feb 22 - Sat Feb 28
// Week 2: Sun Mar 1 - Sat Mar 7
// Week 3: Sun Mar 8 - Sat Mar 14

const WEEK1_START = new Date(2026, 1, 22, 0, 0, 0, 0) // Sun Feb 22
const WEEK2_START = new Date(2026, 2, 1, 0, 0, 0, 0) // Sun Mar 1
const WEEK3_START = new Date(2026, 2, 8, 0, 0, 0, 0) // Sun Mar 8

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('week-navigation', () => {
  // -------------------------------------------------------------------------
  // deriveAvailableWeeks
  // -------------------------------------------------------------------------
  describe('deriveAvailableWeeks', () => {
    it('should return empty array for empty runs', () => {
      const result = deriveAvailableWeeks([])

      expect(result).toEqual([])
    })

    it('should return one week for a single run', () => {
      // Run on Wed Feb 25 (within Week 1: Sun Feb 22 - Sat Feb 28)
      const run = createTestRun(
        new Date(2026, 1, 25, 14, 0, 0), // Wed Feb 25 14:00
        3600 // 1 hour
      )

      const result = deriveAvailableWeeks([run])

      expect(result).toHaveLength(1)
      expect(result[0].weekStart).toEqual(WEEK1_START)
      expect(result[0].weekLabel).toBe('Week of 2/22')
    })

    it('should return 3 WeekInfos for runs spanning 3 weeks, newest first', () => {
      const runWeek1 = createTestRun(
        new Date(2026, 1, 25, 14, 0, 0), // Wed Feb 25 (Week 1)
        3600
      )
      const runWeek2 = createTestRun(
        new Date(2026, 2, 4, 10, 0, 0), // Wed Mar 4 (Week 2)
        3600
      )
      const runWeek3 = createTestRun(
        new Date(2026, 2, 11, 10, 0, 0), // Wed Mar 11 (Week 3)
        3600
      )

      const result = deriveAvailableWeeks([runWeek1, runWeek2, runWeek3])

      expect(result).toHaveLength(3)
      // Newest first
      expect(result[0].weekStart).toEqual(WEEK3_START)
      expect(result[1].weekStart).toEqual(WEEK2_START)
      expect(result[2].weekStart).toEqual(WEEK1_START)
    })

    it('should return single WeekInfo for multiple runs in same week', () => {
      const run1 = createTestRun(
        new Date(2026, 1, 23, 12, 0, 0), // Mon Feb 23 12:00
        3600
      )
      const run2 = createTestRun(
        new Date(2026, 1, 25, 15, 0, 0), // Wed Feb 25 15:00
        3600
      )
      const run3 = createTestRun(
        new Date(2026, 1, 28, 20, 0, 0), // Sat Feb 28 20:00
        3600
      )

      const result = deriveAvailableWeeks([run1, run2, run3])

      expect(result).toHaveLength(1)
      expect(result[0].weekStart).toEqual(WEEK1_START)
    })

    it('should include weeks for runs that span week boundaries', () => {
      // Run that starts in Week 1 (Sat Feb 28) and ends in Week 2 (Sun Mar 1)
      // End time: Sun Mar 1 at 02:00, duration: 6 hours => starts Sat Feb 28 at 20:00
      const boundaryRun = createTestRun(
        new Date(2026, 2, 1, 2, 0, 0), // Sun Mar 1 02:00 (Week 2)
        6 * 3600 // 6 hours => starts Sat Feb 28 20:00 (Week 1)
      )

      const result = deriveAvailableWeeks([boundaryRun])

      // Should include both Week 1 (start time) and Week 2 (end time)
      expect(result).toHaveLength(2)
      expect(result[0].weekStart).toEqual(WEEK2_START) // newest first
      expect(result[1].weekStart).toEqual(WEEK1_START)
    })
  })

  // -------------------------------------------------------------------------
  // getDefaultWeek
  // -------------------------------------------------------------------------
  describe('getDefaultWeek', () => {
    it('should return first (newest) week', () => {
      const weeks = [
        { weekStart: WEEK3_START, weekLabel: 'Week of 3/8' },
        { weekStart: WEEK2_START, weekLabel: 'Week of 3/1' },
        { weekStart: WEEK1_START, weekLabel: 'Week of 2/22' },
      ]

      const result = getDefaultWeek(weeks)

      expect(result).not.toBeNull()
      expect(result!.weekStart).toEqual(WEEK3_START)
    })

    it('should return null for empty array', () => {
      const result = getDefaultWeek([])

      expect(result).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // canNavigateNext / canNavigatePrev
  // -------------------------------------------------------------------------
  describe('canNavigateNext', () => {
    const weeks = [
      { weekStart: WEEK3_START, weekLabel: 'Week of 3/8' },
      { weekStart: WEEK2_START, weekLabel: 'Week of 3/1' },
      { weekStart: WEEK1_START, weekLabel: 'Week of 2/22' },
    ]

    it('should return false when at the newest week', () => {
      expect(canNavigateNext(WEEK3_START, weeks)).toBe(false)
    })

    it('should return true when at the middle week', () => {
      expect(canNavigateNext(WEEK2_START, weeks)).toBe(true)
    })

    it('should return true when at the oldest week', () => {
      expect(canNavigateNext(WEEK1_START, weeks)).toBe(true)
    })

    it('should return false for empty available weeks', () => {
      expect(canNavigateNext(WEEK1_START, [])).toBe(false)
    })
  })

  describe('canNavigatePrev', () => {
    const weeks = [
      { weekStart: WEEK3_START, weekLabel: 'Week of 3/8' },
      { weekStart: WEEK2_START, weekLabel: 'Week of 3/1' },
      { weekStart: WEEK1_START, weekLabel: 'Week of 2/22' },
    ]

    it('should return false when at the oldest week', () => {
      expect(canNavigatePrev(WEEK1_START, weeks)).toBe(false)
    })

    it('should return true when at the middle week', () => {
      expect(canNavigatePrev(WEEK2_START, weeks)).toBe(true)
    })

    it('should return true when at the newest week', () => {
      expect(canNavigatePrev(WEEK3_START, weeks)).toBe(true)
    })

    it('should return false for empty available weeks', () => {
      expect(canNavigatePrev(WEEK1_START, [])).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // getRunsForWeek
  // -------------------------------------------------------------------------
  describe('getRunsForWeek', () => {
    it('should return only runs overlapping the week', () => {
      // Run in Week 1
      const runWeek1 = createTestRun(
        new Date(2026, 1, 25, 14, 0, 0), // Wed Feb 25 14:00
        3600,
        { id: 'week1-run' }
      )
      // Run in Week 2
      const runWeek2 = createTestRun(
        new Date(2026, 2, 4, 10, 0, 0), // Wed Mar 4 10:00
        3600,
        { id: 'week2-run' }
      )

      const result = getRunsForWeek([runWeek1, runWeek2], WEEK1_START)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('week1-run')
    })

    it('should include runs that partially overlap (start before week, end during)', () => {
      // Run starts before Week 2 (Sat Feb 28 at 22:00) and ends during Week 2 (Sun Mar 1 at 02:00)
      // End: Sun Mar 1 02:00, duration: 4 hours => start: Sat Feb 28 22:00 (Week 1)
      const partialRun = createTestRun(
        new Date(2026, 2, 1, 2, 0, 0), // Sun Mar 1 02:00
        4 * 3600, // 4 hours => starts Sat Feb 28 22:00
        { id: 'partial-overlap' }
      )

      const result = getRunsForWeek([partialRun], WEEK2_START)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('partial-overlap')
    })

    it('should exclude runs entirely outside the week', () => {
      // Run entirely in Week 3
      const runWeek3 = createTestRun(
        new Date(2026, 2, 11, 14, 0, 0), // Wed Mar 11 14:00
        3600,
        { id: 'week3-run' }
      )

      const result = getRunsForWeek([runWeek3], WEEK1_START)

      expect(result).toHaveLength(0)
    })

    it('should return empty array for empty runs', () => {
      const result = getRunsForWeek([], WEEK1_START)

      expect(result).toHaveLength(0)
    })

    it('should include runs that start during week and end after week', () => {
      // Run starts Sat Feb 28 at 22:00 (Week 1) and ends Sun Mar 1 at 04:00 (Week 2)
      // End: Sun Mar 1 04:00, duration: 6 hours => start: Sat Feb 28 22:00
      const spanRun = createTestRun(
        new Date(2026, 2, 1, 4, 0, 0), // Sun Mar 1 04:00
        6 * 3600, // 6 hours => starts Sat Feb 28 22:00
        { id: 'span-run' }
      )

      // Should appear in Week 1 (start overlaps)
      const resultWeek1 = getRunsForWeek([spanRun], WEEK1_START)
      expect(resultWeek1).toHaveLength(1)
      expect(resultWeek1[0].id).toBe('span-run')

      // Should also appear in Week 2 (end overlaps)
      const resultWeek2 = getRunsForWeek([spanRun], WEEK2_START)
      expect(resultWeek2).toHaveLength(1)
      expect(resultWeek2[0].id).toBe('span-run')
    })
  })
})
