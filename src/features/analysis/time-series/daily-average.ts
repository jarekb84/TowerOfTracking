import {
  getDaysInMonth,
  differenceInDays,
  isSameMonth,
  isSameYear,
  endOfWeek,
  isWithinInterval,
  getDate,
} from 'date-fns'
import type { PeriodInfo } from './chart-types'

/**
 * Check if a week contains the reference date (i.e., is the "current" week)
 */
export function isCurrentWeek(weekStart: Date, referenceDate: Date): boolean {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 })
  return isWithinInterval(referenceDate, { start: weekStart, end: weekEnd })
}

/**
 * Check if a month contains the reference date (i.e., is the "current" month)
 */
export function isCurrentMonth(monthDate: Date, referenceDate: Date): boolean {
  return isSameMonth(monthDate, referenceDate) && isSameYear(monthDate, referenceDate)
}

/**
 * Calculate daily average for a weekly period
 * - Current week: days from Sunday through reference date
 * - Past weeks: 7 days
 */
export function calculateWeeklyDailyAverage(
  total: number,
  weekStart: Date,
  referenceDate: Date = new Date()
): PeriodInfo {
  let daysInPeriod: number

  if (isCurrentWeek(weekStart, referenceDate)) {
    // Current week: count days from Sunday through today (inclusive)
    daysInPeriod = differenceInDays(referenceDate, weekStart) + 1
  } else {
    // Past week: always 7 days
    daysInPeriod = 7
  }

  return {
    dailyAverage: daysInPeriod > 0 ? total / daysInPeriod : 0,
    daysInPeriod,
  }
}

/**
 * Calculate daily average for a monthly period
 * - Current month: days from 1st through reference date
 * - Past months: actual days in that month
 */
export function calculateMonthlyDailyAverage(
  total: number,
  monthDate: Date,
  referenceDate: Date = new Date()
): PeriodInfo {
  let daysInPeriod: number

  if (isCurrentMonth(monthDate, referenceDate)) {
    // Current month: count days from 1st through today
    daysInPeriod = getDate(referenceDate)
  } else {
    // Past month: use actual days in that month
    daysInPeriod = getDaysInMonth(monthDate)
  }

  return {
    dailyAverage: daysInPeriod > 0 ? total / daysInPeriod : 0,
    daysInPeriod,
  }
}
