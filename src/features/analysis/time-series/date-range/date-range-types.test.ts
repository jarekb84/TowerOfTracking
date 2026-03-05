import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { subDays, subHours } from 'date-fns'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import {
  filterRunsByDateRange,
  countRunsForOption,
  DATE_RANGE_OPTIONS,
  type DateRange,
} from './date-range-types'

function makeRun(daysAgo: number): ParsedGameRun {
  return {
    id: `run-${daysAgo}`,
    timestamp: subDays(new Date(), daysAgo),
    fields: {},
    tier: 1,
    wave: 100,
    coinsEarned: 1000,
    cellsEarned: 10,
    realTime: 60,
    runType: 'farm',
  } as ParsedGameRun
}

// Sorted descending (newest first)
function makeRuns(daysAgoList: number[]): ParsedGameRun[] {
  return [...daysAgoList].sort((a, b) => a - b).map(makeRun)
}

describe('filterRunsByDateRange', () => {
  const now = new Date('2026-03-04T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns all runs for "all"', () => {
    const runs = makeRuns([0, 5, 15, 45, 120])
    const result = filterRunsByDateRange(runs, 'all')
    expect(result).toHaveLength(5)
  })

  it('returns empty array for empty input', () => {
    expect(filterRunsByDateRange([], 'all')).toEqual([])
    expect(filterRunsByDateRange([], 'last-7d')).toEqual([])
    expect(filterRunsByDateRange([], 'last-25r')).toEqual([])
  })

  describe('date-based options', () => {
    const runs = makeRuns([0, 3, 6, 8, 25, 35, 60, 100])

    it('filters to last 7 days', () => {
      const result = filterRunsByDateRange(runs, 'last-7d')
      expect(result).toHaveLength(3) // 0, 3, 6 days ago
    })

    it('filters to last 30 days', () => {
      const result = filterRunsByDateRange(runs, 'last-30d')
      expect(result).toHaveLength(5) // 0, 3, 6, 8, 25 days ago
    })

    it('filters to last 90 days', () => {
      const result = filterRunsByDateRange(runs, 'last-90d')
      expect(result).toHaveLength(7) // 0, 3, 6, 8, 25, 35, 60 days ago
    })
  })

  describe('count-based options', () => {
    const runs = makeRuns([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])

    it('returns first 25 runs (or all if fewer)', () => {
      const result = filterRunsByDateRange(runs, 'last-25r')
      expect(result).toHaveLength(10) // only 10 available
    })

    it('returns first 50 runs (or all if fewer)', () => {
      const result = filterRunsByDateRange(runs, 'last-50r')
      expect(result).toHaveLength(10)
    })

    it('slices to exact count when enough runs exist', () => {
      const manyRuns = makeRuns(Array.from({ length: 60 }, (_, i) => i))
      const result = filterRunsByDateRange(manyRuns, 'last-25r')
      expect(result).toHaveLength(25)
    })

    it('returns first 100 runs', () => {
      const manyRuns = makeRuns(Array.from({ length: 150 }, (_, i) => i))
      const result = filterRunsByDateRange(manyRuns, 'last-100r')
      expect(result).toHaveLength(100)
    })
  })

  describe('boundary conditions', () => {
    it('includes run exactly at 7-day boundary', () => {
      // A run exactly 7 days ago (to the millisecond) should be excluded
      // because subDays(now, 7) creates a cutoff and we use >=
      const exactBoundaryRun = makeRun(7)
      // The run is created at subDays(now, 7), and cutoff is also subDays(now, 7)
      // so run.timestamp >= cutoff should be true
      const result = filterRunsByDateRange([exactBoundaryRun], 'last-7d')
      expect(result).toHaveLength(1)
    })

    it('excludes run just past 7-day boundary', () => {
      const pastBoundaryRun = {
        ...makeRun(0),
        timestamp: subHours(subDays(now, 7), 1),
      } as ParsedGameRun
      const result = filterRunsByDateRange([pastBoundaryRun], 'last-7d')
      expect(result).toHaveLength(0)
    })
  })
})

describe('countRunsForOption', () => {
  const now = new Date('2026-03-04T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const runs = makeRuns([0, 3, 6, 8, 25, 35, 60, 100])
  const findOption = (value: DateRange) => DATE_RANGE_OPTIONS.find((o) => o.value === value)!

  it('counts all runs for "all"', () => {
    expect(countRunsForOption(runs, findOption('all'))).toBe(8)
  })

  it('counts runs within 7 days', () => {
    expect(countRunsForOption(runs, findOption('last-7d'))).toBe(3)
  })

  it('counts runs within 30 days', () => {
    expect(countRunsForOption(runs, findOption('last-30d'))).toBe(5)
  })

  it('counts runs within 90 days', () => {
    expect(countRunsForOption(runs, findOption('last-90d'))).toBe(7)
  })

  it('counts min(runs.length, N) for run-count options', () => {
    expect(countRunsForOption(runs, findOption('last-25r'))).toBe(8) // only 8 available
    expect(countRunsForOption(runs, findOption('last-50r'))).toBe(8)
    expect(countRunsForOption(runs, findOption('last-100r'))).toBe(8)
  })

  it('returns 0 for empty runs', () => {
    expect(countRunsForOption([], findOption('all'))).toBe(0)
    expect(countRunsForOption([], findOption('last-7d'))).toBe(0)
    expect(countRunsForOption([], findOption('last-25r'))).toBe(0)
  })
})
