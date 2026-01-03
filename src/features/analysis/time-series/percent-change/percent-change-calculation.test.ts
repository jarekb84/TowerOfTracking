import { describe, it, expect } from 'vitest'
import { calculatePercentChange } from './percent-change-calculation'
import type { ChartDataPoint } from '../chart-types'

function createDataPoint(
  value: number,
  date: string = '2024-01-01'
): ChartDataPoint {
  return {
    date,
    value,
    timestamp: new Date(date),
  }
}

describe('calculatePercentChange', () => {
  describe('standard calculations', () => {
    it('sets first data point to 0%', () => {
      const dataPoints = [createDataPoint(100)]
      const result = calculatePercentChange(dataPoints)
      expect(result[0].percentChange).toBe(0)
    })

    it('calculates positive percentage change correctly', () => {
      const dataPoints = [createDataPoint(100), createDataPoint(150)]
      const result = calculatePercentChange(dataPoints)
      expect(result[0].percentChange).toBe(0)
      expect(result[1].percentChange).toBe(50) // (150-100)/100 * 100
    })

    it('calculates negative percentage change correctly', () => {
      const dataPoints = [createDataPoint(200), createDataPoint(100)]
      const result = calculatePercentChange(dataPoints)
      expect(result[1].percentChange).toBe(-50) // (100-200)/200 * 100
    })

    it('calculates multi-point series correctly', () => {
      const dataPoints = [
        createDataPoint(100),
        createDataPoint(200), // +100%
        createDataPoint(150), // -25%
        createDataPoint(150), // 0%
      ]
      const result = calculatePercentChange(dataPoints)
      expect(result[0].percentChange).toBe(0)
      expect(result[1].percentChange).toBe(100)
      expect(result[2].percentChange).toBe(-25)
      expect(result[3].percentChange).toBe(0)
    })

    it('handles doubling correctly', () => {
      const dataPoints = [createDataPoint(50), createDataPoint(100)]
      const result = calculatePercentChange(dataPoints)
      expect(result[1].percentChange).toBe(100) // doubled = +100%
    })

    it('handles halving correctly', () => {
      const dataPoints = [createDataPoint(100), createDataPoint(50)]
      const result = calculatePercentChange(dataPoints)
      expect(result[1].percentChange).toBe(-50) // halved = -50%
    })
  })

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = calculatePercentChange([])
      expect(result).toEqual([])
    })

    it('handles previous value of zero (increase)', () => {
      const dataPoints = [createDataPoint(0), createDataPoint(100)]
      const result = calculatePercentChange(dataPoints)
      expect(result[1].percentChange).toBe(100)
    })

    it('handles previous value of zero (decrease)', () => {
      const dataPoints = [createDataPoint(0), createDataPoint(-50)]
      const result = calculatePercentChange(dataPoints)
      expect(result[1].percentChange).toBe(-100)
    })

    it('handles both values zero', () => {
      const dataPoints = [createDataPoint(0), createDataPoint(0)]
      const result = calculatePercentChange(dataPoints)
      expect(result[1].percentChange).toBe(0)
    })

    it('preserves original data point properties', () => {
      const dataPoints: ChartDataPoint[] = [
        {
          date: '2024-01-01',
          value: 100,
          timestamp: new Date('2024-01-01'),
          runInfo: {
            tier: 5,
            wave: 10,
            realTime: 3600,
            timestamp: new Date('2024-01-01 10:00'),
          },
        },
        {
          date: '2024-01-02',
          value: 200,
          timestamp: new Date('2024-01-02'),
          movingAverage: 150,
        },
      ]
      const result = calculatePercentChange(dataPoints)
      expect(result[0].runInfo).toEqual(dataPoints[0].runInfo)
      expect(result[1].movingAverage).toBe(150)
    })
  })

  describe('does not mutate input', () => {
    it('returns new array without modifying original', () => {
      const dataPoints = [createDataPoint(100), createDataPoint(200)]
      const originalValues = dataPoints.map((p) => ({ ...p }))

      calculatePercentChange(dataPoints)

      expect(dataPoints).toEqual(originalValues)
      expect(dataPoints[0]).not.toHaveProperty('percentChange')
    })
  })

  describe('large changes', () => {
    it('handles very large positive changes', () => {
      const dataPoints = [createDataPoint(1), createDataPoint(1000)]
      const result = calculatePercentChange(dataPoints)
      expect(result[1].percentChange).toBe(99900) // (1000-1)/1 * 100
    })

    it('handles very small changes', () => {
      const dataPoints = [createDataPoint(1000000), createDataPoint(1000001)]
      const result = calculatePercentChange(dataPoints)
      expect(result[1].percentChange).toBeCloseTo(0.0001, 4)
    })
  })
})
