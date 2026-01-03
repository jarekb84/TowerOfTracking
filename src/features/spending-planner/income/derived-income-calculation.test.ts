/**
 * Derived Income Calculation Tests
 */

/* eslint-disable max-lines */
import { describe, it, expect } from 'vitest'
import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types'
import { CurrencyId } from '../types'
import {
  getLookbackStartDate,
  filterRunsByLookback,
  extractRunValue,
  groupRunsByDay,
  groupRunsByWeek,
  calculateDerivedWeeklyIncome,
  calculateDerivedGrowthRate,
  calculateDerivedValues,
  DERIVABLE_CURRENCY_FIELDS,
} from './derived-income-calculation'

// =============================================================================
// Test Helpers
// =============================================================================

function createField(value: number): GameRunField {
  return {
    value,
    rawValue: String(value),
    displayValue: String(value),
    originalKey: 'test',
    dataType: 'number',
  }
}

function createMockRun(
  timestamp: Date,
  coinsEarned: number,
  rerollShardsEarned: number = 0,
  rerollShards: number = 0
): ParsedGameRun {
  return {
    id: `run-${timestamp.getTime()}`,
    timestamp,
    tier: 1,
    wave: 100,
    coinsEarned,
    cellsEarned: 0,
    realTime: 3600,
    runType: 'farm',
    fields: {
      rerollShardsEarned: createField(rerollShardsEarned),
      rerollShards: createField(rerollShards),
    },
  }
}

function daysAgo(days: number, referenceDate: Date = new Date()): Date {
  const date = new Date(referenceDate)
  date.setDate(date.getDate() - days)
  return date
}

function weeksAgo(weeks: number, referenceDate: Date = new Date()): Date {
  const date = new Date(referenceDate)
  date.setDate(date.getDate() - weeks * 7)
  return date
}

// =============================================================================
// getLookbackStartDate Tests
// =============================================================================

describe('getLookbackStartDate', () => {
  const referenceDate = new Date('2024-06-15T12:00:00Z')

  it('returns date 3 months ago for 3mo period', () => {
    const result = getLookbackStartDate(referenceDate, '3mo')
    expect(result.getMonth()).toBe(2) // March (0-indexed)
    expect(result.getFullYear()).toBe(2024)
  })

  it('returns date 6 months ago for 6mo period', () => {
    const result = getLookbackStartDate(referenceDate, '6mo')
    expect(result.getMonth()).toBe(11) // December
    expect(result.getFullYear()).toBe(2023)
  })

  it('returns epoch for all period', () => {
    const result = getLookbackStartDate(referenceDate, 'all')
    expect(result.getTime()).toBe(0)
  })
})

// =============================================================================
// filterRunsByLookback Tests
// =============================================================================

describe('filterRunsByLookback', () => {
  const referenceDate = new Date('2024-06-15T12:00:00Z')

  it('filters runs within 3 month period', () => {
    const runs = [
      createMockRun(new Date('2024-06-01'), 1000),
      createMockRun(new Date('2024-04-01'), 2000),
      createMockRun(new Date('2024-02-01'), 3000), // Outside 3mo
      createMockRun(new Date('2023-12-01'), 4000), // Outside 3mo
    ]

    const result = filterRunsByLookback(runs, '3mo', referenceDate)
    expect(result.length).toBe(2)
    expect(result[0].coinsEarned).toBe(1000)
    expect(result[1].coinsEarned).toBe(2000)
  })

  it('filters runs within 6 month period', () => {
    const runs = [
      createMockRun(new Date('2024-06-01'), 1000),
      createMockRun(new Date('2024-01-01'), 2000),
      createMockRun(new Date('2023-06-01'), 3000), // Outside 6mo
    ]

    const result = filterRunsByLookback(runs, '6mo', referenceDate)
    expect(result.length).toBe(2)
  })

  it('includes all runs for all period', () => {
    const runs = [
      createMockRun(new Date('2024-06-01'), 1000),
      createMockRun(new Date('2020-01-01'), 2000),
      createMockRun(new Date('2010-01-01'), 3000),
    ]

    const result = filterRunsByLookback(runs, 'all', referenceDate)
    expect(result.length).toBe(3)
  })

  it('returns empty array for empty input', () => {
    const result = filterRunsByLookback([], '3mo', referenceDate)
    expect(result).toEqual([])
  })
})

