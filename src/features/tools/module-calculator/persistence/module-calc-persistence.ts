/**
 * Module Calculator Persistence
 *
 * Handles localStorage persistence for module calculator selections,
 * storing state separately for each module type (cannon, armor, generator, core).
 */

import type { ModuleType, Rarity } from '@/shared/domain/module-data'
import type { EffectSelection, ConfidenceLevel } from '../types'
import { DEFAULT_CONFIDENCE_LEVEL } from '../results/confidence-level-logic'
import { ROLLABLE_MODULE_RARITIES } from '../configuration/module-config-logic'

const STORAGE_KEY = 'tower-tracking-module-calc-state'

/**
 * Serializable format for effect selections (Map doesn't serialize to JSON)
 */
interface SerializedEffectSelection {
  effectId: string
  minRarity: Rarity | null
  targetSlots: number[]
  isBanned: boolean
  isLocked: boolean
  lockedRarity: Rarity | null
}

/**
 * State stored for a single module type
 */
export interface ModuleTypeState {
  moduleLevel: number
  moduleRarity: Rarity
  selections: SerializedEffectSelection[]
  confidenceLevel: ConfidenceLevel
}

/**
 * Root state persisted to localStorage - stores state per module type
 */
export interface StoredModuleCalcState {
  /** Which module type is currently active */
  activeModuleType: ModuleType
  /** State for each module type (keyed by module type) */
  modules: Partial<Record<ModuleType, ModuleTypeState>>
  lastUpdated: number
}

/**
 * Flattened state for a specific module type (used by hooks)
 */
export interface FlatModuleCalcState {
  moduleType: ModuleType
  moduleLevel: number
  moduleRarity: Rarity
  selections: SerializedEffectSelection[]
  confidenceLevel: ConfidenceLevel
  lastUpdated: number
}

/**
 * Default state for a single module type
 */
function getDefaultModuleTypeState(): ModuleTypeState {
  return {
    moduleLevel: 141,
    moduleRarity: 'ancestral',
    selections: [],
    confidenceLevel: DEFAULT_CONFIDENCE_LEVEL
  }
}

/**
 * Default root state when nothing is stored or validation fails
 */
export function getDefaultStoredState(): StoredModuleCalcState {
  return {
    activeModuleType: 'cannon',
    modules: {},
    lastUpdated: Date.now()
  }
}

/**
 * Get default flattened state for a specific module type
 */
export function getDefaultFlatState(moduleType: ModuleType = 'cannon'): FlatModuleCalcState {
  const typeState = getDefaultModuleTypeState()
  return {
    moduleType,
    moduleLevel: typeState.moduleLevel,
    moduleRarity: typeState.moduleRarity,
    selections: typeState.selections,
    confidenceLevel: typeState.confidenceLevel,
    lastUpdated: Date.now()
  }
}

/**
 * Valid module types for validation
 */
const VALID_MODULE_TYPES: ModuleType[] = ['cannon', 'armor', 'generator', 'core']

/**
 * Valid rarities for validation
 */
const VALID_RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic', 'ancestral']

/**
 * Valid confidence levels for validation
 */
const VALID_CONFIDENCE_LEVELS: ConfidenceLevel[] = ['low', 'medium', 'high']

/**
 * Type guard for module type
 */
function isValidModuleType(value: unknown): value is ModuleType {
  return typeof value === 'string' && VALID_MODULE_TYPES.includes(value as ModuleType)
}

/**
 * Type guard for rarity
 */
function isValidRarity(value: unknown): value is Rarity {
  return typeof value === 'string' && VALID_RARITIES.includes(value as Rarity)
}

/**
 * Type guard for rollable rarity (excludes common/uncommon)
 */
function isValidRollableRarity(value: unknown): value is Rarity {
  return isValidRarity(value) && ROLLABLE_MODULE_RARITIES.includes(value as Rarity)
}

/**
 * Type guard for confidence level
 */
function isValidConfidenceLevel(value: unknown): value is ConfidenceLevel {
  return typeof value === 'string' && VALID_CONFIDENCE_LEVELS.includes(value as ConfidenceLevel)
}

/**
 * Validate optional rarity field (allows null)
 */
function isValidOptionalRarity(value: unknown): boolean {
  return value === null || isValidRarity(value)
}

/**
 * Validate target slots array
 */
function isValidTargetSlots(value: unknown): boolean {
  return Array.isArray(value) && value.every((s) => typeof s === 'number')
}

/**
 * Type guard for effect selection
 */
function isValidEffectSelection(value: unknown): value is SerializedEffectSelection {
  if (!value || typeof value !== 'object') return false

  const sel = value as Record<string, unknown>
  return (
    typeof sel.effectId === 'string' &&
    isValidOptionalRarity(sel.minRarity) &&
    isValidTargetSlots(sel.targetSlots) &&
    typeof sel.isBanned === 'boolean' &&
    typeof sel.isLocked === 'boolean' &&
    isValidOptionalRarity(sel.lockedRarity)
  )
}

/**
 * Validate module level is within valid range
 */
