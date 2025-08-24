import { describe, it, expect } from 'vitest'
import { filterRunsByType, getFarmingRuns, getTournamentRuns, isFarmingRun } from './run-type-filter'
import type { ParsedGameRun } from '../types/game-run.types'
import { RunType } from '../types/game-run.types'

// Mock game run data
const mockRuns: ParsedGameRun[] = [
  {
    id: '1',
    timestamp: new Date('2023-01-01'),
    fields: {},
    tier: 5,
    wave: 100,
    coinsEarned: 1000000,
    cellsEarned: 500,
    realTime: 3600,
    runType: RunType.FARM
  },
  {
    id: '2', 
    timestamp: new Date('2023-01-02'),
    fields: {},
    tier: 10,
    wave: 150,
    coinsEarned: 5000000,
    cellsEarned: 1000,
    realTime: 5400,
    runType: RunType.TOURNAMENT
  },
  {
    id: '3',
    timestamp: new Date('2023-01-03'),
    fields: {},
    tier: 6,
    wave: 120,
    coinsEarned: 1500000,
    cellsEarned: 600,
    realTime: 4200,
    runType: RunType.FARM
  }
]

describe('filterRunsByType', () => {
  it('returns all runs when filter is "all"', () => {
    const result = filterRunsByType(mockRuns, 'all')
    expect(result).toEqual(mockRuns)
  })

  it('returns only farming runs when filter is "farming"', () => {
    const result = filterRunsByType(mockRuns, 'farming')
    expect(result).toHaveLength(2)
    expect(result.every(run => run.runType === RunType.FARM)).toBe(true)
  })

  it('returns only tournament runs when filter is "tournament"', () => {
    const result = filterRunsByType(mockRuns, 'tournament')
    expect(result).toHaveLength(1)
    expect(result[0].runType).toBe(RunType.TOURNAMENT)
  })
})

describe('isFarmingRun', () => {
  it('returns true for farming runs', () => {
    expect(isFarmingRun(mockRuns[0])).toBe(true)
    expect(isFarmingRun(mockRuns[2])).toBe(true)
  })

  it('returns false for tournament runs', () => {
    expect(isFarmingRun(mockRuns[1])).toBe(false)
  })
})

describe('getFarmingRuns', () => {
  it('returns only farming runs', () => {
    const result = getFarmingRuns(mockRuns)
    expect(result).toHaveLength(2)
    expect(result.every(run => run.runType === RunType.FARM)).toBe(true)
  })
})

describe('getTournamentRuns', () => {
  it('returns only tournament runs', () => {
    const result = getTournamentRuns(mockRuns)
    expect(result).toHaveLength(1)
    expect(result[0].runType).toBe(RunType.TOURNAMENT)
  })
})