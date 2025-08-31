import { describe, it, expect } from 'vitest'
import { groupRunsByDateKey, calculateRunAggregates, prepareWeeklyData, prepareMonthlyData, prepareYearlyData } from './date-aggregation'
import { ParsedGameRun } from '../types/game-run.types'

const mockRun1: ParsedGameRun = {
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

const mockRun2: ParsedGameRun = {
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

const mockRun3: ParsedGameRun = {
  id: '3',
  timestamp: new Date('2025-09-01T10:00:00'),
  tier: 11,
  wave: 130,
  coinsEarned: 1500000,
  cellsEarned: 75000,
  realTime: 4500,
  rawData: {},
  runType: 'tournament'
}

describe('Date Aggregation Utils', () => {
  describe('groupRunsByDateKey', () => {
    it('should group runs by the provided date key generator', () => {
      const runs = [mockRun1, mockRun2, mockRun3]
      const dateKeyGenerator = (timestamp: Date) => timestamp.toDateString()
      
      const grouped = groupRunsByDateKey(runs, dateKeyGenerator)
      
      expect(grouped.size).toBe(2) // Two different dates
      expect(grouped.get('Sun Aug 31 2025')).toHaveLength(2) // Two runs on Aug 31
      expect(grouped.get('Mon Sep 01 2025')).toHaveLength(1) // One run on Sep 1
    })

    it('should handle empty runs array', () => {
      const grouped = groupRunsByDateKey([], () => 'test')
      expect(grouped.size).toBe(0)
    })
  })

  describe('calculateRunAggregates', () => {
    it('should calculate correct aggregates for multiple runs', () => {
      const runs = [mockRun1, mockRun2]
      
      const aggregates = calculateRunAggregates(runs)
      
      expect(aggregates.totalCoins).toBe(2200000) // 1M + 1.2M
      expect(aggregates.totalCells).toBe(110000) // 50K + 60K
      expect(aggregates.runCount).toBe(2)
      expect(aggregates.avgCoins).toBe(1100000) // 2.2M / 2
      expect(aggregates.avgCells).toBe(55000) // 110K / 2
    })

    it('should handle single run', () => {
      const runs = [mockRun1]
      
      const aggregates = calculateRunAggregates(runs)
      
      expect(aggregates.totalCoins).toBe(1000000)
      expect(aggregates.totalCells).toBe(50000)
      expect(aggregates.runCount).toBe(1)
      expect(aggregates.avgCoins).toBe(1000000)
      expect(aggregates.avgCells).toBe(50000)
    })

    it('should handle empty runs array', () => {
      const aggregates = calculateRunAggregates([])
      
      expect(aggregates.totalCoins).toBe(0)
      expect(aggregates.totalCells).toBe(0)
      expect(aggregates.runCount).toBe(0)
      expect(aggregates.avgCoins).toBe(0)
      expect(aggregates.avgCells).toBe(0)
    })
  })

  describe('prepareWeeklyData', () => {
    it('should group runs by week starting on Sunday', () => {
      // August 31, 2025 is a Sunday, September 1, 2025 is a Monday (same week)
      const runs = [mockRun1, mockRun2, mockRun3]
      
      const weeklyData = prepareWeeklyData(runs)
      
      expect(weeklyData).toHaveLength(1) // All runs are in the same week (Aug 31-Sep 6)
      
      // First week (Aug 31 - Sep 6)
      const firstWeek = weeklyData[0]
      expect(firstWeek.date).toBe('Aug 31')
      expect(firstWeek.totalCoins).toBe(3700000) // All three runs are in the same week
      expect(firstWeek.totalCells).toBe(185000)
      expect(firstWeek.runCount).toBe(3)
    })

    it('should sort weekly data by timestamp', () => {
      const olderRun: ParsedGameRun = {
        ...mockRun1,
        timestamp: new Date('2025-08-24T10:00:00'), // Previous Sunday
        id: 'older'
      }
      const runs = [mockRun1, olderRun]
      
      const weeklyData = prepareWeeklyData(runs)
      
      expect(weeklyData).toHaveLength(2)
      expect(weeklyData[0].date).toBe('Aug 24') // Earlier week first
      expect(weeklyData[1].date).toBe('Aug 31') // Later week second
    })
  })

  describe('prepareMonthlyData', () => {
    it('should group runs by month', () => {
      const runs = [mockRun1, mockRun2, mockRun3]
      
      const monthlyData = prepareMonthlyData(runs)
      
      expect(monthlyData).toHaveLength(2) // August and September
      
      const augustData = monthlyData.find(month => month.date === 'Aug 2025')
      expect(augustData).toBeDefined()
      expect(augustData!.totalCoins).toBe(2200000) // First two runs
      expect(augustData!.runCount).toBe(2)
      
      const septemberData = monthlyData.find(month => month.date === 'Sep 2025')
      expect(septemberData).toBeDefined()
      expect(septemberData!.totalCoins).toBe(1500000) // Third run
      expect(septemberData!.runCount).toBe(1)
    })
  })

  describe('prepareYearlyData', () => {
    it('should group runs by year', () => {
      const run2024: ParsedGameRun = {
        ...mockRun1,
        timestamp: new Date('2024-12-31T10:00:00'),
        id: '2024'
      }
      const runs = [mockRun1, run2024]
      
      const yearlyData = prepareYearlyData(runs)
      
      expect(yearlyData).toHaveLength(2) // 2024 and 2025
      
      const data2024 = yearlyData.find(year => year.date === '2024')
      expect(data2024).toBeDefined()
      expect(data2024!.runCount).toBe(1)
      
      const data2025 = yearlyData.find(year => year.date === '2025')
      expect(data2025).toBeDefined()
      expect(data2025!.runCount).toBe(1)
    })

    it('should sort yearly data chronologically', () => {
      const run2024: ParsedGameRun = {
        ...mockRun1,
        timestamp: new Date('2024-12-31T10:00:00'),
        id: '2024'
      }
      const runs = [mockRun1, run2024] // 2025 run first, then 2024
      
      const yearlyData = prepareYearlyData(runs)
      
      expect(yearlyData[0].date).toBe('2024') // Earlier year first
      expect(yearlyData[1].date).toBe('2025') // Later year second
    })
  })
})