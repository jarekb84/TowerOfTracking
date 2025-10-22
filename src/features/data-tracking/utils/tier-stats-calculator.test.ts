import { describe, it, expect } from 'vitest'
import type { ParsedGameRun } from '../types/game-run.types'
import type { AvailableField, TierStatsColumnConfig } from '../types/tier-stats-config.types'
import {
  calculateDynamicTierStats,
  calculateFieldStats,
  buildColumnDefinitions,
  getCellValue,
  calculateSummaryStats
} from './tier-stats-calculator'
import { createGameRunField } from './field-utils'

describe('tier-stats-calculator', () => {
  const createMockRun = (
    tier: number,
    wave: number,
    coins: number,
    cells: number,
    duration: number
  ): ParsedGameRun => ({
    id: `run-${tier}-${wave}`,
    timestamp: new Date('2024-01-01'),
    fields: {
      tier: createGameRunField('Tier', tier.toString()),
      wave: createGameRunField('Wave', wave.toString()),
      realTime: createGameRunField('Real Time', `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m 0s`),
      coinsEarned: createGameRunField('Coins Earned', coins.toString()),
      cellsEarned: createGameRunField('Cells Earned', cells.toString())
    },
    tier,
    wave,
    coinsEarned: coins,
    cellsEarned: cells,
    realTime: duration,
    runType: 'farm'
  })

  describe('calculateFieldStats', () => {
    it('should find maximum value across runs', () => {
      const runs = [
        createMockRun(5, 1000, 100000, 5000, 3600),
        createMockRun(5, 1200, 150000, 6000, 3600),
        createMockRun(5, 900, 80000, 4000, 3600)
      ]

      const stats = calculateFieldStats(runs, 'coinsEarned')

      expect(stats?.maxValue).toBe(150000)
      expect(stats?.maxValueRun.wave).toBe(1200)
    })

    it('should calculate hourly rate from run with max value', () => {
      const runs = [
        createMockRun(5, 1000, 100000, 5000, 7200), // 2 hours, 50K/hour
        createMockRun(5, 1200, 150000, 6000, 3600), // 1 hour, 150K/hour (max coins)
        createMockRun(5, 900, 80000, 4000, 10800) // 3 hours, 26.7K/hour
      ]

      const stats = calculateFieldStats(runs, 'coinsEarned')

      expect(stats?.maxValue).toBe(150000)
      expect(stats?.hourlyRate).toBe(150000) // 150000 / 3600 * 3600
    })

    it('should track longest duration independently', () => {
      const runs = [
        createMockRun(5, 1000, 100000, 5000, 3600),
        createMockRun(5, 1200, 150000, 6000, 7200), // max coins, 2 hours
        createMockRun(5, 900, 80000, 4000, 10800) // longest: 3 hours
      ]

      const stats = calculateFieldStats(runs, 'coinsEarned')

      expect(stats?.longestDuration).toBe(10800)
      expect(stats?.longestDurationRun?.wave).toBe(900)
      expect(stats?.maxValueRun.wave).toBe(1200) // Different run
    })

    it('should return null for non-existent field', () => {
      const runs = [createMockRun(5, 1000, 100000, 5000, 3600)]
      const stats = calculateFieldStats(runs, 'nonExistentField')

      expect(stats).toBeNull()
    })

    it('should handle runs with zero duration', () => {
      const runs = [
        createMockRun(5, 1000, 100000, 5000, 0)
      ]

      const stats = calculateFieldStats(runs, 'coinsEarned')

      expect(stats?.maxValue).toBe(100000)
      expect(stats?.hourlyRate).toBeUndefined()
    })
  })

  describe('calculateDynamicTierStats', () => {
    it('should calculate stats for multiple tiers', () => {
      const runs = [
        createMockRun(5, 1000, 100000, 5000, 3600),
        createMockRun(5, 1200, 150000, 6000, 3600),
        createMockRun(6, 1500, 200000, 8000, 3600),
        createMockRun(6, 1400, 180000, 7000, 3600)
      ]

      const columns: TierStatsColumnConfig[] = [
        { fieldName: 'coinsEarned', showHourlyRate: true },
        { fieldName: 'cellsEarned', showHourlyRate: true }
      ]

      const tierStats = calculateDynamicTierStats(runs, columns)

      expect(tierStats).toHaveLength(2)
      expect(tierStats[0].tier).toBe(6) // Highest tier first
      expect(tierStats[1].tier).toBe(5)
    })

    it('should calculate correct max values per tier', () => {
      const runs = [
        createMockRun(5, 1000, 100000, 5000, 3600),
        createMockRun(5, 1200, 150000, 6000, 3600),
        createMockRun(6, 1500, 200000, 8000, 3600)
      ]

      const columns: TierStatsColumnConfig[] = [
        { fieldName: 'coinsEarned', showHourlyRate: false }
      ]

      const tierStats = calculateDynamicTierStats(runs, columns)

      const tier5 = tierStats.find(t => t.tier === 5)
      const tier6 = tierStats.find(t => t.tier === 6)

      expect(tier5?.fields.coinsEarned.maxValue).toBe(150000)
      expect(tier6?.fields.coinsEarned.maxValue).toBe(200000)
    })

    it('should track run count per tier', () => {
      const runs = [
        createMockRun(5, 1000, 100000, 5000, 3600),
        createMockRun(5, 1200, 150000, 6000, 3600),
        createMockRun(5, 900, 80000, 4000, 3600),
        createMockRun(6, 1500, 200000, 8000, 3600)
      ]

      const columns: TierStatsColumnConfig[] = [
        { fieldName: 'wave', showHourlyRate: false }
      ]

      const tierStats = calculateDynamicTierStats(runs, columns)

      const tier5 = tierStats.find(t => t.tier === 5)
      const tier6 = tierStats.find(t => t.tier === 6)

      expect(tier5?.runCount).toBe(3)
      expect(tier6?.runCount).toBe(1)
    })

    it('should handle empty runs array', () => {
      const columns: TierStatsColumnConfig[] = [
        { fieldName: 'coinsEarned', showHourlyRate: false }
      ]

      const tierStats = calculateDynamicTierStats([], columns)
      expect(tierStats).toEqual([])
    })
  })

  describe('buildColumnDefinitions', () => {
    const availableFields: AvailableField[] = [
      { fieldName: 'wave', displayName: 'Wave', dataType: 'number', isNumeric: true, canHaveHourlyRate: true },
      { fieldName: 'coinsEarned', displayName: 'Coins Earned', dataType: 'number', isNumeric: true, canHaveHourlyRate: true },
      { fieldName: 'killedBy', displayName: 'Killed By', dataType: 'string', isNumeric: false, canHaveHourlyRate: false }
    ]

    it('should create columns for each selected field', () => {
      const selectedColumns: TierStatsColumnConfig[] = [
        { fieldName: 'wave', showHourlyRate: false },
        { fieldName: 'coinsEarned', showHourlyRate: false }
      ]

      const columns = buildColumnDefinitions(selectedColumns, availableFields)

      expect(columns).toHaveLength(2)
      expect(columns[0].fieldName).toBe('wave')
      expect(columns[1].fieldName).toBe('coinsEarned')
    })

    it('should set showHourlyRate flag when enabled for numeric fields', () => {
      const selectedColumns: TierStatsColumnConfig[] = [
        { fieldName: 'wave', showHourlyRate: false },
        { fieldName: 'coinsEarned', showHourlyRate: true }
      ]

      const columns = buildColumnDefinitions(selectedColumns, availableFields)

      expect(columns).toHaveLength(2)
      expect(columns[0].showHourlyRate).toBe(false)
      expect(columns[1].showHourlyRate).toBe(true)
    })

    it('should not enable hourly rate for non-numeric fields even if requested', () => {
      const selectedColumns: TierStatsColumnConfig[] = [
        { fieldName: 'killedBy', showHourlyRate: true }
      ]

      const columns = buildColumnDefinitions(selectedColumns, availableFields)

      expect(columns).toHaveLength(1)
      expect(columns[0].showHourlyRate).toBe(false) // Can't have hourly rate for non-numeric
    })

    it('should skip unavailable fields', () => {
      const selectedColumns: TierStatsColumnConfig[] = [
        { fieldName: 'wave', showHourlyRate: false },
        { fieldName: 'invalidField', showHourlyRate: false },
        { fieldName: 'coinsEarned', showHourlyRate: false }
      ]

      const columns = buildColumnDefinitions(selectedColumns, availableFields)

      expect(columns).toHaveLength(2)
      expect(columns.map(c => c.fieldName)).toEqual(['wave', 'coinsEarned'])
    })
  })

  describe('getCellValue', () => {
    const runs = [
      createMockRun(5, 1000, 100000, 5000, 3600)
    ]

    const columns: TierStatsColumnConfig[] = [
      { fieldName: 'coinsEarned', showHourlyRate: true }
    ]

    const tierStats = calculateDynamicTierStats(runs, columns)[0]

    it('should return max value for base column', () => {
      const value = getCellValue(tierStats, 'coinsEarned', false)
      expect(value).toBe(100000)
    })

    it('should return hourly rate for hourly column', () => {
      const value = getCellValue(tierStats, 'coinsEarned', true)
      expect(value).toBe(100000) // 100000 / 3600 * 3600
    })

    it('should return null for non-existent field', () => {
      const value = getCellValue(tierStats, 'invalidField', false)
      expect(value).toBeNull()
    })
  })

  describe('calculateSummaryStats', () => {
    it('should calculate total tiers and runs', () => {
      const runs = [
        createMockRun(5, 1000, 100000, 5000, 3600),
        createMockRun(5, 1200, 150000, 6000, 3600),
        createMockRun(6, 1500, 200000, 8000, 3600)
      ]

      const columns: TierStatsColumnConfig[] = [
        { fieldName: 'coinsEarned', showHourlyRate: false }
      ]

      const tierStats = calculateDynamicTierStats(runs, columns)
      const summary = calculateSummaryStats(tierStats, columns)

      expect(summary.totalTiers).toBe(2)
      expect(summary.totalRuns).toBe(3)
    })

    it('should find highest value across all tiers', () => {
      const runs = [
        createMockRun(5, 1000, 100000, 5000, 3600),
        createMockRun(5, 1200, 150000, 6000, 3600),
        createMockRun(6, 1500, 200000, 8000, 3600)
      ]

      const columns: TierStatsColumnConfig[] = [
        { fieldName: 'coinsEarned', showHourlyRate: false },
        { fieldName: 'cellsEarned', showHourlyRate: false }
      ]

      const tierStats = calculateDynamicTierStats(runs, columns)
      const summary = calculateSummaryStats(tierStats, columns)

      expect(summary.highestValues.coinsEarned).toBe(200000)
      expect(summary.highestValues.cellsEarned).toBe(8000)
    })

    it('should handle empty tier stats', () => {
      const summary = calculateSummaryStats([], [])

      expect(summary.totalTiers).toBe(0)
      expect(summary.totalRuns).toBe(0)
      expect(summary.highestValues).toEqual({})
    })
  })
})
