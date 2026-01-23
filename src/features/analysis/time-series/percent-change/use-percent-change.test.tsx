import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePercentChange } from './use-percent-change'

describe('usePercentChange', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('returns false as default when no stored value exists', () => {
      const { result } = renderHook(() => usePercentChange('testMetric'))
      expect(result.current.isEnabled).toBe(false)
    })

    it('loads persisted value on mount', () => {
      localStorage.setItem(
        'tower-tracking-percent-change-config',
        JSON.stringify({
          coinsEarned: true,
        })
      )

      const { result } = renderHook(() => usePercentChange('coinsEarned'))
      expect(result.current.isEnabled).toBe(true)
    })

    it('returns false for unset metric when other metrics are stored', () => {
      localStorage.setItem(
        'tower-tracking-percent-change-config',
        JSON.stringify({
          coinsEarned: true,
        })
      )

      const { result } = renderHook(() => usePercentChange('cellsEarned'))
      expect(result.current.isEnabled).toBe(false)
    })
  })

  describe('setEnabled', () => {
    it('updates isEnabled state to true', () => {
      const { result } = renderHook(() => usePercentChange('testMetric'))

      act(() => {
        result.current.setEnabled(true)
      })

      expect(result.current.isEnabled).toBe(true)
    })

    it('updates isEnabled state to false', () => {
      const { result } = renderHook(() => usePercentChange('testMetric'))

      act(() => {
        result.current.setEnabled(true)
      })

      act(() => {
        result.current.setEnabled(false)
      })

      expect(result.current.isEnabled).toBe(false)
    })

    it('persists true value to localStorage', () => {
      const { result } = renderHook(() => usePercentChange('testMetric'))

      act(() => {
        result.current.setEnabled(true)
      })

      const stored = localStorage.getItem('tower-tracking-percent-change-config')
      expect(JSON.parse(stored!)).toEqual({ testMetric: true })
    })

    it('persists false value to localStorage', () => {
      const { result } = renderHook(() => usePercentChange('testMetric'))

      act(() => {
        result.current.setEnabled(true)
      })

      act(() => {
        result.current.setEnabled(false)
      })

      const stored = localStorage.getItem('tower-tracking-percent-change-config')
      expect(JSON.parse(stored!)).toEqual({ testMetric: false })
    })

    it('preserves other metric settings when updating', () => {
      localStorage.setItem(
        'tower-tracking-percent-change-config',
        JSON.stringify({
          existingMetric: true,
        })
      )

      const { result } = renderHook(() => usePercentChange('newMetric'))

      act(() => {
        result.current.setEnabled(true)
      })

      const stored = localStorage.getItem('tower-tracking-percent-change-config')
      expect(JSON.parse(stored!)).toEqual({
        existingMetric: true,
        newMetric: true,
      })
    })
  })

  describe('toggle', () => {
    it('toggles from false to true', () => {
      const { result } = renderHook(() => usePercentChange('testMetric'))

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isEnabled).toBe(true)
    })

    it('toggles from true to false', () => {
      const { result } = renderHook(() => usePercentChange('testMetric'))

      act(() => {
        result.current.setEnabled(true)
      })

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isEnabled).toBe(false)
    })

    it('persists toggled value to localStorage', () => {
      const { result } = renderHook(() => usePercentChange('testMetric'))

      act(() => {
        result.current.toggle()
      })

      const stored = localStorage.getItem('tower-tracking-percent-change-config')
      expect(JSON.parse(stored!)).toEqual({ testMetric: true })
    })
  })

  describe('metric key changes', () => {
    it('loads new metric value when key changes', () => {
      localStorage.setItem(
        'tower-tracking-percent-change-config',
        JSON.stringify({
          metricA: true,
          metricB: false,
        })
      )

      const { result, rerender } = renderHook(
        ({ metric }) => usePercentChange(metric),
        { initialProps: { metric: 'metricA' } }
      )

      expect(result.current.isEnabled).toBe(true)

      rerender({ metric: 'metricB' })

      expect(result.current.isEnabled).toBe(false)
    })
  })
})
