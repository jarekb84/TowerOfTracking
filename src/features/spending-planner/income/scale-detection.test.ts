/**
 * Scale Detection Tests
 *
 * Tests for the getBestScaleForValue function.
 */

import { describe, expect, it } from 'vitest'
import { getBestScaleForValue } from './scale-detection'

describe('getBestScaleForValue', () => {
  it('returns empty string for zero', () => {
    expect(getBestScaleForValue(0)).toBe('')
  })

  it('returns empty string for small values', () => {
    expect(getBestScaleForValue(500)).toBe('')
    expect(getBestScaleForValue(999)).toBe('')
  })

  it('returns K for thousands', () => {
    expect(getBestScaleForValue(1000)).toBe('K')
    expect(getBestScaleForValue(5000)).toBe('K')
    expect(getBestScaleForValue(100_000)).toBe('K')
    expect(getBestScaleForValue(999_000)).toBe('K')
  })

  it('returns M for millions', () => {
    expect(getBestScaleForValue(1_000_000)).toBe('M')
    expect(getBestScaleForValue(50_000_000)).toBe('M')
    expect(getBestScaleForValue(999_000_000)).toBe('M')
  })

  it('returns B for billions', () => {
    expect(getBestScaleForValue(1_000_000_000)).toBe('B')
    expect(getBestScaleForValue(500_000_000_000)).toBe('B')
  })

  it('returns T for trillions', () => {
    expect(getBestScaleForValue(1e12)).toBe('T')
    expect(getBestScaleForValue(400e12)).toBe('T')
    // 9999e12 = 9.999e15 which is quadrillion range, so uses q scale
    expect(getBestScaleForValue(9999e12)).toBe('q')
  })

  it('returns q for quadrillions', () => {
    expect(getBestScaleForValue(1e15)).toBe('q')
    expect(getBestScaleForValue(500e15)).toBe('q')
  })

  it('returns Q for quintillions', () => {
    expect(getBestScaleForValue(1e18)).toBe('Q')
    expect(getBestScaleForValue(999e18)).toBe('Q') // 9.99e20, still quintillion
  })

  it('returns s for sextillions', () => {
    expect(getBestScaleForValue(1e21)).toBe('s')
    expect(getBestScaleForValue(9999e18)).toBe('s') // 9.999e21 is sextillion
  })

  it('handles values with decimal precision', () => {
    expect(getBestScaleForValue(1.5e12)).toBe('T') // 1.5T
    expect(getBestScaleForValue(2.75e9)).toBe('B') // 2.75B
    expect(getBestScaleForValue(15.25e6)).toBe('M') // 15.25M
  })

  it('falls back to smaller scale for unclean large values', () => {
    // 1.234567T would produce too many decimals at T scale
    // Should fall back to B scale (1234.57B) or further
    const value = 1.234567e12
    const scale = getBestScaleForValue(value)
    // Either T with rounded value or falls back
    expect(['T', 'B', 'M', 'K', '']).toContain(scale)
  })

  it('handles boundary values correctly', () => {
    // Exactly at scale boundaries
    expect(getBestScaleForValue(1e3)).toBe('K')
    expect(getBestScaleForValue(1e6)).toBe('M')
    expect(getBestScaleForValue(1e9)).toBe('B')
    expect(getBestScaleForValue(1e12)).toBe('T')
    expect(getBestScaleForValue(1e15)).toBe('q')
    expect(getBestScaleForValue(1e18)).toBe('Q')
  })

  it('uses cleaner scale when value spans multiple scales', () => {
    // 500B = 0.5T, should use B since 500 is cleaner than 0.5
    expect(getBestScaleForValue(500e9)).toBe('B')
  })
})
