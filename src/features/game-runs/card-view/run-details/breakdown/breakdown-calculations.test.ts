/* eslint-disable max-lines */
/**
 * Breakdown Calculations Tests
 *
 * Tests for composite breakdown calculation functions:
 * - calculateBreakdownGroup
 * - extractPlainFields
 * - findUncategorizedFields
 */

import { describe, it, expect } from 'vitest'
import type { BreakdownConfig, PlainFieldsConfig } from '../types'
import { createMockRun } from '../test-helpers'
import {
  calculateBreakdownGroup,
  extractPlainFields,
  findUncategorizedFields,
} from './breakdown-calculations'

// =============================================================================
// calculateBreakdownGroup
// =============================================================================

describe('calculateBreakdownGroup', () => {
  const damageConfig: BreakdownConfig = {
    totalField: 'damageDealt',
    label: 'DAMAGE DEALT',
    sources: [
      { fieldName: 'deathWaveDamage', displayName: 'Death Wave', color: '#ef4444' },
      { fieldName: 'thornDamage', displayName: 'Thorn', color: '#22d3ee' },
      { fieldName: 'orbDamage', displayName: 'Orb', color: '#f87171' },
    ],
  }

  it('calculates breakdown with correct percentages', () => {
    const run = createMockRun({
      damageDealt: 1000,
      deathWaveDamage: 500, // 50%
      thornDamage: 300, // 30%
      orbDamage: 200, // 20%
    })

    const result = calculateBreakdownGroup(run, damageConfig)

    expect(result).not.toBeNull()
    expect(result!.total).toBe(1000)
    expect(result!.items).toHaveLength(3)
    expect(result!.items[0].percentage).toBe(50)
    expect(result!.items[0].displayName).toBe('Death Wave')
  })

  it('returns null when no source fields exist', () => {
    const run = createMockRun({ damageDealt: 1000 })
    const result = calculateBreakdownGroup(run, damageConfig)
    expect(result).toBeNull()
  })

  it('only includes fields that exist in run (plus discrepancy if applicable)', () => {
    const run = createMockRun({
      damageDealt: 1000,
      deathWaveDamage: 700,
      // thornDamage and orbDamage don't exist
      // Sum = 700, total = 1000 → 30% unknown discrepancy
    })

    const result = calculateBreakdownGroup(run, damageConfig)

    expect(result).not.toBeNull()
    // 1 existing source field + 1 unknown discrepancy
    expect(result!.items).toHaveLength(2)
    expect(result!.items[0].fieldName).toBe('deathWaveDamage')
    // Second item is the discrepancy
    expect(result!.items[1].isDiscrepancy).toBe(true)
    expect(result!.items[1].discrepancyType).toBe('unknown')
  })

  it('includes zero-value fields if they exist', () => {
    const run = createMockRun({
      damageDealt: 1000,
      deathWaveDamage: 1000,
      thornDamage: 0, // Zero but exists
    })

    const result = calculateBreakdownGroup(run, damageConfig)

    expect(result).not.toBeNull()
    expect(result!.items).toHaveLength(2)
    expect(result!.items.some(i => i.fieldName === 'thornDamage')).toBe(true)
  })

  it('sorts items by percentage descending', () => {
    const run = createMockRun({
      damageDealt: 1000,
      deathWaveDamage: 200,
      thornDamage: 500,
      orbDamage: 300,
    })

    const result = calculateBreakdownGroup(run, damageConfig)

    expect(result).not.toBeNull()
    expect(result!.items[0].displayName).toBe('Thorn')
    expect(result!.items[1].displayName).toBe('Orb')
    expect(result!.items[2].displayName).toBe('Death Wave')
  })

  it('computes sum total when totalField is null', () => {
    const shardsConfig: BreakdownConfig = {
      totalField: null,
      label: 'SHARDS',
      sources: [
        { fieldName: 'rerollShards', displayName: 'Re-roll', color: '#94a3b8' },
        { fieldName: 'armorShards', displayName: 'Armor', color: '#64748b' },
      ],
    }

    const run = createMockRun({
      rerollShards: 100,
      armorShards: 50,
    })

    const result = calculateBreakdownGroup(run, shardsConfig)

    expect(result).not.toBeNull()
    expect(result!.total).toBe(150)
    expect(result!.items[0].percentage).toBeCloseTo(66.67, 1)
    expect(result!.items[1].percentage).toBeCloseTo(33.33, 1)
  })

  it('includes per-hour value when perHourField is configured', () => {
    const coinsConfig: BreakdownConfig = {
      totalField: 'coinsEarned',
      label: 'COINS EARNED',
      perHourField: 'coinsPerHour',
      sources: [
        { fieldName: 'coinsFromDeathWave', displayName: 'Death Wave', color: '#ef4444' },
      ],
    }

    const run = createMockRun({
      coinsEarned: 1000000,
      coinsPerHour: 500000,
      coinsFromDeathWave: 800000,
    })

    const result = calculateBreakdownGroup(run, coinsConfig)

    expect(result).not.toBeNull()
    expect(result!.perHourDisplayValue).toBeDefined()
  })

  // ===========================================================================
  // Discrepancy Detection Tests
  // ===========================================================================

  describe('discrepancy detection', () => {
    const damageConfigWithTotal: BreakdownConfig = {
      totalField: 'damageDealt',
      label: 'DAMAGE DEALT',
      sources: [
        { fieldName: 'deathWaveDamage', displayName: 'Death Wave', color: '#ef4444' },
        { fieldName: 'thornDamage', displayName: 'Thorn', color: '#22d3ee' },
        { fieldName: 'orbDamage', displayName: 'Orb', color: '#f87171' },
      ],
    }

    it('adds Unknown item when sources sum to less than total by more than 1%', () => {
      const run = createMockRun({
        damageDealt: 1000,
        deathWaveDamage: 500,
        thornDamage: 300,
        // orbDamage missing - but total is 1000, sources sum to 800 = 20% unknown
      })

      const result = calculateBreakdownGroup(run, damageConfigWithTotal)

      expect(result).not.toBeNull()
      // 2 source items + 1 unknown item
      expect(result!.items).toHaveLength(3)

      const unknownItem = result!.items.find(i => i.isDiscrepancy)
      expect(unknownItem).toBeDefined()
      expect(unknownItem!.discrepancyType).toBe('unknown')
      expect(unknownItem!.displayName).toBe('Unknown')
      expect(unknownItem!.value).toBe(200)
      expect(unknownItem!.percentage).toBe(20)
    })

    it('adds Overage item when sources sum to more than total by more than 1%', () => {
      const run = createMockRun({
        damageDealt: 1000,
        deathWaveDamage: 600,
        thornDamage: 400,
        orbDamage: 150, // Sum = 1150, total = 1000 → 15% overage
      })

      const result = calculateBreakdownGroup(run, damageConfigWithTotal)

      expect(result).not.toBeNull()
      // 3 source items + 1 overage item
      expect(result!.items).toHaveLength(4)

      const overageItem = result!.items.find(i => i.isDiscrepancy)
      expect(overageItem).toBeDefined()
      expect(overageItem!.discrepancyType).toBe('overage')
      expect(overageItem!.displayName).toBe('Overage')
      expect(overageItem!.value).toBe(150)
      expect(overageItem!.percentage).toBe(15)
    })

    it('does not add discrepancy when within threshold (1%)', () => {
      const run = createMockRun({
        damageDealt: 1000,
        deathWaveDamage: 500,
        thornDamage: 300,
        orbDamage: 195, // Sum = 995, total = 1000 → 0.5% unknown (below 1%)
      })

      const result = calculateBreakdownGroup(run, damageConfigWithTotal)

      expect(result).not.toBeNull()
      expect(result!.items).toHaveLength(3) // No discrepancy item
      expect(result!.items.every(i => !i.isDiscrepancy)).toBe(true)
    })

    it('does not add discrepancy when sources exactly match total', () => {
      const run = createMockRun({
        damageDealt: 1000,
        deathWaveDamage: 500,
        thornDamage: 300,
        orbDamage: 200, // Sum = 1000, total = 1000 → no discrepancy
      })

      const result = calculateBreakdownGroup(run, damageConfigWithTotal)

      expect(result).not.toBeNull()
      expect(result!.items).toHaveLength(3)
      expect(result!.items.every(i => !i.isDiscrepancy)).toBe(true)
    })

    it('places discrepancy item at the end after sorted items', () => {
      const run = createMockRun({
        damageDealt: 1000,
        deathWaveDamage: 200,
        thornDamage: 500,
        // Sum = 700, total = 1000 → 30% unknown
      })

      const result = calculateBreakdownGroup(run, damageConfigWithTotal)

      expect(result).not.toBeNull()
      expect(result!.items).toHaveLength(3)

      // First two items should be sorted by percentage
      expect(result!.items[0].displayName).toBe('Thorn') // 50%
      expect(result!.items[1].displayName).toBe('Death Wave') // 20%

      // Last item should be the discrepancy
      expect(result!.items[2].isDiscrepancy).toBe(true)
      expect(result!.items[2].displayName).toBe('Unknown')
    })

    it('does not add discrepancy for computed sum totals (totalField: null)', () => {
      const shardsConfig: BreakdownConfig = {
        totalField: null,
        label: 'SHARDS',
        sources: [
          { fieldName: 'rerollShards', displayName: 'Re-roll', color: '#94a3b8' },
          { fieldName: 'armorShards', displayName: 'Armor', color: '#64748b' },
        ],
      }

      const run = createMockRun({
        rerollShards: 100,
        armorShards: 50,
      })

      const result = calculateBreakdownGroup(run, shardsConfig)

      expect(result).not.toBeNull()
      expect(result!.items).toHaveLength(2) // No discrepancy item
      expect(result!.items.every(i => !i.isDiscrepancy)).toBe(true)
    })

    it('handles 100% unknown (total exists but no sources)', () => {
      const run = createMockRun({
        damageDealt: 1000,
        deathWaveDamage: 0, // Exists with zero value
      })

      const result = calculateBreakdownGroup(run, damageConfigWithTotal)

      expect(result).not.toBeNull()
      // Should have zero-value item + unknown item
      expect(result!.items).toHaveLength(2)

      const unknownItem = result!.items.find(i => i.isDiscrepancy)
      expect(unknownItem).toBeDefined()
      expect(unknownItem!.percentage).toBe(100)
    })

    it('provides correct color for unknown discrepancy', () => {
      const run = createMockRun({
        damageDealt: 1000,
        deathWaveDamage: 800,
      })

      const result = calculateBreakdownGroup(run, damageConfigWithTotal)
      const unknownItem = result!.items.find(i => i.isDiscrepancy)

      expect(unknownItem!.color).toBe('#6b7280') // gray-600
    })

    it('provides correct color for overage discrepancy', () => {
      const run = createMockRun({
        damageDealt: 1000,
        deathWaveDamage: 1200,
      })

      const result = calculateBreakdownGroup(run, damageConfigWithTotal)
      const overageItem = result!.items.find(i => i.isDiscrepancy)

      expect(overageItem!.color).toBe('#fbbf24') // amber-400
    })

    it('skips discrepancy detection when skipDiscrepancy is true', () => {
      const configWithSkip: BreakdownConfig = {
        totalField: 'totalEnemies',
        label: 'ENEMIES AFFECTED BY',
        skipDiscrepancy: true, // Supplementary data, not a breakdown of total
        sources: [
          { fieldName: 'destroyedInSpotlight', displayName: 'Spotlight', color: '#e2e8f0' },
          { fieldName: 'taggedByDeathwave', displayName: 'Deathwave', color: '#ef4444' },
        ],
      }

      const run = createMockRun({
        totalEnemies: 1000,
        destroyedInSpotlight: 100, // Only 10% of total
        taggedByDeathwave: 200,    // Only 20% of total
        // Sum = 300, total = 1000 → would normally be 70% unknown
      })

      const result = calculateBreakdownGroup(run, configWithSkip)

      expect(result).not.toBeNull()
      expect(result!.items).toHaveLength(2) // No discrepancy item
      expect(result!.items.every(i => !i.isDiscrepancy)).toBe(true)
    })

    it('still detects discrepancy when skipDiscrepancy is false', () => {
      const configWithoutSkip: BreakdownConfig = {
        totalField: 'damageDealt',
        label: 'DAMAGE',
        skipDiscrepancy: false,
        sources: [
          { fieldName: 'deathWaveDamage', displayName: 'Death Wave', color: '#ef4444' },
        ],
      }

      const run = createMockRun({
        damageDealt: 1000,
        deathWaveDamage: 500, // 50% of total
      })

      const result = calculateBreakdownGroup(run, configWithoutSkip)

      expect(result).not.toBeNull()
      expect(result!.items).toHaveLength(2) // 1 source + 1 unknown
      expect(result!.items.some(i => i.isDiscrepancy)).toBe(true)
    })
  })
})

