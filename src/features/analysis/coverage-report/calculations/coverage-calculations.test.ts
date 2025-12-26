/**
 * Coverage Calculations Tests
 */

import { describe, it, expect } from 'vitest'
import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types'
import {
  extractFieldValue,
  getTotalEnemies,
  hasValidCoverageData,
  calculateCoveragePercentage,
  calculateMetricCoverageForRun,
  sumAffectedCounts,
  sumTotalEnemies,
  calculateMetricCoverage,
  sortMetricsByPercentage,
  filterNonZeroCoverage,
} from './coverage-calculations'
import type { CoverageMetricDefinition, MetricCoverage } from '../types'

/**
 * Helper to create a mock game run with specified fields
 */
function createMockRun(
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
    id: 'test-run',
    timestamp: new Date('2024-03-15'),
    fields: runFields,
    tier: 11,
    wave: 1000,
    coinsEarned: 100000,
    cellsEarned: 50,
    realTime: 3600,
    gameSpeed: 2.0,
    runType: 'farm',
    ...overrides,
  }
}

const mockMetric: CoverageMetricDefinition = {
  fieldName: 'taggedByDeathwave',
  label: 'Death Wave',
  category: 'economic',
  color: '#ef4444',
}

describe('extractFieldValue', () => {
  it('extracts numeric value from existing field', () => {
    const run = createMockRun({ testField: 500 })
    expect(extractFieldValue(run, 'testField')).toBe(500)
  })

  it('returns 0 for missing field', () => {
    const run = createMockRun({})
    expect(extractFieldValue(run, 'nonexistent')).toBe(0)
  })

  it('returns 0 for non-numeric field', () => {
    const run = createMockRun({})
    run.fields['stringField'] = {
      value: 'text' as unknown as number,
      rawValue: 'text',
      displayValue: 'text',
      originalKey: 'stringField',
      dataType: 'string' as const,
    }
    expect(extractFieldValue(run, 'stringField')).toBe(0)
  })
})

describe('getTotalEnemies', () => {
  it('extracts totalEnemies field', () => {
    const run = createMockRun({ totalEnemies: 10000 })
    expect(getTotalEnemies(run)).toBe(10000)
  })

  it('returns 0 when totalEnemies missing', () => {
    const run = createMockRun({})
    expect(getTotalEnemies(run)).toBe(0)
  })
})

describe('hasValidCoverageData', () => {
  it('returns true when totalEnemies > 0', () => {
    const run = createMockRun({ totalEnemies: 5000 })
    expect(hasValidCoverageData(run)).toBe(true)
  })

  it('returns false when totalEnemies = 0', () => {
    const run = createMockRun({ totalEnemies: 0 })
    expect(hasValidCoverageData(run)).toBe(false)
  })

  it('returns false when totalEnemies missing', () => {
    const run = createMockRun({})
    expect(hasValidCoverageData(run)).toBe(false)
  })
})

describe('calculateCoveragePercentage', () => {
  it('calculates correct percentage', () => {
    expect(calculateCoveragePercentage(500, 1000)).toBe(50)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateCoveragePercentage(333, 1000)).toBe(33.3)
    expect(calculateCoveragePercentage(1, 3)).toBe(33.33)
  })

  it('returns 0 when total is 0', () => {
    expect(calculateCoveragePercentage(100, 0)).toBe(0)
  })

  it('returns 0 when affected is 0', () => {
    expect(calculateCoveragePercentage(0, 1000)).toBe(0)
  })

  it('returns 100 when affected equals total', () => {
    expect(calculateCoveragePercentage(1000, 1000)).toBe(100)
  })

  it('handles values greater than total (can happen with orbs)', () => {
    // Orbs can hit enemies multiple times, so affected > total is possible
    expect(calculateCoveragePercentage(1500, 1000)).toBe(150)
  })
})

describe('calculateMetricCoverageForRun', () => {
  it('calculates coverage for a single metric in a run', () => {
    const run = createMockRun({
      totalEnemies: 1000,
      taggedByDeathwave: 800,
    })

    const result = calculateMetricCoverageForRun(run, mockMetric)

    expect(result.fieldName).toBe('taggedByDeathwave')
    expect(result.label).toBe('Death Wave')
    expect(result.color).toBe('#ef4444')
    expect(result.percentage).toBe(80)
    expect(result.affectedCount).toBe(800)
    expect(result.totalEnemies).toBe(1000)
  })

  it('returns 0 percentage when metric field is missing', () => {
    const run = createMockRun({ totalEnemies: 1000 })

    const result = calculateMetricCoverageForRun(run, mockMetric)

    expect(result.percentage).toBe(0)
    expect(result.affectedCount).toBe(0)
  })
})

