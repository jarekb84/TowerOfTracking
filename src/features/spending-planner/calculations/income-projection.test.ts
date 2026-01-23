import { describe, it, expect } from 'vitest'
import {
  projectBalances,
  projectIncomes,
  projectAllBalances,
  projectAllIncomes,
  findAffordableWeek,
} from './income-projection'
import { CurrencyId } from '../types'
import type { CurrencyIncome } from '../types'

/** Create a test CurrencyIncome with default derived income fields */
function createTestIncome(
  currencyId: CurrencyId,
  currentBalance: number,
  weeklyIncome: number,
  growthRatePercent: number
): CurrencyIncome {
  return {
    currencyId,
    currentBalance,
    weeklyIncome,
    growthRatePercent,
    weeklyIncomeSource: 'manual',
    growthRateSource: 'manual',
    derivedWeeklyIncome: null,
    derivedGrowthRate: null,
  }
}

describe('income-projection', () => {
  describe('projectBalances', () => {
    it('should project balances without growth', () => {
      const income = createTestIncome(CurrencyId.Coins, 100, 50, 0)

      const balances = projectBalances(income, 4)

      expect(balances).toEqual([100, 150, 200, 250, 300])
    })

    it('should project balances with growth', () => {
      const income = createTestIncome(CurrencyId.Coins, 100, 100, 10)

      const balances = projectBalances(income, 3)

      // Week 0: 100 (starting)
      // Week 1: 100 + 100 = 200
      // Week 2: 200 + 110 = 310
      // Week 3: 310 + 121 = 431
      expect(balances[0]).toBe(100)
      expect(balances[1]).toBe(200)
      expect(balances[2]).toBeCloseTo(310, 5)
      expect(balances[3]).toBeCloseTo(431, 5)
    })

    it('should handle zero starting balance', () => {
      const income = createTestIncome(CurrencyId.Coins, 0, 100, 0)

      const balances = projectBalances(income, 3)

      expect(balances).toEqual([0, 100, 200, 300])
    })

    it('should handle zero income', () => {
      const income = createTestIncome(CurrencyId.Coins, 500, 0, 0)

      const balances = projectBalances(income, 3)

      expect(balances).toEqual([500, 500, 500, 500])
    })

    it('should handle negative growth', () => {
      const income = createTestIncome(CurrencyId.Coins, 100, 100, -50)

      const balances = projectBalances(income, 3)

      // Week 0: 100
      // Week 1: 100 + 100 = 200
      // Week 2: 200 + 50 = 250
      // Week 3: 250 + 25 = 275
      expect(balances[0]).toBe(100)
      expect(balances[1]).toBe(200)
      expect(balances[2]).toBe(250)
      expect(balances[3]).toBe(275)
    })

    describe('week 0 proration', () => {
      it('should apply proration to week 0 income only', () => {
        const income = createTestIncome(CurrencyId.Coins, 100, 100, 0)

        const balances = projectBalances(income, 3, 0.5) // 50% proration

        // Week 0 starting: 100
        // Week 0 ending (balances[1]): 100 + 50 = 150 (prorated)
        // Week 1 ending (balances[2]): 150 + 100 = 250 (full income)
        // Week 2 ending (balances[3]): 250 + 100 = 350 (full income)
        expect(balances[0]).toBe(100)
        expect(balances[1]).toBe(150) // Prorated
        expect(balances[2]).toBe(250) // Full income
        expect(balances[3]).toBe(350) // Full income
      })

      it('should use full income when proration factor is 1', () => {
        const income = createTestIncome(CurrencyId.Coins, 100, 100, 0)

        const balances = projectBalances(income, 3, 1)

        expect(balances).toEqual([100, 200, 300, 400])
      })

      it('should handle zero proration factor', () => {
        const income = createTestIncome(CurrencyId.Coins, 100, 100, 0)

        const balances = projectBalances(income, 3, 0)

        // Week 0: no income added (0% proration)
        // Week 1+: full income
        expect(balances[0]).toBe(100)
        expect(balances[1]).toBe(100) // No income from week 0
        expect(balances[2]).toBe(200) // 100 + 100
        expect(balances[3]).toBe(300) // 200 + 100
      })

      it('should apply proration with growth rate', () => {
        const income = createTestIncome(CurrencyId.Coins, 100, 100, 10)

        const balances = projectBalances(income, 3, 0.5)

        // Week 0 starting: 100, week 0 income: 100 * 0.5 = 50
        // Week 0 ending (balances[1]): 100 + 50 = 150
        // Week 1 income: 100 * 1.1 = 110, balances[2]: 150 + 110 = 260
        // Week 2 income: 110 * 1.1 = 121, balances[3]: 260 + 121 = 381
        expect(balances[0]).toBe(100)
        expect(balances[1]).toBe(150)
        expect(balances[2]).toBeCloseTo(260, 5)
        expect(balances[3]).toBeCloseTo(381, 5)
      })

      it('should default to full income when proration not specified', () => {
        const income = createTestIncome(CurrencyId.Coins, 100, 100, 0)

        const balances = projectBalances(income, 3)

        expect(balances).toEqual([100, 200, 300, 400])
      })
    })
  })

  describe('projectIncomes', () => {
    it('should project incomes without growth', () => {
      const income = createTestIncome(CurrencyId.Coins, 100, 50, 0)

      const incomes = projectIncomes(income, 4)

      expect(incomes).toEqual([50, 50, 50, 50])
    })

    it('should project incomes with growth', () => {
      const income = createTestIncome(CurrencyId.Coins, 100, 100, 10)

      const incomes = projectIncomes(income, 4)

      expect(incomes[0]).toBe(100)
      expect(incomes[1]).toBeCloseTo(110, 5)
      expect(incomes[2]).toBeCloseTo(121, 5)
      expect(incomes[3]).toBeCloseTo(133.1, 5)
    })
  })

  describe('projectAllBalances', () => {
    it('should project balances for all currencies', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 50, 0),
        createTestIncome(CurrencyId.Stones, 200, 100, 0),
      ]

      const result = projectAllBalances(incomes, 2)

      expect(result.get(CurrencyId.Coins)).toEqual([100, 150, 200])
      expect(result.get(CurrencyId.Stones)).toEqual([200, 300, 400])
    })
  })

  describe('projectAllIncomes', () => {
    it('should project incomes for all currencies', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 50, 0),
        createTestIncome(CurrencyId.Stones, 200, 100, 0),
      ]

      const result = projectAllIncomes(incomes, 2)

      expect(result.get(CurrencyId.Coins)).toEqual([50, 50])
      expect(result.get(CurrencyId.Stones)).toEqual([100, 100])
    })
  })

  describe('findAffordableWeek', () => {
    it('should find week when affordable from start', () => {
      const balances = [100, 150, 200, 250, 300]
      expect(findAffordableWeek(balances, 100)).toBe(0)
    })

    it('should find week when affordable later', () => {
      const balances = [100, 150, 200, 250, 300]
      expect(findAffordableWeek(balances, 200)).toBe(2)
    })

    it('should return -1 if never affordable', () => {
      const balances = [100, 150, 200, 250, 300]
      expect(findAffordableWeek(balances, 500)).toBe(-1)
    })

    it('should handle exact match', () => {
      const balances = [100, 150, 200, 250, 300]
      expect(findAffordableWeek(balances, 150)).toBe(1)
    })

    it('should handle empty balances', () => {
      expect(findAffordableWeek([], 100)).toBe(-1)
    })
  })
})
