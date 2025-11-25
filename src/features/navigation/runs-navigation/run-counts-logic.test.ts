import { describe, it, expect } from 'vitest'
import { computeRunCounts } from './run-counts-logic'
import { RunType } from '@/shared/domain/run-types/types'
import { ParsedGameRun } from '@/shared/types/game-run.types'

// Create mock run factory
function createMockRun(overrides: Partial<ParsedGameRun> = {}): ParsedGameRun {
  return {
    id: `run-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date('2024-01-15T14:30:00'),
    fields: {},
    tier: 11,
    wave: 1000,
    coinsEarned: 1000000,
    cellsEarned: 500,
    realTime: 3600,
    runType: RunType.FARM,
    ...overrides,
  }
}

describe('computeRunCounts', () => {
  it('should count runs by type correctly', () => {
    const runs = [
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.TOURNAMENT }),
      createMockRun({ runType: RunType.MILESTONE }),
      createMockRun({ runType: RunType.MILESTONE }),
      createMockRun({ runType: RunType.MILESTONE }),
    ]

    const result = computeRunCounts(runs)

    expect(result[RunType.FARM]).toBe(2)
    expect(result[RunType.TOURNAMENT]).toBe(1)
    expect(result[RunType.MILESTONE]).toBe(3)
  })

  it('should return zero counts for empty runs array', () => {
    const result = computeRunCounts([])

    expect(result[RunType.FARM]).toBe(0)
    expect(result[RunType.TOURNAMENT]).toBe(0)
    expect(result[RunType.MILESTONE]).toBe(0)
  })

  it('should return zero for run types not present', () => {
    const runs = [
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.FARM }),
    ]

    const result = computeRunCounts(runs)

    expect(result[RunType.FARM]).toBe(2)
    expect(result[RunType.TOURNAMENT]).toBe(0)
    expect(result[RunType.MILESTONE]).toBe(0)
  })

  it('should handle all runs being the same type', () => {
    const runs = [
      createMockRun({ runType: RunType.TOURNAMENT }),
      createMockRun({ runType: RunType.TOURNAMENT }),
      createMockRun({ runType: RunType.TOURNAMENT }),
    ]

    const result = computeRunCounts(runs)

    expect(result[RunType.FARM]).toBe(0)
    expect(result[RunType.TOURNAMENT]).toBe(3)
    expect(result[RunType.MILESTONE]).toBe(0)
  })
})