function isValidModuleLevel(value: unknown): value is number {
  return typeof value === 'number' && value >= 1 && value <= 200
}

/**
 * Validate a single module type's state
 */
function validateModuleTypeState(data: unknown): ModuleTypeState {
  const defaults = getDefaultModuleTypeState()

  if (!data || typeof data !== 'object') {
    return defaults
  }

  const stored = data as Record<string, unknown>

  return {
    moduleLevel: isValidModuleLevel(stored.moduleLevel) ? stored.moduleLevel : defaults.moduleLevel,
    moduleRarity: isValidRollableRarity(stored.moduleRarity)
      ? stored.moduleRarity
      : defaults.moduleRarity,
    selections: Array.isArray(stored.selections)
      ? stored.selections.filter(isValidEffectSelection)
      : defaults.selections,
    confidenceLevel: isValidConfidenceLevel(stored.confidenceLevel)
      ? stored.confidenceLevel
      : defaults.confidenceLevel
  }
}

/**
 * Validate the modules object (state per module type)
 */
function validateModulesObject(data: unknown): Partial<Record<ModuleType, ModuleTypeState>> {
  if (!data || typeof data !== 'object') {
    return {}
  }

  const result: Partial<Record<ModuleType, ModuleTypeState>> = {}
  const stored = data as Record<string, unknown>

  for (const moduleType of VALID_MODULE_TYPES) {
    if (moduleType in stored) {
      result[moduleType] = validateModuleTypeState(stored[moduleType])
    }
  }

  return result
}

/**
 * Validate stored state and return defaults for invalid fields
 */
function validateStoredState(data: unknown): StoredModuleCalcState {
  const defaults = getDefaultStoredState()

  if (!data || typeof data !== 'object') {
    return defaults
  }

  const stored = data as Record<string, unknown>

  return {
    activeModuleType: isValidModuleType(stored.activeModuleType)
      ? stored.activeModuleType
      : defaults.activeModuleType,
    modules: validateModulesObject(stored.modules),
    lastUpdated: typeof stored.lastUpdated === 'number' ? stored.lastUpdated : Date.now()
  }
}

/**
 * Load the full module calculator state from localStorage
 * Returns default state if none exists or if parsing/validation fails
 */
export function loadModuleCalcStateRaw(): StoredModuleCalcState {
  if (typeof window === 'undefined') {
    return getDefaultStoredState()
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return getDefaultStoredState()
    }

    const parsed = JSON.parse(stored)
    return validateStoredState(parsed)
  } catch (error) {
    console.warn('Failed to load module calculator state from localStorage:', error)
    return getDefaultStoredState()
  }
}

/**
 * Load state for a specific module type (flattened format for hooks)
 * Falls back to defaults if no state exists for that module type
 */
export function loadModuleCalcState(moduleType?: ModuleType): FlatModuleCalcState {
  const rootState = loadModuleCalcStateRaw()
  const targetType = moduleType ?? rootState.activeModuleType
  const typeState = rootState.modules[targetType] ?? getDefaultModuleTypeState()

  return {
    moduleType: targetType,
    moduleLevel: typeState.moduleLevel,
    moduleRarity: typeState.moduleRarity,
    selections: typeState.selections,
    confidenceLevel: typeState.confidenceLevel,
    lastUpdated: rootState.lastUpdated
  }
}

/**
 * Save state for a specific module type to localStorage
 * Preserves state for other module types
 */
export function saveModuleCalcState(state: FlatModuleCalcState): void {
  if (typeof window === 'undefined') return

  try {
    // Load existing state to preserve other module types
    const existingState = loadModuleCalcStateRaw()

    // Update the state for this specific module type
    const updatedModules: Partial<Record<ModuleType, ModuleTypeState>> = {
      ...existingState.modules,
      [state.moduleType]: {
        moduleLevel: state.moduleLevel,
        moduleRarity: state.moduleRarity,
        selections: state.selections,
        confidenceLevel: state.confidenceLevel
      }
    }

    const updated: StoredModuleCalcState = {
      activeModuleType: state.moduleType,
      modules: updatedModules,
      lastUpdated: Date.now()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save module calculator state to localStorage:', error)
  }
}

/**
 * Convert selections Map to serializable array
 */
export function serializeSelections(selections: Map<string, EffectSelection>): SerializedEffectSelection[] {
  return Array.from(selections.values()).filter(
    // Only persist selections that have meaningful data
    (sel) =>
      sel.minRarity !== null ||
      sel.targetSlots.length > 0 ||
      sel.isBanned ||
      sel.isLocked
  )
}

/**
 * Convert serialized selections array back to Map
 */
export function deserializeSelections(serialized: SerializedEffectSelection[]): Map<string, EffectSelection> {
  const map = new Map<string, EffectSelection>()
  for (const sel of serialized) {
    map.set(sel.effectId, sel)
  }
  return map
}

/**
 * Clear module calculator state from localStorage
 */
export function clearModuleCalcState(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear module calculator state from localStorage:', error)
  }
}
