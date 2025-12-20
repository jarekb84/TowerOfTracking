/**
 * Core Sub-Effects - Ultimate Weapon Abilities
 *
 * Sub-effects for damage-dealing ultimate weapon abilities.
 * Separated from base core effects for file size management.
 * Data sourced from docs/subeffects.md.
 */

import type { SubEffectConfig } from '../types';

/**
 * Death Wave, Smart Missiles, Inner Land Mines, Poison Swamp, Chain Lightning
 */
export const CORE_WEAPON_SUB_EFFECTS: SubEffectConfig[] = [
  {
    id: 'deathWaveDamage',
    displayName: 'Death Wave - Damage',
    moduleType: 'core',
    unit: 'x',
    values: {
      common: 8,
      rare: 15,
      epic: 25,
      legendary: 50,
      mythic: 100,
      ancestral: 250,
    },
  },
  {
    id: 'deathWaveQuantity',
    displayName: 'Death Wave - Quantity',
    moduleType: 'core',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: 1,
      mythic: 2,
      ancestral: 3,
    },
  },
  {
    id: 'deathWaveCooldown',
    displayName: 'Death Wave - Cooldown',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: -6,
      mythic: -10,
      ancestral: -13,
    },
  },
  {
    id: 'smartMissilesDamage',
    displayName: 'Smart Missiles - Damage',
    moduleType: 'core',
    unit: 'x',
    values: {
      common: 8,
      rare: 15,
      epic: 25,
      legendary: 50,
      mythic: 100,
      ancestral: 250,
    },
  },
  {
    id: 'smartMissilesQuantity',
    displayName: 'Smart Missiles - Quantity',
    moduleType: 'core',
    values: {
      common: null,
      rare: null,
      epic: 1,
      legendary: 2,
      mythic: 4,
      ancestral: 5,
    },
  },
  {
    id: 'smartMissilesCooldown',
    displayName: 'Smart Missiles - Cooldown',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: -2,
      mythic: -4,
      ancestral: -6,
    },
  },
  {
    id: 'innerLandMinesDamage',
    displayName: 'Inner Land Mines - Damage',
    moduleType: 'core',
    unit: 'x',
    values: {
      common: 8,
      rare: 15,
      epic: 25,
      legendary: 50,
      mythic: 100,
      ancestral: 250,
    },
  },
  {
    id: 'innerLandMinesQuantity',
    displayName: 'Inner Land Mines - Quantity',
    moduleType: 'core',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: 1,
      mythic: 2,
      ancestral: 3,
    },
  },
  {
    id: 'innerLandMinesCooldown',
    displayName: 'Inner Land Mines - Cooldown',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: null,
      epic: -5,
      legendary: -8,
      mythic: -10,
      ancestral: -13,
    },
  },
  {
    id: 'poisonSwampDamage',
    displayName: 'Poison Swamp - Damage',
    moduleType: 'core',
    unit: 'x',
    values: {
      common: 8,
      rare: 15,
      epic: 25,
      legendary: 50,
      mythic: 100,
      ancestral: 250,
    },
  },
  {
    id: 'poisonSwampDuration',
    displayName: 'Poison Swamp - Duration',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: null,
      epic: null,
      legendary: 2,
      mythic: 5,
      ancestral: 10,
    },
  },
  {
    id: 'poisonSwampCooldown',
    displayName: 'Poison Swamp - Cooldown',
    moduleType: 'core',
    unit: 's',
    values: {
      common: null,
      rare: -2,
      epic: -4,
      legendary: -6,
      mythic: -8,
      ancestral: -10,
    },
  },
  {
    id: 'chainLightningDamage',
    displayName: 'Chain Lightning - Damage',
    moduleType: 'core',
    unit: 'x',
    values: {
      common: 8,
      rare: 15,
      epic: 25,
      legendary: 50,
      mythic: 100,
      ancestral: 250,
    },
  },
  {
    id: 'chainLightningQuantity',
    displayName: 'Chain Lightning - Quantity',
    moduleType: 'core',
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
    id: 'chainLightningChance',
    displayName: 'Chain Lightning - Chance',
    moduleType: 'core',
    unit: '%',
    values: {
      common: 2,
      rare: 4,
      epic: 6,
      legendary: 9,
      mythic: 12,
      ancestral: 15,
    },
  },
];