// =============================================================================
// extractPlainFields
// =============================================================================

describe('extractPlainFields', () => {
  const config: PlainFieldsConfig = {
    label: 'DAMAGE TAKEN',
    fields: [
      { fieldName: 'damageTaken', displayName: 'Total' },
      { fieldName: 'damageTakenWall', displayName: 'Wall' },
      { fieldName: 'damageTakenWhileBerserked', displayName: 'Berserked' },
    ],
  }

  it('extracts all existing fields', () => {
    const run = createMockRun({
      damageTaken: 5000,
      damageTakenWall: 3000,
      damageTakenWhileBerserked: 2000,
    })

    const result = extractPlainFields(run, config)

    expect(result.label).toBe('DAMAGE TAKEN')
    expect(result.items).toHaveLength(3)
    expect(result.items[0].displayName).toBe('Total')
    expect(result.items[0].displayValue).toBe('5.0K')
  })

  it('only includes fields that exist in run', () => {
    const run = createMockRun({
      damageTaken: 5000,
      // Other fields don't exist
    })

    const result = extractPlainFields(run, config)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].fieldName).toBe('damageTaken')
  })

  it('returns empty items when no fields exist', () => {
    const run = createMockRun({})
    const result = extractPlainFields(run, config)

    expect(result.items).toHaveLength(0)
    expect(result.label).toBe('DAMAGE TAKEN')
  })

  it('uses original key when displayName not provided', () => {
    const configNoDisplayName: PlainFieldsConfig = {
      fields: [{ fieldName: 'someField' }],
    }

    const run = createMockRun({ someField: 100 })
    const result = extractPlainFields(run, configNoDisplayName)

    expect(result.items[0].displayName).toBe('someField')
  })
})

