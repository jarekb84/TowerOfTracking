import { describe, it, expect } from 'vitest'
import {
  generateWeekDates,
  daysBetween,
  isDateInWeek,
  durationToWeeks,
  getWeekStart,
  getDaysRemainingInWeek,
  getCurrentWeekProrationFactor,
  formatDateRange,
} from './timeline-utils'

describe('timeline-utils', () => {
  describe('generateWeekDates', () => {
    it('should generate correct number of week dates', () => {
      const start = new Date(2025, 0, 1)
      const dates = generateWeekDates(start, 4)

      expect(dates).toHaveLength(4)
    })

    it('should space dates 7 days apart', () => {
      const start = new Date(2025, 0, 1)
      const dates = generateWeekDates(start, 3)

      expect(dates[0].getDate()).toBe(1)
      expect(dates[1].getDate()).toBe(8)
      expect(dates[2].getDate()).toBe(15)
    })

    it('should handle empty weeks', () => {
      const start = new Date(2025, 0, 1)
      const dates = generateWeekDates(start, 0)

      expect(dates).toHaveLength(0)
    })
  })

  describe('daysBetween', () => {
    it('should return 0 for same date', () => {
      const date = new Date(2025, 0, 1)
      expect(daysBetween(date, date)).toBe(0)
    })

    it('should return correct number of days', () => {
      const start = new Date(2025, 0, 1)
      const end = new Date(2025, 0, 15)
      expect(daysBetween(start, end)).toBe(14)
    })

    it('should handle month boundaries', () => {
      const start = new Date(2025, 0, 25)
      const end = new Date(2025, 1, 5)
      expect(daysBetween(start, end)).toBe(11)
    })
  })

  describe('isDateInWeek', () => {
    const weekStart = new Date(2025, 0, 6) // Monday

    it('should return true for first day of week', () => {
      const date = new Date(2025, 0, 6)
      expect(isDateInWeek(date, weekStart)).toBe(true)
    })

    it('should return true for mid-week day', () => {
      const date = new Date(2025, 0, 9)
      expect(isDateInWeek(date, weekStart)).toBe(true)
    })

    it('should return true for last day of week', () => {
      const date = new Date(2025, 0, 12)
      expect(isDateInWeek(date, weekStart)).toBe(true)
    })

    it('should return false for next week', () => {
      const date = new Date(2025, 0, 13)
      expect(isDateInWeek(date, weekStart)).toBe(false)
    })

    it('should return false for previous week', () => {
      const date = new Date(2025, 0, 5)
      expect(isDateInWeek(date, weekStart)).toBe(false)
    })
  })

  describe('durationToWeeks', () => {
    it('should return 1 for 1-7 days', () => {
      expect(durationToWeeks(1)).toBe(1)
      expect(durationToWeeks(7)).toBe(1)
    })

    it('should return 2 for 8-14 days', () => {
      expect(durationToWeeks(8)).toBe(2)
      expect(durationToWeeks(14)).toBe(2)
    })

    it('should round up partial weeks', () => {
      expect(durationToWeeks(10)).toBe(2)
      expect(durationToWeeks(15)).toBe(3)
    })

    it('should handle 0 days', () => {
      expect(durationToWeeks(0)).toBe(0)
    })
  })

  describe('getWeekStart', () => {
    it('should return Sunday for a Sunday', () => {
      const sunday = new Date(2025, 0, 5) // Sunday
      const result = getWeekStart(sunday)
      expect(result.getDate()).toBe(5)
    })

    it('should return previous Sunday for mid-week date', () => {
      const wednesday = new Date(2025, 0, 8) // Wednesday
      const result = getWeekStart(wednesday)
      expect(result.getDate()).toBe(5) // Previous Sunday
    })

    it('should return previous Sunday for Saturday', () => {
      const saturday = new Date(2025, 0, 11) // Saturday
      const result = getWeekStart(saturday)
      expect(result.getDate()).toBe(5) // Previous Sunday
    })

    it('should set time to midnight', () => {
      const date = new Date(2025, 0, 8, 15, 30, 45)
      const result = getWeekStart(date)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })
  })

  describe('getDaysRemainingInWeek', () => {
    it('should return 7 for Sunday (full week remaining)', () => {
      const sunday = new Date(2025, 0, 5) // Sunday
      expect(getDaysRemainingInWeek(sunday)).toBe(7)
    })

    it('should return 6 for Monday', () => {
      const monday = new Date(2025, 0, 6) // Monday
      expect(getDaysRemainingInWeek(monday)).toBe(6)
    })

    it('should return 2 for Friday', () => {
      const friday = new Date(2025, 0, 3) // Friday
      expect(getDaysRemainingInWeek(friday)).toBe(2)
    })

    it('should return 1 for Saturday (only Saturday remains)', () => {
      const saturday = new Date(2025, 0, 4) // Saturday
      expect(getDaysRemainingInWeek(saturday)).toBe(1)
    })
  })

  describe('getCurrentWeekProrationFactor', () => {
    it('should return 1.0 for Sunday (full week)', () => {
      const sunday = new Date(2025, 0, 5) // Sunday
      expect(getCurrentWeekProrationFactor(sunday)).toBe(1)
    })

    it('should return approximately 0.857 for Monday (6/7)', () => {
      const monday = new Date(2025, 0, 6) // Monday
      expect(getCurrentWeekProrationFactor(monday)).toBeCloseTo(6 / 7, 5)
    })

    it('should return approximately 0.286 for Friday (2/7)', () => {
      const friday = new Date(2025, 0, 3) // Friday
      expect(getCurrentWeekProrationFactor(friday)).toBeCloseTo(2 / 7, 5)
    })

    it('should return approximately 0.143 for Saturday (1/7)', () => {
      const saturday = new Date(2025, 0, 4) // Saturday
      expect(getCurrentWeekProrationFactor(saturday)).toBeCloseTo(1 / 7, 5)
    })
  })

  describe('formatDateRange', () => {
    it('should format a date range using locale-aware format', () => {
      const start = new Date(2025, 0, 5)
      const end = new Date(2025, 0, 15)
      expect(formatDateRange(start, end)).toBe('Jan 5 - Jan 15')
    })
  })
})