// =============================================================================
// extractRunValue Tests
// =============================================================================

describe('extractRunValue', () => {
  it('extracts value from cached property', () => {
    const run = createMockRun(new Date(), 5000)
    const result = extractRunValue(run, { cachedProperty: 'coinsEarned' })
    expect(result).toBe(5000)
  })

  it('sums values from multiple field names', () => {
    const run = createMockRun(new Date(), 0, 100, 50)
    const result = extractRunValue(run, {
      fieldNames: ['rerollShardsEarned', 'rerollShards'],
    })
    expect(result).toBe(150)
  })

  it('returns 0 for missing cached property', () => {
    const run = createMockRun(new Date(), 1000)
    const result = extractRunValue(run, { cachedProperty: 'cellsEarned' })
    expect(result).toBe(0)
  })

  it('returns 0 for missing field names', () => {
    const run = createMockRun(new Date(), 1000)
    const result = extractRunValue(run, { fieldNames: ['NonexistentField'] })
    expect(result).toBe(0)
  })

  it('handles partial field matches', () => {
    const run = createMockRun(new Date(), 0, 100, 0)
    run.fields = {
      rerollShardsEarned: createField(100),
    }
    const result = extractRunValue(run, {
      fieldNames: ['rerollShardsEarned', 'missingField'],
    })
    expect(result).toBe(100)
  })
})

// =============================================================================
// groupRunsByDay Tests
// =============================================================================

describe('groupRunsByDay', () => {
  it('groups runs by date', () => {
    const runs = [
      createMockRun(new Date('2024-06-15T10:00:00Z'), 1000),
      createMockRun(new Date('2024-06-15T14:00:00Z'), 2000),
      createMockRun(new Date('2024-06-14T10:00:00Z'), 3000),
    ]

    const result = groupRunsByDay(runs)
    expect(result.size).toBe(2)
    expect(result.get('2024-06-15')?.length).toBe(2)
    expect(result.get('2024-06-14')?.length).toBe(1)
  })

  it('returns empty map for empty input', () => {
    const result = groupRunsByDay([])
    expect(result.size).toBe(0)
  })
})

// =============================================================================
// groupRunsByWeek Tests
// =============================================================================

describe('groupRunsByWeek', () => {
  it('groups runs by ISO week', () => {
    // Use dates that are definitely in the same week (Mon-Sun of same week)
    const runs = [
      createMockRun(new Date('2024-06-10'), 1000), // Monday, Week 24
      createMockRun(new Date('2024-06-11'), 2000), // Tuesday, Week 24
      createMockRun(new Date('2024-06-04'), 3000), // Tuesday, Week 23
    ]

    const result = groupRunsByWeek(runs)
    expect(result.size).toBe(2)

    // Check that runs are grouped correctly - get total runs
    const allRuns = Array.from(result.values())
    const totalRuns = allRuns.reduce((sum, arr) => sum + arr.length, 0)
    expect(totalRuns).toBe(3)

    // One week should have 2 runs, one should have 1
    const runCounts = allRuns.map((arr) => arr.length).sort()
    expect(runCounts).toEqual([1, 2])
  })

  it('returns empty map for empty input', () => {
    const result = groupRunsByWeek([])
    expect(result.size).toBe(0)
  })
})

// =============================================================================
// calculateDerivedWeeklyIncome Tests
// =============================================================================

