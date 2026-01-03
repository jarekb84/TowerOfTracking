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
  describe('week 0 (current week)', () => {
    it('should apply proration to income only', () => {
      const result = calculateWeekBalance({
        rawBalance: 255,
        income: 500,
        expenditure: 0,
        weekIndex: 0,
        currentWeekProrationFactor: 0.26,
        week0FullIncome: 500,
      })

      expect(result.priorBalance).toBe(255)
      expect(result.income).toBeCloseTo(130, 0)
      expect(result.expenditure).toBe(0)
      expect(result.balance).toBeCloseTo(385, 0)
    })

    it('should handle expenditure in week 0', () => {
      const result = calculateWeekBalance({
        rawBalance: 100,
        income: 500,
        expenditure: 200,
        weekIndex: 0,
        currentWeekProrationFactor: 0.5,
        week0FullIncome: 500,
      })

      expect(result.priorBalance).toBe(300)
      expect(result.income).toBe(250)
      expect(result.balance).toBe(350)
    })

    it('should work with full week (factor 1)', () => {
      const result = calculateWeekBalance({
        rawBalance: 255,
        income: 500,
        expenditure: 0,
        weekIndex: 0,
        currentWeekProrationFactor: 1,
        week0FullIncome: 500,
      })

      expect(result.balance).toBe(755)
    })
  })

  describe('week N > 0 (future weeks)', () => {
    it('should apply proration adjustment from week 0', () => {
      const result = calculateWeekBalance({
        rawBalance: 755,
        income: 500.5,
        expenditure: 0,
        weekIndex: 1,
        currentWeekProrationFactor: 0.26,
        week0FullIncome: 500,
      })

      const adjustment = (0.26 - 1) * 500
      expect(result.priorBalance).toBeCloseTo(755 + adjustment, 0)
      expect(result.balance).toBeCloseTo(755 + 500.5 + adjustment, 0)
    })

    it('should handle expenditure in future week', () => {
      const result = calculateWeekBalance({
        rawBalance: 83,
        income: 500.5,
        expenditure: 672,
        weekIndex: 1,
        currentWeekProrationFactor: 0.26,
        week0FullIncome: 500,
      })

      const adjustment = (0.26 - 1) * 500
      expect(result.priorBalance).toBeCloseTo(83 + 672 + adjustment, 0)
      expect(result.balance).toBeCloseTo(83 + 500.5 + adjustment, 0)
    })

    it('should work with full week 0 (no adjustment needed)', () => {
      const result = calculateWeekBalance({
        rawBalance: 755,
        income: 500,
        expenditure: 0,
        weekIndex: 1,
        currentWeekProrationFactor: 1,
        week0FullIncome: 500,
      })

      expect(result.priorBalance).toBe(755)
      expect(result.balance).toBe(1255)
    })
  })

  describe('user-reported scenario', () => {
    // Starting balance: 255T, Week 0: +130T prorated -> 385T
    // Week 1: prior 385T, +500.5T income, -672T spending -> ~213.5T

    it('should calculate week 0 correctly', () => {
      const result = calculateWeekBalance({
        rawBalance: 255e12,
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
      const rawBalance = 255e12 + 500e12 - 672e12

      const result = calculateWeekBalance({
        rawBalance,
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
