/**
 * Mini Coverage Calculations Tests
 */

import { describe, it, expect } from 'vitest'
import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types'
import { calculateMiniCoverageData, hasValidCoverageData } from './mini-coverage-calculations'

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
    runType: 'farm',
    ...overrides,
  }
}

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

describe('calculateMiniCoverageData', () => {
  it('returns null when run has no totalEnemies', () => {
    const run = createMockRun({})
    expect(calculateMiniCoverageData(run)).toBeNull()
  })

  it('returns null when totalEnemies = 0', () => {
    const run = createMockRun({ totalEnemies: 0 })
    expect(calculateMiniCoverageData(run)).toBeNull()
  })

  it('returns null when all metrics have zero values', () => {
    const run = createMockRun({
      totalEnemies: 1000,
      // All coverage metrics are 0 or missing
    })
    expect(calculateMiniCoverageData(run)).toBeNull()
  })

  it('returns data with only economic metrics when combat metrics are zero', () => {
    const run = createMockRun({
      totalEnemies: 1000,
      taggedByDeathwave: 800,
      destroyedInSpotlight: 600,
    })

    const result = calculateMiniCoverageData(run)

    expect(result).not.toBeNull()
    expect(result!.economicMetrics).toHaveLength(2)
    expect(result!.combatMetrics).toHaveLength(0)
  })

  it('returns data with only combat metrics when economic metrics are zero', () => {
    const run = createMockRun({
      totalEnemies: 1000,
      enemiesHitByOrbs: 900,
      destroyedByOrbs: 700,
    })

    const result = calculateMiniCoverageData(run)

    expect(result).not.toBeNull()
    expect(result!.economicMetrics).toHaveLength(0)
    expect(result!.combatMetrics).toHaveLength(2)
  })

  it('returns all 9 metrics when all have values', () => {
    const run = createMockRun({
      totalEnemies: 1000,
      // Economic (4)
      taggedByDeathwave: 800,
      destroyedInSpotlight: 600,
      destroyedInGoldenBot: 400,
      summonedEnemies: 200,
      // Combat (5)
      enemiesHitByOrbs: 900,
      destroyedByOrbs: 700,
      destroyedByDeathRay: 500,
      destroyedByThorns: 300,
      destroyedByLandMine: 100,
    })

    const result = calculateMiniCoverageData(run)

    expect(result).not.toBeNull()
    expect(result!.economicMetrics).toHaveLength(4)
    expect(result!.combatMetrics).toHaveLength(5)
  })

  it('calculates correct percentages', () => {
    const run = createMockRun({
      totalEnemies: 1000,
      taggedByDeathwave: 850,
    })

    const result = calculateMiniCoverageData(run)

    expect(result).not.toBeNull()
    expect(result!.economicMetrics[0].percentage).toBe(85)
    expect(result!.economicMetrics[0].affectedCount).toBe(850)
    expect(result!.economicMetrics[0].totalEnemies).toBe(1000)
  })

  it('sorts metrics by percentage descending', () => {
    const run = createMockRun({
      totalEnemies: 1000,
      taggedByDeathwave: 200, // 20%
      destroyedInSpotlight: 800, // 80%
      destroyedInGoldenBot: 500, // 50%
    })

    const result = calculateMiniCoverageData(run)

    expect(result).not.toBeNull()
    expect(result!.economicMetrics[0].label).toBe('Spotlight')
    expect(result!.economicMetrics[1].label).toBe('Golden Bot')
    expect(result!.economicMetrics[2].label).toBe('Death Wave')
  })

  it('filters out metrics with zero values', () => {
    const run = createMockRun({
      totalEnemies: 1000,
      taggedByDeathwave: 800,
      destroyedInSpotlight: 0, // Should be filtered out
      destroyedInGoldenBot: 500,
    })

    const result = calculateMiniCoverageData(run)

    expect(result).not.toBeNull()
    expect(result!.economicMetrics).toHaveLength(2)
    expect(result!.economicMetrics.some((m) => m.label === 'Spotlight')).toBe(false)
  })

  it('handles coverage greater than 100% (orbs can hit enemies multiple times)', () => {
    const run = createMockRun({
      totalEnemies: 1000,
      enemiesHitByOrbs: 1500, // 150% - orbs can hit same enemy multiple times
    })

    const result = calculateMiniCoverageData(run)

    expect(result).not.toBeNull()
    expect(result!.combatMetrics[0].percentage).toBe(150)
  })

  it('includes metric metadata (label and color)', () => {
    const run = createMockRun({
      totalEnemies: 1000,
      taggedByDeathwave: 800,
    })

    const result = calculateMiniCoverageData(run)

    expect(result).not.toBeNull()
    const deathWaveMetric = result!.economicMetrics[0]
    expect(deathWaveMetric.fieldName).toBe('taggedByDeathwave')
    expect(deathWaveMetric.label).toBe('Death Wave')
    expect(deathWaveMetric.color).toBe('#ef4444')
  })
})
