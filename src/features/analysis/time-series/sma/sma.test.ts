import { describe, it, expect } from 'vitest'
import { calculateSma } from './sma'
import type { ChartDataPoint } from '../chart-types'

function createDataPoint(value: number, date: string = '2024-01-01'): ChartDataPoint {
  return {
    date,
    value,
    timestamp: new Date(date),
  }
}

describe('calculateSma', () => {
  describe('standard SMA calculation', () => {
    it('calculates SMA correctly for period 3', () => {
      const dataPoints = [
        createDataPoint(10),
        createDataPoint(20),
        createDataPoint(30),
        createDataPoint(40),
        createDataPoint(50),
      ]

      const result = calculateSma(dataPoints, 3)

      expect(result[0].sma).toBeNull()
      expect(result[1].sma).toBeNull()
      expect(result[2].sma).toBe(20) // (10 + 20 + 30) / 3
      expect(result[3].sma).toBe(30) // (20 + 30 + 40) / 3
      expect(result[4].sma).toBe(40) // (30 + 40 + 50) / 3
    })

    it('calculates SMA correctly for period 5', () => {
      const dataPoints = [
        createDataPoint(100),
        createDataPoint(200),
        createDataPoint(300),
        createDataPoint(400),
        createDataPoint(500),
        createDataPoint(600),
      ]

      const result = calculateSma(dataPoints, 5)

      expect(result[0].sma).toBeNull()
      expect(result[1].sma).toBeNull()
      expect(result[2].sma).toBeNull()
      expect(result[3].sma).toBeNull()
      expect(result[4].sma).toBe(300) // (100 + 200 + 300 + 400 + 500) / 5
      expect(result[5].sma).toBe(400) // (200 + 300 + 400 + 500 + 600) / 5
    })

    it('calculates SMA correctly for period 10', () => {
      const dataPoints = Array.from({ length: 12 }, (_, i) =>
        createDataPoint((i + 1) * 10)
      )

      const result = calculateSma(dataPoints, 10)

      // First 9 points should be null
      for (let i = 0; i < 9; i++) {
        expect(result[i].sma).toBeNull()
      }

      // Point 10 (index 9): sum of 10+20+30+40+50+60+70+80+90+100 = 550, avg = 55
      expect(result[9].sma).toBe(55)

      // Point 11 (index 10): sum of 20+30+40+50+60+70+80+90+100+110 = 650, avg = 65
      expect(result[10].sma).toBe(65)
    })
  })

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = calculateSma([], 3)
      expect(result).toEqual([])
    })

    it('returns all null SMA values when data points fewer than period', () => {
      const dataPoints = [
        createDataPoint(10),
        createDataPoint(20),
      ]

      const result = calculateSma(dataPoints, 5)

      expect(result[0].sma).toBeNull()
      expect(result[1].sma).toBeNull()
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

      const result = calculateSma(dataPoints, 3)

      expect(result[0].runInfo).toEqual(dataPoints[0].runInfo)
      expect(result[1].runInfo).toBeUndefined()
      expect(result[2].periodInfo).toEqual(dataPoints[2].periodInfo)
    })

    it('handles single data point', () => {
      const dataPoints = [createDataPoint(100)]
      const result = calculateSma(dataPoints, 3)

      expect(result).toHaveLength(1)
      expect(result[0].sma).toBeNull()
      expect(result[0].value).toBe(100)
    })

    it('handles exact number of points as period', () => {
      const dataPoints = [
        createDataPoint(10),
        createDataPoint(20),
        createDataPoint(30),
      ]

      const result = calculateSma(dataPoints, 3)

      expect(result[0].sma).toBeNull()
      expect(result[1].sma).toBeNull()
      expect(result[2].sma).toBe(20) // Only the last point has SMA
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

      calculateSma(dataPoints, 3)

      expect(dataPoints).toEqual(originalValues)
      expect(dataPoints[0]).not.toHaveProperty('sma')
    })
  })
})
