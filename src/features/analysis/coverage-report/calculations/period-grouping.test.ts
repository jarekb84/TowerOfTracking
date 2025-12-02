/**
 * Period Grouping Tests for Coverage Report
 */

import { describe, it, expect } from 'vitest'
import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types'
import { Duration } from '@/shared/domain/filters'
import type { CoverageReportFilters, CoverageFieldName } from '../types'
import {
  filterRuns,
  groupRunsByPeriod,
  limitToPeriods,
  calculatePeriodCoverage,
  calculateCoverageSummary,
  calculateCoverageAnalysis,
} from './period-grouping'

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

const defaultFilters: CoverageReportFilters = {
  selectedMetrics: new Set<CoverageFieldName>(['taggedByDeathwave', 'destroyedInSpotlight']),
  runType: 'all',
  tier: 'all',
  duration: 'daily' as Duration,
  periodCount: 10,
}

describe('filterRuns', () => {
  it('excludes runs without totalEnemies (D4)', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15'), { totalEnemies: 1000 }),
      createMockRun('2', new Date('2024-03-16'), { totalEnemies: 0 }),
      createMockRun('3', new Date('2024-03-17'), {}), // Missing totalEnemies
    ]

    const filtered = filterRuns(runs, defaultFilters)

    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('1')
  })

  it('filters by run type', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15'), { totalEnemies: 1000 }, { runType: 'farm' }),
      createMockRun('2', new Date('2024-03-16'), { totalEnemies: 1000 }, { runType: 'tournament' }),
    ]

    const farmFilters = { ...defaultFilters, runType: 'farm' as const }
    const filtered = filterRuns(runs, farmFilters)

    expect(filtered).toHaveLength(1)
    expect(filtered[0].runType).toBe('farm')
  })

  it('filters by tier', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15'), { totalEnemies: 1000 }, { tier: 11 }),
      createMockRun('2', new Date('2024-03-16'), { totalEnemies: 1000 }, { tier: 12 }),
    ]

    const tierFilters = { ...defaultFilters, tier: 11 }
    const filtered = filterRuns(runs, tierFilters)

    expect(filtered).toHaveLength(1)
    expect(filtered[0].tier).toBe(11)
  })

  it('returns all runs when filters are "all"', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15'), { totalEnemies: 1000 }, { runType: 'farm', tier: 11 }),
      createMockRun('2', new Date('2024-03-16'), { totalEnemies: 1000 }, { runType: 'tournament', tier: 12 }),
    ]

    const filtered = filterRuns(runs, defaultFilters)

    expect(filtered).toHaveLength(2)
  })
})

describe('groupRunsByPeriod', () => {
  it('groups runs by daily period', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15T10:00:00'), { totalEnemies: 1000 }),
      createMockRun('2', new Date('2024-03-15T14:00:00'), { totalEnemies: 1000 }),
      createMockRun('3', new Date('2024-03-16T10:00:00'), { totalEnemies: 1000 }),
    ]

    const groups = groupRunsByPeriod(runs, Duration.DAILY)

    expect(groups.size).toBe(2)
    expect(groups.get('2024-03-15')).toHaveLength(2)
    expect(groups.get('2024-03-16')).toHaveLength(1)
  })

  it('groups runs by per-run period', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15T10:00:00'), { totalEnemies: 1000 }),
      createMockRun('2', new Date('2024-03-15T14:00:00'), { totalEnemies: 1000 }),
    ]

    const groups = groupRunsByPeriod(runs, Duration.PER_RUN)

    expect(groups.size).toBe(2) // Each run is its own period
  })

  it('groups runs by monthly period', () => {
    // Use explicit timestamps to avoid timezone issues
    const runs = [
      createMockRun('1', new Date(2024, 2, 15, 12, 0, 0), { totalEnemies: 1000 }), // March 15
      createMockRun('2', new Date(2024, 2, 20, 12, 0, 0), { totalEnemies: 1000 }), // March 20
      createMockRun('3', new Date(2024, 3, 5, 12, 0, 0), { totalEnemies: 1000 }),  // April 5
    ]

    const groups = groupRunsByPeriod(runs, Duration.MONTHLY)

    expect(groups.size).toBe(2)
    expect(groups.get('2024-03')).toHaveLength(2)
    expect(groups.get('2024-04')).toHaveLength(1)
  })
})

