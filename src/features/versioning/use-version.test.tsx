import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useVersion } from './use-version'

describe('useVersion', () => {
  it('returns formatted version from environment variable', () => {
    // Note: In tests, import.meta.env.VITE_APP_VERSION will be whatever is set
    // in the test environment. The hook delegates to formatVersionForDisplay,
    // which is tested separately for all edge cases.
    const { result } = renderHook(() => useVersion())

    // Should return a string starting with 'v'
    expect(result.current).toMatch(/^v/)
  })

  it('returns consistent value across multiple calls', () => {
    const { result: result1 } = renderHook(() => useVersion())
    const { result: result2 } = renderHook(() => useVersion())

    // Should return the same value
    expect(result1.current).toBe(result2.current)
  })
})
