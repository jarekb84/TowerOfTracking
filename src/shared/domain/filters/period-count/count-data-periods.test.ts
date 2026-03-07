import { describe, it, expect } from 'vitest'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { Duration } from '../types'
import { countDataPeriods } from './count-data-periods'

function mockRun(date: Date): ParsedGameRun {
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

describe('countDataPeriods', () => {
  it('should return 0 for empty runs', () => {
    expect(countDataPeriods([], Duration.DAILY)).toBe(0)
  })

  it('should return 1 for single run', () => {
    expect(countDataPeriods([mockRun(new Date('2024-06-15'))], Duration.DAILY)).toBe(1)
  })

  it('should count distinct days', () => {
    const runs = [
      mockRun(new Date('2024-06-15T10:00:00')),
      mockRun(new Date('2024-06-15T14:00:00')),
      mockRun(new Date('2024-06-16T10:00:00')),
      mockRun(new Date('2024-06-17T10:00:00')),
    ]
    expect(countDataPeriods(runs, Duration.DAILY)).toBe(3)
  })

  it('should count distinct weeks', () => {
    const runs = [
      // Week 1 (Sun Jun 9 - Sat Jun 15, 2024)
      mockRun(new Date('2024-06-10T10:00:00')),
      mockRun(new Date('2024-06-12T10:00:00')),
      // Week 2 (Sun Jun 16 - Sat Jun 22)
      mockRun(new Date('2024-06-17T10:00:00')),
      // Week 3 (Sun Jun 23 - Sat Jun 29)
      mockRun(new Date('2024-06-25T10:00:00')),
    ]
    expect(countDataPeriods(runs, Duration.WEEKLY)).toBe(3)
  })

  it('should count distinct months', () => {
    const runs = [
      mockRun(new Date('2024-01-15')),
      mockRun(new Date('2024-01-20')),
      mockRun(new Date('2024-03-10')),
      mockRun(new Date('2024-05-01')),
    ]
    expect(countDataPeriods(runs, Duration.MONTHLY)).toBe(3)
  })

  it('should count distinct years', () => {
    const runs = [
      mockRun(new Date('2023-06-15')),
      mockRun(new Date('2024-01-01')),
      mockRun(new Date('2024-12-31')),
    ]
    expect(countDataPeriods(runs, Duration.YEARLY)).toBe(2)
  })

  it('should count per-run periods (each run is unique)', () => {
    const runs = [
      mockRun(new Date('2024-06-15T10:00:00')),
      mockRun(new Date('2024-06-15T10:00:01')),
    ]
    expect(countDataPeriods(runs, Duration.PER_RUN)).toBe(2)
  })

  it('should skip invalid timestamps', () => {
    const runs = [
      mockRun(new Date('2024-06-15')),
      { ...mockRun(new Date('2024-06-16')), timestamp: undefined } as unknown as ParsedGameRun,
      mockRun(new Date('2024-06-17')),
    ]
    expect(countDataPeriods(runs, Duration.DAILY)).toBe(2)
  })
})
