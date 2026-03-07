import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration } from '../types'
import type { PeriodCountOverrides } from './period-count-logic'
import { usePeriodCountOptions } from './use-period-count-options'

function mockRun(date: Date): ParsedGameRun {
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

describe('usePeriodCountOptions', () => {
  it('should return correct options for PER_RUN', () => {
    const { result } = renderHook(() => usePeriodCountOptions(Duration.PER_RUN))

    expect(result.current.options).toEqual([5, 10, 15, 20, 25, 30])
    expect(result.current.defaultCount).toBe(10)
    expect(result.current.label).toBe('Last Runs')
  })

  it('should return correct options for DAILY', () => {
    const { result } = renderHook(() => usePeriodCountOptions(Duration.DAILY))

    expect(result.current.options).toEqual([7, 14, 21, 28, 35, 42])
    expect(result.current.defaultCount).toBe(14)
    expect(result.current.label).toBe('Last Days')
  })

  it('should return correct options for WEEKLY', () => {
    const { result } = renderHook(() => usePeriodCountOptions(Duration.WEEKLY))

    expect(result.current.options).toEqual([5, 10, 15, 20, 25, 30])
    expect(result.current.defaultCount).toBe(10)
    expect(result.current.label).toBe('Last Weeks')
  })

  it('should return correct options for MONTHLY', () => {
    const { result } = renderHook(() => usePeriodCountOptions(Duration.MONTHLY))

    expect(result.current.options).toEqual([3, 6, 9, 12])
    expect(result.current.defaultCount).toBe(6)
    expect(result.current.label).toBe('Last Months')
  })

  it('should return correct options for YEARLY', () => {
    const { result } = renderHook(() => usePeriodCountOptions(Duration.YEARLY))

    expect(result.current.options).toEqual([2, 3, 4, 5])
    expect(result.current.defaultCount).toBe(3)
    expect(result.current.label).toBe('Last Years')
  })

  it('should provide adjustForDuration helper', () => {
    const { result } = renderHook(() => usePeriodCountOptions(Duration.DAILY))

    // Valid option stays the same
    expect(result.current.adjustForDuration(14)).toBe(14)

    // Invalid option gets adjusted
    expect(result.current.adjustForDuration(10)).toBe(7)

    // "all" stays "all"
    expect(result.current.adjustForDuration('all')).toBe('all')
  })

  it('should update when duration changes', () => {
    const { result, rerender } = renderHook(
      ({ duration }) => usePeriodCountOptions(duration),
      { initialProps: { duration: Duration.DAILY } }
    )

    expect(result.current.label).toBe('Last Days')
    expect(result.current.options[0]).toBe(7)

    rerender({ duration: Duration.WEEKLY })

    expect(result.current.label).toBe('Last Weeks')
    expect(result.current.options[0]).toBe(5)
  })

  it('should memoize results based on duration', () => {
    const { result, rerender } = renderHook(
      ({ duration }) => usePeriodCountOptions(duration),
      { initialProps: { duration: Duration.DAILY } }
    )

    const firstOptions = result.current.options
    const firstLabel = result.current.label

    // Rerender with same duration
    rerender({ duration: Duration.DAILY })
    expect(result.current.options).toBe(firstOptions)
    expect(result.current.label).toBe(firstLabel)

    // Rerender with different duration
    rerender({ duration: Duration.WEEKLY })
    expect(result.current.options).not.toBe(firstOptions)
  })

  describe('with overrides', () => {
    const overrides: PeriodCountOverrides = {
      [Duration.DAILY]: [2, 3, 4, 5, 6, 7],
    }

    it('should return override options when provided', () => {
      const { result } = renderHook(() => usePeriodCountOptions(Duration.DAILY, overrides))

      expect(result.current.options).toEqual([2, 3, 4, 5, 6, 7])
      expect(result.current.defaultCount).toBe(2)
      expect(result.current.label).toBe('Last Days')
    })

    it('should return defaults for durations without overrides', () => {
      const { result } = renderHook(() => usePeriodCountOptions(Duration.WEEKLY, overrides))

      expect(result.current.options).toEqual([5, 10, 15, 20, 25, 30])
      expect(result.current.defaultCount).toBe(10)
    })

    it('should use overrides in adjustForDuration', () => {
      const { result } = renderHook(() => usePeriodCountOptions(Duration.DAILY, overrides))

      // 14 not in [2,3,4,5,6,7], closest is 7
      expect(result.current.adjustForDuration(14)).toBe(7)
      // 5 is valid
      expect(result.current.adjustForDuration(5)).toBe(5)
    })
  })

  describe('with runs (data-aware pruning)', () => {
    it('should prune options based on data coverage', () => {
      // 9 distinct weeks of data
      const runs: ParsedGameRun[] = []
      for (let i = 0; i < 9; i++) {
        const date = new Date('2024-01-01')
        date.setDate(date.getDate() + i * 7)
        runs.push(mockRun(date))
      }

      const { result } = renderHook(() =>
        usePeriodCountOptions(Duration.WEEKLY, undefined, runs)
      )

      // Weekly options [5,10,15,20,25,30], 9 weeks -> [5, 10]
      expect(result.current.options).toEqual([5, 10])
    })

    it('should return full options when runs not provided', () => {
      const { result } = renderHook(() =>
        usePeriodCountOptions(Duration.WEEKLY)
      )

      expect(result.current.options).toEqual([5, 10, 15, 20, 25, 30])
    })

    it('should provide ensureValidOption helper', () => {
      // 4 months of data
      const runs = [
        mockRun(new Date('2024-01-15')),
        mockRun(new Date('2024-02-15')),
        mockRun(new Date('2024-03-15')),
        mockRun(new Date('2024-04-15')),
      ]

      const { result } = renderHook(() =>
        usePeriodCountOptions(Duration.MONTHLY, undefined, runs)
      )

      // Monthly options [3,6,9,12], 4 months -> [3, 6]
      expect(result.current.options).toEqual([3, 6])

      // 3 is valid
      expect(result.current.ensureValidOption(3)).toBe(3)
      // 9 is pruned, falls back to 'all'
      expect(result.current.ensureValidOption(9)).toBe('all')
      // 'all' stays 'all'
      expect(result.current.ensureValidOption('all')).toBe('all')
    })
  })
})
