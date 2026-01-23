import { describe, it, expect } from 'vitest'
import { calculateMovingAverage } from './moving-average-calculation'
import type { ChartDataPoint } from '../chart-types'

function createDataPoint(value: number, date: string = '2024-01-01'): ChartDataPoint {
  return {
    date,
    value,
    timestamp: new Date(date),
  }
}

describe('calculateMovingAverage', () => {
  describe('standard moving average calculation', () => {
    it('calculates moving average correctly for window size 3', () => {
      const dataPoints = [
        createDataPoint(10),
        createDataPoint(20),
        createDataPoint(30),
        createDataPoint(40),
        createDataPoint(50),
      ]

      const result = calculateMovingAverage(dataPoints, 3)

      expect(result[0].movingAverage).toBeNull()
      expect(result[1].movingAverage).toBeNull()
      expect(result[2].movingAverage).toBe(20) // (10 + 20 + 30) / 3
      expect(result[3].movingAverage).toBe(30) // (20 + 30 + 40) / 3
      expect(result[4].movingAverage).toBe(40) // (30 + 40 + 50) / 3
    })

    it('calculates moving average correctly for window size 5', () => {
      const dataPoints = [
        createDataPoint(100),
        createDataPoint(200),
        createDataPoint(300),
        createDataPoint(400),
        createDataPoint(500),
        createDataPoint(600),
      ]

      const result = calculateMovingAverage(dataPoints, 5)

      expect(result[0].movingAverage).toBeNull()
      expect(result[1].movingAverage).toBeNull()
      expect(result[2].movingAverage).toBeNull()
      expect(result[3].movingAverage).toBeNull()
      expect(result[4].movingAverage).toBe(300) // (100 + 200 + 300 + 400 + 500) / 5
      expect(result[5].movingAverage).toBe(400) // (200 + 300 + 400 + 500 + 600) / 5
    })

    it('calculates moving average correctly for window size 10', () => {
      const dataPoints = Array.from({ length: 12 }, (_, i) =>
        createDataPoint((i + 1) * 10)
      )

      const result = calculateMovingAverage(dataPoints, 10)

      // First 9 points should be null
      for (let i = 0; i < 9; i++) {
        expect(result[i].movingAverage).toBeNull()
      }

      // Point 10 (index 9): sum of 10+20+30+40+50+60+70+80+90+100 = 550, avg = 55
      expect(result[9].movingAverage).toBe(55)

      // Point 11 (index 10): sum of 20+30+40+50+60+70+80+90+100+110 = 650, avg = 65
      expect(result[10].movingAverage).toBe(65)
    })
  })

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = calculateMovingAverage([], 3)
      expect(result).toEqual([])
    })

    it('returns all null moving average values when data points fewer than window size', () => {
      const dataPoints = [
        createDataPoint(10),
        createDataPoint(20),
      ]

      const result = calculateMovingAverage(dataPoints, 5)

      expect(result[0].movingAverage).toBeNull()
      expect(result[1].movingAverage).toBeNull()
    })

    it('preserves original data point properties', () => {
      const dataPoints: ChartDataPoint[] = [
        {
          date: '2024-01-01',
          value: 100,
          timestamp: new Date('2024-01-01'),
          runInfo: { tier: 5, wave: 10, realTime: 3600, timestamp: new Date('2024-01-01 10:00') },
        },
        {
          date: '2024-01-02',
          value: 200,
          timestamp: new Date('2024-01-02'),
        },
        {
          date: '2024-01-03',
          value: 300,
          timestamp: new Date('2024-01-03'),
          periodInfo: { dailyAverage: 250, daysInPeriod: 2 },
        },
      ]

      const result = calculateMovingAverage(dataPoints, 3)

      expect(result[0].runInfo).toEqual(dataPoints[0].runInfo)
      expect(result[1].runInfo).toBeUndefined()
      expect(result[2].periodInfo).toEqual(dataPoints[2].periodInfo)
    })

    it('handles single data point', () => {
      const dataPoints = [createDataPoint(100)]
      const result = calculateMovingAverage(dataPoints, 3)

      expect(result).toHaveLength(1)
      expect(result[0].movingAverage).toBeNull()
      expect(result[0].value).toBe(100)
    })

    it('handles exact number of points as window size', () => {
      const dataPoints = [
        createDataPoint(10),
        createDataPoint(20),
        createDataPoint(30),
      ]

      const result = calculateMovingAverage(dataPoints, 3)

      expect(result[0].movingAverage).toBeNull()
      expect(result[1].movingAverage).toBeNull()
      expect(result[2].movingAverage).toBe(20) // Only the last point has moving average
    })
  })

  describe('does not mutate input', () => {
    it('returns new array without modifying original', () => {
      const dataPoints = [
        createDataPoint(10),
        createDataPoint(20),
        createDataPoint(30),
      ]
      const originalValues = dataPoints.map(p => ({ ...p }))

      calculateMovingAverage(dataPoints, 3)

      expect(dataPoints).toEqual(originalValues)
      expect(dataPoints[0]).not.toHaveProperty('movingAverage')
    })
  })
})
