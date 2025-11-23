import { describe, it, expect } from 'vitest'
import { Duration } from '../types'
import {
  getPeriodCountOptions,
  getDefaultPeriodCount,
  getPeriodCountLabel,
  formatPeriodCountValue,
  adjustPeriodCountForDuration
} from './period-count-logic'

describe('getPeriodCountOptions', () => {
  it('should return standard increments for PER_RUN', () => {
    expect(getPeriodCountOptions(Duration.PER_RUN)).toEqual([5, 10, 15, 20, 25, 30])
  })

  it('should return weekly cycles for DAILY', () => {
    expect(getPeriodCountOptions(Duration.DAILY)).toEqual([7, 14, 21, 28, 35, 42])
  })

  it('should return standard increments for WEEKLY', () => {
    expect(getPeriodCountOptions(Duration.WEEKLY)).toEqual([5, 10, 15, 20, 25, 30])
  })

  it('should return quarterly increments for MONTHLY', () => {
    expect(getPeriodCountOptions(Duration.MONTHLY)).toEqual([3, 6, 9, 12])
  })

  it('should return small increments for YEARLY', () => {
    expect(getPeriodCountOptions(Duration.YEARLY)).toEqual([2, 3, 4, 5])
  })
})

describe('getDefaultPeriodCount', () => {
  it('should return 10 for PER_RUN', () => {
    expect(getDefaultPeriodCount(Duration.PER_RUN)).toBe(10)
  })

  it('should return 14 for DAILY', () => {
    expect(getDefaultPeriodCount(Duration.DAILY)).toBe(14)
  })

  it('should return 10 for WEEKLY', () => {
    expect(getDefaultPeriodCount(Duration.WEEKLY)).toBe(10)
  })

  it('should return 6 for MONTHLY', () => {
    expect(getDefaultPeriodCount(Duration.MONTHLY)).toBe(6)
  })

  it('should return 3 for YEARLY', () => {
    expect(getDefaultPeriodCount(Duration.YEARLY)).toBe(3)
  })
})

describe('getPeriodCountLabel', () => {
  it('should return correct labels for each duration', () => {
    expect(getPeriodCountLabel(Duration.PER_RUN)).toBe('Last Runs')
    expect(getPeriodCountLabel(Duration.DAILY)).toBe('Last Days')
    expect(getPeriodCountLabel(Duration.WEEKLY)).toBe('Last Weeks')
    expect(getPeriodCountLabel(Duration.MONTHLY)).toBe('Last Months')
    expect(getPeriodCountLabel(Duration.YEARLY)).toBe('Last Years')
  })
})

describe('formatPeriodCountValue', () => {
  it('should format "all" as "All"', () => {
    expect(formatPeriodCountValue('all', Duration.DAILY)).toBe('All')
    expect(formatPeriodCountValue('all', Duration.WEEKLY)).toBe('All')
  })

  it('should format singular values correctly', () => {
    expect(formatPeriodCountValue(1, Duration.PER_RUN)).toBe('1 Run')
    expect(formatPeriodCountValue(1, Duration.DAILY)).toBe('1 Day')
    expect(formatPeriodCountValue(1, Duration.WEEKLY)).toBe('1 Week')
    expect(formatPeriodCountValue(1, Duration.MONTHLY)).toBe('1 Month')
    expect(formatPeriodCountValue(1, Duration.YEARLY)).toBe('1 Year')
  })

  it('should format plural values correctly', () => {
    expect(formatPeriodCountValue(5, Duration.PER_RUN)).toBe('5 Runs')
    expect(formatPeriodCountValue(7, Duration.DAILY)).toBe('7 Days')
    expect(formatPeriodCountValue(10, Duration.WEEKLY)).toBe('10 Weeks')
    expect(formatPeriodCountValue(3, Duration.MONTHLY)).toBe('3 Months')
    expect(formatPeriodCountValue(2, Duration.YEARLY)).toBe('2 Years')
  })
})

describe('adjustPeriodCountForDuration', () => {
  it('should keep "all" unchanged', () => {
    expect(adjustPeriodCountForDuration('all', Duration.DAILY)).toBe('all')
    expect(adjustPeriodCountForDuration('all', Duration.WEEKLY)).toBe('all')
  })

  it('should keep valid option unchanged', () => {
    expect(adjustPeriodCountForDuration(10, Duration.PER_RUN)).toBe(10)
    expect(adjustPeriodCountForDuration(14, Duration.DAILY)).toBe(14)
    expect(adjustPeriodCountForDuration(6, Duration.MONTHLY)).toBe(6)
  })

  it('should find closest option when current is invalid', () => {
    // 10 is not in DAILY options [7, 14, 21, 28, 35, 42]
    // Closest is 7 (diff 3) vs 14 (diff 4)
    expect(adjustPeriodCountForDuration(10, Duration.DAILY)).toBe(7)

    // 15 -> closest is 14
    expect(adjustPeriodCountForDuration(15, Duration.DAILY)).toBe(14)

    // 10 is not in MONTHLY options [3, 6, 9, 12]
    // Closest is 9 (diff 1) vs 12 (diff 2)
    expect(adjustPeriodCountForDuration(10, Duration.MONTHLY)).toBe(9)

    // 8 -> closest is 9 (diff 1) vs 6 (diff 2)
    expect(adjustPeriodCountForDuration(8, Duration.MONTHLY)).toBe(9)
  })

  it('should handle values outside range', () => {
    // 100 is far above all options
    expect(adjustPeriodCountForDuration(100, Duration.DAILY)).toBe(42)

    // 1 is below all YEARLY options [2, 3, 4, 5]
    expect(adjustPeriodCountForDuration(1, Duration.YEARLY)).toBe(2)
  })
})
