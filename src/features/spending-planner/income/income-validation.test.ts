import { describe, it, expect } from 'vitest'
import {
  validateCurrencyIncome,
  validateStoneBreakdown,
  clampNumber,
  ensureNonNegative,
  clampGrowthRate,
} from './income-validation'
import { CurrencyId } from '../types'
import type { CurrencyIncome, StoneIncomeBreakdown } from '../types'

describe('income-validation', () => {
  describe('validateCurrencyIncome', () => {
    it('should accept valid income', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 1000,
        weeklyIncome: 500,
        growthRatePercent: 5,
      }
      const result = validateCurrencyIncome(income)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept zero values', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Stones,
        currentBalance: 0,
        weeklyIncome: 0,
        growthRatePercent: 0,
      }
      const result = validateCurrencyIncome(income)
      expect(result.isValid).toBe(true)
    })

    it('should reject negative balance', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: -100,
        weeklyIncome: 500,
        growthRatePercent: 5,
      }
      const result = validateCurrencyIncome(income)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Current balance cannot be negative')
    })

    it('should reject negative income', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 100,
        weeklyIncome: -500,
        growthRatePercent: 5,
      }
      const result = validateCurrencyIncome(income)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Weekly income cannot be negative')
    })

    it('should reject growth rate below -100%', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 100,
        weeklyIncome: 500,
        growthRatePercent: -150,
      }
      const result = validateCurrencyIncome(income)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Growth rate cannot be less than -100%')
    })

    it('should reject growth rate above 1000%', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 100,
        weeklyIncome: 500,
        growthRatePercent: 1500,
      }
      const result = validateCurrencyIncome(income)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Growth rate cannot exceed 1000%')
    })

    it('should accept -100% growth rate', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: 100,
        weeklyIncome: 500,
        growthRatePercent: -100,
      }
      const result = validateCurrencyIncome(income)
      expect(result.isValid).toBe(true)
    })

    it('should collect multiple errors', () => {
      const income: CurrencyIncome = {
        currencyId: CurrencyId.Coins,
        currentBalance: -100,
        weeklyIncome: -500,
        growthRatePercent: 5,
      }
      const result = validateCurrencyIncome(income)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('validateStoneBreakdown', () => {
    it('should accept valid breakdown', () => {
      const breakdown: StoneIncomeBreakdown = {
        weeklyChallenges: 60,
        eventStore: 0,
        tournamentResults: 200,
      }
      const result = validateStoneBreakdown(breakdown)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept all zeros', () => {
      const breakdown: StoneIncomeBreakdown = {
        weeklyChallenges: 0,
        eventStore: 0,
        tournamentResults: 0,
      }
      const result = validateStoneBreakdown(breakdown)
      expect(result.isValid).toBe(true)
    })

    it('should reject negative weekly challenges', () => {
      const breakdown: StoneIncomeBreakdown = {
        weeklyChallenges: -10,
        eventStore: 0,
        tournamentResults: 200,
      }
      const result = validateStoneBreakdown(breakdown)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Weekly challenges cannot be negative')
    })

    it('should reject negative event store', () => {
      const breakdown: StoneIncomeBreakdown = {
        weeklyChallenges: 60,
        eventStore: -50,
        tournamentResults: 200,
      }
      const result = validateStoneBreakdown(breakdown)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Event store cannot be negative')
    })

    it('should reject negative tournament results', () => {
      const breakdown: StoneIncomeBreakdown = {
        weeklyChallenges: 60,
        eventStore: 0,
        tournamentResults: -100,
      }
      const result = validateStoneBreakdown(breakdown)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Tournament results cannot be negative')
    })
  })

  describe('clampNumber', () => {
    it('should return value within range', () => {
      expect(clampNumber(5, 0, 10)).toBe(5)
    })

    it('should clamp to minimum', () => {
      expect(clampNumber(-5, 0, 10)).toBe(0)
    })

    it('should clamp to maximum', () => {
      expect(clampNumber(15, 0, 10)).toBe(10)
    })

    it('should handle edge cases', () => {
      expect(clampNumber(0, 0, 10)).toBe(0)
      expect(clampNumber(10, 0, 10)).toBe(10)
    })
  })

  describe('ensureNonNegative', () => {
    it('should return positive values unchanged', () => {
      expect(ensureNonNegative(100)).toBe(100)
    })

    it('should return zero unchanged', () => {
      expect(ensureNonNegative(0)).toBe(0)
    })

    it('should convert negative to zero', () => {
      expect(ensureNonNegative(-50)).toBe(0)
    })
  })

  describe('clampGrowthRate', () => {
    it('should return valid growth rate unchanged', () => {
      expect(clampGrowthRate(5)).toBe(5)
      expect(clampGrowthRate(0)).toBe(0)
      expect(clampGrowthRate(100)).toBe(100)
    })

    it('should clamp to -100% minimum', () => {
      expect(clampGrowthRate(-150)).toBe(-100)
    })

    it('should clamp to 1000% maximum', () => {
      expect(clampGrowthRate(1500)).toBe(1000)
    })

    it('should allow boundary values', () => {
      expect(clampGrowthRate(-100)).toBe(-100)
      expect(clampGrowthRate(1000)).toBe(1000)
    })
  })
})
