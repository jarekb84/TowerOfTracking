/**
 * Core Sub-Effects (Ultimate Weapons)
 *
 * 27 sub-effects for the Core module, focused on special abilities.
 * Split into base abilities and weapon abilities for file size management.
 * Data sourced from docs/subeffects.md.
 */

import type { SubEffectConfig } from '../types';
import { CORE_WEAPON_SUB_EFFECTS } from './core-sub-effects-weapons';

/**
 * Base core abilities: Golden Tower, Black Hole, Spotlight, Chrono Field
 */
const CORE_BASE_SUB_EFFECTS: SubEffectConfig[] = [
  {
    id: 'goldenTowerBonus',
    displayName: 'Golden Tower - Bonus',
    moduleType: 'core',
    unit: 'x',
    values: {
      common: null,
      rare: null,
      epic: 1,
      legendary: 2,
      mythic: 3,
      ancestral: 4,
    },
  },
  {
    id: 'goldenTowerDuration',
    displayName: 'Golden Tower - Duration',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: 2,
      mythic: 4,
      ancestral: 7,
    },
  },
  {
    id: 'goldenTowerCooldown',
    displayName: 'Golden Tower - Cooldown',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: -5,
      mythic: -8,
      ancestral: -12,
    },
  },
  {
    id: 'blackHoleSize',
    displayName: 'Black Hole - Size',
    moduleType: 'core',
    unit: 'm',
    values: {
      common: 2,
      rare: 4,
      epic: 6,
      legendary: 8,
      mythic: 10,
      ancestral: 12,
    },
  },
  {
    id: 'blackHoleDuration',
    displayName: 'Black Hole - Duration',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: 2,
      mythic: 3,
      ancestral: 4,
    },
  },
  {
    id: 'blackHoleCooldown',
    displayName: 'Black Hole - Cooldown',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: -2,
      mythic: -3,
      ancestral: -4,
    },
  },
  {
    id: 'spotlightBonus',
    displayName: 'Spotlight - Bonus',
    moduleType: 'core',
    unit: 'x',
    values: {
      common: 1.2,
      rare: 2.5,
      epic: 3.5,
      legendary: 10,
      mythic: 15,
      ancestral: 20,
    },
  },
  {
    id: 'spotlightAngle',
    displayName: 'Spotlight - Angle',
    moduleType: 'core',
    unit:'°',
    values: {
      common: null,
      rare: null,
      epic: 3,
      legendary: 6,
      mythic: 11,
      ancestral: 15,
    },
  },
  {
    id: 'chronoFieldDuration',
    displayName: 'Chrono Field - Duration',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: 4,
      mythic: 7,
      ancestral: 10,
    },
  },
  {
    id: 'chronoFieldSpeedReduction',
    displayName: 'Chrono Field - Speed Reduction',
    moduleType: 'core',
    unit: '%',
    values: {
      common: null,
      rare: null,
      epic: 3,
      legendary: 8,
      mythic: 11,
      ancestral: 15,
    },
  },
  {
    id: 'chronoFieldCooldown',
    displayName: 'Chrono Field - Cooldown',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: -4,
      mythic: -7,
      ancestral: -10,
    },
  },
];

/**
 * All Core sub-effects combined
 */
export const CORE_SUB_EFFECTS: SubEffectConfig[] = [
  ...CORE_BASE_SUB_EFFECTS,
  ...CORE_WEAPON_SUB_EFFECTS,
];
