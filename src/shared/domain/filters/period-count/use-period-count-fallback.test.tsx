import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePeriodCountFallback } from './use-period-count-fallback'

describe('usePeriodCountFallback', () => {
  describe('default (all) strategy', () => {
    it('does not call onFallback when current count is valid', () => {
      const onFallback = vi.fn()
      renderHook(() => usePeriodCountFallback(10, [5, 10, 15], onFallback))
      expect(onFallback).not.toHaveBeenCalled()
    })

    it('does not call onFallback when current count is all', () => {
      const onFallback = vi.fn()
      renderHook(() => usePeriodCountFallback('all', [5, 10, 15], onFallback))
      expect(onFallback).not.toHaveBeenCalled()
    })

    it('calls onFallback with all when current count is pruned', () => {
      const onFallback = vi.fn()
      renderHook(() => usePeriodCountFallback(20, [5, 10, 15], onFallback))
      expect(onFallback).toHaveBeenCalledWith('all')
    })

    it('calls onFallback when options change and current becomes invalid', () => {
      const onFallback = vi.fn()
      const { rerender } = renderHook(
        ({ options }) => usePeriodCountFallback(10, options, onFallback),
        { initialProps: { options: [5, 10, 15] } }
      )

      expect(onFallback).not.toHaveBeenCalled()

      rerender({ options: [5, 15] })
      expect(onFallback).toHaveBeenCalledWith('all')
    })
  })

  describe('last-available strategy', () => {
    it('does not call onFallback when current count is valid', () => {
      const onFallback = vi.fn()
      renderHook(() => usePeriodCountFallback(10, [5, 10, 15], onFallback, 'last-available'))
      expect(onFallback).not.toHaveBeenCalled()
    })

    it('calls onFallback with last option when current count is pruned', () => {
      const onFallback = vi.fn()
      renderHook(() => usePeriodCountFallback(20, [5, 10, 15], onFallback, 'last-available'))
      expect(onFallback).toHaveBeenCalledWith(15)
    })

    it('calls onFallback when options change and current becomes invalid', () => {
      const onFallback = vi.fn()
      const { rerender } = renderHook(
        ({ options }) => usePeriodCountFallback(10, options, onFallback, 'last-available'),
        { initialProps: { options: [5, 10, 15] } }
      )

      expect(onFallback).not.toHaveBeenCalled()

      rerender({ options: [5, 7] })
      expect(onFallback).toHaveBeenCalledWith(7)
    })
  })
})