describe('limitToPeriods', () => {
  it('limits to most recent N periods', () => {
    const runs1 = [createMockRun('1', new Date('2024-03-15'), { totalEnemies: 1000 })]
    const runs2 = [createMockRun('2', new Date('2024-03-16'), { totalEnemies: 1000 })]
    const runs3 = [createMockRun('3', new Date('2024-03-17'), { totalEnemies: 1000 })]

    const groups = new Map<string, ParsedGameRun[]>([
      ['2024-03-15', runs1],
      ['2024-03-16', runs2],
      ['2024-03-17', runs3],
    ])

    const limited = limitToPeriods(groups, 2, Duration.DAILY)

    expect(limited.size).toBe(2)
    expect(limited.has('2024-03-15')).toBe(false) // Oldest excluded
    expect(limited.has('2024-03-16')).toBe(true)
    expect(limited.has('2024-03-17')).toBe(true)
  })

  it('returns oldest first for chart display', () => {
    const runs1 = [createMockRun('1', new Date('2024-03-15'), { totalEnemies: 1000 })]
    const runs2 = [createMockRun('2', new Date('2024-03-16'), { totalEnemies: 1000 })]

    const groups = new Map<string, ParsedGameRun[]>([
      ['2024-03-15', runs1],
      ['2024-03-16', runs2],
    ])

    const limited = limitToPeriods(groups, 2, Duration.DAILY)
    const keys = Array.from(limited.keys())

    expect(keys[0]).toBe('2024-03-15') // Oldest first
    expect(keys[1]).toBe('2024-03-16')
  })
})

describe('calculatePeriodCoverage', () => {
  it('calculates coverage for selected metrics', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15'), {
        totalEnemies: 1000,
        taggedByDeathwave: 800,
        destroyedInSpotlight: 300,
      }),
    ]

    const selectedMetrics = new Set<CoverageFieldName>(['taggedByDeathwave', 'destroyedInSpotlight'])
    const result = calculatePeriodCoverage(runs, selectedMetrics, '2024-03-15', 'Mar 15')

    expect(result.periodKey).toBe('2024-03-15')
    expect(result.periodLabel).toBe('Mar 15')
    expect(result.totalEnemies).toBe(1000)
    expect(result.runCount).toBe(1)
    expect(result.metrics).toHaveLength(2)

    const deathwaveMetric = result.metrics.find(m => m.fieldName === 'taggedByDeathwave')
    expect(deathwaveMetric?.percentage).toBe(80)

    const spotlightMetric = result.metrics.find(m => m.fieldName === 'destroyedInSpotlight')
    expect(spotlightMetric?.percentage).toBe(30)
  })

  it('aggregates across multiple runs in same period', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15T10:00'), {
        totalEnemies: 1000,
        taggedByDeathwave: 800,
      }),
      createMockRun('2', new Date('2024-03-15T14:00'), {
        totalEnemies: 1000,
        taggedByDeathwave: 600,
      }),
    ]

    const selectedMetrics = new Set<CoverageFieldName>(['taggedByDeathwave'])
    const result = calculatePeriodCoverage(runs, selectedMetrics, '2024-03-15', 'Mar 15')

    expect(result.totalEnemies).toBe(2000)
    expect(result.runCount).toBe(2)

    const metric = result.metrics[0]
    expect(metric.percentage).toBe(70) // 1400/2000 = 70%
    expect(metric.affectedCount).toBe(1400)
  })
})

