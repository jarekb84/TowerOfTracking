import { describe, it, expect } from 'vitest'
import {
  isCurrentWeek,
  isCurrentMonth,
  calculateWeeklyDailyAverage,
  calculateMonthlyDailyAverage,
} from './daily-average'

describe('isCurrentWeek', () => {
  it('returns true when reference date is within the week', () => {
    // Sunday Dec 1, 2024
    const weekStart = new Date(2024, 11, 1)
    // Wednesday Dec 4, 2024
    const referenceDate = new Date(2024, 11, 4)
    expect(isCurrentWeek(weekStart, referenceDate)).toBe(true)
  })

  it('returns true when reference date is the start of the week', () => {
    const weekStart = new Date(2024, 11, 1)
    const referenceDate = new Date(2024, 11, 1)
    expect(isCurrentWeek(weekStart, referenceDate)).toBe(true)
  })

  it('returns true when reference date is the end of the week', () => {
    // Sunday Dec 1, 2024
    const weekStart = new Date(2024, 11, 1)
    // Saturday Dec 7, 2024
    const referenceDate = new Date(2024, 11, 7)
    expect(isCurrentWeek(weekStart, referenceDate)).toBe(true)
  })

  it('returns false when reference date is before the week', () => {
    const weekStart = new Date(2024, 11, 8)
    const referenceDate = new Date(2024, 11, 4)
    expect(isCurrentWeek(weekStart, referenceDate)).toBe(false)
  })

  it('returns false when reference date is after the week', () => {
    const weekStart = new Date(2024, 11, 1)
    const referenceDate = new Date(2024, 11, 10)
    expect(isCurrentWeek(weekStart, referenceDate)).toBe(false)
  })
})

describe('isCurrentMonth', () => {
  it('returns true when reference date is within the same month', () => {
    const monthDate = new Date(2024, 11, 1)
    const referenceDate = new Date(2024, 11, 21)
    expect(isCurrentMonth(monthDate, referenceDate)).toBe(true)
  })

  it('returns false when reference date is in a different month', () => {
    const monthDate = new Date(2024, 10, 1) // November
    const referenceDate = new Date(2024, 11, 21) // December
    expect(isCurrentMonth(monthDate, referenceDate)).toBe(false)
  })

  it('returns false when reference date is in a different year', () => {
    const monthDate = new Date(2023, 11, 1) // December 2023
    const referenceDate = new Date(2024, 11, 21) // December 2024
    expect(isCurrentMonth(monthDate, referenceDate)).toBe(false)
  })
})

describe('calculateWeeklyDailyAverage', () => {
  describe('past weeks', () => {
    it('uses 7 days for a past week', () => {
      // Week starting Nov 24, 2024 (past week)
      const weekStart = new Date(2024, 10, 24)
      // Reference date is Dec 7, 2024 (different week)
      const referenceDate = new Date(2024, 11, 7)
      const total = 700

      const result = calculateWeeklyDailyAverage(total, weekStart, referenceDate)

      expect(result.daysInPeriod).toBe(7)
      expect(result.dailyAverage).toBe(100)
    })
  })

  describe('current week', () => {
    it('uses days elapsed for current week (Wednesday = 4 days)', () => {
      // Week starting Sunday Dec 1, 2024
      const weekStart = new Date(2024, 11, 1)
      // Reference date is Wednesday Dec 4, 2024 (Sun, Mon, Tue, Wed = 4 days)
      const referenceDate = new Date(2024, 11, 4)
      const total = 400

      const result = calculateWeeklyDailyAverage(total, weekStart, referenceDate)

      expect(result.daysInPeriod).toBe(4)
      expect(result.dailyAverage).toBe(100)
    })

    it('uses 1 day for first day of week (Sunday)', () => {
      // Week starting Sunday Dec 1, 2024
      const weekStart = new Date(2024, 11, 1)
      // Reference date is Sunday Dec 1, 2024
      const referenceDate = new Date(2024, 11, 1)
      const total = 100

      const result = calculateWeeklyDailyAverage(total, weekStart, referenceDate)

      expect(result.daysInPeriod).toBe(1)
      expect(result.dailyAverage).toBe(100)
    })

    it('uses 7 days for Saturday (last day of week)', () => {
      // Week starting Sunday Dec 1, 2024
      const weekStart = new Date(2024, 11, 1)
      // Reference date is Saturday Dec 7, 2024
      const referenceDate = new Date(2024, 11, 7)
      const total = 700

      const result = calculateWeeklyDailyAverage(total, weekStart, referenceDate)

      expect(result.daysInPeriod).toBe(7)
      expect(result.dailyAverage).toBe(100)
    })
  })

  describe('edge cases', () => {
    it('handles zero total', () => {
      const weekStart = new Date(2024, 11, 1)
      const referenceDate = new Date(2024, 11, 10)

      const result = calculateWeeklyDailyAverage(0, weekStart, referenceDate)

      expect(result.daysInPeriod).toBe(7)
      expect(result.dailyAverage).toBe(0)
    })
  })
})

