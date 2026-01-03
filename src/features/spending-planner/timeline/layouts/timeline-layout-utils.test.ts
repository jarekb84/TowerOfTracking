/**
 * Tests for timeline-layout-utils.ts
 *
 * Note: Tests for calculateProrationAdjustment and calculateWeekBalance
 * are in calculate-week-balance.test.ts to keep file under 300 lines.
 */
import { describe, it, expect } from 'vitest'
import {
  applyIncomeProration,
  calculatePriorBalances,
  formatMetricDisplay,
  getWeekCurrencyData,
} from './timeline-layout-utils'
import { CurrencyId } from '../../types'

describe('timeline-layout-utils', () => {
  describe('calculatePriorBalances', () => {
    it('should calculate prior balances with no expenditure', () => {
      // balancesByWeek[N] is balance at start of week with spending subtracted
      // With no spending, prior = balance + 0 = balance
      const balances = new Map<CurrencyId, number[]>([
        [CurrencyId.Coins, [100, 100, 100]],
      ])
      const expenditures = new Map<CurrencyId, number[]>([
        [CurrencyId.Coins, [0, 0, 0]],
      ])

      const result = calculatePriorBalances(balances, expenditures)

      expect(result.get(CurrencyId.Coins)).toEqual([100, 100, 100])
    })

    it('should calculate prior balances adding back expenditure', () => {
      // balancesByWeek[N] is balance at start of week with spending subtracted
      // Prior = balance + expenditure (add back what was subtracted)
      const balances = new Map<CurrencyId, number[]>([
        [CurrencyId.Coins, [70, 50, 100]],
      ])
      const expenditures = new Map<CurrencyId, number[]>([
        [CurrencyId.Coins, [30, 100, 0]],
      ])

      const result = calculatePriorBalances(balances, expenditures)

      // Week 0: Prior = 70 + 30 = 100 (balance before 30 was spent)
      // Week 1: Prior = 50 + 100 = 150 (balance before 100 was spent)
      // Week 2: Prior = 100 + 0 = 100 (no spending)
      expect(result.get(CurrencyId.Coins)).toEqual([100, 150, 100])
    })

    it('should handle multiple currencies', () => {
      const balances = new Map<CurrencyId, number[]>([
        [CurrencyId.Coins, [200, 300]],
        [CurrencyId.Stones, [50, 100]],
      ])
      const expenditures = new Map<CurrencyId, number[]>([
        [CurrencyId.Coins, [0, 0]],
        [CurrencyId.Stones, [0, 0]],
      ])

      const result = calculatePriorBalances(balances, expenditures)

      // No expenditure, so prior = balance
      expect(result.get(CurrencyId.Coins)).toEqual([200, 300])
      expect(result.get(CurrencyId.Stones)).toEqual([50, 100])
    })

    it('should handle missing data gracefully', () => {
      const balances = new Map<CurrencyId, number[]>([
        [CurrencyId.Coins, [100, 200]],
      ])
      // Expenditure map missing for Coins
      const expenditures = new Map<CurrencyId, number[]>()

      const result = calculatePriorBalances(balances, expenditures)

      // With no expenditure data, prior = balance + 0 = balance
      expect(result.get(CurrencyId.Coins)).toEqual([100, 200])
    })
  })

  describe('formatMetricDisplay', () => {
    describe('for income', () => {
      it('should return blank for zero income', () => {
        const result = formatMetricDisplay(0, 'income')
        expect(result.displayValue).toBe('')
        expect(result.hasValue).toBe(false)
      })

      it('should indicate non-zero income has value', () => {
        const result = formatMetricDisplay(100, 'income')
        expect(result.hasValue).toBe(true)
      })

      it('should handle negative income', () => {
        const result = formatMetricDisplay(-50, 'income')
        expect(result.hasValue).toBe(true)
      })
    })

    describe('for expenditure', () => {
      it('should return dash for zero expenditure', () => {
        const result = formatMetricDisplay(0, 'expenditure')
        expect(result.displayValue).toBe('-')
        expect(result.hasValue).toBe(false)
      })

      it('should indicate non-zero expenditure has value', () => {
        const result = formatMetricDisplay(500, 'expenditure')
        expect(result.hasValue).toBe(true)
      })
    })
  })

  describe('getWeekCurrencyData', () => {
    it('should extract data for a specific week and currency', () => {
      // balancesByWeek[N] is balance at start of week (after spending subtracted)
      // Ending balance = start balance + income
      const maps = {
        balancesByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [100, 150, 200]],
        ]),
        incomeByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [50, 50, 50]],
        ]),
        expenditureByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [0, 100, 0]],
        ]),
        priorBalancesByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [100, 250, 200]],
        ]),
      }

      const result = getWeekCurrencyData(1, CurrencyId.Coins, maps)

      expect(result).toEqual({
        priorBalance: 250,
        income: 50,
        expenditure: 100,
        // Ending balance = start balance (150) + income (50) = 200
        balance: 200,
      })
    })

    it('should return zeros for missing currency data', () => {
      const maps = {
        balancesByWeek: new Map<CurrencyId, number[]>(),
        incomeByWeek: new Map<CurrencyId, number[]>(),
        expenditureByWeek: new Map<CurrencyId, number[]>(),
        priorBalancesByWeek: new Map<CurrencyId, number[]>(),
      }

      const result = getWeekCurrencyData(0, CurrencyId.Coins, maps)

      expect(result).toEqual({
        priorBalance: 0,
        income: 0,
        expenditure: 0,
        balance: 0,
      })
    })

    it('should return zeros for out of bounds week index', () => {
      const maps = {
        balancesByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [100]],
        ]),
        incomeByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [50]],
        ]),
        expenditureByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [25]],
        ]),
        priorBalancesByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [125]],
        ]),
      }

      const result = getWeekCurrencyData(10, CurrencyId.Coins, maps) // Out of bounds

      expect(result).toEqual({
        priorBalance: 0,
        income: 0,
        expenditure: 0,
        balance: 0,
      })
    })

    it('should calculate ending balance as start balance plus income', () => {
      // This test verifies the key calculation: ending balance = start + income
      const maps = {
        balancesByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [255]],
        ]),
        incomeByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [500]],
        ]),
        expenditureByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [450]],
        ]),
        priorBalancesByWeek: new Map<CurrencyId, number[]>([
          [CurrencyId.Coins, [705]],
        ]),
      }

      const result = getWeekCurrencyData(0, CurrencyId.Coins, maps)

      // Prior: 705 (255 + 450 expenditure added back)
      // Income: +500
      // Expenditure: -450
      // Ending balance: 255 (start) + 500 (income) = 755
      expect(result).toEqual({
        priorBalance: 705,
        income: 500,
        expenditure: 450,
        balance: 755,
      })
    })
  })

  describe('applyIncomeProration', () => {
    it('should return data unchanged when proration factor is 1', () => {
      const data = {
        priorBalance: 100,
        income: 50,
        expenditure: 20,
        balance: 130,
      }

      const result = applyIncomeProration(data, 1)

      expect(result).toBe(data) // Same reference, not just equal
    })

    it('should prorate income and adjust balance for half week', () => {
      const data = {
        priorBalance: 100,
        income: 70,
        expenditure: 0,
        balance: 170, // 100 + 70
      }

      const result = applyIncomeProration(data, 0.5)

      expect(result.income).toBe(35) // 70 * 0.5
      expect(result.balance).toBe(135) // 170 - (70 - 35) = 170 - 35 = 135
      expect(result.priorBalance).toBe(100) // Unchanged
      expect(result.expenditure).toBe(0) // Unchanged
    })

    it('should handle partial week proration correctly', () => {
      const data = {
        priorBalance: 200,
        income: 100,
        expenditure: 50,
        balance: 250, // Already has full income included
      }

      // 3 days remaining out of 7 = 3/7 factor
      const factor = 3 / 7
      const result = applyIncomeProration(data, factor)

      const proratedIncome = 100 * factor
      const balanceAdjustment = 100 - proratedIncome
      expect(result.income).toBeCloseTo(proratedIncome, 10)
      expect(result.balance).toBeCloseTo(250 - balanceAdjustment, 10)
      expect(result.priorBalance).toBe(200)
      expect(result.expenditure).toBe(50)
    })

    it('should preserve all other fields', () => {
      const data = {
        priorBalance: 500,
        income: 200,
        expenditure: 150,
        balance: 700,
      }

      const result = applyIncomeProration(data, 0.75)

      expect(result.priorBalance).toBe(500)
      expect(result.expenditure).toBe(150)
      expect(result.income).toBe(150) // 200 * 0.75
      expect(result.balance).toBe(650) // 700 - (200 - 150) = 700 - 50 = 650
    })
  })
})
