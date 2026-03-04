import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { subDays } from 'date-fns'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { useDateRange } from './use-date-range'

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

function makeRuns(daysAgoList: number[]): ParsedGameRun[] {
  return [...daysAgoList].sort((a, b) => a - b).map(makeRun)
}

describe('useDateRange', () => {
  const now = new Date('2026-03-04T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to "all" and returns all runs unfiltered', () => {
    const runs = makeRuns([0, 5, 15, 45, 120])
    const { result } = renderHook(() => useDateRange(runs))

    expect(result.current.dateRange).toBe('all')
    expect(result.current.filteredRuns).toHaveLength(5)
  })

  it('filters runs when date range is changed to a date-based option', () => {
    const runs = makeRuns([0, 3, 6, 8, 25, 35, 60, 100])
    const { result } = renderHook(() => useDateRange(runs))

    act(() => {
      result.current.setDateRange('last-7d')
    })

    expect(result.current.dateRange).toBe('last-7d')
    expect(result.current.filteredRuns).toHaveLength(3) // 0, 3, 6 days ago
  })

  it('filters runs when date range is changed to a count-based option', () => {
    const runs = makeRuns(Array.from({ length: 60 }, (_, i) => i))
    const { result } = renderHook(() => useDateRange(runs))

    act(() => {
      result.current.setDateRange('last-25r')
    })

    expect(result.current.dateRange).toBe('last-25r')
    expect(result.current.filteredRuns).toHaveLength(25)
  })

  it('updates filtered runs when input runs change', () => {
    const initialRuns = makeRuns([0, 3, 6])
    const { result, rerender } = renderHook(
      ({ runs }) => useDateRange(runs),
      { initialProps: { runs: initialRuns } }
    )

    act(() => {
      result.current.setDateRange('last-7d')
    })
    expect(result.current.filteredRuns).toHaveLength(3)

    // Add a run outside the 7-day window
    const updatedRuns = makeRuns([0, 3, 6, 15])
    rerender({ runs: updatedRuns })

    // Should still only show 3 runs within 7 days
    expect(result.current.filteredRuns).toHaveLength(3)
  })

  it('can switch back to "all" after filtering', () => {
    const runs = makeRuns([0, 3, 6, 8, 25, 35])
    const { result } = renderHook(() => useDateRange(runs))

    act(() => {
      result.current.setDateRange('last-7d')
    })
    expect(result.current.filteredRuns).toHaveLength(3)

    act(() => {
      result.current.setDateRange('all')
    })
    expect(result.current.filteredRuns).toHaveLength(6)
  })

  it('returns empty array when no runs match the filter', () => {
    const runs = makeRuns([100, 120, 150])
    const { result } = renderHook(() => useDateRange(runs))

    act(() => {
      result.current.setDateRange('last-7d')
    })

    expect(result.current.filteredRuns).toHaveLength(0)
  })
})
