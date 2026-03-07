import { describe, it, expect } from 'vitest'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration } from '../types'
import {
  getAvailableDurations,
  isDurationAvailable,
  getDurationLabel,
  getClosestAvailableDuration
} from './duration-filter-logic'

function createMockRunWithDate(date: Date): ParsedGameRun {
  return {
    id: `run-${date.getTime()}`,
    timestamp: date,
    tier: 14,
    wave: 100,
    coinsEarned: 1000,
    cellsEarned: 100,
    realTime: 3600,
    runType: 'farm',
    fields: {}
  } as ParsedGameRun
}

describe('getAvailableDurations', () => {
  it('should return empty array for no runs', () => {
    expect(getAvailableDurations([])).toEqual([])
  })

  it('should return HOURLY, PER_RUN, and DAILY for single run', () => {
    const runs = [createMockRunWithDate(new Date('2024-01-15'))]
    expect(getAvailableDurations(runs)).toEqual([Duration.HOURLY, Duration.PER_RUN, Duration.DAILY])
  })

  it('should always include DAILY when runs exist', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-15')),
      createMockRunWithDate(new Date('2024-01-15'))
    ]
    const available = getAvailableDurations(runs)
    expect(available).toContain(Duration.DAILY)
  })

  it('should not include WEEKLY for 7 days or fewer', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-01')),
      createMockRunWithDate(new Date('2024-01-08'))
    ]
    const available = getAvailableDurations(runs)
    expect(available).not.toContain(Duration.WEEKLY)
  })

  it('should include WEEKLY for data spanning more than 7 days', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-01')),
      createMockRunWithDate(new Date('2024-01-09'))
    ]
    const available = getAvailableDurations(runs)
    expect(available).toContain(Duration.WEEKLY)
    expect(available).not.toContain(Duration.MONTHLY)
  })

  it('should include MONTHLY for runs in different calendar months', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-31')),
      createMockRunWithDate(new Date('2024-02-01'))
    ]
    const available = getAvailableDurations(runs)
    expect(available).toContain(Duration.MONTHLY)
    expect(available).not.toContain(Duration.YEARLY)
  })

  it('should not include MONTHLY for runs in same calendar month', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-01')),
      createMockRunWithDate(new Date('2024-01-31'))
    ]
    const available = getAvailableDurations(runs)
    expect(available).not.toContain(Duration.MONTHLY)
  })

  it('should include YEARLY for runs spanning multiple calendar years', () => {
    const runs = [
      createMockRunWithDate(new Date('2023-12-31')),
      createMockRunWithDate(new Date('2024-01-01'))
    ]
    const available = getAvailableDurations(runs)
    expect(available).toContain(Duration.YEARLY)
  })

  it('should not include YEARLY for runs in same year even if far apart', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-01')),
      createMockRunWithDate(new Date('2024-12-31'))
    ]
    const available = getAvailableDurations(runs)
    expect(available).not.toContain(Duration.YEARLY)
  })

  it('should handle runs without valid dates', () => {
    const runs = [
      { ...createMockRunWithDate(new Date('2024-01-01')), timestamp: undefined } as unknown as ParsedGameRun,
      createMockRunWithDate(new Date('2024-01-02'))
    ]
    // With only one valid date, can't determine span beyond daily
    const available = getAvailableDurations(runs)
    expect(available).toEqual([Duration.HOURLY, Duration.PER_RUN, Duration.DAILY])
  })
})

describe('isDurationAvailable', () => {
  it('should return true for available duration', () => {
    const available = [Duration.PER_RUN, Duration.DAILY, Duration.WEEKLY]
    expect(isDurationAvailable(Duration.DAILY, available)).toBe(true)
  })

  it('should return false for unavailable duration', () => {
    const available = [Duration.PER_RUN, Duration.DAILY]
    expect(isDurationAvailable(Duration.YEARLY, available)).toBe(false)
  })
})

describe('getDurationLabel', () => {
  it('should return correct labels', () => {
    expect(getDurationLabel(Duration.PER_RUN)).toBe('Per Run')
    expect(getDurationLabel(Duration.DAILY)).toBe('Daily')
    expect(getDurationLabel(Duration.WEEKLY)).toBe('Weekly')
    expect(getDurationLabel(Duration.MONTHLY)).toBe('Monthly')
    expect(getDurationLabel(Duration.YEARLY)).toBe('Yearly')
  })
})

describe('getClosestAvailableDuration', () => {
  it('should return requested if available', () => {
    const available = [Duration.PER_RUN, Duration.DAILY, Duration.WEEKLY]
    expect(getClosestAvailableDuration(Duration.WEEKLY, available)).toBe(Duration.WEEKLY)
  })

  it('should fallback to PER_RUN when requested not available', () => {
    const available = [Duration.PER_RUN, Duration.DAILY]
    expect(getClosestAvailableDuration(Duration.MONTHLY, available)).toBe(Duration.PER_RUN)
  })

  it('should fallback to next available in preference order', () => {
    const available = [Duration.DAILY, Duration.WEEKLY]
    expect(getClosestAvailableDuration(Duration.YEARLY, available)).toBe(Duration.DAILY)
  })

  it('should handle empty available list', () => {
    expect(getClosestAvailableDuration(Duration.WEEKLY, [])).toBe(Duration.PER_RUN)
  })
})
