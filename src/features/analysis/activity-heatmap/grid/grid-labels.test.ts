import { describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/locale/locale-store', () => ({
  getDisplayLocale: () => 'en-US',
}))

import { formatDayHeaderLabel, formatHourLabel, formatHourOption, isHourActive } from './grid-labels'

describe('formatDayHeaderLabel', () => {
  it('returns weekday and day for first day of week', () => {
    // Sunday Jan 7, 2024
    const weekStart = new Date(2024, 0, 7)
    const result = formatDayHeaderLabel(0, weekStart)
    expect(result).toContain('Sun')
    expect(result).toContain('7')
  })

  it('returns weekday and day for last day of week', () => {
    // Sunday Jan 7 → Saturday Jan 13
    const weekStart = new Date(2024, 0, 7)
    const result = formatDayHeaderLabel(6, weekStart)
    expect(result).toContain('Sat')
    expect(result).toContain('13')
  })

  it('returns empty string for negative index', () => {
    expect(formatDayHeaderLabel(-1, new Date())).toBe('')
  })

  it('returns empty string for index > 6', () => {
    expect(formatDayHeaderLabel(7, new Date())).toBe('')
  })

  it('handles month boundary correctly', () => {
    // Sunday Jan 28, 2024 → dayIndex 5 = Friday Feb 2
    const weekStart = new Date(2024, 0, 28)
    const result = formatDayHeaderLabel(5, weekStart)
    expect(result).toContain('Fri')
    expect(result).toContain('2')
  })

  it('produces unique labels for all 7 days', () => {
    const weekStart = new Date(2024, 0, 7)
    const labels = Array.from({ length: 7 }, (_, i) => formatDayHeaderLabel(i, weekStart))
    const unique = new Set(labels)
    expect(unique.size).toBe(7)
  })
})

describe('isHourActive', () => {
  it('returns false when disabled regardless of hour', () => {
    expect(isHourActive(10, 8, 23, false)).toBe(false)
    expect(isHourActive(0, 0, 24, false)).toBe(false)
  })

  describe('standard range (startHour < endHour)', () => {
    it('returns true for hour within range', () => {
      expect(isHourActive(10, 8, 23, true)).toBe(true)
    })

    it('returns false for hour outside range', () => {
      expect(isHourActive(5, 8, 23, true)).toBe(false)
    })

    it('includes startHour (inclusive)', () => {
      expect(isHourActive(8, 8, 23, true)).toBe(true)
    })

    it('excludes endHour (exclusive)', () => {
      expect(isHourActive(23, 8, 23, true)).toBe(false)
    })
  })

  describe('overnight range (startHour >= endHour)', () => {
    it('returns true for hour after startHour', () => {
      expect(isHourActive(23, 22, 6, true)).toBe(true)
    })

    it('returns true for hour before endHour', () => {
      expect(isHourActive(3, 22, 6, true)).toBe(true)
    })

    it('returns false for hour in the gap', () => {
      expect(isHourActive(10, 22, 6, true)).toBe(false)
    })

    it('includes startHour (inclusive)', () => {
      expect(isHourActive(22, 22, 6, true)).toBe(true)
    })

    it('excludes endHour (exclusive)', () => {
      expect(isHourActive(6, 22, 6, true)).toBe(false)
    })
  })
})

describe('formatHourLabel', () => {
  it('returns a non-empty string for hour 0', () => {
    expect(formatHourLabel(0).length).toBeGreaterThan(0)
  })

  it('returns a non-empty string for hour 12', () => {
    expect(formatHourLabel(12).length).toBeGreaterThan(0)
  })

  it('returns a non-empty string for hour 23', () => {
    expect(formatHourLabel(23).length).toBeGreaterThan(0)
  })

  it('produces different labels for different hours', () => {
    const label0 = formatHourLabel(0)
    const label12 = formatHourLabel(12)
    const label6 = formatHourLabel(6)

    expect(label0).not.toBe(label12)
    expect(label0).not.toBe(label6)
    expect(label12).not.toBe(label6)
  })
})

describe('formatHourOption', () => {
  it('returns a non-empty string for hour 0', () => {
    expect(formatHourOption(0).length).toBeGreaterThan(0)
  })

  it('includes minutes in the output', () => {
    // The option format includes minutes (e.g., "2:00 PM" or "14:00")
    const result = formatHourOption(14)
    expect(result).toContain('00')
  })

  it('produces different labels for different hours', () => {
    const option0 = formatHourOption(0)
    const option12 = formatHourOption(12)
    const option6 = formatHourOption(6)

    expect(option0).not.toBe(option12)
    expect(option0).not.toBe(option6)
    expect(option12).not.toBe(option6)
  })

  it('produces all 24 unique labels', () => {
    const labels = Array.from({ length: 24 }, (_, i) => formatHourOption(i))
    const unique = new Set(labels)
    expect(unique.size).toBe(24)
  })
})