describe('calculateCoverageSummary', () => {
  it('calculates summary across all periods', () => {
    const periods = [
      {
        periodKey: '2024-03-15',
        periodLabel: 'Mar 15',
        totalEnemies: 1000,
        runCount: 1,
        metrics: [
          { fieldName: 'taggedByDeathwave' as CoverageFieldName, label: 'Death Wave', color: '#ef4444', percentage: 80, affectedCount: 800, totalEnemies: 1000 },
        ],
      },
      {
        periodKey: '2024-03-16',
        periodLabel: 'Mar 16',
        totalEnemies: 1000,
        runCount: 1,
        metrics: [
          { fieldName: 'taggedByDeathwave' as CoverageFieldName, label: 'Death Wave', color: '#ef4444', percentage: 60, affectedCount: 600, totalEnemies: 1000 },
        ],
      },
    ]

    const selectedMetrics = new Set<CoverageFieldName>(['taggedByDeathwave'])
    const summary = calculateCoverageSummary(periods, selectedMetrics)

    expect(summary.totalRuns).toBe(2)
    expect(summary.totalEnemies).toBe(2000)
    expect(summary.metrics).toHaveLength(1)
    expect(summary.metrics[0].percentage).toBe(70) // 1400/2000 = 70%
    expect(summary.metrics[0].affectedCount).toBe(1400)
  })
})

describe('calculateCoverageAnalysis', () => {
  it('produces complete analysis data', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15'), {
        totalEnemies: 1000,
        taggedByDeathwave: 800,
      }, { runType: 'farm', tier: 11 }),
      createMockRun('2', new Date('2024-03-16'), {
        totalEnemies: 1000,
        taggedByDeathwave: 600,
      }, { runType: 'farm', tier: 11 }),
    ]

    const filters: CoverageReportFilters = {
      selectedMetrics: new Set<CoverageFieldName>(['taggedByDeathwave']),
      runType: 'all',
      tier: 'all',
      duration: 'daily' as Duration,
      periodCount: 10,
    }

    const result = calculateCoverageAnalysis(runs, filters)

    expect(result.filters).toBe(filters)
    expect(result.periods).toHaveLength(2)
    expect(result.summary.totalRuns).toBe(2)
    expect(result.summary.totalEnemies).toBe(2000)
  })

  it('filters runs and limits periods correctly', () => {
    // Use explicit timestamps to avoid timezone issues
    const runs = [
      createMockRun('1', new Date(2024, 2, 14, 12, 0, 0), { totalEnemies: 1000 }, { tier: 10 }), // March 14
      createMockRun('2', new Date(2024, 2, 15, 12, 0, 0), { totalEnemies: 1000 }, { tier: 11 }), // March 15
      createMockRun('3', new Date(2024, 2, 16, 12, 0, 0), { totalEnemies: 1000 }, { tier: 11 }), // March 16
      createMockRun('4', new Date(2024, 2, 17, 12, 0, 0), { totalEnemies: 1000 }, { tier: 11 }), // March 17
    ]

    const filters: CoverageReportFilters = {
      selectedMetrics: new Set<CoverageFieldName>(['taggedByDeathwave']),
      runType: 'all',
      tier: 11,
      duration: 'daily' as Duration,
      periodCount: 2, // Only last 2 periods
    }

    const result = calculateCoverageAnalysis(runs, filters)

    // Should exclude tier 10 run and only include last 2 days (March 16, 17)
    expect(result.periods).toHaveLength(2)
    expect(result.periods[0].periodKey).toBe('2024-03-16')
    expect(result.periods[1].periodKey).toBe('2024-03-17')
  })

  it('returns empty periods when no valid runs', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15'), { totalEnemies: 0 }), // Invalid
    ]

    const result = calculateCoverageAnalysis(runs, defaultFilters)

    expect(result.periods).toHaveLength(0)
    expect(result.summary.totalRuns).toBe(0)
  })
})
