import { describe, it, expect } from 'vitest'
import { filterRunsByType } from './filter-runs-by-type'
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

describe('filterRunsByType', () => {
  it('should filter runs by FARM type', () => {
    const runs = [
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.TOURNAMENT }),
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.MILESTONE }),
    ]

    const result = filterRunsByType(runs, RunType.FARM)

    expect(result).toHaveLength(2)
    expect(result.every(run => run.runType === RunType.FARM)).toBe(true)
  })

  it('should filter runs by TOURNAMENT type', () => {
    const runs = [
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.TOURNAMENT }),
      createMockRun({ runType: RunType.TOURNAMENT }),
      createMockRun({ runType: RunType.MILESTONE }),
    ]

    const result = filterRunsByType(runs, RunType.TOURNAMENT)

    expect(result).toHaveLength(2)
    expect(result.every(run => run.runType === RunType.TOURNAMENT)).toBe(true)
  })

  it('should filter runs by MILESTONE type', () => {
    const runs = [
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.MILESTONE }),
      createMockRun({ runType: RunType.MILESTONE }),
      createMockRun({ runType: RunType.MILESTONE }),
    ]

    const result = filterRunsByType(runs, RunType.MILESTONE)

    expect(result).toHaveLength(3)
    expect(result.every(run => run.runType === RunType.MILESTONE)).toBe(true)
  })

  it('should return empty array when no runs match', () => {
    const runs = [
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.FARM }),
    ]

    const result = filterRunsByType(runs, RunType.TOURNAMENT)

    expect(result).toHaveLength(0)
  })

  it('should return empty array when runs array is empty', () => {
    const result = filterRunsByType([], RunType.FARM)

    expect(result).toHaveLength(0)
  })

  it('should preserve original run data in filtered results', () => {
    const originalRun = createMockRun({
      runType: RunType.FARM,
      coinsEarned: 5000000,
      cellsEarned: 250,
    })
    const runs = [originalRun]

    const result = filterRunsByType(runs, RunType.FARM)

    expect(result[0]).toBe(originalRun)
    expect(result[0].coinsEarned).toBe(5000000)
    expect(result[0].cellsEarned).toBe(250)
  })
})
