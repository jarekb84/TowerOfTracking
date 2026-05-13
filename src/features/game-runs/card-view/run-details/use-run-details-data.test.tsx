/**
 * Run Details Data Hook Tests
 *
 * Fixtures use V3 canonical field keys (`<sectionCamel>_<labelCamel>`) —
 * same shape the runtime parsers produce after V2->V3 remap.
 *
 * The data shape is graph-driven (per commit 6's BELONGS_TO_SECTION +
 * BELONGS_TO_CATEGORY cutover): top-level `categories[]` in
 * `categoriesInDisplayOrder()` order, each with `sections[]` from
 * `sectionsInCategory()`.
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createMockRun } from './test-helpers'
import { useRunDetailsData } from './use-run-details-data'
import type { CategoryData, SectionData } from './types'

function findCategory(
  categories: readonly CategoryData[],
  categoryId: string,
): CategoryData | undefined {
  return categories.find((c) => c.categoryId === categoryId)
}

function findSection(
  category: CategoryData | undefined,
  sectionId: string,
): SectionData | undefined {
  return category?.sections.find((s) => s.sectionId === sectionId)
}

describe('useRunDetailsData', () => {
  it('returns categories in catalog declaration order', () => {
    const run = createMockRun({ battleReport_tier: 11, battleReport_wave: 1000 })

    const { result } = renderHook(() => useRunDetailsData(run))

    expect(result.current.categories.map((c) => c.categoryId)).toEqual([
      'category:general',
      'category:records',
      'category:combat',
      'category:economic',
    ])
  })

  describe('battle report section', () => {
    it('lists the run\'s battleReport_* fields in declaration order', () => {
      const run = createMockRun({
        battleReport_tier: 11,
        battleReport_wave: 1000,
        battleReport_gameTime: 7200,
        battleReport_realTime: 7500,
        battleReport_killedBy: 'Boss',
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const general = findCategory(result.current.categories, 'category:general')
      const battleReport = findSection(general, 'section:battleReport')

      expect(battleReport).toBeDefined()
      expect(battleReport!.kind).toBe('plain')
      if (battleReport!.kind === 'plain') {
        expect(battleReport!.items.map((i) => i.fieldName)).toEqual([
          'battleReport_tier',
          'battleReport_wave',
          'battleReport_killedBy',
          'battleReport_gameTime',
          'battleReport_realTime',
        ])
      }
    })

    it('hides battleReport_battleDate (rendered in the run card header)', () => {
      const run = createMockRun({
        battleReport_tier: 11,
        battleReport_battleDate: '2024-03-15T10:30:00',
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const general = findCategory(result.current.categories, 'category:general')
      const battleReport = findSection(general, 'section:battleReport')

      expect(battleReport).toBeDefined()
      if (battleReport!.kind === 'plain') {
        expect(
          battleReport!.items.some((i) => i.fieldName === 'battleReport_battleDate'),
        ).toBe(false)
      }
    })
  })

  describe('combat category', () => {
    it('calculates damage dealt breakdown for section:damage', () => {
      const run = createMockRun({
        damage_damageDealt: 1000000,
        damage_deathWave: 500000,
        damage_thorns: 300000,
        damage_orbs: 200000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const combat = findCategory(result.current.categories, 'category:combat')
      const damage = findSection(combat, 'section:damage')

      expect(damage).toBeDefined()
      expect(damage!.kind).toBe('breakdown')
      if (damage!.kind === 'breakdown') {
        expect(damage!.total).toBe(1000000)
        expect(damage!.items).toHaveLength(3)
      }
    })

    it('calculates enemies destroyed breakdown for section:totalEnemies', () => {
      const run = createMockRun({
        totalEnemies_totalEnemies: 10000,
        totalEnemies_basic: 5000,
        totalEnemies_fast: 3000,
        totalEnemies_tank: 2000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const combat = findCategory(result.current.categories, 'category:combat')
      const totalEnemies = findSection(combat, 'section:totalEnemies')

      expect(totalEnemies).toBeDefined()
      if (totalEnemies!.kind === 'breakdown') {
        expect(totalEnemies!.total).toBe(10000)
        expect(totalEnemies!.items[0].percentage).toBe(50)
      }
    })

    it('renders damage taken as a plain section', () => {
      const run = createMockRun({
        damageTaken_tower: 5000,
        damageTaken_wall: 3000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const combat = findCategory(result.current.categories, 'category:combat')
      const damageTaken = findSection(combat, 'section:damageTaken')

      expect(damageTaken).toBeDefined()
      expect(damageTaken!.kind).toBe('plain')
    })
  })

  describe('economic category', () => {
    it('calculates coins earned breakdown for section:coins', () => {
      const run = createMockRun({
        battleReport_coinsEarned: 1000000,
        coins_deathWave: 400000,
        coins_goldenTower: 300000,
        coins_spotlight: 300000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const economic = findCategory(result.current.categories, 'category:economic')
      const coins = findSection(economic, 'section:coins')

      expect(coins).toBeDefined()
      if (coins!.kind === 'breakdown') {
        expect(coins!.total).toBe(1000000)
        expect(coins!.items).toHaveLength(3)
      }
    })

    it('includes per-hour rate when available', () => {
      const run = createMockRun({
        battleReport_coinsEarned: 1000000,
        battleReport_coinsPerHour: 500000,
        coins_deathWave: 1000000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const economic = findCategory(result.current.categories, 'category:economic')
      const coins = findSection(economic, 'section:coins')

      if (coins!.kind === 'breakdown') {
        expect(coins!.perHourDisplayValue).toBeDefined()
      }
    })

    it('renders currencies as a plain section', () => {
      const run = createMockRun({
        currencies_armorShards: 50,
        currencies_coreShards: 100,
        currencies_cannonShards: 50,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const economic = findCategory(result.current.categories, 'category:economic')
      const currencies = findSection(economic, 'section:currencies')

      expect(currencies).toBeDefined()
      expect(currencies!.kind).toBe('plain')
      if (currencies!.kind === 'plain') {
        expect(currencies!.items.map((i) => i.fieldName)).toContain('currencies_armorShards')
      }
    })
  })

  describe('uncategorized fields', () => {
    it('captures fields not in any section', () => {
      const run = createMockRun({
        battleReport_tier: 11,
        unknownNewField: 500,
        anotherNewField: 300,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const uncategorized = result.current.uncategorized

      expect(uncategorized.items.some((i) => i.fieldName === 'unknownNewField')).toBe(true)
      expect(uncategorized.items.some((i) => i.fieldName === 'anotherNewField')).toBe(true)
    })

    it('excludes internal fields from uncategorized', () => {
      const run = createMockRun({
        battleReport_tier: 11,
      })
      run.fields['_notes'] = {
        value: 'test notes',
        rawValue: 'test notes',
        displayValue: 'test notes',
        originalKey: '_notes',
        dataType: 'string',
      }

      const { result } = renderHook(() => useRunDetailsData(run))

      expect(
        result.current.uncategorized.items.some((i) => i.fieldName === '_notes'),
      ).toBe(false)
    })

    it('returns empty uncategorized when all fields are known', () => {
      const run = createMockRun({
        battleReport_tier: 11,
        battleReport_wave: 1000,
        battleReport_gameTime: 3600,
        battleReport_realTime: 3700,
      })

      const { result } = renderHook(() => useRunDetailsData(run))

      expect(result.current.uncategorized.items).toHaveLength(0)
    })
  })

  describe('null handling', () => {
    it('omits sections with no data', () => {
      const run = createMockRun({
        battleReport_tier: 11,
        battleReport_wave: 1000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const combat = findCategory(result.current.categories, 'category:combat')

      expect(findSection(combat, 'section:damage')).toBeUndefined()
      expect(findSection(combat, 'section:totalEnemies')).toBeUndefined()
    })
  })

  describe('memoization', () => {
    it('returns same reference for unchanged run', () => {
      const run = createMockRun({ battleReport_tier: 11 })

      const { result, rerender } = renderHook(() => useRunDetailsData(run))
      const firstResult = result.current

      rerender()

      expect(result.current).toBe(firstResult)
    })
  })
})
