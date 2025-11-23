import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { useAvailableTiers } from './use-available-tiers'

function createMockRun(tier: number, runType: 'farm' | 'tournament' | 'milestone' = 'farm'): ParsedGameRun {
  return {
    id: `run-${tier}-${Math.random()}`,
    timestamp: new Date(),
    tier,
    wave: 100,
    coinsEarned: 1000,
    cellsEarned: 100,
    realTime: 3600,
    runType,
    fields: {}
  } as ParsedGameRun
}

describe('useAvailableTiers', () => {
  it('should return empty tiers for empty runs', () => {
    const { result } = renderHook(() => useAvailableTiers([]))

    expect(result.current.tiers).toEqual([])
    expect(result.current.tierCounts.size).toBe(0)
    expect(result.current.totalCount).toBe(0)
  })

  it('should return tiers sorted highest first', () => {
    const runs = [
      createMockRun(12),
      createMockRun(14),
      createMockRun(13),
      createMockRun(11)
    ]
    const { result } = renderHook(() => useAvailableTiers(runs))

    expect(result.current.tiers).toEqual([14, 13, 12, 11])
  })

  it('should calculate tier counts', () => {
    const runs = [
      createMockRun(14),
      createMockRun(14),
      createMockRun(13),
      createMockRun(14)
    ]
    const { result } = renderHook(() => useAvailableTiers(runs))

    expect(result.current.tierCounts.get(14)).toBe(3)
    expect(result.current.tierCounts.get(13)).toBe(1)
  })

  it('should calculate total count', () => {
    const runs = [
      createMockRun(14),
      createMockRun(14),
      createMockRun(13)
    ]
    const { result } = renderHook(() => useAvailableTiers(runs))

    expect(result.current.totalCount).toBe(3)
  })

  it('should filter by run type when provided', () => {
    const runs = [
      createMockRun(14, 'farm'),
      createMockRun(14, 'tournament'),
      createMockRun(13, 'tournament'),
      createMockRun(12, 'farm')
    ]
    const { result } = renderHook(() => useAvailableTiers(runs, 'farm'))

    expect(result.current.tiers).toEqual([14, 12])
    expect(result.current.tierCounts.get(14)).toBe(1)
    expect(result.current.tierCounts.get(12)).toBe(1)
    expect(result.current.totalCount).toBe(2)
  })

  it('should return all tiers when run type is "all"', () => {
    const runs = [
      createMockRun(14, 'farm'),
      createMockRun(13, 'tournament')
    ]
    const { result } = renderHook(() => useAvailableTiers(runs, 'all'))

    expect(result.current.tiers).toEqual([14, 13])
    expect(result.current.totalCount).toBe(2)
  })

  it('should memoize result based on runs and runType', () => {
    const runs = [createMockRun(14)]
    type Props = { runs: ParsedGameRun[]; runType: 'all' | 'farm' | 'tournament' | 'milestone' }
    const { result, rerender } = renderHook(
      ({ runs, runType }: Props) => useAvailableTiers(runs, runType),
      { initialProps: { runs, runType: 'all' } as Props }
    )

    const firstResult = result.current

    // Rerender with same props
    rerender({ runs, runType: 'all' })
    expect(result.current).toBe(firstResult)

    // Rerender with different runType
    rerender({ runs, runType: 'farm' })
    expect(result.current).not.toBe(firstResult)
  })
})
