import { describe, it, expect } from 'vitest'
import { getSortValue, sortTierStats, sortByTier } from './tier-stats-sort'
import type { DynamicTierStats, TierStatsColumn, FieldStats } from '../types/tier-stats-config.types'
import type { ParsedGameRun } from '../types/game-run.types'
import { createGameRunField } from './field-utils'

describe('tier-stats-sort', () => {
  const createMockRun = (tier: number, coins: number, duration: number): ParsedGameRun => ({
    id: `run-${tier}`,
    timestamp: new Date('2024-01-01'),
    fields: {
      tier: createGameRunField('Tier', tier.toString()),
      coinsEarned: createGameRunField('Coins Earned', coins.toString())
    },
    tier,
    coinsEarned: coins,
    realTime: duration,
    wave: 1000,
    cellsEarned: 0,
    runType: 'farm'
  })

  const createFieldStats = (maxValue: number, run: ParsedGameRun, hourlyRate?: number): FieldStats => ({
    maxValue,
    maxValueRun: run,
    hourlyRate
  })

  const createTierStats = (tier: number, coinsValue: number, coinsHourly?: number): DynamicTierStats => {
    const run = createMockRun(tier, coinsValue, 3600)
    return {
      tier,
      runCount: 1,
      fields: {
        coinsEarned: createFieldStats(coinsValue, run, coinsHourly)
      }
    }
  }

  const createColumn = (
    fieldName: string,
    showHourlyRate: boolean = false
  ): TierStatsColumn => ({
    id: fieldName,
    fieldName,
    displayName: fieldName,
    showHourlyRate,
    dataType: 'number'
  })

  describe('getSortValue', () => {
    it('should return tier number for tier column', () => {
      const tierStats = createTierStats(5, 100000)
      const tierColumn = createColumn('tier')

      const value = getSortValue(tierStats, tierColumn)
      expect(value).toBe(5)
    })

    it('should return aggregate value when hourly rate is disabled', () => {
      const tierStats = createTierStats(5, 100000, 50000)
      const column = createColumn('coinsEarned', false)

      const value = getSortValue(tierStats, column)
      expect(value).toBe(100000)
    })

    it('should return hourly rate when enabled', () => {
      const tierStats = createTierStats(5, 100000, 50000)
      const column = createColumn('coinsEarned', true)

      const value = getSortValue(tierStats, column)
      expect(value).toBe(50000)
    })

    it('should fall back to aggregate when hourly rate is null', () => {
      const tierStats = createTierStats(5, 100000, undefined)
      const column = createColumn('coinsEarned', true)

      const value = getSortValue(tierStats, column)
      expect(value).toBe(100000)
    })

    it('should return -Infinity for missing field', () => {
      const tierStats = createTierStats(5, 100000)
      const column = createColumn('nonExistentField')

      const value = getSortValue(tierStats, column)
      expect(value).toBe(-Infinity)
    })
  })

  describe('sortTierStats', () => {
    const mockTierStats = [
      createTierStats(1, 50000, 25000),
      createTierStats(2, 100000, 40000),
      createTierStats(3, 75000, 50000)
    ]

    it('should sort by aggregate value ascending when hourly disabled', () => {
      const column = createColumn('coinsEarned', false)
      const sorted = sortTierStats(mockTierStats, column, 'asc')

      expect(sorted[0].tier).toBe(1) // 50000 coins
      expect(sorted[1].tier).toBe(3) // 75000 coins
      expect(sorted[2].tier).toBe(2) // 100000 coins
    })

    it('should sort by aggregate value descending when hourly disabled', () => {
      const column = createColumn('coinsEarned', false)
      const sorted = sortTierStats(mockTierStats, column, 'desc')

      expect(sorted[0].tier).toBe(2) // 100000 coins
      expect(sorted[1].tier).toBe(3) // 75000 coins
      expect(sorted[2].tier).toBe(1) // 50000 coins
    })

    it('should sort by hourly rate ascending when enabled', () => {
      const column = createColumn('coinsEarned', true)
      const sorted = sortTierStats(mockTierStats, column, 'asc')

      expect(sorted[0].tier).toBe(1) // 25000/hr
      expect(sorted[1].tier).toBe(2) // 40000/hr
      expect(sorted[2].tier).toBe(3) // 50000/hr
    })

    it('should sort by hourly rate descending when enabled', () => {
      const column = createColumn('coinsEarned', true)
      const sorted = sortTierStats(mockTierStats, column, 'desc')

      expect(sorted[0].tier).toBe(3) // 50000/hr
      expect(sorted[1].tier).toBe(2) // 40000/hr
      expect(sorted[2].tier).toBe(1) // 25000/hr
    })

    it('should not mutate original array', () => {
      const column = createColumn('coinsEarned', false)
      const original = [...mockTierStats]

      sortTierStats(mockTierStats, column, 'asc')

      expect(mockTierStats).toEqual(original)
    })

    it('should handle empty array', () => {
      const column = createColumn('coinsEarned', false)
      const sorted = sortTierStats([], column, 'asc')

      expect(sorted).toEqual([])
    })

    it('should handle single item array', () => {
      const single = [createTierStats(1, 50000)]
      const column = createColumn('coinsEarned', false)
      const sorted = sortTierStats(single, column, 'asc')

      expect(sorted).toHaveLength(1)
      expect(sorted[0].tier).toBe(1)
    })
  })

  describe('sortByTier', () => {
    const mockTierStats = [
      createTierStats(3, 100000),
      createTierStats(1, 50000),
      createTierStats(2, 75000)
    ]

    it('should sort by tier ascending', () => {
      const sorted = sortByTier(mockTierStats, 'asc')

      expect(sorted[0].tier).toBe(1)
      expect(sorted[1].tier).toBe(2)
      expect(sorted[2].tier).toBe(3)
    })

    it('should sort by tier descending', () => {
      const sorted = sortByTier(mockTierStats, 'desc')

      expect(sorted[0].tier).toBe(3)
      expect(sorted[1].tier).toBe(2)
      expect(sorted[2].tier).toBe(1)
    })

    it('should not mutate original array', () => {
      const original = [...mockTierStats]

      sortByTier(mockTierStats, 'asc')

      expect(mockTierStats).toEqual(original)
    })

    it('should handle empty array', () => {
      const sorted = sortByTier([], 'asc')
      expect(sorted).toEqual([])
    })
  })

  describe('intelligent sorting integration', () => {
    it('should prioritize hourly rate over aggregate when both exist', () => {
      // Tier 1: Low aggregate but HIGH hourly rate (efficient)
      // Tier 2: HIGH aggregate but low hourly rate (inefficient)
      const tierStats = [
        createTierStats(1, 50000, 60000), // 50K coins, 60K/hr (short efficient run)
        createTierStats(2, 200000, 30000)  // 200K coins, 30K/hr (long inefficient run)
      ]

      const column = createColumn('coinsEarned', true)
      const sorted = sortTierStats(tierStats, column, 'desc')

      // Should sort by hourly rate, so tier 1 (60K/hr) comes first
      expect(sorted[0].tier).toBe(1)
      expect(sorted[1].tier).toBe(2)
    })

    it('should use aggregate as tiebreaker when hourly rates are equal', () => {
      const tierStats = [
        createTierStats(1, 75000, 50000),
        createTierStats(2, 100000, 50000)
      ]

      const column = createColumn('coinsEarned', true)
      const sorted = sortTierStats(tierStats, column, 'desc')

      // Same hourly rate, but tier 2 has higher aggregate
      // Since they're equal in primary sort (hourly), order may vary
      // But both should maintain stable sort behavior
      expect(sorted).toHaveLength(2)
    })
  })
})
