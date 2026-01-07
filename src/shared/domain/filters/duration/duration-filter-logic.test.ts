import { describe, it, expect } from 'vitest'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration } from '../types'
import {
  getAvailableDurations,
  isDurationAvailable,
  getDurationLabel,
  getClosestAvailableDuration,
  stringToDuration,
  durationToString
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
    gameSpeed: 2.0,
    runType: 'farm',
    fields: {}
  }
}

describe('getAvailableDurations', () => {
  it('should return empty array for no runs', () => {
    expect(getAvailableDurations([])).toEqual([])
  })

  it('should return only PER_RUN for single run', () => {
    const runs = [createMockRunWithDate(new Date('2024-01-15'))]
    expect(getAvailableDurations(runs)).toEqual([Duration.PER_RUN])
  })

  it('should include DAILY for runs spanning 2+ days', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-15')),
      createMockRunWithDate(new Date('2024-01-16'))
    ]
    const available = getAvailableDurations(runs)
    expect(available).toContain(Duration.PER_RUN)
    expect(available).toContain(Duration.DAILY)
    expect(available).not.toContain(Duration.WEEKLY)
  })

  it('should include WEEKLY for runs spanning 14+ days', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-01')),
      createMockRunWithDate(new Date('2024-01-15'))
    ]
    const available = getAvailableDurations(runs)
    expect(available).toContain(Duration.WEEKLY)
    expect(available).not.toContain(Duration.MONTHLY)
  })

  it('should include MONTHLY for runs spanning 60+ days', () => {
    const runs = [
      createMockRunWithDate(new Date('2024-01-01')),
      createMockRunWithDate(new Date('2024-03-02'))
    ]
    const available = getAvailableDurations(runs)
    expect(available).toContain(Duration.MONTHLY)
    expect(available).not.toContain(Duration.YEARLY)
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
    // With only one valid date, can't determine span
    const available = getAvailableDurations(runs)
    expect(available).toEqual([Duration.PER_RUN])
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

describe('stringToDuration', () => {
  it('should convert valid duration strings to Duration enum', () => {
    expect(stringToDuration('per-run')).toBe(Duration.PER_RUN)
    expect(stringToDuration('daily')).toBe(Duration.DAILY)
    expect(stringToDuration('weekly')).toBe(Duration.WEEKLY)
    expect(stringToDuration('monthly')).toBe(Duration.MONTHLY)
    expect(stringToDuration('yearly')).toBe(Duration.YEARLY)
  })

  it('should return PER_RUN for invalid duration strings', () => {
    expect(stringToDuration('invalid')).toBe(Duration.PER_RUN)
    expect(stringToDuration('')).toBe(Duration.PER_RUN)
    expect(stringToDuration('DAILY')).toBe(Duration.PER_RUN) // case-sensitive
  })
})

describe('durationToString', () => {
  it('should convert Duration enum to string', () => {
    expect(durationToString(Duration.PER_RUN)).toBe('per-run')
    expect(durationToString(Duration.DAILY)).toBe('daily')
    expect(durationToString(Duration.WEEKLY)).toBe('weekly')
    expect(durationToString(Duration.MONTHLY)).toBe('monthly')
    expect(durationToString(Duration.YEARLY)).toBe('yearly')
  })
})
