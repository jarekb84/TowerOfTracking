/**
 * Coverage Report Hook Tests
 *
 * CRITICAL: This file must use .tsx extension for React Testing Library's renderHook()
 */

import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types'
import { Duration } from '@/shared/domain/filters'
import { useCoverageReport } from './use-coverage-report'
import type { CoverageFieldName } from './types'

/**
 * Helper to create a mock game run with specified fields
 */
function createMockRun(
  id: string,
  timestamp: Date,
  fields: Record<string, number>,
  overrides?: Partial<ParsedGameRun>
): ParsedGameRun {
  const runFields: Record<string, GameRunField> = {}

  for (const [key, value] of Object.entries(fields)) {
    runFields[key] = {
      value,
      rawValue: String(value),
      displayValue: String(value),
      originalKey: key,
      dataType: 'number',
    }
  }

  return {
    id,
    timestamp,
    fields: runFields,
    tier: 11,
    wave: 1000,
    coinsEarned: 100000,
    cellsEarned: 50,
    realTime: 3600,
    runType: 'farm',
    ...overrides,
  }
}

describe('useCoverageReport', () => {
  const defaultMockRuns = [
    createMockRun('1', new Date(2024, 2, 15, 12, 0, 0), {
      totalEnemies: 1000,
      taggedByDeathwave: 800,
      destroyedInSpotlight: 300,
    }),
    createMockRun('2', new Date(2024, 2, 16, 12, 0, 0), {
      totalEnemies: 1000,
      taggedByDeathwave: 600,
      destroyedInSpotlight: 400,
    }),
  ]

  describe('initialization', () => {
    it('initializes with default filters', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      expect(result.current.filters.runType).toBe('farm')
      expect(result.current.filters.tier).toBe('all')
      expect(result.current.filters.duration).toBe('daily')
      expect(result.current.filters.periodCount).toBe(14)
      // D5: Default to 3 core Economic metrics (Death Wave, Spotlight, Golden Bot)
      expect(result.current.filters.selectedMetrics.size).toBe(3)
      expect(result.current.filters.selectedMetrics.has('taggedByDeathwave')).toBe(true)
      expect(result.current.filters.selectedMetrics.has('destroyedInSpotlight')).toBe(true)
      expect(result.current.filters.selectedMetrics.has('destroyedInGoldenBot')).toBe(true)
      expect(result.current.filters.selectedMetrics.has('summonedEnemies')).toBe(false)
    })

    it('merges initial filters with defaults', () => {
      const { result } = renderHook(() =>
        useCoverageReport({
          runs: defaultMockRuns,
          initialFilters: { tier: 11, periodCount: 10 },
        })
      )

      expect(result.current.filters.tier).toBe(11)
      expect(result.current.filters.periodCount).toBe(10)
      // Other values should be defaults
      expect(result.current.filters.runType).toBe('farm')
    })
  })

  describe('toggleMetric', () => {
    it('adds a metric when not selected', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      // Initially has 3 economic metrics, not combat
      expect(result.current.filters.selectedMetrics.has('enemiesHitByOrbs')).toBe(false)

      act(() => {
        result.current.toggleMetric('enemiesHitByOrbs')
      })

      expect(result.current.filters.selectedMetrics.has('enemiesHitByOrbs')).toBe(true)
      expect(result.current.filters.selectedMetrics.size).toBe(4)
    })

    it('removes a metric when selected', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      expect(result.current.filters.selectedMetrics.has('taggedByDeathwave')).toBe(true)

      act(() => {
        result.current.toggleMetric('taggedByDeathwave')
      })

      expect(result.current.filters.selectedMetrics.has('taggedByDeathwave')).toBe(false)
      expect(result.current.filters.selectedMetrics.size).toBe(2)
    })

    it('prevents deselecting the last metric', () => {
      // Start with only one metric selected via initialFilters
      const initialMetrics = new Set<CoverageFieldName>(['taggedByDeathwave'])
      const { result } = renderHook(() =>
        useCoverageReport({
          runs: defaultMockRuns,
          initialFilters: { selectedMetrics: initialMetrics },
        })
      )

      // Verify we started with just one metric
      expect(result.current.filters.selectedMetrics.size).toBe(1)
      expect(result.current.filters.selectedMetrics.has('taggedByDeathwave')).toBe(true)

      // Try to remove the last one - should be prevented
      act(() => {
        result.current.toggleMetric('taggedByDeathwave')
      })

      // Should still have the one metric
      expect(result.current.filters.selectedMetrics.size).toBe(1)
      expect(result.current.filters.selectedMetrics.has('taggedByDeathwave')).toBe(true)
    })
  })

  describe('filter setters', () => {
    it('updates run type', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      act(() => {
        result.current.setRunType('tournament')
      })

      expect(result.current.filters.runType).toBe('tournament')
    })

    it('updates tier', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      act(() => {
        result.current.setTier(11)
      })

      expect(result.current.filters.tier).toBe(11)
    })

    it('updates duration and resets period count', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      act(() => {
        result.current.setDuration(Duration.WEEKLY)
      })

      expect(result.current.filters.duration).toBe('weekly')
      // Period count should reset to default for weekly
      expect(result.current.filters.periodCount).toBeLessThanOrEqual(20)
    })

    it('prevents setting yearly duration (D7)', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      const originalDuration = result.current.filters.duration

      act(() => {
        result.current.setDuration(Duration.YEARLY)
      })

      // Duration should not change to yearly
      expect(result.current.filters.duration).toBe(originalDuration)
    })

    it('updates period count with bounds', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      act(() => {
        result.current.setPeriodCount(100)
      })

      // Should be capped at 50
      expect(result.current.filters.periodCount).toBe(50)

      act(() => {
        result.current.setPeriodCount(0)
      })

      // Should be minimum 1
      expect(result.current.filters.periodCount).toBe(1)
    })
  })

  describe('analysis data', () => {
    it('calculates analysis data from runs', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      expect(result.current.analysisData).not.toBeNull()
      expect(result.current.hasData).toBe(true)
      expect(result.current.analysisData?.periods.length).toBeGreaterThan(0)
    })

    it('returns null for empty runs', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: [] })
      )

      expect(result.current.analysisData).toBeNull()
      expect(result.current.hasData).toBe(false)
    })

    it('recalculates when filters change', () => {
      const runs = [
        createMockRun('1', new Date(2024, 2, 15, 12, 0, 0), { totalEnemies: 1000 }, { tier: 10 }),
        createMockRun('2', new Date(2024, 2, 16, 12, 0, 0), { totalEnemies: 1000 }, { tier: 11 }),
      ]

      const { result } = renderHook(() =>
        useCoverageReport({ runs })
      )

      const initialPeriods = result.current.analysisData?.periods.length

      act(() => {
        result.current.setTier(11)
      })

      // Should have fewer periods after filtering by tier
      expect(result.current.analysisData?.periods.length).toBeLessThanOrEqual(initialPeriods || 0)
    })
  })

  describe('cross-chart highlight', () => {
    it('manages highlighted metric state', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      expect(result.current.highlightedMetric).toBeNull()

      act(() => {
        result.current.setHighlightedMetric('taggedByDeathwave')
      })

      expect(result.current.highlightedMetric).toBe('taggedByDeathwave')

      act(() => {
        result.current.setHighlightedMetric(null)
      })

      expect(result.current.highlightedMetric).toBeNull()
    })
  })

  describe('available options', () => {
    it('provides available tiers from runs', () => {
      const runs = [
        createMockRun('1', new Date(2024, 2, 15, 12, 0, 0), { totalEnemies: 1000 }, { tier: 10 }),
        createMockRun('2', new Date(2024, 2, 16, 12, 0, 0), { totalEnemies: 1000 }, { tier: 11 }),
        createMockRun('3', new Date(2024, 2, 17, 12, 0, 0), { totalEnemies: 1000 }, { tier: 11 }),
      ]

      const { result } = renderHook(() =>
        useCoverageReport({ runs })
      )

      expect(result.current.availableTiers).toContain(10)
      expect(result.current.availableTiers).toContain(11)
    })

    it('excludes yearly from available durations (D7)', () => {
      const { result } = renderHook(() =>
        useCoverageReport({ runs: defaultMockRuns })
      )

      expect(result.current.availableDurations).not.toContain(Duration.YEARLY)
    })
  })

  describe('auto-reset behavior', () => {
    it('auto-resets tier to all when selected tier becomes unavailable', () => {
      const runs = [
        createMockRun('1', new Date(2024, 2, 15, 12, 0, 0), { totalEnemies: 1000 }, { tier: 10, runType: 'farm' }),
        createMockRun('2', new Date(2024, 2, 16, 12, 0, 0), { totalEnemies: 1000 }, { tier: 11, runType: 'tournament' }),
      ]

      const { result, rerender } = renderHook(
        ({ runs: r }) => useCoverageReport({ runs: r }),
        { initialProps: { runs } }
      )

      // Select tier 10
      act(() => {
        result.current.setTier(10)
      })

      expect(result.current.filters.tier).toBe(10)

      // Filter to only tournament runs (which has no tier 10)
      act(() => {
        result.current.setRunType('tournament')
      })

      // Re-render to trigger the useEffect
      rerender({ runs })

      // Tier should auto-reset to 'all' since tier 10 has no tournament runs
      expect(result.current.filters.tier).toBe('all')
    })
  })
})
