/**
 * Sub-Effect Data
 *
 * Consolidated access to all sub-effects across all module types.
 * Provides lookup maps and utilities for accessing effect configurations.
 */

import type { ModuleType, SubEffectConfig } from '../types';
import { CANNON_SUB_EFFECTS } from './cannon-sub-effects';
import { ARMOR_SUB_EFFECTS } from './armor-sub-effects';
import { GENERATOR_SUB_EFFECTS } from './generator-sub-effects';
import { CORE_SUB_EFFECTS } from './core-sub-effects';

/**
 * All sub-effects by module type
 */
const SUB_EFFECTS_BY_MODULE: Record<ModuleType, SubEffectConfig[]> = {
  cannon: CANNON_SUB_EFFECTS,
  armor: ARMOR_SUB_EFFECTS,
  generator: GENERATOR_SUB_EFFECTS,
  core: CORE_SUB_EFFECTS,
};

/**
 * All sub-effects as a flat array
 */
const ALL_SUB_EFFECTS: SubEffectConfig[] = [
  ...CANNON_SUB_EFFECTS,
  ...ARMOR_SUB_EFFECTS,
  ...GENERATOR_SUB_EFFECTS,
  ...CORE_SUB_EFFECTS,
];

/**
 * Lookup map for sub-effects by ID
 */
const SUB_EFFECT_MAP: Record<string, SubEffectConfig> = Object.fromEntries(
  ALL_SUB_EFFECTS.map((effect) => [effect.id, effect])
);

/**
 * Get all sub-effects for a specific module type
 */
export function getSubEffectsForModule(moduleType: ModuleType): SubEffectConfig[] {
  return SUB_EFFECTS_BY_MODULE[moduleType];
}

/**
 * Get a specific sub-effect by ID
 */
export function getSubEffectById(id: string): SubEffectConfig | undefined {
  return SUB_EFFECT_MAP[id];
}

