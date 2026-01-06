import { describe, it, expect } from 'vitest'
import { calculateProrationAdjustment, calculateWeekBalance } from './timeline-layout-utils'

describe('calculateProrationAdjustment', () => {
  it('should return 0 when proration factor is 1', () => {
    expect(calculateProrationAdjustment(500, 1)).toBe(0)
  })

  it('should return negative adjustment for partial week', () => {
    // adjustment = (0.5 - 1) * 500 = -250
    expect(calculateProrationAdjustment(500, 0.5)).toBe(-250)
  })

  it('should calculate correct adjustment for realistic proration', () => {
    const factor = 2 / 7
    const result = calculateProrationAdjustment(500, factor)
    expect(result).toBeCloseTo((factor - 1) * 500, 10)
  })

  it('should handle zero income', () => {
    expect(calculateProrationAdjustment(0, 0.5)).toBeCloseTo(0, 10)
  })
})

describe('calculateWeekBalance', () => {
  /**
   * NEW SEMANTICS (Mid-Week Spending Model):
   * - rawEndingBalance = balances[weekIndex + 1] = starting balance + income - spending
   * - priorBalance = balance at START of week = endingBalance - displayedIncome + expenditure
   * - endingBalance = rawEndingBalance (with proration adjustment)
   */

  describe('week 0 (current week)', () => {
    it('should apply proration to income and calculate correct prior balance', () => {
      // Starting balance: 255, Full income: 500, Expenditure: 0
      // rawEndingBalance = 255 + 500 - 0 = 755
      const result = calculateWeekBalance({
        rawEndingBalance: 755,
        income: 500,
        expenditure: 0,
        weekIndex: 0,
        currentWeekProrationFactor: 0.26,
        week0FullIncome: 500,
      })

      // proratedIncome = 500 * 0.26 = 130
      // incomeAdjustment = 130 - 500 = -370
      // endingBalance = 755 + (-370) = 385
      // priorBalance = 385 - 130 + 0 = 255
      expect(result.priorBalance).toBe(255)
      expect(result.income).toBeCloseTo(130, 0)
      expect(result.expenditure).toBe(0)
      expect(result.balance).toBeCloseTo(385, 0)
    })

    it('should handle expenditure in week 0', () => {
      // Starting balance: 300, Full income: 500, Expenditure: 200
      // rawEndingBalance = 300 + 500 - 200 = 600
      const result = calculateWeekBalance({
        rawEndingBalance: 600,
        income: 500,
        expenditure: 200,
        weekIndex: 0,
        currentWeekProrationFactor: 0.5,
        week0FullIncome: 500,
      })

      // proratedIncome = 500 * 0.5 = 250
      // incomeAdjustment = 250 - 500 = -250
      // endingBalance = 600 + (-250) = 350
      // priorBalance = 350 - 250 + 200 = 300
      expect(result.priorBalance).toBe(300)
      expect(result.income).toBe(250)
      expect(result.expenditure).toBe(200)
      expect(result.balance).toBe(350)
    })

    it('should work with full week (factor 1)', () => {
      // Starting balance: 255, Full income: 500, Expenditure: 0
      // rawEndingBalance = 255 + 500 = 755
      const result = calculateWeekBalance({
        rawEndingBalance: 755,
        income: 500,
        expenditure: 0,
        weekIndex: 0,
        currentWeekProrationFactor: 1,
        week0FullIncome: 500,
      })

      // No proration adjustment needed
      expect(result.priorBalance).toBe(255)
      expect(result.balance).toBe(755)
    })
  })

  describe('week N > 0 (future weeks)', () => {
    it('should apply proration adjustment from week 0', () => {
      // Starting balance: 385, Income: 500.5, Expenditure: 0
      // rawEndingBalance (before adjustment) = 385 + 500.5 = 885.5
      // But calculator assumes full week 0 income, so raw = 885.5 + 370 = 1255.5
      const result = calculateWeekBalance({
        rawEndingBalance: 1255.5,
        income: 500.5,
        expenditure: 0,
        weekIndex: 1,
        currentWeekProrationFactor: 0.26,
        week0FullIncome: 500,
      })

      // adjustment = (0.26 - 1) * 500 = -370
      // endingBalance = 1255.5 + (-370) = 885.5
      // priorBalance = 885.5 - 500.5 + 0 = 385
      expect(result.priorBalance).toBeCloseTo(385, 0)
      expect(result.balance).toBeCloseTo(885.5, 0)
    })

    it('should handle expenditure in future week', () => {
      // Starting balance: 385, Income: 500.5, Expenditure: 672
      // Displayed ending balance = 385 + 500.5 - 672 = 213.5
      // rawEndingBalance (before adjustment) = 213.5 - (-370) = 583.5
      const result = calculateWeekBalance({
        rawEndingBalance: 583.5,
        income: 500.5,
        expenditure: 672,
        weekIndex: 1,
        currentWeekProrationFactor: 0.26,
        week0FullIncome: 500,
      })

      // endingBalance = 583.5 + (-370) = 213.5
      // priorBalance = 213.5 - 500.5 + 672 = 385
      expect(result.priorBalance).toBeCloseTo(385, 0)
      expect(result.balance).toBeCloseTo(213.5, 0)
    })

    it('should work with full week 0 (no adjustment needed)', () => {
      // Starting balance: 755, Income: 500, Expenditure: 0
      // rawEndingBalance = 755 + 500 = 1255
      const result = calculateWeekBalance({
        rawEndingBalance: 1255,
        income: 500,
        expenditure: 0,
        weekIndex: 1,
        currentWeekProrationFactor: 1,
        week0FullIncome: 500,
      })

      // No proration adjustment
      expect(result.priorBalance).toBe(755)
      expect(result.balance).toBe(1255)
    })
  })

  describe('user-reported scenario', () => {
    // Starting balance: 255T, Week 0: +130T prorated -> 385T ending balance
    // Week 1: prior 385T, +500.5T income, -672T spending -> ~213.5T ending balance

    it('should calculate week 0 correctly', () => {
      // Starting: 255T, Full income: 500T, Expenditure: 0
      // rawEndingBalance = 255T + 500T = 755T
      const result = calculateWeekBalance({
        rawEndingBalance: 755e12,
        income: 500e12,
        expenditure: 0,
        weekIndex: 0,
        currentWeekProrationFactor: 0.26,
        week0FullIncome: 500e12,
      })

      expect(result.priorBalance).toBe(255e12)
      expect(result.income).toBeCloseTo(130e12, -9)
      expect(result.balance).toBeCloseTo(385e12, -9)
    })

    it('should calculate week 1 correctly with proration adjustment', () => {
      // Prior (starting): 385T, Income: 500.5T, Expenditure: 672T
      // Displayed ending = 385T + 500.5T - 672T = 213.5T
      // Proration adjustment = (0.26 - 1) * 500T = -370T
      // rawEndingBalance = 213.5T - (-370T) = 583.5T
      const rawEndingBalance = 583.5e12

      const result = calculateWeekBalance({
        rawEndingBalance,
        income: 500.5e12,
        expenditure: 672e12,
        weekIndex: 1,
        currentWeekProrationFactor: 0.26,
        week0FullIncome: 500e12,
      })

      expect(result.priorBalance).toBeCloseTo(385e12, -9)
      expect(result.balance).toBeCloseTo(213.5e12, -9)
    })
  })
})
