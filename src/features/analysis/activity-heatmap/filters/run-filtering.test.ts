/**
 * Heatmap Run Filtering Tests
 *
 * Tests for the filterHeatmapRuns pure function.
 */

import { describe, it, expect } from 'vitest'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { RunTypeValue } from '@/shared/domain/run-types/types'
import { filterHeatmapRuns } from './run-filtering'

// ---------------------------------------------------------------------------
// Test helper
// ---------------------------------------------------------------------------

let nextId = 1

/**
 * Creates a minimal ParsedGameRun for testing run filtering.
 */
function createTestRun(
  tier: number,
  runType: RunTypeValue,
  overrides?: Partial<ParsedGameRun>
): ParsedGameRun {
  const defaults = {
    id: `test-run-${nextId++}`,
    timestamp: new Date(2026, 1, 25, 14, 0, 0),
    realTime: 3600,
    tier,
    wave: 100,
    coinsEarned: 1000,
    cellsEarned: 10,
    runType,
    fields: {},
  }
  return { ...defaults, ...overrides } as ParsedGameRun
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function createMixedRuns(): ParsedGameRun[] {
  return [
    createTestRun(11, 'farm', { id: 't11-farm' }),
    createTestRun(11, 'tournament', { id: 't11-tourney' }),
    createTestRun(8, 'farm', { id: 't8-farm' }),
    createTestRun(8, 'tournament', { id: 't8-tourney' }),
    createTestRun(5, 'farm', { id: 't5-farm' }),
  ]
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('run-filtering', () => {
  describe('filterHeatmapRuns', () => {
    it('should return all runs when tier=0 and runType=all', () => {
      const runs = createMixedRuns()

      const result = filterHeatmapRuns(runs, { tier: 0, runType: 'all' })

      expect(result).toHaveLength(5)
    })

    it('should filter by specific tier', () => {
      const runs = createMixedRuns()

      const result = filterHeatmapRuns(runs, { tier: 11, runType: 'all' })

      expect(result).toHaveLength(2)
      expect(result.every((r) => r.tier === 11)).toBe(true)
    })

    it('should filter by specific run type', () => {
      const runs = createMixedRuns()

      const result = filterHeatmapRuns(runs, { tier: 0, runType: 'farm' })

      expect(result).toHaveLength(3)
      expect(result.every((r) => r.runType === 'farm')).toBe(true)
    })

    it('should combine tier and run type filters', () => {
      const runs = createMixedRuns()

      const result = filterHeatmapRuns(runs, { tier: 8, runType: 'tournament' })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t8-tourney')
    })

    it('should return empty array when no matches', () => {
      const runs = createMixedRuns()

      const result = filterHeatmapRuns(runs, { tier: 5, runType: 'tournament' })

      expect(result).toHaveLength(0)
    })

    it('should return empty array for empty input', () => {
      const result = filterHeatmapRuns([], { tier: 0, runType: 'all' })

      expect(result).toHaveLength(0)
    })
  })
})
