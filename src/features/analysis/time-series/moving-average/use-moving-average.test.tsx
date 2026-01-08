import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMovingAverage } from './use-moving-average'
import type { TimePeriod } from '../chart-types'

describe('useMovingAverage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('returns "none" as default when no stored value exists', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric', 'daily'))

      expect(result.current.trendWindow).toBe('none')
      expect(result.current.isEnabled).toBe(false)
      expect(result.current.windowSize).toBeNull()
    })

    it('loads persisted value on mount', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '7d',
        })
      )

      const { result } = renderHook(() => useMovingAverage('coinsEarned', 'daily'))

      expect(result.current.trendWindow).toBe('7d')
      expect(result.current.isEnabled).toBe(true)
      expect(result.current.windowSize).toBe(7)
    })

    it('returns "none" for different metric+period combination', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '7d',
        })
      )

      const { result } = renderHook(() => useMovingAverage('totalDamage', 'daily'))

      expect(result.current.trendWindow).toBe('none')
      expect(result.current.isEnabled).toBe(false)
    })

    it('returns correct value for same metric but different period', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '7d',
          'coinsEarned:weekly': '2w',
        })
      )

      const { result: dailyResult } = renderHook(() =>
        useMovingAverage('coinsEarned', 'daily')
      )
      const { result: weeklyResult } = renderHook(() =>
        useMovingAverage('coinsEarned', 'weekly')
      )

      expect(dailyResult.current.trendWindow).toBe('7d')
      expect(weeklyResult.current.trendWindow).toBe('2w')
    })
  })

  describe('setTrendWindow', () => {
    it('updates trendWindow state', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric', 'daily'))

      act(() => {
        result.current.setTrendWindow('14d')
      })

      expect(result.current.trendWindow).toBe('14d')
      expect(result.current.isEnabled).toBe(true)
      expect(result.current.windowSize).toBe(14)
    })

    it('persists value to localStorage with compound key', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric', 'daily'))

      act(() => {
        result.current.setTrendWindow('3d')
      })

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual({ 'testMetric:daily': '3d' })
    })

    it('can set value back to "none"', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric', 'daily'))

      act(() => {
        result.current.setTrendWindow('7d')
      })

      expect(result.current.isEnabled).toBe(true)

      act(() => {
        result.current.setTrendWindow('none')
      })

      expect(result.current.trendWindow).toBe('none')
      expect(result.current.isEnabled).toBe(false)
      expect(result.current.windowSize).toBeNull()
    })
  })

  describe('windowSize', () => {
    it('returns null when trendWindow is "none"', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric', 'daily'))

      expect(result.current.windowSize).toBeNull()
    })

    it('returns numeric value for daily options', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric', 'daily'))

      act(() => {
        result.current.setTrendWindow('7d')
      })
      expect(result.current.windowSize).toBe(7)

      act(() => {
        result.current.setTrendWindow('14d')
      })
      expect(result.current.windowSize).toBe(14)
    })

    it('returns numeric value for weekly options', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric', 'weekly'))

      act(() => {
        result.current.setTrendWindow('2w')
      })
      expect(result.current.windowSize).toBe(2)

      act(() => {
        result.current.setTrendWindow('4w')
      })
      expect(result.current.windowSize).toBe(4)
    })
  })

  describe('isEnabled', () => {
    it('is false when trendWindow is "none"', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric', 'daily'))

      expect(result.current.isEnabled).toBe(false)
    })

    it('is true when trendWindow is not "none"', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric', 'daily'))

      act(() => {
        result.current.setTrendWindow('3d')
      })

      expect(result.current.isEnabled).toBe(true)
    })
  })

  describe('metric key changes', () => {
    it('reloads persisted value when metricKey changes', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '7d',
          'totalDamage:daily': '14d',
        })
      )

      const { result, rerender } = renderHook(
        ({ metricKey, period }: { metricKey: string; period: TimePeriod }) =>
          useMovingAverage(metricKey, period),
        { initialProps: { metricKey: 'coinsEarned', period: 'daily' as TimePeriod } }
      )

      expect(result.current.trendWindow).toBe('7d')

      rerender({ metricKey: 'totalDamage', period: 'daily' as TimePeriod })

      expect(result.current.trendWindow).toBe('14d')
    })
  })

  describe('period changes', () => {
    it('reloads persisted value when period changes', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '7d',
          'coinsEarned:weekly': '2w',
        })
      )

      const { result, rerender } = renderHook(
        ({ metricKey, period }: { metricKey: string; period: TimePeriod }) =>
          useMovingAverage(metricKey, period),
        { initialProps: { metricKey: 'coinsEarned', period: 'daily' as TimePeriod } }
      )

      expect(result.current.trendWindow).toBe('7d')

      rerender({ metricKey: 'coinsEarned', period: 'weekly' as TimePeriod })

      expect(result.current.trendWindow).toBe('2w')
    })

    it('returns "none" when switching to a period without stored value', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '7d',
        })
      )

      const { result, rerender } = renderHook(
        ({ metricKey, period }: { metricKey: string; period: TimePeriod }) =>
          useMovingAverage(metricKey, period),
        { initialProps: { metricKey: 'coinsEarned', period: 'daily' as TimePeriod } }
      )

      expect(result.current.trendWindow).toBe('7d')

      rerender({ metricKey: 'coinsEarned', period: 'weekly' as TimePeriod })

      expect(result.current.trendWindow).toBe('none')
    })
  })
})
