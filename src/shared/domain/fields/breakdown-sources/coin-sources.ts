/**
 * Coin Source Field Definitions
 *
 * All coin source fields with their display names, colors, and aliases.
 * Merged from both Run Details and Source Analysis configurations.
 *
 * Note: Cash (cashFromGoldenTower) is a completely separate currency and
 * is NOT included here. This is strictly coin-related income sources.
 */

import type { FieldConfig } from './types';

/**
 * All coin source fields
 *
 * These are the individual sources that contribute to the total coins earned.
 * Used by both Run Details (breakdown bars) and Source Analysis (charts).
 *
 * Aliases are only used for true data variations (e.g., casing differences),
 * NOT for different fields that happen to have similar names.
 */
export const COIN_FIELDS: FieldConfig[] = [
  { fieldName: 'coinsFromDeathWave', displayName: 'Death Wave', color: '#ef4444' },
  { fieldName: 'coinsFromGoldenTower', displayName: 'Golden Tower', color: '#fbbf24' },
  { fieldName: 'coinsFromSpotlight', displayName: 'Spotlight', color: '#e2e8f0' },
  { fieldName: 'goldenBotCoinsEarned', displayName: 'Golden Bot', color: '#fbbf24' },
  { fieldName: 'guardianCoinsStolen', displayName: 'Guardian Stolen', color: '#a855f7' },
  { fieldName: 'coinsStolen', displayName: 'Coins Stolen', color: '#8b5cf6' },
  { fieldName: 'coinsFetched', displayName: 'Guardian Fetched', color: '#7c3aed' },
  {
    fieldName: 'coinsFromBlackHole',
    displayName: 'Black Hole',
    color: '#475569',
    aliases: ['coinsFromBlackhole'], // Casing variation in some data exports
  },
  { fieldName: 'coinsFromCoinUpgrade', displayName: 'Coin Upgrade', color: '#f59e0b' },
  { fieldName: 'coinsFromCoinBonuses', displayName: 'Coin Bonuses', color: '#fb923c' },
  {
    fieldName: 'coinsFromOrb',
    displayName: 'Orbs',
    color: '#fda4af',
    aliases: ['coinsFromOrbs'], // Singular/plural variation
  },
];
