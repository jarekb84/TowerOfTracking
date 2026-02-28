import { describe, it, expect } from 'vitest'
import { groupRunsByDateKey, calculateRunAggregates } from './date-aggregation'
import { ParsedGameRun } from '@/shared/types/game-run.types'

const mockRun1: ParsedGameRun = {
  id: '1',
  timestamp: new Date('2025-08-31T10:00:00'),
  tier: 10,
  wave: 100,
  coinsEarned: 1000000,
  cellsEarned: 50000,
  realTime: 3600,
  gameSpeed: 2.0,
  fields: {},
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
  gameSpeed: 2.0,
  fields: {},
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
  gameSpeed: 2.0,
  fields: {},
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

})