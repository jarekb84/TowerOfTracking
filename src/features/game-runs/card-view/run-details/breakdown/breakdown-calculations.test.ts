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

  it('only includes fields that exist in run', () => {
    const run = createMockRun({
      damageDealt: 1000,
      deathWaveDamage: 700,
      // thornDamage and orbDamage don't exist
    })

    const result = calculateBreakdownGroup(run, damageConfig)

    expect(result).not.toBeNull()
    expect(result!.items).toHaveLength(1)
    expect(result!.items[0].fieldName).toBe('deathWaveDamage')
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
