import { describe, it, expect } from 'vitest'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import {
  extractAvailableTiers,
  getAvailableTiersForRunType,
  countRunsPerTier,
  formatTierLabel,
  nullToAllTierAdapter,
  allToNullTierAdapter,
  zeroToAllTierAdapter,
  allToZeroTierAdapter
} from './tier-filter-logic'

function createMockRun(tier: number, runType: 'farm' | 'tournament' | 'milestone' = 'farm'): ParsedGameRun {
  return {
    id: `run-${tier}-${Math.random()}`,
    timestamp: new Date(),
    tier,
    wave: 100,
    coinsEarned: 1000,
    cellsEarned: 100,
    realTime: 3600,
    gameSpeed: 2.0,
    runType,
    fields: {}
  }
}

describe('extractAvailableTiers', () => {
  it('should return empty array for empty runs', () => {
    expect(extractAvailableTiers([])).toEqual([])
  })

  it('should extract unique tiers sorted highest first', () => {
    const runs = [
      createMockRun(12),
      createMockRun(14),
      createMockRun(13),
      createMockRun(14), // duplicate
      createMockRun(11)
    ]
    expect(extractAvailableTiers(runs)).toEqual([14, 13, 12, 11])
  })

  it('should filter out invalid tier values', () => {
    const runs = [
      createMockRun(14),
      { ...createMockRun(0), tier: 0 } as ParsedGameRun,
      { ...createMockRun(-1), tier: -1 } as ParsedGameRun,
      createMockRun(12)
    ]
    expect(extractAvailableTiers(runs)).toEqual([14, 12])
  })

  it('should handle single run', () => {
    expect(extractAvailableTiers([createMockRun(13)])).toEqual([13])
  })
})

describe('getAvailableTiersForRunType', () => {
  it('should return all tiers when filter is "all"', () => {
    const runs = [
      createMockRun(14, 'farm'),
      createMockRun(13, 'tournament'),
      createMockRun(12, 'farm')
    ]
    expect(getAvailableTiersForRunType(runs, 'all')).toEqual([14, 13, 12])
  })

  it('should filter tiers by run type', () => {
    const runs = [
      createMockRun(14, 'farm'),
      createMockRun(13, 'tournament'),
      createMockRun(12, 'farm'),
      createMockRun(14, 'tournament')
    ]
    expect(getAvailableTiersForRunType(runs, 'farm')).toEqual([14, 12])
    expect(getAvailableTiersForRunType(runs, 'tournament')).toEqual([14, 13])
  })

  it('should return empty array when no runs match filter', () => {
    const runs = [createMockRun(14, 'farm')]
    expect(getAvailableTiersForRunType(runs, 'tournament')).toEqual([])
  })
})

describe('countRunsPerTier', () => {
  it('should count runs per tier', () => {
    const runs = [
      createMockRun(14),
      createMockRun(14),
      createMockRun(13),
      createMockRun(12),
      createMockRun(14)
    ]
    const counts = countRunsPerTier(runs)
    expect(counts.get(14)).toBe(3)
    expect(counts.get(13)).toBe(1)
    expect(counts.get(12)).toBe(1)
  })

  it('should filter by run type when provided', () => {
    const runs = [
      createMockRun(14, 'farm'),
      createMockRun(14, 'tournament'),
      createMockRun(14, 'farm'),
      createMockRun(13, 'tournament')
    ]
    const farmCounts = countRunsPerTier(runs, 'farm')
    expect(farmCounts.get(14)).toBe(2)
    expect(farmCounts.get(13)).toBeUndefined()

    const tournamentCounts = countRunsPerTier(runs, 'tournament')
    expect(tournamentCounts.get(14)).toBe(1)
    expect(tournamentCounts.get(13)).toBe(1)
  })

  it('should return empty map for empty runs', () => {
    expect(countRunsPerTier([]).size).toBe(0)
  })
})

describe('formatTierLabel', () => {
  it('should format tier as T-prefix', () => {
    expect(formatTierLabel(14)).toBe('T14')
    expect(formatTierLabel(1)).toBe('T1')
    expect(formatTierLabel(99)).toBe('T99')
  })
})

describe('nullToAllTierAdapter', () => {
  it('should convert null to "all"', () => {
    expect(nullToAllTierAdapter(null)).toBe('all')
  })

  it('should pass through tier numbers unchanged', () => {
    expect(nullToAllTierAdapter(14)).toBe(14)
    expect(nullToAllTierAdapter(1)).toBe(1)
    expect(nullToAllTierAdapter(0)).toBe(0)
  })
})

describe('allToNullTierAdapter', () => {
  it('should convert "all" to null', () => {
    expect(allToNullTierAdapter('all')).toBe(null)
  })

  it('should pass through tier numbers unchanged', () => {
    expect(allToNullTierAdapter(14)).toBe(14)
    expect(allToNullTierAdapter(1)).toBe(1)
    expect(allToNullTierAdapter(0)).toBe(0)
  })
})

describe('zeroToAllTierAdapter', () => {
  it('should convert 0 to "all"', () => {
    expect(zeroToAllTierAdapter(0)).toBe('all')
  })

  it('should pass through non-zero tier numbers unchanged', () => {
    expect(zeroToAllTierAdapter(14)).toBe(14)
    expect(zeroToAllTierAdapter(1)).toBe(1)
  })
})

describe('allToZeroTierAdapter', () => {
  it('should convert "all" to 0', () => {
    expect(allToZeroTierAdapter('all')).toBe(0)
  })

  it('should pass through tier numbers unchanged', () => {
    expect(allToZeroTierAdapter(14)).toBe(14)
    expect(allToZeroTierAdapter(1)).toBe(1)
  })
})
