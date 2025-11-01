/* eslint-disable max-lines */
// Test file covering multiple functions with comprehensive percentile aggregation tests
import { describe, it, expect } from 'vitest'
import type { ParsedGameRun } from '@/features/data-tracking/types/game-run.types'
import type { AvailableField, TierStatsColumnConfig } from '../types'
import { TierStatsAggregation } from '../types'
import {
  calculateDynamicTierStats,
  calculateFieldStats,
  buildColumnDefinitions,
  getCellValue,
  calculateSummaryStats
} from './tier-stats-calculator'
import { createGameRunField } from '@/features/analysis/shared/parsing/field-utils'

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

  describe('getCellValue - Percentile Aggregation', () => {
    // Create runs with varying coins and durations to test percentile-specific hourly rates
    const runs = [
      createMockRun(11, 1000, 10000000000000, 5000, 50000), // 10.0T in 13.9h
      createMockRun(11, 1100, 10100000000000, 5000, 48000), // 10.1T in 13.3h
      createMockRun(11, 1200, 10600000000000, 5000, 47000), // 10.6T in 13.1h
      createMockRun(11, 1300, 10800000000000, 5000, 46000), // 10.8T in 12.8h
      createMockRun(11, 1400, 11000000000000, 5000, 48000), // 11.0T in 13.3h
      createMockRun(11, 1500, 11300000000000, 5000, 47000), // 11.3T in 13.1h
      createMockRun(11, 1600, 11500000000000, 5000, 45000), // 11.5T in 12.5h
      createMockRun(11, 1700, 11700000000000, 5000, 46000), // 11.7T in 12.8h
      createMockRun(11, 1800, 11900000000000, 5000, 47000), // 11.9T in 13.1h
      createMockRun(11, 1900, 12100000000000, 5000, 48000)  // 12.1T in 13.3h (MAX)
    ]

    const columns: TierStatsColumnConfig[] = [
      { fieldName: 'coinsEarned', showHourlyRate: true }
    ]

    const tierStats = calculateDynamicTierStats(runs, columns)[0]

    it('should return MAX value correctly', () => {
      const value = getCellValue(tierStats, 'coinsEarned', false, TierStatsAggregation.MAX)
      expect(value).toBe(12100000000000) // 12.1T
    })

    it('should return MAX hourly rate from specific max run', () => {
      const hourlyRate = getCellValue(tierStats, 'coinsEarned', true, TierStatsAggregation.MAX)

      // MAX is 12.1T from run with 48000s duration
      // Hourly rate = 12.1T / 48000 * 3600 = ~908B/h
      const expectedRate = (12100000000000 / 48000) * 3600
      expect(hourlyRate).toBeCloseTo(expectedRate, 2)
    })

    it('should return P90 value correctly', () => {
      const value = getCellValue(tierStats, 'coinsEarned', false, TierStatsAggregation.P90)

      // P90 should be high but not max
      expect(value).not.toBeNull()
      expect(value!).toBeLessThanOrEqual(12100000000000)
      expect(value!).toBeGreaterThan(10000000000000)
    })

    it('should calculate P90 hourly rate using P90 run duration, not average', () => {
      const p90Value = getCellValue(tierStats, 'coinsEarned', false, TierStatsAggregation.P90)
      const p90HourlyRate = getCellValue(tierStats, 'coinsEarned', true, TierStatsAggregation.P90)

      expect(p90Value).not.toBeNull()
      expect(p90HourlyRate).not.toBeNull()

      // P90 hourly rate should be calculated using the specific run's duration at P90 position
      const fieldStats = tierStats.fields.coinsEarned
      expect(fieldStats.p90Duration).not.toBeNull()

      const expectedP90Rate = (fieldStats.p90Value! / fieldStats.p90Duration!) * 3600
      expect(p90HourlyRate).toBeCloseTo(expectedP90Rate, 2)
    })

    it('should ensure P90 hourly rate is NEVER higher than MAX hourly rate', () => {
      const maxHourlyRate = getCellValue(tierStats, 'coinsEarned', true, TierStatsAggregation.MAX)
      const p90HourlyRate = getCellValue(tierStats, 'coinsEarned', true, TierStatsAggregation.P90)

      expect(maxHourlyRate).not.toBeNull()
      expect(p90HourlyRate).not.toBeNull()

      // P90 hourly rate should NEVER exceed MAX hourly rate
      expect(p90HourlyRate!).toBeLessThanOrEqual(maxHourlyRate!)
    })

    it('should calculate P75 hourly rate using P75 run duration', () => {
      const p75Value = getCellValue(tierStats, 'coinsEarned', false, TierStatsAggregation.P75)
      const p75HourlyRate = getCellValue(tierStats, 'coinsEarned', true, TierStatsAggregation.P75)

      expect(p75Value).not.toBeNull()
      expect(p75HourlyRate).not.toBeNull()

      const fieldStats = tierStats.fields.coinsEarned
      expect(fieldStats.p75Duration).not.toBeNull()

      const expectedP75Rate = (fieldStats.p75Value! / fieldStats.p75Duration!) * 3600
      expect(p75HourlyRate).toBeCloseTo(expectedP75Rate, 2)
    })

    it('should calculate P50 hourly rate using P50 run duration', () => {
      const p50Value = getCellValue(tierStats, 'coinsEarned', false, TierStatsAggregation.P50)
      const p50HourlyRate = getCellValue(tierStats, 'coinsEarned', true, TierStatsAggregation.P50)

      expect(p50Value).not.toBeNull()
      expect(p50HourlyRate).not.toBeNull()

      const fieldStats = tierStats.fields.coinsEarned
      expect(fieldStats.p50Duration).not.toBeNull()

      const expectedP50Rate = (fieldStats.p50Value! / fieldStats.p50Duration!) * 3600
      expect(p50HourlyRate).toBeCloseTo(expectedP50Rate, 2)
    })

    it('should return null when percentile duration is missing', () => {
      // Create a tier stats with missing percentile duration
      const incompleteTierStats = {
        ...tierStats,
        fields: {
          coinsEarned: {
            ...tierStats.fields.coinsEarned,
            p90Duration: null
          }
        }
      }

      const hourlyRate = getCellValue(incompleteTierStats, 'coinsEarned', true, TierStatsAggregation.P90)
      expect(hourlyRate).toBeNull()
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
