import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadModuleCalcState,
  loadModuleCalcStateRaw,
  saveModuleCalcState,
  clearModuleCalcState,
  getDefaultStoredState,
  getDefaultFlatState,
  serializeSelections,
  deserializeSelections,
  type StoredModuleCalcState,
  type FlatModuleCalcState,
  type ModuleTypeState
} from './module-calc-persistence'
import type { EffectSelection } from '../types'

describe('module-calc-persistence', () => {
  const STORAGE_KEY = 'tower-tracking-module-calc-state'

  const createSelection = (id: string, overrides: Partial<EffectSelection> = {}): EffectSelection => ({
    effectId: id, minRarity: null, targetSlots: [], isBanned: false, isLocked: false, lockedRarity: null, ...overrides
  })

  const createFlatState = (overrides: Partial<FlatModuleCalcState> = {}): FlatModuleCalcState => ({
    moduleType: 'cannon', moduleLevel: 141, moduleRarity: 'ancestral', selections: [],
    confidenceLevel: 'medium', lastUpdated: Date.now(), ...overrides
  })

  const createModuleTypeState = (overrides: Partial<ModuleTypeState> = {}): ModuleTypeState => ({
    moduleLevel: 141, moduleRarity: 'ancestral', selections: [], confidenceLevel: 'medium', ...overrides
  })

  const createStoredState = (overrides: Partial<StoredModuleCalcState> = {}): StoredModuleCalcState => ({
    activeModuleType: 'cannon', modules: {}, lastUpdated: Date.now(), ...overrides
  })

  beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })
  afterEach(() => { localStorage.clear() })

  describe('getDefaultStoredState / getDefaultFlatState', () => {
    it('returns expected default structures', () => {
      expect(getDefaultStoredState()).toMatchObject({ activeModuleType: 'cannon', modules: {} })
      expect(getDefaultFlatState()).toMatchObject({
        moduleType: 'cannon', moduleLevel: 141, moduleRarity: 'ancestral', selections: [], confidenceLevel: 'medium'
      })
      expect(getDefaultFlatState('generator').moduleType).toBe('generator')
    })
  })

  describe('loadModuleCalcState', () => {
    it('returns defaults when localStorage is empty', () => {
      expect(loadModuleCalcState()).toMatchObject({ moduleType: 'cannon', selections: [] })
    })

    it('loads state for active module type', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createStoredState({
        activeModuleType: 'armor',
        modules: { armor: createModuleTypeState({ moduleLevel: 120, selections: [createSelection('e1', { minRarity: 'epic' })] }) }
      })))
      const loaded = loadModuleCalcState()
      expect(loaded.moduleType).toBe('armor')
      expect(loaded.moduleLevel).toBe(120)
      expect(loaded.selections).toHaveLength(1)
    })

    it('loads state for specific module type when requested', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createStoredState({
        modules: { cannon: createModuleTypeState({ moduleLevel: 100 }), generator: createModuleTypeState({ moduleLevel: 150 }) }
      })))
      expect(loadModuleCalcState('generator').moduleLevel).toBe(150)
    })

    it('returns defaults when module type has no stored state', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createStoredState({ modules: { cannon: createModuleTypeState() } })))
      expect(loadModuleCalcState('generator').moduleLevel).toBe(141)
    })

    it('returns defaults for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid{')
      expect(loadModuleCalcState().moduleType).toBe('cannon')
    })

    it('filters invalid selections and validates field values', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createStoredState({
        modules: { cannon: createModuleTypeState({
          moduleLevel: 999, moduleRarity: 'common' as 'ancestral', confidenceLevel: 'ultra' as 'medium',
          selections: [createSelection('valid', { minRarity: 'epic' }), { effectId: 'bad' } as EffectSelection]
        }) }
      })))
      const loaded = loadModuleCalcState()
      expect(loaded.moduleLevel).toBe(141)
      expect(loaded.moduleRarity).toBe('ancestral')
      expect(loaded.confidenceLevel).toBe('medium')
      expect(loaded.selections).toHaveLength(1)
      expect(loaded.selections[0].effectId).toBe('valid')
    })

    it('accepts locked and banned effects', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createStoredState({
        modules: { cannon: createModuleTypeState({
          selections: [createSelection('locked', { isLocked: true, lockedRarity: 'legendary' }), createSelection('banned', { isBanned: true })]
        }) }
      })))
      const loaded = loadModuleCalcState()
      expect(loaded.selections[0].isLocked).toBe(true)
      expect(loaded.selections[1].isBanned).toBe(true)
    })
  })

  describe('loadModuleCalcStateRaw', () => {
    it('returns the full stored structure', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createStoredState({
        activeModuleType: 'generator', modules: { cannon: createModuleTypeState(), generator: createModuleTypeState() }
      })))
      const raw = loadModuleCalcStateRaw()
      expect(raw.activeModuleType).toBe('generator')
      expect(Object.keys(raw.modules)).toEqual(['cannon', 'generator'])
    })
  })

  describe('saveModuleCalcState', () => {
    it('saves state for specific module type and updates activeModuleType', () => {
      saveModuleCalcState(createFlatState({ moduleType: 'generator', moduleLevel: 180 }))
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as StoredModuleCalcState
      expect(parsed.activeModuleType).toBe('generator')
      expect(parsed.modules.generator?.moduleLevel).toBe(180)
    })

    it('preserves state for other module types', () => {
      saveModuleCalcState(createFlatState({ moduleType: 'cannon', moduleLevel: 100 }))
      saveModuleCalcState(createFlatState({ moduleType: 'generator', moduleLevel: 150 }))
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as StoredModuleCalcState
      expect(parsed.modules.cannon?.moduleLevel).toBe(100)
      expect(parsed.modules.generator?.moduleLevel).toBe(150)
    })

    it('handles localStorage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => saveModuleCalcState(createFlatState())).not.toThrow()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('clearModuleCalcState', () => {
    it('removes state and handles errors', () => {
      saveModuleCalcState(createFlatState())
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
      clearModuleCalcState()
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('err') })
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => clearModuleCalcState()).not.toThrow()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('serializeSelections / deserializeSelections', () => {
    it('converts between Map and array, filtering empty selections', () => {
      const map = new Map([
        ['target', createSelection('target', { minRarity: 'epic' })],
        ['empty', createSelection('empty')],
        ['banned', createSelection('banned', { isBanned: true })]
      ])
      const serialized = serializeSelections(map)
      expect(serialized).toHaveLength(2)
      expect(serialized.map(s => s.effectId).sort()).toEqual(['banned', 'target'])

      const deserialized = deserializeSelections(serialized)
      expect(deserialized.size).toBe(2)
      expect(deserialized.get('target')?.minRarity).toBe('epic')
    })

    it('handles empty inputs', () => {
      expect(serializeSelections(new Map())).toEqual([])
      expect(deserializeSelections([]).size).toBe(0)
    })
  })

  describe('roundtrip persistence', () => {
    it('preserves complex state and multiple module types', () => {
      const cannon = createFlatState({ moduleType: 'cannon', moduleLevel: 100, selections: [createSelection('c1', { isBanned: true })] })
      const generator = createFlatState({ moduleType: 'generator', moduleLevel: 150, moduleRarity: 'legendary', confidenceLevel: 'high',
        selections: [createSelection('g1', { isLocked: true, lockedRarity: 'epic' })] })

      saveModuleCalcState(cannon)
      saveModuleCalcState(generator)

      const loadedCannon = loadModuleCalcState('cannon')
      const loadedGenerator = loadModuleCalcState('generator')

      expect(loadedCannon.moduleLevel).toBe(100)
      expect(loadedCannon.selections[0].effectId).toBe('c1')
      expect(loadedGenerator.moduleLevel).toBe(150)
      expect(loadedGenerator.moduleRarity).toBe('legendary')
      expect(loadedGenerator.confidenceLevel).toBe('high')
      expect(loadedGenerator.selections[0].effectId).toBe('g1')
    })

    it.each([
      ['module types', ['cannon', 'armor', 'generator', 'core']],
      ['rarities', ['rare', 'epic', 'legendary', 'ancestral']],
      ['confidence', ['low', 'medium', 'high']]
    ] as const)('preserves all %s', (_, values) => {
      for (const v of values) {
        const key = _ === 'module types' ? 'moduleType' : _ === 'rarities' ? 'moduleRarity' : 'confidenceLevel'
        const state = createFlatState({ [key]: v })
        saveModuleCalcState(state)
        expect(loadModuleCalcState(state.moduleType)[key]).toBe(v)
      }
    })
  })
})
