import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration } from '../types'
import { useAvailableDurations } from './use-available-durations'

function createMockRunWithDate(date: Date): ParsedGameRun {
  return {
    id: `run-${date.getTime()}`,
    timestamp: date,
    tier: 14,
    wave: 100,
    coinsEarned: 1000,
    cellsEarned: 100,
    realTime: 3600,
    runType: 'farm',
    fields: {}
  } as ParsedGameRun
}

describe('useAvailableDurations', () => {
  it('should return empty durations for no runs', () => {
    const { result } = renderHook(() => useAvailableDurations([]))

    expect(result.current.durations).toEqual([])
  })

  it('should return only PER_RUN for single run', () => {
    const runs = [createMockRunWithDate(new Date('2024-01-15'))]
    const { result } = renderHook(() => useAvailableDurations(runs))

    expect(result.current.durations).toEqual([Duration.PER_RUN])
  })

  it('should include appropriate durations based on data span', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-01')),
      createMockRunWithDate(new Date('2024-03-15'))
    ]
    const { result } = renderHook(() => useAvailableDurations(runs))

    expect(result.current.durations).toContain(Duration.PER_RUN)
    expect(result.current.durations).toContain(Duration.DAILY)
    expect(result.current.durations).toContain(Duration.WEEKLY)
    expect(result.current.durations).toContain(Duration.MONTHLY)
    expect(result.current.durations).not.toContain(Duration.YEARLY)
  })

  it('should provide isAvailable helper function', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-01')),
      createMockRunWithDate(new Date('2024-01-10'))
    ]
    const { result } = renderHook(() => useAvailableDurations(runs))

    expect(result.current.isAvailable(Duration.PER_RUN)).toBe(true)
    expect(result.current.isAvailable(Duration.DAILY)).toBe(true)
    expect(result.current.isAvailable(Duration.MONTHLY)).toBe(false)
    expect(result.current.isAvailable(Duration.YEARLY)).toBe(false)
  })

  it('should provide getClosest helper function', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-01')),
      createMockRunWithDate(new Date('2024-01-10'))
    ]
    const { result } = renderHook(() => useAvailableDurations(runs))

    // Available duration returns itself
    expect(result.current.getClosest(Duration.DAILY)).toBe(Duration.DAILY)

    // Unavailable duration returns fallback
    expect(result.current.getClosest(Duration.MONTHLY)).toBe(Duration.PER_RUN)
  })

  it('should include YEARLY for multi-year data', () => {
    const runs = [
      createMockRunWithDate(new Date('2023-06-01')),
      createMockRunWithDate(new Date('2024-06-01'))
    ]
    const { result } = renderHook(() => useAvailableDurations(runs))

    expect(result.current.durations).toContain(Duration.YEARLY)
    expect(result.current.isAvailable(Duration.YEARLY)).toBe(true)
  })

  it('should memoize durations based on runs', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-01')),
      createMockRunWithDate(new Date('2024-01-10'))
    ]
    const { result, rerender } = renderHook(
      ({ runs }) => useAvailableDurations(runs),
      { initialProps: { runs } }
    )

    const firstDurations = result.current.durations

    // Rerender with same runs
    rerender({ runs })
    expect(result.current.durations).toBe(firstDurations)
  })
})
