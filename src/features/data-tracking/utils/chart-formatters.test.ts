import { describe, it, expect } from 'vitest'
import { formatLargeNumber, generateYAxisTicks } from './chart-formatters'

describe('Chart Formatters', () => {
  describe('formatLargeNumber', () => {
    it('should format numbers in quadrillions', () => {
      expect(formatLargeNumber(1.5e15)).toBe('1.5Q')
      expect(formatLargeNumber(2.34e15)).toBe('2.3Q')
    })

    it('should format numbers in trillions', () => {
      expect(formatLargeNumber(1.5e12)).toBe('1.5T')
      expect(formatLargeNumber(2.34e12)).toBe('2.3T')
    })

    it('should format numbers in billions', () => {
      expect(formatLargeNumber(1.5e9)).toBe('1.5B')
      expect(formatLargeNumber(2.34e9)).toBe('2.3B')
    })

    it('should format numbers in millions', () => {
      expect(formatLargeNumber(1.5e6)).toBe('1.5M')
      expect(formatLargeNumber(2.34e6)).toBe('2.3M')
    })

    it('should format numbers in thousands', () => {
      expect(formatLargeNumber(1500)).toBe('1.5K')
      expect(formatLargeNumber(2340)).toBe('2.3K')
    })

    it('should return exact string for small numbers', () => {
      expect(formatLargeNumber(123)).toBe('123')
      expect(formatLargeNumber(0)).toBe('0')
      expect(formatLargeNumber(999)).toBe('999')
    })
  })

  describe('generateYAxisTicks', () => {
    it('should generate appropriate ticks for small values', () => {
      const ticks = generateYAxisTicks(100)
      expect(ticks).toEqual([0, 50, 100])
    })

    it('should generate appropriate ticks for medium values', () => {
      const ticks = generateYAxisTicks(500)
      expect(ticks).toEqual([0, 100, 200, 300, 400, 500])
    })

    it('should generate appropriate ticks for large values', () => {
      const ticks = generateYAxisTicks(1200)
      expect(ticks).toEqual([0, 500, 1000, 1500]) // Algorithm uses step of 500 for 1200
    })

    it('should handle edge case of zero', () => {
      const ticks = generateYAxisTicks(0)
      expect(ticks).toEqual([]) // No ticks for zero max value
    })

    it('should generate reasonable number of ticks for very large values', () => {
      const ticks = generateYAxisTicks(1e12)
      expect(ticks).toHaveLength(3) // Actual behavior generates 3 ticks
      expect(ticks[0]).toBe(0)
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(1e12)
    })
  })
})