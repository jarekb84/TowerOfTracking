import { describe, it, expect } from 'vitest'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { calculateDataSpan } from './data-span'

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

describe('calculateDataSpan', () => {
  it('should return null for empty array', () => {
    expect(calculateDataSpan([])).toBeNull()
  })

  it('should return null for single run', () => {
    expect(calculateDataSpan([mockRun(new Date('2024-06-15'))])).toBeNull()
  })

  it('should return null when fewer than 2 valid timestamps', () => {
    const runs = [
      mockRun(new Date('2024-06-15')),
      { ...mockRun(new Date('2024-06-16')), timestamp: undefined } as unknown as ParsedGameRun,
    ]
    expect(calculateDataSpan(runs)).toBeNull()
  })

  it('should compute day span correctly', () => {
    const result = calculateDataSpan([
      mockRun(new Date('2024-01-01')),
      mockRun(new Date('2024-01-15')),
    ])
    expect(result).not.toBeNull()
    expect(result!.daySpan).toBe(14)
  })

  it('should find earliest and latest dates regardless of order', () => {
    const result = calculateDataSpan([
      mockRun(new Date('2024-03-15')),
      mockRun(new Date('2024-01-01')),
      mockRun(new Date('2024-06-30')),
    ])
    expect(result!.earliest.toISOString()).toContain('2024-01-01')
    expect(result!.latest.toISOString()).toContain('2024-06-30')
  })

  it('should detect different months', () => {
    const sameMonth = calculateDataSpan([
      mockRun(new Date('2024-03-01')),
      mockRun(new Date('2024-03-28')),
    ])
    expect(sameMonth!.spansDifferentMonths).toBe(false)

    const diffMonth = calculateDataSpan([
      mockRun(new Date('2024-03-31')),
      mockRun(new Date('2024-04-01')),
    ])
    expect(diffMonth!.spansDifferentMonths).toBe(true)
  })

  it('should detect different years', () => {
    const sameYear = calculateDataSpan([
      mockRun(new Date('2024-01-01')),
      mockRun(new Date('2024-12-31')),
    ])
    expect(sameYear!.spansDifferentYears).toBe(false)

    const diffYear = calculateDataSpan([
      mockRun(new Date('2023-12-31')),
      mockRun(new Date('2024-01-01')),
    ])
    expect(diffYear!.spansDifferentYears).toBe(true)
  })

  it('should handle runs with same timestamp', () => {
    const result = calculateDataSpan([
      mockRun(new Date('2024-06-15T10:00:00')),
      mockRun(new Date('2024-06-15T10:00:00')),
    ])
    expect(result!.daySpan).toBe(0)
    expect(result!.spansDifferentMonths).toBe(false)
    expect(result!.spansDifferentYears).toBe(false)
  })
})
