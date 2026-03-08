import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Duration } from '@/shared/domain/filters/types'
import { useMovingAverage } from './use-moving-average'
import type { TimePeriod } from '../chart-types'
import { resetCache } from '@/shared/persistence/page-state-store'

const STORAGE_KEY = 'tower-tracking-page-state'
const PAGE_SCOPE = 'test/page'

describe('useMovingAverage', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCache()
  })

  describe('initial state', () => {
    it('returns "none" as default when no stored value exists', () => {
      const { result } = renderHook(() =>
        useMovingAverage('testMetric', Duration.DAILY, PAGE_SCOPE)
      )

      expect(result.current.trendWindow).toBe('none')
      expect(result.current.isEnabled).toBe(false)
      expect(result.current.windowSize).toBeNull()
    })

    it('loads persisted value on mount', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [PAGE_SCOPE]: { 'movingAverage:coinsEarned:daily': '7d' },
        })
      )

      const { result } = renderHook(() =>
        useMovingAverage('coinsEarned', Duration.DAILY, PAGE_SCOPE)
      )

      expect(result.current.trendWindow).toBe('7d')
      expect(result.current.isEnabled).toBe(true)
      expect(result.current.windowSize).toBe(7)
    })

    it('returns "none" for different metric+period combination', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [PAGE_SCOPE]: { 'movingAverage:coinsEarned:daily': '7d' },
        })
      )

      const { result } = renderHook(() =>
        useMovingAverage('totalDamage', Duration.DAILY, PAGE_SCOPE)
      )

      expect(result.current.trendWindow).toBe('none')
      expect(result.current.isEnabled).toBe(false)
    })

    it('returns correct value for same metric but different period', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [PAGE_SCOPE]: {
            'movingAverage:coinsEarned:daily': '7d',
            'movingAverage:coinsEarned:weekly': '2w',
          },
        })
      )

      const { result: dailyResult } = renderHook(() =>
        useMovingAverage('coinsEarned', Duration.DAILY, PAGE_SCOPE)
      )
      const { result: weeklyResult } = renderHook(() =>
        useMovingAverage('coinsEarned', Duration.WEEKLY, PAGE_SCOPE)
      )

      expect(dailyResult.current.trendWindow).toBe('7d')
      expect(weeklyResult.current.trendWindow).toBe('2w')
    })
  })

  describe('setTrendWindow', () => {
    it('updates trendWindow state', () => {
      const { result } = renderHook(() =>
        useMovingAverage('testMetric', Duration.DAILY, PAGE_SCOPE)
      )

      act(() => {
        result.current.setTrendWindow('14d')
      })

      expect(result.current.trendWindow).toBe('14d')
      expect(result.current.isEnabled).toBe(true)
      expect(result.current.windowSize).toBe(14)
    })

    it('persists value to localStorage with compound key', () => {
      const { result } = renderHook(() =>
        useMovingAverage('testMetric', Duration.DAILY, PAGE_SCOPE)
      )

      act(() => {
        result.current.setTrendWindow('3d')
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored[PAGE_SCOPE]['movingAverage:testMetric:daily']).toBe('3d')
    })

    it('can set value back to "none"', () => {
      const { result } = renderHook(() =>
        useMovingAverage('testMetric', Duration.DAILY, PAGE_SCOPE)
      )

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
      const { result } = renderHook(() =>
        useMovingAverage('testMetric', Duration.DAILY, PAGE_SCOPE)
      )

      expect(result.current.windowSize).toBeNull()
    })

    it('returns numeric value for daily options', () => {
      const { result } = renderHook(() =>
        useMovingAverage('testMetric', Duration.DAILY, PAGE_SCOPE)
      )

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
      const { result } = renderHook(() =>
        useMovingAverage('testMetric', Duration.WEEKLY, PAGE_SCOPE)
      )

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
      const { result } = renderHook(() =>
        useMovingAverage('testMetric', Duration.DAILY, PAGE_SCOPE)
      )

      expect(result.current.isEnabled).toBe(false)
    })

    it('is true when trendWindow is not "none"', () => {
      const { result } = renderHook(() =>
        useMovingAverage('testMetric', Duration.DAILY, PAGE_SCOPE)
      )

      act(() => {
        result.current.setTrendWindow('3d')
      })

      expect(result.current.isEnabled).toBe(true)
    })
  })

  describe('metric key changes', () => {
    it('reloads persisted value when metricKey changes', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [PAGE_SCOPE]: {
            'movingAverage:coinsEarned:daily': '7d',
            'movingAverage:totalDamage:daily': '14d',
          },
        })
      )

      const { result, rerender } = renderHook(
        ({ metricKey, period }: { metricKey: string; period: TimePeriod }) =>
          useMovingAverage(metricKey, period, PAGE_SCOPE),
        { initialProps: { metricKey: 'coinsEarned', period: Duration.DAILY as TimePeriod } }
      )

      expect(result.current.trendWindow).toBe('7d')

      rerender({ metricKey: 'totalDamage', period: Duration.DAILY as TimePeriod })

      expect(result.current.trendWindow).toBe('14d')
    })
  })

  describe('period changes', () => {
    it('reloads persisted value when period changes', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [PAGE_SCOPE]: {
            'movingAverage:coinsEarned:daily': '7d',
            'movingAverage:coinsEarned:weekly': '2w',
          },
        })
      )

      const { result, rerender } = renderHook(
        ({ metricKey, period }: { metricKey: string; period: TimePeriod }) =>
          useMovingAverage(metricKey, period, PAGE_SCOPE),
        { initialProps: { metricKey: 'coinsEarned', period: Duration.DAILY as TimePeriod } }
      )

      expect(result.current.trendWindow).toBe('7d')

      rerender({ metricKey: 'coinsEarned', period: Duration.WEEKLY as TimePeriod })

      expect(result.current.trendWindow).toBe('2w')
    })

    it('returns "none" when switching to a period without stored value', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [PAGE_SCOPE]: { 'movingAverage:coinsEarned:daily': '7d' },
        })
      )

      const { result, rerender } = renderHook(
        ({ metricKey, period }: { metricKey: string; period: TimePeriod }) =>
          useMovingAverage(metricKey, period, PAGE_SCOPE),
        { initialProps: { metricKey: 'coinsEarned', period: Duration.DAILY as TimePeriod } }
      )

      expect(result.current.trendWindow).toBe('7d')

      rerender({ metricKey: 'coinsEarned', period: Duration.WEEKLY as TimePeriod })

      expect(result.current.trendWindow).toBe('none')
    })
  })
})
