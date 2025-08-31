import { describe, it, expect } from 'vitest'
import { prepareTimeSeriesData, getAvailableTimePeriods } from './chart-data'
import { ParsedGameRun } from '../types/game-run.types'

describe('Chart Data Utils', () => {
  describe('getAvailableTimePeriods', () => {
    it('should show daily, weekly, and monthly views even with single day of data', () => {
      const runs: ParsedGameRun[] = [
        {
          id: '1',
          timestamp: new Date('2025-08-31T10:00:00'),
          tier: 10,
          wave: 100,
          coinsEarned: 1000000,
          cellsEarned: 50000,
          realTime: 3600,
          rawData: {},
          runType: 'farm'
        },
        {
          id: '2',
          timestamp: new Date('2025-08-31T14:00:00'),
          tier: 10,
          wave: 120,
          coinsEarned: 1200000,
          cellsEarned: 60000,
          realTime: 4000,
          rawData: {},
          runType: 'farm'
        }
      ]

      const periods = getAvailableTimePeriods(runs)
      const periodTypes = periods.map(p => p.period)

      expect(periodTypes).toContain('hourly')
      expect(periodTypes).toContain('run')
      expect(periodTypes).toContain('daily')
      expect(periodTypes).toContain('weekly')
      expect(periodTypes).toContain('monthly')
      expect(periodTypes).not.toContain('yearly') // Only one year of data
    })

    it('should show yearly view only when data spans multiple years', () => {
      const runs: ParsedGameRun[] = [
        {
          id: '1',
          timestamp: new Date('2024-08-31T10:00:00'),
          tier: 10,
          wave: 100,
          coinsEarned: 1000000,
          cellsEarned: 50000,
          realTime: 3600,
          rawData: {},
          runType: 'farm'
        },
        {
          id: '2',
          timestamp: new Date('2025-08-31T14:00:00'),
          tier: 10,
          wave: 120,
          coinsEarned: 1200000,
          cellsEarned: 60000,
          realTime: 4000,
          rawData: {},
          runType: 'farm'
        }
      ]

      const periods = getAvailableTimePeriods(runs)
      const periodTypes = periods.map(p => p.period)

      expect(periodTypes).toContain('yearly')
    })

    it('should only show hourly and run views when no data', () => {
      const runs: ParsedGameRun[] = []

      const periods = getAvailableTimePeriods(runs)
      const periodTypes = periods.map(p => p.period)

      expect(periodTypes).toEqual(['hourly', 'run'])
    })
  })

  describe('prepareTimeSeriesData', () => {
    it('should include current day data in daily view', () => {
      const today = new Date('2025-08-31T10:00:00')
      const runs: ParsedGameRun[] = [
        {
          id: '1',
          timestamp: today,
          tier: 10,
          wave: 100,
          coinsEarned: 1000000,
          cellsEarned: 50000,
          realTime: 3600,
          rawData: {},
          runType: 'farm'
        }
      ]

      const dailyData = prepareTimeSeriesData(runs, 'daily', 'coins')
      
      expect(dailyData).toHaveLength(1)
      expect(dailyData[0].value).toBe(1000000)
      expect(dailyData[0].date).toBe('Aug 31')
    })

    it('should include current week data in weekly view', () => {
      // August 31, 2025 is actually a Sunday
      const sunday = new Date('2025-08-31T10:00:00')
      const runs: ParsedGameRun[] = [
        {
          id: '1',
          timestamp: sunday,
          tier: 10,
          wave: 100,
          coinsEarned: 1000000,
          cellsEarned: 50000,
          realTime: 3600,
          rawData: {},
          runType: 'farm'
        }
      ]

      const weeklyData = prepareTimeSeriesData(runs, 'weekly', 'coins')
      
      expect(weeklyData).toHaveLength(1)
      expect(weeklyData[0].value).toBe(1000000)
      // Week should start on Sunday (Aug 31 is a Sunday, so it's the start of the week)
      expect(weeklyData[0].date).toBe('Aug 31')
    })

    it('should include current month data in monthly view', () => {
      const august = new Date('2025-08-31T10:00:00')
      const runs: ParsedGameRun[] = [
        {
          id: '1',
          timestamp: august,
          tier: 10,
          wave: 100,
          coinsEarned: 1000000,
          cellsEarned: 50000,
          realTime: 3600,
          rawData: {},
          runType: 'farm'
        }
      ]

      const monthlyData = prepareTimeSeriesData(runs, 'monthly', 'coins')
      
      expect(monthlyData).toHaveLength(1)
      expect(monthlyData[0].value).toBe(1000000)
      expect(monthlyData[0].date).toBe('Aug 2025')
    })

    it('should aggregate multiple runs in the same period correctly', () => {
      const runs: ParsedGameRun[] = [
        {
          id: '1',
          timestamp: new Date('2025-08-31T10:00:00'),
          tier: 10,
          wave: 100,
          coinsEarned: 1000000,
          cellsEarned: 50000,
          realTime: 3600,
          rawData: {},
          runType: 'farm'
        },
        {
          id: '2',
          timestamp: new Date('2025-08-31T14:00:00'),
          tier: 10,
          wave: 120,
          coinsEarned: 1200000,
          cellsEarned: 60000,
          realTime: 4000,
          rawData: {},
          runType: 'farm'
        }
      ]

      const dailyData = prepareTimeSeriesData(runs, 'daily', 'coins')
      
      expect(dailyData).toHaveLength(1)
      expect(dailyData[0].value).toBe(2200000) // Sum of both runs
      expect(dailyData[0].date).toBe('Aug 31')
    })

    it('should handle cells metric correctly', () => {
      const runs: ParsedGameRun[] = [
        {
          id: '1',
          timestamp: new Date('2025-08-31T10:00:00'),
          tier: 10,
          wave: 100,
          coinsEarned: 1000000,
          cellsEarned: 50000,
          realTime: 3600,
          rawData: {},
          runType: 'farm'
        }
      ]

      const cellsData = prepareTimeSeriesData(runs, 'daily', 'cells')
      
      expect(cellsData).toHaveLength(1)
      expect(cellsData[0].value).toBe(50000)
    })

    it('should correctly group by week starting on Sunday', () => {
      const runs: ParsedGameRun[] = [
        // Saturday Aug 30, 2025
        {
          id: '1',
          timestamp: new Date('2025-08-30T10:00:00'),
          tier: 10,
          wave: 100,
          coinsEarned: 1000000,
          cellsEarned: 50000,
          realTime: 3600,
          rawData: {},
          runType: 'farm'
        },
        // Sunday Aug 31, 2025 (should be in next week)
        {
          id: '2',
          timestamp: new Date('2025-08-31T10:00:00'),
          tier: 10,
          wave: 120,
          coinsEarned: 1200000,
          cellsEarned: 60000,
          realTime: 4000,
          rawData: {},
          runType: 'farm'
        }
      ]

      const weeklyData = prepareTimeSeriesData(runs, 'weekly', 'coins')
      
      expect(weeklyData).toHaveLength(2) // Two different weeks
      expect(weeklyData[0].value).toBe(1000000) // First week (Saturday Aug 30)
      expect(weeklyData[1].value).toBe(1200000) // Second week (Sunday Aug 31)
    })
  })
})