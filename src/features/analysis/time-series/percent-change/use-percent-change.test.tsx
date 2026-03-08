import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePercentChange } from './use-percent-change'
import { resetCache } from '@/shared/persistence/page-state-store'

const STORAGE_KEY = 'tower-tracking-page-state'
const PAGE_SCOPE = 'test/page'

describe('usePercentChange', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCache()
  })

  describe('initial state', () => {
    it('returns false as default when no stored value exists', () => {
      const { result } = renderHook(() => usePercentChange('testMetric', PAGE_SCOPE))
      expect(result.current.isEnabled).toBe(false)
    })

    it('loads persisted value on mount', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [PAGE_SCOPE]: { 'percentChange:coinsEarned': true },
        })
      )

      const { result } = renderHook(() => usePercentChange('coinsEarned', PAGE_SCOPE))
      expect(result.current.isEnabled).toBe(true)
    })

    it('returns false for unset metric when other metrics are stored', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [PAGE_SCOPE]: { 'percentChange:coinsEarned': true },
        })
      )

      const { result } = renderHook(() => usePercentChange('cellsEarned', PAGE_SCOPE))
      expect(result.current.isEnabled).toBe(false)
    })
  })

  describe('setEnabled', () => {
    it('updates isEnabled state to true', () => {
      const { result } = renderHook(() => usePercentChange('testMetric', PAGE_SCOPE))

      act(() => {
        result.current.setEnabled(true)
      })

      expect(result.current.isEnabled).toBe(true)
    })

    it('updates isEnabled state to false', () => {
      const { result } = renderHook(() => usePercentChange('testMetric', PAGE_SCOPE))

      act(() => {
        result.current.setEnabled(true)
      })

      act(() => {
        result.current.setEnabled(false)
      })

      expect(result.current.isEnabled).toBe(false)
    })

    it('persists true value to localStorage', () => {
      const { result } = renderHook(() => usePercentChange('testMetric', PAGE_SCOPE))

      act(() => {
        result.current.setEnabled(true)
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored[PAGE_SCOPE]['percentChange:testMetric']).toBe(true)
    })

    it('persists false value to localStorage', () => {
      const { result } = renderHook(() => usePercentChange('testMetric', PAGE_SCOPE))

      act(() => {
        result.current.setEnabled(true)
      })

      act(() => {
        result.current.setEnabled(false)
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored[PAGE_SCOPE]['percentChange:testMetric']).toBe(false)
    })
  })

  describe('toggle', () => {
    it('toggles from false to true', () => {
      const { result } = renderHook(() => usePercentChange('testMetric', PAGE_SCOPE))

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isEnabled).toBe(true)
    })

    it('toggles from true to false', () => {
      const { result } = renderHook(() => usePercentChange('testMetric', PAGE_SCOPE))

      act(() => {
        result.current.setEnabled(true)
      })

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isEnabled).toBe(false)
    })

    it('persists toggled value to localStorage', () => {
      const { result } = renderHook(() => usePercentChange('testMetric', PAGE_SCOPE))

      act(() => {
        result.current.toggle()
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored[PAGE_SCOPE]['percentChange:testMetric']).toBe(true)
    })
  })

  describe('metric key changes', () => {
    it('loads new metric value when key changes', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          [PAGE_SCOPE]: {
            'percentChange:metricA': true,
            'percentChange:metricB': false,
          },
        })
      )

      const { result, rerender } = renderHook(
        ({ metric }) => usePercentChange(metric, PAGE_SCOPE),
        { initialProps: { metric: 'metricA' } }
      )

      expect(result.current.isEnabled).toBe(true)

      rerender({ metric: 'metricB' })

      expect(result.current.isEnabled).toBe(false)
    })
  })
})
