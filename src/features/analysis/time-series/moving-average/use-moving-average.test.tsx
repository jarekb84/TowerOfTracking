import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMovingAverage } from './use-moving-average'

describe('useMovingAverage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('returns "none" as default when no stored value exists', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric'))

      expect(result.current.averagePeriod).toBe('none')
      expect(result.current.isAverageEnabled).toBe(false)
    })

    it('loads persisted value on mount', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        coinsEarned: 5,
      }))

      const { result } = renderHook(() => useMovingAverage('coinsEarned'))

      expect(result.current.averagePeriod).toBe(5)
      expect(result.current.isAverageEnabled).toBe(true)
    })

    it('returns "none" for different metric key', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        coinsEarned: 5,
      }))

      const { result } = renderHook(() => useMovingAverage('totalDamage'))

      expect(result.current.averagePeriod).toBe('none')
      expect(result.current.isAverageEnabled).toBe(false)
    })
  })

  describe('setAveragePeriod', () => {
    it('updates averagePeriod state', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric'))

      act(() => {
        result.current.setAveragePeriod(10)
      })

      expect(result.current.averagePeriod).toBe(10)
      expect(result.current.isAverageEnabled).toBe(true)
    })

    it('persists value to localStorage', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric'))

      act(() => {
        result.current.setAveragePeriod(3)
      })

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual({ testMetric: 3 })
    })

    it('can set value back to "none"', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric'))

      act(() => {
        result.current.setAveragePeriod(5)
      })

      expect(result.current.isAverageEnabled).toBe(true)

      act(() => {
        result.current.setAveragePeriod('none')
      })

      expect(result.current.averagePeriod).toBe('none')
      expect(result.current.isAverageEnabled).toBe(false)
    })
  })

  describe('isAverageEnabled', () => {
    it('is false when averagePeriod is "none"', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric'))

      expect(result.current.isAverageEnabled).toBe(false)
    })

    it('is true when averagePeriod is a number', () => {
      const { result } = renderHook(() => useMovingAverage('testMetric'))

      act(() => {
        result.current.setAveragePeriod(3)
      })

      expect(result.current.isAverageEnabled).toBe(true)
    })
  })

  describe('metric key changes', () => {
    it('reloads persisted value when metricKey changes', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        coinsEarned: 5,
        totalDamage: 10,
      }))

      const { result, rerender } = renderHook(
        ({ metricKey }) => useMovingAverage(metricKey),
        { initialProps: { metricKey: 'coinsEarned' } }
      )

      expect(result.current.averagePeriod).toBe(5)

      rerender({ metricKey: 'totalDamage' })

      expect(result.current.averagePeriod).toBe(10)
    })
  })
})
