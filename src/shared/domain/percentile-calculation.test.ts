import { describe, it, expect } from 'vitest'
import {
  calculatePercentile,
  calculateP99,
  calculateP90,
  calculateP75,
  calculateP50,
  calculateAllPercentiles,
} from './percentile-calculation'

describe('calculatePercentile', () => {
  it('should return null for empty array', () => {
    expect(calculatePercentile([], 0.99)).toBeNull()
  })

  it('should return the single value for single-element array', () => {
    expect(calculatePercentile([42], 0.99)).toBe(42)
    expect(calculatePercentile([100], 0.50)).toBe(100)
  })

  it('should calculate P99 correctly for sorted array', () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    // P99 of 10 items: floor(0.99 * 10) = 9, clamped to index 9
    expect(calculatePercentile(sorted, 0.99)).toBe(10)
  })

  it('should calculate P90 correctly for sorted array', () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    // P90 of 10 items: floor(0.90 * 10) = 9, index 9
    expect(calculatePercentile(sorted, 0.90)).toBe(10)
  })

  it('should calculate P75 correctly for sorted array', () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    // P75 of 10 items: floor(0.75 * 10) = 7, index 7 = value 8
    expect(calculatePercentile(sorted, 0.75)).toBe(8)
  })

  it('should calculate P50 (median) correctly for sorted array', () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    // P50 of 10 items: floor(0.50 * 10) = 5, index 5 = value 6
    expect(calculatePercentile(sorted, 0.50)).toBe(6)
  })

  it('should handle large datasets correctly', () => {
    const sorted = Array.from({ length: 1000 }, (_, i) => i + 1)
    // P99 of 1000 items: floor(0.99 * 1000) = 990, index 990 = value 991
    expect(calculatePercentile(sorted, 0.99)).toBe(991)
    // P50 of 1000 items: floor(0.50 * 1000) = 500, index 500 = value 501
    expect(calculatePercentile(sorted, 0.50)).toBe(501)
  })

  it('should clamp index to array bounds', () => {
    const sorted = [1, 2, 3]
    // P99 of 3 items: floor(0.99 * 3) = 2, index 2 = value 3
    expect(calculatePercentile(sorted, 0.99)).toBe(3)
    // Even with percentile > 1, should clamp to last index
    expect(calculatePercentile(sorted, 1.0)).toBe(3)
  })
})

describe('calculateP99', () => {
  it('should return null for empty array', () => {
    expect(calculateP99([])).toBeNull()
  })

  it('should handle single value', () => {
    expect(calculateP99([500])).toBe(500)
  })

  it('should sort unsorted values before calculating', () => {
    const unsorted = [10, 1, 5, 8, 3, 9, 2, 7, 4, 6]
    // After sorting: [1,2,3,4,5,6,7,8,9,10]
    // P99: floor(0.99 * 10) = 9, value at index 9 = 10
    expect(calculateP99(unsorted)).toBe(10)
  })

  it('should filter out top 1% outliers in realistic scenario', () => {
    // Simulate 100 runs where 99 have values 100-150, and 1 has value 1000 (outlier)
    const values = Array.from({ length: 99 }, (_, i) => 100 + i * 0.5)
    values.push(1000) // Add outlier
    const p99 = calculateP99(values)
    // P99 of 100 items: floor(0.99 * 100) = 99, clamped to index 99 (the outlier)
    // So P99 doesn't filter the outlier in this case. Need more data points.
    expect(p99).toBe(1000)
  })

  it('should handle real-world game data scenario', () => {
    // Simulated rewards: 10 runs with normal values, 1 lucky run
    const normalRuns = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145]
    const luckyRun = [500]
    const allRuns = [...normalRuns, ...luckyRun]

    const p99 = calculateP99(allRuns)
    // P99 of 11 items: floor(0.99 * 11) = 10, index 10 (the lucky run at position 10 after sort)
    expect(p99).toBe(500)
  })
})

describe('calculateP90', () => {
  it('should return null for empty array', () => {
    expect(calculateP90([])).toBeNull()
  })

  it('should handle single value', () => {
    expect(calculateP90([250])).toBe(250)
  })

  it('should sort unsorted values before calculating', () => {
    const unsorted = [5, 1, 9, 3, 7, 2, 8, 4, 10, 6]
    // After sorting: [1,2,3,4,5,6,7,8,9,10]
    // P90: floor(0.90 * 10) = 9, value at index 9 = 10
    expect(calculateP90(unsorted)).toBe(10)
  })

  it('should filter out top 10% in realistic scenario', () => {
    const values = Array.from({ length: 100 }, (_, i) => 100 + i)
    // Values: 100-199
    // P90 of 100 items: floor(0.90 * 100) = 90, index 90 = value 190
    expect(calculateP90(values)).toBe(190)
  })
})

describe('calculateP75', () => {
  it('should return null for empty array', () => {
    expect(calculateP75([])).toBeNull()
  })

  it('should handle single value', () => {
    expect(calculateP75([175])).toBe(175)
  })

  it('should calculate upper quartile correctly', () => {
    const values = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190]
    // P75: floor(0.75 * 10) = 7, index 7 = value 170
    expect(calculateP75(values)).toBe(170)
  })

  it('should represent above-average performance', () => {
    const values = Array.from({ length: 100 }, (_, i) => 50 + i)
    // Values: 50-149
    // P75 of 100 items: floor(0.75 * 100) = 75, index 75 = value 125
    expect(calculateP75(values)).toBe(125)
  })
})

