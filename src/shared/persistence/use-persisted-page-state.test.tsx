import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistedPageState } from './use-persisted-page-state'
import { resetCache } from './page-state-store'

const STORAGE_KEY = 'tower-tracking-page-state'

describe('usePersistedPageState', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCache()
  })

  describe('initial state', () => {
    it('returns default value initially', () => {
      const { result } = renderHook(() =>
        usePersistedPageState('test/page', 'color', 'blue')
      )
      expect(result.current[0]).toBe('blue')
    })

    it('hydrates from localStorage on mount', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ 'test/page': { color: 'red' } })
      )

      const { result } = renderHook(() =>
        usePersistedPageState('test/page', 'color', 'blue')
      )

      expect(result.current[0]).toBe('red')
    })
  })

  describe('setValue', () => {
    it('updates state and persists', () => {
      const { result } = renderHook(() =>
        usePersistedPageState('test/page', 'count', 0)
      )

      act(() => {
        result.current[1](42)
      })

      expect(result.current[0]).toBe(42)
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored['test/page'].count).toBe(42)
    })

    it('works with updater function', () => {
      const { result } = renderHook(() =>
        usePersistedPageState('test/page', 'count', 10)
      )

      act(() => {
        result.current[1]((prev) => prev + 5)
      })

      expect(result.current[0]).toBe(15)
    })
  })

  describe('validator', () => {
    it('rejects invalid stored data and falls back to default', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ 'test/page': { mode: 'invalid' } })
      )

      const { result } = renderHook(() =>
        usePersistedPageState('test/page', 'mode', 'normal', {
          validator: (v) => v === 'normal' || v === 'advanced',
        })
      )

      expect(result.current[0]).toBe('normal')
    })

    it('accepts valid stored data', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ 'test/page': { mode: 'advanced' } })
      )

      const { result } = renderHook(() =>
        usePersistedPageState('test/page', 'mode', 'normal', {
          validator: (v) => v === 'normal' || v === 'advanced',
        })
      )

      expect(result.current[0]).toBe('advanced')
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('updates state immediately but delays localStorage write', () => {
      const { result } = renderHook(() =>
        usePersistedPageState('test/page', 'search', '', {
          debounceMs: 300,
        })
      )

      act(() => {
        result.current[1]('hello')
      })

      // State updates immediately
      expect(result.current[0]).toBe('hello')
      // localStorage not yet written
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Now persisted
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored['test/page'].search).toBe('hello')
    })
  })

  describe('multiple hooks on same page', () => {
    it('two hooks with different keys persist independently', () => {
      const { result: resultA } = renderHook(() =>
        usePersistedPageState('test/page', 'keyA', 'a')
      )
      const { result: resultB } = renderHook(() =>
        usePersistedPageState('test/page', 'keyB', 'b')
      )

      act(() => {
        resultA.current[1]('A-updated')
      })
      act(() => {
        resultB.current[1]('B-updated')
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored['test/page'].keyA).toBe('A-updated')
      expect(stored['test/page'].keyB).toBe('B-updated')
    })
  })
})
