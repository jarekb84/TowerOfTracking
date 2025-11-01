import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    expect(result.current).toBe('initial')

    // Update value
    rerender({ value: 'updated', delay: 300 })

    // Value should not change immediately
    expect(result.current).toBe('initial')

    // Advance time by less than delay
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('initial')

    // Advance time past delay
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe('updated')
  })

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    // Rapid changes
    rerender({ value: 'change1', delay: 300 })
    act(() => { vi.advanceTimersByTime(100) })

    rerender({ value: 'change2', delay: 300 })
    act(() => { vi.advanceTimersByTime(100) })

    rerender({ value: 'change3', delay: 300 })
    act(() => { vi.advanceTimersByTime(100) })

    // Still showing initial because timer keeps resetting
    expect(result.current).toBe('initial')

    // Now wait full delay from last change
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('change3')
  })

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    rerender({ value: 'updated', delay: 500 })

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe('updated')
  })

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    )

    rerender({ value: 'updated', delay: 0 })

    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current).toBe('updated')
  })

  it('should work with different data types', () => {
    // Test with number
    const { result: numResult, rerender: numRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    )

    numRerender({ value: 42, delay: 300 })
    act(() => { vi.advanceTimersByTime(300) })
    expect(numResult.current).toBe(42)

    // Test with object
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: { a: 1 }, delay: 300 } }
    )

    const newObj = { a: 2 }
    objRerender({ value: newObj, delay: 300 })
    act(() => { vi.advanceTimersByTime(300) })
    expect(objResult.current).toEqual(newObj)
  })
})
