/**
 * Damage Source Field Definitions
 *
 * All damage source fields with their display names and colors.
 *
 * Field names are V3 canonical (`<sectionCamel>_<labelCamel>`) — see
 * src/shared/domain/migrations/v2-to-v3-field-map.ts.
 */

import type { FieldConfig } from './types';

export const DAMAGE_FIELDS: FieldConfig[] = [
  { fieldName: 'damage_deathWave', displayName: 'Death Wave', color: '#ef4444' },
  { fieldName: 'damage_chainLightning', displayName: 'Chain Lightning', color: '#3b82f6' },
  { fieldName: 'damage_thorns', displayName: 'Thorns', color: '#22d3ee' },
  { fieldName: 'damage_orbs', displayName: 'Orbs', color: '#f87171' },
  { fieldName: 'damage_flameBot', displayName: 'Flame Bot', color: '#fbbf24' },
  { fieldName: 'damage_landMines', displayName: 'Land Mines', color: '#9333ea' },
  { fieldName: 'damage_deathRay', displayName: 'Death Ray', color: '#ff5722' },
  { fieldName: 'damage_smartMissiles', displayName: 'Smart Missiles', color: '#64748b' },
  { fieldName: 'damage_innerLandMines', displayName: 'Inner Land Mines', color: '#7c3aed' },
  { fieldName: 'damage_poisonSwamp', displayName: 'Poison Swamp', color: '#22c55e' },
  { fieldName: 'damage_blackHole', displayName: 'Black Hole', color: '#475569' },
  { fieldName: 'damage_electrons', displayName: 'Electrons', color: '#06b6d4' },
  { fieldName: 'damage_projectiles', displayName: 'Projectiles', color: '#f59e0b' },
  { fieldName: 'damage_rendArmor', displayName: 'Rend Armor', color: '#dc2626' },
  { fieldName: 'damage_attackChip', displayName: 'Attack Chip', color: '#d946ef' },
  { fieldName: 'healthRegenerated_lifesteal', displayName: 'Lifesteal', color: '#f43f5e' },
];