describe('sumAffectedCounts', () => {
  it('sums affected counts across multiple runs', () => {
    const runs = [
      createMockRun({ taggedByDeathwave: 100 }),
      createMockRun({ taggedByDeathwave: 200 }),
      createMockRun({ taggedByDeathwave: 300 }),
    ]

    expect(sumAffectedCounts(runs, 'taggedByDeathwave')).toBe(600)
  })

  it('handles runs with missing field', () => {
    const runs = [
      createMockRun({ taggedByDeathwave: 100 }),
      createMockRun({}),
      createMockRun({ taggedByDeathwave: 200 }),
    ]

    expect(sumAffectedCounts(runs, 'taggedByDeathwave')).toBe(300)
  })

  it('returns 0 for empty array', () => {
    expect(sumAffectedCounts([], 'taggedByDeathwave')).toBe(0)
  })
})

describe('sumTotalEnemies', () => {
  it('sums total enemies across multiple runs', () => {
    const runs = [
      createMockRun({ totalEnemies: 1000 }),
      createMockRun({ totalEnemies: 2000 }),
      createMockRun({ totalEnemies: 3000 }),
    ]

    expect(sumTotalEnemies(runs)).toBe(6000)
  })

  it('returns 0 for empty array', () => {
    expect(sumTotalEnemies([])).toBe(0)
  })
})

describe('calculateMetricCoverage', () => {
  it('calculates aggregate coverage across multiple runs', () => {
    const runs = [
      createMockRun({ totalEnemies: 1000, taggedByDeathwave: 800 }),
      createMockRun({ totalEnemies: 1000, taggedByDeathwave: 600 }),
    ]

    const result = calculateMetricCoverage(runs, mockMetric)

    expect(result.percentage).toBe(70) // 1400/2000 = 70%
    expect(result.affectedCount).toBe(1400)
    expect(result.totalEnemies).toBe(2000)
  })
})

describe('sortMetricsByPercentage', () => {
  it('sorts metrics by percentage descending', () => {
    const metrics: MetricCoverage[] = [
      { fieldName: 'taggedByDeathwave', label: 'Death Wave', color: '#111', percentage: 20, affectedCount: 200, totalEnemies: 1000 },
      { fieldName: 'destroyedInSpotlight', label: 'Spotlight', color: '#222', percentage: 80, affectedCount: 800, totalEnemies: 1000 },
      { fieldName: 'destroyedInGoldenBot', label: 'Golden Bot', color: '#333', percentage: 50, affectedCount: 500, totalEnemies: 1000 },
    ]

    const sorted = sortMetricsByPercentage(metrics)

    expect(sorted[0].fieldName).toBe('destroyedInSpotlight')
    expect(sorted[1].fieldName).toBe('destroyedInGoldenBot')
    expect(sorted[2].fieldName).toBe('taggedByDeathwave')
  })

  it('uses affectedCount as tiebreaker', () => {
    const metrics: MetricCoverage[] = [
      { fieldName: 'taggedByDeathwave', label: 'Death Wave', color: '#111', percentage: 50, affectedCount: 100, totalEnemies: 200 },
      { fieldName: 'destroyedInSpotlight', label: 'Spotlight', color: '#222', percentage: 50, affectedCount: 500, totalEnemies: 1000 },
    ]

    const sorted = sortMetricsByPercentage(metrics)

    expect(sorted[0].fieldName).toBe('destroyedInSpotlight') // Higher affected count
    expect(sorted[1].fieldName).toBe('taggedByDeathwave')
  })

  it('does not mutate original array', () => {
    const metrics: MetricCoverage[] = [
      { fieldName: 'taggedByDeathwave', label: 'Death Wave', color: '#111', percentage: 20, affectedCount: 200, totalEnemies: 1000 },
      { fieldName: 'destroyedInSpotlight', label: 'Spotlight', color: '#222', percentage: 80, affectedCount: 800, totalEnemies: 1000 },
    ]

    sortMetricsByPercentage(metrics)

    expect(metrics[0].fieldName).toBe('taggedByDeathwave') // Original unchanged
  })
})

describe('filterNonZeroCoverage', () => {
  it('filters out metrics with 0 percentage', () => {
    const metrics: MetricCoverage[] = [
      { fieldName: 'taggedByDeathwave', label: 'Death Wave', color: '#111', percentage: 50, affectedCount: 500, totalEnemies: 1000 },
      { fieldName: 'destroyedInSpotlight', label: 'Spotlight', color: '#222', percentage: 0, affectedCount: 0, totalEnemies: 1000 },
      { fieldName: 'destroyedInGoldenBot', label: 'Golden Bot', color: '#333', percentage: 25, affectedCount: 250, totalEnemies: 1000 },
    ]

    const filtered = filterNonZeroCoverage(metrics)

    expect(filtered).toHaveLength(2)
    expect(filtered.some(m => m.fieldName === 'destroyedInSpotlight')).toBe(false)
  })

  it('returns empty array when all metrics have 0 coverage', () => {
    const metrics: MetricCoverage[] = [
      { fieldName: 'taggedByDeathwave', label: 'Death Wave', color: '#111', percentage: 0, affectedCount: 0, totalEnemies: 1000 },
    ]

    expect(filterNonZeroCoverage(metrics)).toHaveLength(0)
  })
})