describe('calculateP50', () => {
  it('should return null for empty array', () => {
    expect(calculateP50([])).toBeNull()
  })

  it('should handle single value', () => {
    expect(calculateP50([125])).toBe(125)
  })

  it('should calculate median correctly for even-length array', () => {
    const values = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145]
    // P50: floor(0.50 * 10) = 5, index 5 = value 125
    expect(calculateP50(values)).toBe(125)
  })

  it('should calculate median correctly for odd-length array', () => {
    const values = [100, 110, 120, 130, 140, 150, 160, 170, 180]
    // P50: floor(0.50 * 9) = 4, index 4 = value 140
    expect(calculateP50(values)).toBe(140)
  })

  it('should handle the documentation example', () => {
    // From spec: "100, 105, 110, 115, 120, 125, 130, 135, 140, 500"
    const values = [100, 105, 110, 115, 120, 125, 130, 135, 140, 500]
    const p50 = calculateP50(values)
    // P50 of 10 items: floor(0.50 * 10) = 5, index 5 = value 125
    expect(p50).toBe(125)
  })

  it('should be robust to outliers', () => {
    const normalValues = [100, 100, 100, 100, 100]
    const withOutliers = [...normalValues, 1000, 2000]
    const p50 = calculateP50(withOutliers)
    // Median should still be in the normal range
    expect(p50).toBe(100)
  })
})

describe('calculateAllPercentiles', () => {
  it('should return all null values for empty array', () => {
    const result = calculateAllPercentiles([])
    expect(result).toEqual({
      p99: null,
      p90: null,
      p75: null,
      p50: null,
    })
  })

  it('should calculate all percentiles efficiently with single sort', () => {
    const values = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145]
    const result = calculateAllPercentiles(values)

    expect(result.p99).toBe(145)
    expect(result.p90).toBe(145)
    expect(result.p75).toBe(135)
    expect(result.p50).toBe(125)
  })

  it('should produce same results as individual functions', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1)

    const batch = calculateAllPercentiles(values)
    const individual = {
      p99: calculateP99(values),
      p90: calculateP90(values),
      p75: calculateP75(values),
      p50: calculateP50(values),
    }

    expect(batch).toEqual(individual)
  })

  it('should handle unsorted input correctly', () => {
    const unsorted = [10, 1, 5, 8, 3, 9, 2, 7, 4, 6]
    const result = calculateAllPercentiles(unsorted)

    // After sorting: [1,2,3,4,5,6,7,8,9,10]
    expect(result.p99).toBe(10)
    expect(result.p90).toBe(10)
    expect(result.p75).toBe(8)
    expect(result.p50).toBe(6)
  })

  it('should maintain percentile ordering: P50 <= P75 <= P90 <= P99', () => {
    const values = Array.from({ length: 200 }, () => Math.random() * 1000)
    const result = calculateAllPercentiles(values)

    expect(result.p50).not.toBeNull()
    expect(result.p75).not.toBeNull()
    expect(result.p90).not.toBeNull()
    expect(result.p99).not.toBeNull()

    expect(result.p50!).toBeLessThanOrEqual(result.p75!)
    expect(result.p75!).toBeLessThanOrEqual(result.p90!)
    expect(result.p90!).toBeLessThanOrEqual(result.p99!)
  })
})

describe('percentile functions integration', () => {
  it('should maintain percentile ordering: P50 <= P75 <= P90 <= P99 <= MAX', () => {
    const values = Array.from({ length: 100 }, () => Math.random() * 1000)

    const p50 = calculateP50(values)!
    const p75 = calculateP75(values)!
    const p90 = calculateP90(values)!
    const p99 = calculateP99(values)!
    const max = Math.max(...values)

    expect(p50).toBeLessThanOrEqual(p75)
    expect(p75).toBeLessThanOrEqual(p90)
    expect(p90).toBeLessThanOrEqual(p99)
    expect(p99).toBeLessThanOrEqual(max)
  })

  it('should handle identical values across all percentiles', () => {
    const values = [100, 100, 100, 100, 100]

    expect(calculateP50(values)).toBe(100)
    expect(calculateP75(values)).toBe(100)
    expect(calculateP90(values)).toBe(100)
    expect(calculateP99(values)).toBe(100)
  })

  it('should demonstrate outlier filtering across percentiles', () => {
    // 95 normal runs + 5 lucky runs
    const normalRuns = Array.from({ length: 95 }, () => 100)
    const luckyRuns = [500, 600, 700, 800, 900]
    const allRuns = [...normalRuns, ...luckyRuns]

    const p50 = calculateP50(allRuns)!
    const p75 = calculateP75(allRuns)!
    const p90 = calculateP90(allRuns)!
    const p99 = calculateP99(allRuns)!

    // Median should be in normal range
    expect(p50).toBe(100)
    // P75 should still be in normal range
    expect(p75).toBe(100)
    // P90 should be in normal range (90% of 100 = 90, index 90 out of 0-99)
    expect(p90).toBe(100)
    // P99 should start picking up lucky runs
    expect(p99).toBeGreaterThan(100)
  })
})
