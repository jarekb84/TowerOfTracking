/**
 * Damage Source Field Definitions
 *
 * All damage source fields with their display names and colors.
 * Order matches the Run Details display order.
 */

import type { FieldConfig } from './types';

/**
 * All damage source fields
 *
 * These are the individual sources that contribute to the total damage dealt.
 * Used by both Run Details (breakdown bars) and Source Analysis (charts).
 */
export const DAMAGE_FIELDS: FieldConfig[] = [
  { fieldName: 'deathWaveDamage', displayName: 'Death Wave', color: '#ef4444' },
  { fieldName: 'chainLightningDamage', displayName: 'Chain Lightning', color: '#3b82f6' },
  { fieldName: 'thornDamage', displayName: 'Thorn', color: '#22d3ee' },
  { fieldName: 'orbDamage', displayName: 'Orb', color: '#f87171' },
  { fieldName: 'flameBotDamage', displayName: 'Flame Bot Damage', color: '#fbbf24' },
  { fieldName: 'damage', displayName: 'Guardian Damage', color: '#a855f7' },
  { fieldName: 'landMineDamage', displayName: 'Land Mine', color: '#9333ea' },
  { fieldName: 'deathRayDamage', displayName: 'Death Ray', color: '#ff5722' },
  { fieldName: 'smartMissileDamage', displayName: 'Smart Missile', color: '#64748b' },
  { fieldName: 'innerLandMineDamage', displayName: 'Inner Land Mine', color: '#7c3aed' },
  { fieldName: 'swampDamage', displayName: 'Swamp', color: '#22c55e' },
  { fieldName: 'blackHoleDamage', displayName: 'Black Hole', color: '#475569' },
  { fieldName: 'electronsDamage', displayName: 'Electrons', color: '#06b6d4' },
  { fieldName: 'projectilesDamage', displayName: 'Projectiles', color: '#f59e0b' },
  { fieldName: 'rendArmorDamage', displayName: 'Rend Armor', color: '#dc2626' },
  { fieldName: 'lifesteal', displayName: 'Lifesteal', color: '#f43f5e' },
];