// =============================================================================
// findUncategorizedFields
// =============================================================================

describe('findUncategorizedFields', () => {
  it('finds fields not in categorized set', () => {
    const run = createMockRun({
      categorizedField: 100,
      uncategorizedField: 200,
      anotherUncategorized: 300,
    })

    const categorized = new Set(['categorizedField'])
    const skip = new Set<string>()

    const result = findUncategorizedFields(run, categorized, skip)

    expect(result.label).toBe('MISCELLANEOUS')
    expect(result.items).toHaveLength(2)
    expect(result.items.some(i => i.fieldName === 'uncategorizedField')).toBe(true)
    expect(result.items.some(i => i.fieldName === 'anotherUncategorized')).toBe(true)
  })

  it('excludes fields in skip set', () => {
    const run = createMockRun({
      normalField: 100,
      _internalField: 200,
    })

    const categorized = new Set<string>()
    const skip = new Set(['_internalField'])

    const result = findUncategorizedFields(run, categorized, skip)

    expect(result.items).toHaveLength(1)
    expect(result.items[0].fieldName).toBe('normalField')
  })

  it('returns empty when all fields are categorized or skipped', () => {
    const run = createMockRun({
      categorized: 100,
      skipped: 200,
    })

    const categorized = new Set(['categorized'])
    const skip = new Set(['skipped'])

    const result = findUncategorizedFields(run, categorized, skip)

    expect(result.items).toHaveLength(0)
  })

  it('handles run with unknown game export fields', () => {
    const run = createMockRun({
      knownField: 100,
      newGameFeatureField: 500, // Simulates a new field from game update
      anotherNewField: 300,
    })

    const categorized = new Set(['knownField'])
    const skip = new Set<string>()

    const result = findUncategorizedFields(run, categorized, skip)

    expect(result.items).toHaveLength(2)
    expect(result.items.some(i => i.fieldName === 'newGameFeatureField')).toBe(true)
  })
})


