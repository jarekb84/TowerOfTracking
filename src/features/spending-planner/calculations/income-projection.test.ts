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

describe('income-projection', () => {
  describe('projectBalances', () => {
    it('should project balances without growth', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 100,
        weeklyIncome: 50,
        growthRatePercent: 0,
      }

      const balances = projectBalances(income, 4)

      expect(balances).toEqual([100, 150, 200, 250, 300])
    })

    it('should project balances with growth', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 100,
        weeklyIncome: 100,
        growthRatePercent: 10,
      }

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
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 0,
        weeklyIncome: 100,
        growthRatePercent: 0,
      }

      const balances = projectBalances(income, 3)

      expect(balances).toEqual([0, 100, 200, 300])
    })

    it('should handle zero income', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 500,
        weeklyIncome: 0,
        growthRatePercent: 0,
      }

      const balances = projectBalances(income, 3)

      expect(balances).toEqual([500, 500, 500, 500])
    })

    it('should handle negative growth', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 100,
        weeklyIncome: 100,
        growthRatePercent: -50,
      }

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
  })

  describe('projectIncomes', () => {
    it('should project incomes without growth', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 100,
        weeklyIncome: 50,
        growthRatePercent: 0,
      }

      const incomes = projectIncomes(income, 4)

      expect(incomes).toEqual([50, 50, 50, 50])
    })

    it('should project incomes with growth', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 100,
        weeklyIncome: 100,
        growthRatePercent: 10,
      }

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
        { currencyId: CurrencyId.Coins, currentBalance: 100, weeklyIncome: 50, growthRatePercent: 0 },
        { currencyId: CurrencyId.Stones, currentBalance: 200, weeklyIncome: 100, growthRatePercent: 0 },
      ]

      const result = projectAllBalances(incomes, 2)

      expect(result.get(CurrencyId.Coins)).toEqual([100, 150, 200])
      expect(result.get(CurrencyId.Stones)).toEqual([200, 300, 400])
    })
  })

  describe('projectAllIncomes', () => {
    it('should project incomes for all currencies', () => {
      const incomes: CurrencyIncome[] = [
        { currencyId: CurrencyId.Coins, currentBalance: 100, weeklyIncome: 50, growthRatePercent: 0 },
        { currencyId: CurrencyId.Stones, currentBalance: 200, weeklyIncome: 100, growthRatePercent: 0 },
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