describe('calculateMonthlyDailyAverage', () => {
  describe('past months', () => {
    it('uses 30 days for November', () => {
      const monthDate = new Date(2024, 10, 1) // November
      const referenceDate = new Date(2024, 11, 7) // December
      const total = 3000

      const result = calculateMonthlyDailyAverage(total, monthDate, referenceDate)

      expect(result.daysInPeriod).toBe(30)
      expect(result.dailyAverage).toBe(100)
    })

    it('uses 31 days for October', () => {
      const monthDate = new Date(2024, 9, 1) // October
      const referenceDate = new Date(2024, 11, 7) // December
      const total = 3100

      const result = calculateMonthlyDailyAverage(total, monthDate, referenceDate)

      expect(result.daysInPeriod).toBe(31)
      expect(result.dailyAverage).toBe(100)
    })

    it('uses 28 days for February in a non-leap year', () => {
      const monthDate = new Date(2023, 1, 1) // February 2023
      const referenceDate = new Date(2023, 11, 7) // December 2023
      const total = 2800

      const result = calculateMonthlyDailyAverage(total, monthDate, referenceDate)

      expect(result.daysInPeriod).toBe(28)
      expect(result.dailyAverage).toBe(100)
    })

    it('uses 29 days for February in a leap year', () => {
      const monthDate = new Date(2024, 1, 1) // February 2024
      const referenceDate = new Date(2024, 11, 7) // December 2024
      const total = 2900

      const result = calculateMonthlyDailyAverage(total, monthDate, referenceDate)

      expect(result.daysInPeriod).toBe(29)
      expect(result.dailyAverage).toBe(100)
    })
  })

  describe('current month', () => {
    it('uses day of month for current month (Dec 21 = 21 days)', () => {
      const monthDate = new Date(2024, 11, 1) // December
      const referenceDate = new Date(2024, 11, 21) // December 21
      const total = 2100

      const result = calculateMonthlyDailyAverage(total, monthDate, referenceDate)

      expect(result.daysInPeriod).toBe(21)
      expect(result.dailyAverage).toBe(100)
    })

    it('uses 1 day for first day of month', () => {
      const monthDate = new Date(2024, 11, 1) // December
      const referenceDate = new Date(2024, 11, 1) // December 1
      const total = 100

      const result = calculateMonthlyDailyAverage(total, monthDate, referenceDate)

      expect(result.daysInPeriod).toBe(1)
      expect(result.dailyAverage).toBe(100)
    })

    it('uses full days for last day of month', () => {
      const monthDate = new Date(2024, 10, 1) // November
      const referenceDate = new Date(2024, 10, 30) // November 30
      const total = 3000

      const result = calculateMonthlyDailyAverage(total, monthDate, referenceDate)

      expect(result.daysInPeriod).toBe(30)
      expect(result.dailyAverage).toBe(100)
    })
  })

  describe('edge cases', () => {
    it('handles zero total', () => {
      const monthDate = new Date(2024, 10, 1) // November
      const referenceDate = new Date(2024, 11, 7) // December

      const result = calculateMonthlyDailyAverage(0, monthDate, referenceDate)

      expect(result.daysInPeriod).toBe(30)
      expect(result.dailyAverage).toBe(0)
    })
  })
})