describe('calculateDerivedWeeklyIncome', () => {
  const referenceDate = new Date('2024-06-15T12:00:00Z')
  const coinsConfig = DERIVABLE_CURRENCY_FIELDS[CurrencyId.Coins]!

  it('calculates weekly income from 7 days of data', () => {
    const runs: ParsedGameRun[] = []
    // One run per day for 7 days, each earning 1000 coins
    for (let i = 0; i < 7; i++) {
      runs.push(createMockRun(daysAgo(i, referenceDate), 1000))
    }

    const result = calculateDerivedWeeklyIncome(runs, coinsConfig, referenceDate)
    expect(result.weeklyIncome).toBe(7000)
    expect(result.hasSufficientData).toBe(true)
    expect(result.daysOfData).toBe(7)
    expect(result.runsAnalyzed).toBe(7)
  })

  it('extrapolates from partial data', () => {
    const runs = [
      createMockRun(daysAgo(0, referenceDate), 1000),
      createMockRun(daysAgo(1, referenceDate), 1000),
      createMockRun(daysAgo(2, referenceDate), 1000),
    ]

    const result = calculateDerivedWeeklyIncome(runs, coinsConfig, referenceDate)
    // 3 days of 1000 each = 3000 total, extrapolated to 7 days = 7000
    expect(result.weeklyIncome).toBe(7000)
    expect(result.hasSufficientData).toBe(true)
    expect(result.daysOfData).toBe(3)
  })

  it('marks insufficient data when less than 3 days', () => {
    const runs = [
      createMockRun(daysAgo(0, referenceDate), 1000),
      createMockRun(daysAgo(1, referenceDate), 1000),
    ]

    const result = calculateDerivedWeeklyIncome(runs, coinsConfig, referenceDate)
    expect(result.hasSufficientData).toBe(false)
    expect(result.daysOfData).toBe(2)
  })

  it('handles multiple runs per day', () => {
    const runs = [
      createMockRun(new Date(daysAgo(0, referenceDate).setHours(10)), 500),
      createMockRun(new Date(daysAgo(0, referenceDate).setHours(15)), 500),
      createMockRun(new Date(daysAgo(1, referenceDate).setHours(10)), 1000),
      createMockRun(new Date(daysAgo(2, referenceDate).setHours(10)), 1000),
    ]

    const result = calculateDerivedWeeklyIncome(runs, coinsConfig, referenceDate)
    // Total: 3000 over 3 days = 1000/day, extrapolated to 7000/week
    expect(result.weeklyIncome).toBe(7000)
    expect(result.daysOfData).toBe(3)
    expect(result.runsAnalyzed).toBe(4)
  })

  it('returns 0 for empty runs', () => {
    const result = calculateDerivedWeeklyIncome([], coinsConfig, referenceDate)
    expect(result.weeklyIncome).toBe(0)
    expect(result.hasSufficientData).toBe(false)
    expect(result.daysOfData).toBe(0)
    expect(result.runsAnalyzed).toBe(0)
  })

  it('ignores runs older than 7 days', () => {
    const runs = [
      createMockRun(daysAgo(0, referenceDate), 1000),
      createMockRun(daysAgo(1, referenceDate), 1000),
      createMockRun(daysAgo(2, referenceDate), 1000),
      createMockRun(daysAgo(10, referenceDate), 5000), // Should be ignored
    ]

    const result = calculateDerivedWeeklyIncome(runs, coinsConfig, referenceDate)
    expect(result.weeklyIncome).toBe(7000) // Only 3 days of 1000 each
    expect(result.runsAnalyzed).toBe(3)
  })
})

// =============================================================================
// calculateDerivedGrowthRate Tests
// =============================================================================

