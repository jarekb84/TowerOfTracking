/**
 * Run Details Data Hook Tests
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createMockRun } from './test-helpers'
import { useRunDetailsData } from './use-run-details-data'

describe('useRunDetailsData', () => {
  describe('structure', () => {
    it('returns correct data structure', () => {
      const run = createMockRun({
        tier: 11,
        wave: 1000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))

      expect(result.current).toHaveProperty('battleReport')
      expect(result.current).toHaveProperty('combat')
      expect(result.current).toHaveProperty('economic')
      expect(result.current).toHaveProperty('modules')
      expect(result.current).toHaveProperty('uncategorized')
    })

    it('returns battle report with essential and miscellaneous sections', () => {
      const run = createMockRun({
        tier: 11,
        wave: 1000,
        gameTime: 7200,
        realTime: 7500,
        killedBy: 'Boss',
      })

      const { result } = renderHook(() => useRunDetailsData(run))

      // 5 essential fields + 1 computed gameSpeed
      expect(result.current.battleReport.essential.items).toHaveLength(6)
      expect(result.current.battleReport.essential.items.some(i => i.fieldName === 'tier')).toBe(true)
    })

    it('returns combat section with all subsections', () => {
      const run = createMockRun({
        damageDealt: 1000000,
        deathWaveDamage: 500000,
        totalEnemies: 5000,
        basic: 3000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))

      expect(result.current.combat).toHaveProperty('damageDealt')
      expect(result.current.combat).toHaveProperty('damageTaken')
      expect(result.current.combat).toHaveProperty('enemiesDestroyed')
      expect(result.current.combat).toHaveProperty('destroyedBy')
    })
  })

  describe('battle report', () => {
    it('extracts essential fields when present', () => {
      const run = createMockRun({
        tier: 11,
        wave: 1000,
        gameTime: 7200,
        realTime: 7500,
        killedBy: 'Boss',
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const essential = result.current.battleReport.essential

      // 5 essential fields + 1 computed gameSpeed
      expect(essential.items).toHaveLength(6)
      expect(essential.items.find(i => i.fieldName === 'tier')?.displayValue).toBe('11')
    })

    it('calculates game speed from gameTime and realTime', () => {
      const run = createMockRun({
        gameTime: 7200, // 2 hours in seconds
        realTime: 3600, // 1 hour in seconds
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const essential = result.current.battleReport.essential

      const gameSpeed = essential.items.find(i => i.fieldName === 'gameSpeed')
      expect(gameSpeed).toBeDefined()
      expect(gameSpeed!.displayName).toBe('Game Speed')
      expect(gameSpeed!.displayValue).toBe('2x')
    })

    it('omits game speed when realTime is 0', () => {
      const run = createMockRun({
        gameTime: 7200,
      }, {
        realTime: 0, // Override the cached property
        gameSpeed: null, // gameSpeed is null when realTime is 0
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const essential = result.current.battleReport.essential

      const gameSpeed = essential.items.find(i => i.fieldName === 'gameSpeed')
      expect(gameSpeed).toBeUndefined()
    })

    it('extracts miscellaneous fields when present', () => {
      const run = createMockRun({
        wavesSkipped: 10,
        recoveryPackages: 3,
        freeAttackUpgrade: 1,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const misc = result.current.battleReport.miscellaneous

      expect(misc.label).toBe('MISCELLANEOUS')
      expect(misc.items.some(i => i.fieldName === 'wavesSkipped')).toBe(true)
    })
  })

  describe('combat section', () => {
    it('calculates damage dealt breakdown', () => {
      const run = createMockRun({
        damageDealt: 1000000,
        deathWaveDamage: 500000,
        thornDamage: 300000,
        orbDamage: 200000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const damageDealt = result.current.combat.damageDealt

      expect(damageDealt).not.toBeNull()
      expect(damageDealt!.total).toBe(1000000)
      expect(damageDealt!.items).toHaveLength(3)
    })

    it('calculates enemies destroyed breakdown', () => {
      const run = createMockRun({
        totalEnemies: 10000,
        basic: 5000,
        fast: 3000,
        tank: 2000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const enemiesDestroyed = result.current.combat.enemiesDestroyed

      expect(enemiesDestroyed).not.toBeNull()
      expect(enemiesDestroyed!.total).toBe(10000)
      expect(enemiesDestroyed!.items[0].percentage).toBe(50) // basic
    })

    it('extracts damage taken as plain fields', () => {
      const run = createMockRun({
        damageTaken: 5000,
        damageTakenWall: 3000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const damageTaken = result.current.combat.damageTaken

      expect(damageTaken.label).toBe('DAMAGE TAKEN')
      expect(damageTaken.items).toHaveLength(2)
    })
  })

  describe('economic section', () => {
    it('calculates coins earned breakdown', () => {
      const run = createMockRun({
        coinsEarned: 1000000,
        coinsFromDeathWave: 400000,
        coinsFromGoldenTower: 300000,
        coinsFromSpotlight: 300000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const coinsEarned = result.current.economic.coinsEarned

      expect(coinsEarned).not.toBeNull()
      expect(coinsEarned!.total).toBe(1000000)
      expect(coinsEarned!.items).toHaveLength(3)
    })

    it('includes per-hour rate when available', () => {
      const run = createMockRun({
        coinsEarned: 1000000,
        coinsPerHour: 500000,
        coinsFromDeathWave: 1000000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const coinsEarned = result.current.economic.coinsEarned

      expect(coinsEarned).not.toBeNull()
      expect(coinsEarned!.perHourDisplayValue).toBeDefined()
    })

    it('calculates cells per hour dynamically', () => {
      const run = createMockRun({
        cellsEarned: 100,
      }, {
        cellsEarned: 100,
        realTime: 3600, // 1 hour
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const otherEarnings = result.current.economic.otherEarnings

      const cellsPerHour = otherEarnings.items.find(i => i.fieldName === 'cellsPerHour')
      expect(cellsPerHour).toBeDefined()
      expect(cellsPerHour!.displayValue).toBe('100')
    })
  })

  describe('modules section', () => {
    it('calculates upgrade shards breakdown with computed total', () => {
      const run = createMockRun({
        armorShards: 50,
        coreShards: 100,
        cannonShards: 50,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const upgradeShards = result.current.modules.upgradeShards

      expect(upgradeShards).not.toBeNull()
      expect(upgradeShards!.total).toBe(200) // Sum of all upgrade shards
      expect(upgradeShards!.items).toHaveLength(3)
    })

    it('calculates modules breakdown with computed total', () => {
      const run = createMockRun({
        commonModules: 15,
        rareModules: 5,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const modules = result.current.modules.modules

      expect(modules).not.toBeNull()
      expect(modules!.total).toBe(20)
      expect(modules!.items[0].percentage).toBe(75) // common
      expect(modules!.items[1].percentage).toBe(25) // rare
    })
  })

  describe('uncategorized fields', () => {
    it('captures fields not in any section', () => {
      const run = createMockRun({
        tier: 11,
        unknownNewField: 500,
        anotherNewField: 300,
      })

      const { result } = renderHook(() => useRunDetailsData(run))
      const uncategorized = result.current.uncategorized

      expect(uncategorized.items.some(i => i.fieldName === 'unknownNewField')).toBe(true)
      expect(uncategorized.items.some(i => i.fieldName === 'anotherNewField')).toBe(true)
    })

    it('excludes internal fields from uncategorized', () => {
      const run = createMockRun({
        tier: 11,
      })
      // Add internal field
      run.fields['_notes'] = {
        value: 'test notes',
        rawValue: 'test notes',
        displayValue: 'test notes',
        originalKey: '_notes',
        dataType: 'string',
      }

      const { result } = renderHook(() => useRunDetailsData(run))
      const uncategorized = result.current.uncategorized

      expect(uncategorized.items.some(i => i.fieldName === '_notes')).toBe(false)
    })

    it('returns empty uncategorized when all fields are known', () => {
      const run = createMockRun({
        tier: 11,
        wave: 1000,
        gameTime: 3600,
        realTime: 3700,
      })

      const { result } = renderHook(() => useRunDetailsData(run))

      // Should have 0 uncategorized since all fields are in BATTLE_REPORT_ESSENTIAL
      expect(result.current.uncategorized.items).toHaveLength(0)
    })
  })

  describe('null handling', () => {
    it('returns null for sections with no data', () => {
      const run = createMockRun({
        tier: 11,
        wave: 1000,
      })

      const { result } = renderHook(() => useRunDetailsData(run))

      // These should be null because no source fields exist
      expect(result.current.combat.damageDealt).toBeNull()
      expect(result.current.combat.enemiesDestroyed).toBeNull()
      expect(result.current.economic.coinsEarned).toBeNull()
    })
  })

  describe('memoization', () => {
    it('returns same reference for unchanged run', () => {
      const run = createMockRun({ tier: 11 })

      const { result, rerender } = renderHook(() => useRunDetailsData(run))
      const firstResult = result.current

      rerender()

      expect(result.current).toBe(firstResult)
    })
  })
})
