import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Duration } from '../types'
import { usePeriodCountOptions } from './use-period-count-options'

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
})