describe('calculateDerivedGrowthRate', () => {
  const referenceDate = new Date('2024-06-15T12:00:00Z')
  const coinsConfig = DERIVABLE_CURRENCY_FIELDS[CurrencyId.Coins]!

  it('calculates positive growth rate', () => {
    // Using linear growth: 1000, 1100, 1200, 1300 (100 per week = 10% of mean 1150)
    const runs: ParsedGameRun[] = [
      createMockRun(weeksAgo(4, referenceDate), 1000),
      createMockRun(weeksAgo(3, referenceDate), 1100),
      createMockRun(weeksAgo(2, referenceDate), 1200),
      createMockRun(weeksAgo(1, referenceDate), 1300),
    ]

    const result = calculateDerivedGrowthRate(runs, coinsConfig, '3mo', referenceDate)
    // Linear regression: slope=100, mean=1150, growth = 100/1150 ≈ 8.7%
    expect(result.growthRatePercent).toBeCloseTo(8.7, 0)
    expect(result.hasSufficientData).toBe(true)
    expect(result.weeksOfData).toBe(4)
  })

  it('calculates negative growth rate', () => {
    // Using linear decline: 2000, 1800, 1600, 1400 (-200 per week = -11.8% of mean 1700)
    const runs = [
      createMockRun(weeksAgo(4, referenceDate), 2000),
      createMockRun(weeksAgo(3, referenceDate), 1800),
      createMockRun(weeksAgo(2, referenceDate), 1600),
      createMockRun(weeksAgo(1, referenceDate), 1400),
    ]

    const result = calculateDerivedGrowthRate(runs, coinsConfig, '3mo', referenceDate)
    // Linear regression: slope=-200, mean=1700, growth = -200/1700 ≈ -11.8%
    expect(result.growthRatePercent).toBeCloseTo(-11.8, 0)
    expect(result.hasSufficientData).toBe(true)
  })

  it('returns 0 for stable income', () => {
    const runs = [
      createMockRun(weeksAgo(4, referenceDate), 1000),
      createMockRun(weeksAgo(3, referenceDate), 1000),
      createMockRun(weeksAgo(2, referenceDate), 1000),
      createMockRun(weeksAgo(1, referenceDate), 1000),
    ]

    const result = calculateDerivedGrowthRate(runs, coinsConfig, '3mo', referenceDate)
    expect(result.growthRatePercent).toBe(0)
    expect(result.hasSufficientData).toBe(true)
  })

  it('marks insufficient data when less than 4 weeks', () => {
    const runs = [
      createMockRun(weeksAgo(2, referenceDate), 1000),
      createMockRun(weeksAgo(1, referenceDate), 1100),
    ]

    const result = calculateDerivedGrowthRate(runs, coinsConfig, '3mo', referenceDate)
    expect(result.hasSufficientData).toBe(false)
    expect(result.weeksOfData).toBe(2)
  })

  it('returns 0 for empty runs', () => {
    const result = calculateDerivedGrowthRate([], coinsConfig, '3mo', referenceDate)
    expect(result.growthRatePercent).toBe(0)
    expect(result.hasSufficientData).toBe(false)
    expect(result.weeksOfData).toBe(0)
  })

  it('returns 0 for single week of data', () => {
    const runs = [createMockRun(weeksAgo(1, referenceDate), 1000)]

    const result = calculateDerivedGrowthRate(runs, coinsConfig, '3mo', referenceDate)
    expect(result.growthRatePercent).toBe(0)
    expect(result.hasSufficientData).toBe(false)
    expect(result.weeksOfData).toBe(1)
  })

  it('respects lookback period filter', () => {
    const runs = [
      createMockRun(weeksAgo(1, referenceDate), 1000),
      createMockRun(weeksAgo(2, referenceDate), 1000),
      createMockRun(weeksAgo(3, referenceDate), 1000),
      createMockRun(weeksAgo(4, referenceDate), 1000),
      createMockRun(weeksAgo(20, referenceDate), 500), // Outside 3mo, should be ignored
    ]

    const result = calculateDerivedGrowthRate(runs, coinsConfig, '3mo', referenceDate)
    expect(result.weeksOfData).toBe(4) // Only 4 weeks within 3mo
  })
})

// =============================================================================
// calculateDerivedValues Tests
// =============================================================================

describe('calculateDerivedValues', () => {
  const referenceDate = new Date('2024-06-15T12:00:00Z')

  it('calculates both income and growth for derivable currency', () => {
    const runs = [
      createMockRun(daysAgo(0, referenceDate), 1000),
      createMockRun(daysAgo(1, referenceDate), 1000),
      createMockRun(daysAgo(2, referenceDate), 1000),
      createMockRun(weeksAgo(2, referenceDate), 900),
      createMockRun(weeksAgo(3, referenceDate), 800),
      createMockRun(weeksAgo(4, referenceDate), 700),
    ]

    const result = calculateDerivedValues(runs, CurrencyId.Coins, '3mo', referenceDate)

    expect(result.income).not.toBeNull()
    expect(result.income?.weeklyIncome).toBeGreaterThan(0)
    expect(result.growthRate).not.toBeNull()
  })

  it('returns null for non-derivable currency', () => {
    const runs = [createMockRun(daysAgo(0, referenceDate), 1000)]

    const result = calculateDerivedValues(runs, CurrencyId.Stones, '3mo', referenceDate)

    expect(result.income).toBeNull()
    expect(result.growthRate).toBeNull()
  })

  it('works with reroll shards currency', () => {
    const runs = [
      createMockRun(daysAgo(0, referenceDate), 0, 500, 100),
      createMockRun(daysAgo(1, referenceDate), 0, 500, 100),
      createMockRun(daysAgo(2, referenceDate), 0, 500, 100),
    ]

    const result = calculateDerivedValues(
      runs,
      CurrencyId.RerollShards,
      '3mo',
      referenceDate
    )

    expect(result.income).not.toBeNull()
    expect(result.income?.weeklyIncome).toBeGreaterThan(0)
  })
})
