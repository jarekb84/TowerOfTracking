import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Duration } from '@/shared/domain/filters/types'
import { useIntervalSelector } from './use-interval-selector'

describe('useIntervalSelector', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('defaults to "all" when no persisted value exists', () => {
      const { result } = renderHook(() => useIntervalSelector(Duration.DAILY))

      expect(result.current.intervalCount).toBe('all')
    })

    it('loads persisted value on mount', () => {
      localStorage.setItem(
        'tower-tracking-time-series-filters',
        JSON.stringify({ periodCounts: { daily: 14 } })
      )

      const { result } = renderHook(() => useIntervalSelector(Duration.DAILY))

      expect(result.current.intervalCount).toBe(14)
    })

    it('returns correct count options for duration', () => {
      const { result } = renderHook(() => useIntervalSelector(Duration.DAILY))

      expect(result.current.countOptions).toEqual([7, 14, 21, 28, 35, 42])
    })

    it('returns correct label for duration', () => {
      const { result } = renderHook(() => useIntervalSelector(Duration.DAILY))

      expect(result.current.label).toBe('Last Days')
    })
  })

  describe('setIntervalCount', () => {
    it('updates state', () => {
      const { result } = renderHook(() => useIntervalSelector(Duration.DAILY))

      act(() => {
        result.current.setIntervalCount(14)
      })

      expect(result.current.intervalCount).toBe(14)
    })

    it('persists to localStorage', () => {
      const { result } = renderHook(() => useIntervalSelector(Duration.DAILY))

      act(() => {
        result.current.setIntervalCount(14)
      })

      const stored = JSON.parse(localStorage.getItem('tower-tracking-time-series-filters')!)
      expect(stored.periodCounts.daily).toBe(14)
    })

    it('can set to "all"', () => {
      const { result } = renderHook(() => useIntervalSelector(Duration.DAILY))

      act(() => {
        result.current.setIntervalCount(14)
      })
      act(() => {
        result.current.setIntervalCount('all')
      })

      expect(result.current.intervalCount).toBe('all')
    })
  })

  describe('duration changes', () => {
    it('loads persisted value for new duration', () => {
      localStorage.setItem(
        'tower-tracking-time-series-filters',
        JSON.stringify({ periodCounts: { daily: 14, weekly: 10 } })
      )

      const { result, rerender } = renderHook(
        ({ duration }) => useIntervalSelector(duration),
        { initialProps: { duration: Duration.DAILY } }
      )

      expect(result.current.intervalCount).toBe(14)

      rerender({ duration: Duration.WEEKLY })

      expect(result.current.intervalCount).toBe(10)
    })

    it('falls back to "all" for duration without persisted value', () => {
      localStorage.setItem(
        'tower-tracking-time-series-filters',
        JSON.stringify({ periodCounts: { daily: 14 } })
      )

      const { result, rerender } = renderHook(
        ({ duration }) => useIntervalSelector(duration),
        { initialProps: { duration: Duration.DAILY } }
      )

      expect(result.current.intervalCount).toBe(14)

      rerender({ duration: Duration.WEEKLY })

      expect(result.current.intervalCount).toBe('all')
    })

    it('updates options and label for new duration', () => {
      const { result, rerender } = renderHook(
        ({ duration }) => useIntervalSelector(duration),
        { initialProps: { duration: Duration.DAILY } }
      )

      expect(result.current.countOptions).toEqual([7, 14, 21, 28, 35, 42])
      expect(result.current.label).toBe('Last Days')

      rerender({ duration: Duration.HOURLY })

      expect(result.current.countOptions).toEqual([6, 12, 18, 24, 30, 36])
      expect(result.current.label).toBe('Last Hours')
    })
  })
})
