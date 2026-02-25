/**
 * Week Utility Functions Tests
 *
 * Comprehensive tests for Sunday-based week date math.
 */

import { describe, it, expect } from 'vitest'
import {
  getWeekStart,
  getWeekEnd,
  getNextWeekStart,
  getPrevWeekStart,
  isSameWeek,
  getDayIndex,
} from './week-utils'

describe('week-utils', () => {
  describe('getWeekStart', () => {
    it('should return same day at midnight when given a Sunday', () => {
      // 2024-01-07 is a Sunday
      const sunday = new Date(2024, 0, 7, 14, 30, 0)
      const result = getWeekStart(sunday)

      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(7)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })

    it('should return previous Sunday for Monday', () => {
      // 2024-01-08 is a Monday
      const monday = new Date(2024, 0, 8, 10, 0, 0)
      const result = getWeekStart(monday)

      expect(result.getDate()).toBe(7) // Sunday Jan 7
      expect(result.getDay()).toBe(0) // Sunday
      expect(result.getHours()).toBe(0)
    })

    it('should return previous Sunday for Tuesday', () => {
      // 2024-01-09 is a Tuesday
      const tuesday = new Date(2024, 0, 9, 12, 0, 0)
      const result = getWeekStart(tuesday)

      expect(result.getDate()).toBe(7)
      expect(result.getDay()).toBe(0)
    })

    it('should return previous Sunday for Wednesday', () => {
      // 2024-01-10 is a Wednesday
      const wednesday = new Date(2024, 0, 10, 12, 0, 0)
      const result = getWeekStart(wednesday)

      expect(result.getDate()).toBe(7)
      expect(result.getDay()).toBe(0)
    })

    it('should return previous Sunday for Thursday', () => {
      // 2024-01-11 is a Thursday
      const thursday = new Date(2024, 0, 11, 12, 0, 0)
      const result = getWeekStart(thursday)

      expect(result.getDate()).toBe(7)
      expect(result.getDay()).toBe(0)
    })

    it('should return previous Sunday for Friday', () => {
      // 2024-01-12 is a Friday
      const friday = new Date(2024, 0, 12, 12, 0, 0)
      const result = getWeekStart(friday)

      expect(result.getDate()).toBe(7)
      expect(result.getDay()).toBe(0)
    })

    it('should return previous Sunday for Saturday', () => {
      // 2024-01-13 is a Saturday
      const saturday = new Date(2024, 0, 13, 23, 59, 59)
      const result = getWeekStart(saturday)

      expect(result.getDate()).toBe(7) // Sunday Jan 7
      expect(result.getDay()).toBe(0)
    })

    it('should handle edge of year (Jan 1 on a Wednesday)', () => {
      // 2025-01-01 is a Wednesday
      const newYearsDay = new Date(2025, 0, 1, 12, 0, 0)
      const result = getWeekStart(newYearsDay)

      // Should go back to Sunday Dec 29, 2024
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(11) // December
      expect(result.getDate()).toBe(29)
      expect(result.getDay()).toBe(0) // Sunday
    })

    it('should handle edge of month', () => {
      // 2024-03-01 is a Friday
      const marchFirst = new Date(2024, 2, 1, 12, 0, 0)
      const result = getWeekStart(marchFirst)

      // Should go back to Sunday Feb 25, 2024
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(25)
      expect(result.getDay()).toBe(0)
    })

    it('should not mutate the input date', () => {
      const original = new Date(2024, 0, 10, 15, 30, 0)
      const originalTime = original.getTime()
      getWeekStart(original)

      expect(original.getTime()).toBe(originalTime)
    })
  })

  describe('getWeekEnd', () => {
    it('should return Saturday 23:59:59.999 for a given Sunday', () => {
      const sunday = new Date(2024, 0, 7, 0, 0, 0, 0) // Sunday Jan 7
      const result = getWeekEnd(sunday)

      expect(result.getDate()).toBe(13) // Saturday Jan 13
      expect(result.getDay()).toBe(6) // Saturday
      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(59)
      expect(result.getMilliseconds()).toBe(999)
    })

    it('should handle week crossing month boundary', () => {
      // Sunday Jan 28, 2024 -> Saturday Feb 3, 2024
      const sunday = new Date(2024, 0, 28, 0, 0, 0, 0)
      const result = getWeekEnd(sunday)

      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(3)
      expect(result.getDay()).toBe(6)
      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(59)
      expect(result.getMilliseconds()).toBe(999)
    })

    it('should handle week crossing year boundary', () => {
      // Sunday Dec 29, 2024 -> Saturday Jan 4, 2025
      const sunday = new Date(2024, 11, 29, 0, 0, 0, 0)
      const result = getWeekEnd(sunday)

      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(4)
      expect(result.getDay()).toBe(6)
    })

    it('should not mutate the input date', () => {
      const original = new Date(2024, 0, 7, 0, 0, 0, 0)
      const originalTime = original.getTime()
      getWeekEnd(original)

      expect(original.getTime()).toBe(originalTime)
    })
  })

  describe('getNextWeekStart', () => {
    it('should add 7 days to the given date', () => {
      const sunday = new Date(2024, 0, 7, 0, 0, 0, 0) // Sunday Jan 7
      const result = getNextWeekStart(sunday)

      expect(result.getDate()).toBe(14) // Sunday Jan 14
      expect(result.getDay()).toBe(0) // Sunday
      expect(result.getHours()).toBe(0)
    })

    it('should handle month boundary', () => {
      const sunday = new Date(2024, 0, 28, 0, 0, 0, 0) // Sunday Jan 28
      const result = getNextWeekStart(sunday)

      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(4) // Sunday Feb 4
    })

    it('should handle year boundary', () => {
      const sunday = new Date(2024, 11, 29, 0, 0, 0, 0) // Sunday Dec 29
      const result = getNextWeekStart(sunday)

      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(5) // Sunday Jan 5
    })

    it('should not mutate the input date', () => {
      const original = new Date(2024, 0, 7, 0, 0, 0, 0)
      const originalTime = original.getTime()
      getNextWeekStart(original)

      expect(original.getTime()).toBe(originalTime)
    })
  })

  describe('getPrevWeekStart', () => {
    it('should subtract 7 days from the given date', () => {
      const sunday = new Date(2024, 0, 14, 0, 0, 0, 0) // Sunday Jan 14
      const result = getPrevWeekStart(sunday)

      expect(result.getDate()).toBe(7) // Sunday Jan 7
      expect(result.getDay()).toBe(0) // Sunday
      expect(result.getHours()).toBe(0)
    })

    it('should handle month boundary', () => {
      const sunday = new Date(2024, 1, 4, 0, 0, 0, 0) // Sunday Feb 4
      const result = getPrevWeekStart(sunday)

      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(28)
    })

    it('should handle year boundary', () => {
      const sunday = new Date(2025, 0, 5, 0, 0, 0, 0) // Sunday Jan 5, 2025
      const result = getPrevWeekStart(sunday)

      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(11) // December
      expect(result.getDate()).toBe(29)
    })

    it('should not mutate the input date', () => {
      const original = new Date(2024, 0, 14, 0, 0, 0, 0)
      const originalTime = original.getTime()
      getPrevWeekStart(original)

      expect(original.getTime()).toBe(originalTime)
    })
  })

  describe('isSameWeek', () => {
    it('should return true for two dates in the same week', () => {
      // Sunday Jan 7 and Tuesday Jan 9, 2024
      const sunday = new Date(2024, 0, 7, 10, 0, 0)
      const tuesday = new Date(2024, 0, 9, 15, 0, 0)

      expect(isSameWeek(sunday, tuesday)).toBe(true)
    })

    it('should return true for Sunday and Saturday of the same week', () => {
      // Sunday Jan 7 and Saturday Jan 13, 2024
      const sunday = new Date(2024, 0, 7, 0, 0, 0)
      const saturday = new Date(2024, 0, 13, 23, 59, 59)

      expect(isSameWeek(sunday, saturday)).toBe(true)
    })

    it('should return false for adjacent weeks', () => {
      // Saturday Jan 13 and Sunday Jan 14, 2024
      const saturday = new Date(2024, 0, 13, 23, 59, 59)
      const nextSunday = new Date(2024, 0, 14, 0, 0, 0)

      expect(isSameWeek(saturday, nextSunday)).toBe(false)
    })

    it('should return false for dates in different weeks', () => {
      const week1 = new Date(2024, 0, 8, 12, 0, 0)
      const week3 = new Date(2024, 0, 22, 12, 0, 0)

      expect(isSameWeek(week1, week3)).toBe(false)
    })

    it('should return true for the same date', () => {
      const date = new Date(2024, 0, 10, 12, 0, 0)

      expect(isSameWeek(date, date)).toBe(true)
    })

    it('should handle week spanning month boundary', () => {
      // Sunday Jan 28 and Thursday Feb 1, 2024 (same week)
      const sunday = new Date(2024, 0, 28, 12, 0, 0)
      const thursday = new Date(2024, 1, 1, 12, 0, 0)

      expect(isSameWeek(sunday, thursday)).toBe(true)
    })

    it('should handle week spanning year boundary', () => {
      // Sunday Dec 29, 2024 and Wednesday Jan 1, 2025 (same week)
      const sunday = new Date(2024, 11, 29, 12, 0, 0)
      const wednesday = new Date(2025, 0, 1, 12, 0, 0)

      expect(isSameWeek(sunday, wednesday)).toBe(true)
    })
  })

  describe('getDayIndex', () => {
    it('should return 0 for Sunday', () => {
      // 2024-01-07 is a Sunday
      const sunday = new Date(2024, 0, 7)
      expect(getDayIndex(sunday)).toBe(0)
    })

    it('should return 1 for Monday', () => {
      // 2024-01-08 is a Monday
      const monday = new Date(2024, 0, 8)
      expect(getDayIndex(monday)).toBe(1)
    })

    it('should return 2 for Tuesday', () => {
      // 2024-01-09 is a Tuesday
      const tuesday = new Date(2024, 0, 9)
      expect(getDayIndex(tuesday)).toBe(2)
    })

    it('should return 3 for Wednesday', () => {
      // 2024-01-10 is a Wednesday
      const wednesday = new Date(2024, 0, 10)
      expect(getDayIndex(wednesday)).toBe(3)
    })

    it('should return 4 for Thursday', () => {
      // 2024-01-11 is a Thursday
      const thursday = new Date(2024, 0, 11)
      expect(getDayIndex(thursday)).toBe(4)
    })

    it('should return 5 for Friday', () => {
      // 2024-01-12 is a Friday
      const friday = new Date(2024, 0, 12)
      expect(getDayIndex(friday)).toBe(5)
    })

    it('should return 6 for Saturday', () => {
      // 2024-01-13 is a Saturday
      const saturday = new Date(2024, 0, 13)
      expect(getDayIndex(saturday)).toBe(6)
    })
  })
})
