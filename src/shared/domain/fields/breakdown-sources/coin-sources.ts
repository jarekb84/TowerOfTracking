/**
 * Coin Source Field Definitions
 *
 * All coin source fields with their display names, colors, and aliases.
 * Merged from both Run Details and Source Analysis configurations.
 *
 * Field names are V3 canonical (`<sectionCamel>_<labelCamel>`) — see the
 * `RENAMED_FROM` edges in
 * `src/shared/domain/field-graph/catalog/edges/renames/renames.edges.ts`.
 *
 * Note: Cash income sources (`cash_*`) are a separate currency and are
 * NOT included here. This is strictly coin-related income.
 */

import type { FieldConfig } from './types';

export const COIN_FIELDS: FieldConfig[] = [
  { fieldName: 'coins_deathWave', displayName: 'Death Wave', color: '#ef4444' },
  { fieldName: 'coins_goldenTower', displayName: 'Golden Tower', color: '#fbbf24' },
  { fieldName: 'coins_spotlight', displayName: 'Spotlight', color: '#e2e8f0' },
  { fieldName: 'coins_goldenBot', displayName: 'Golden Bot', color: '#fbbf24' },
  { fieldName: 'coins_coinsFetched', displayName: 'Guardian Fetched', color: '#7c3aed' },
  { fieldName: 'coins_blackHole', displayName: 'Black Hole', color: '#475569' },
  { fieldName: 'coins_coinBonusUpgrade', displayName: 'Coin Bonus Upgrade', color: '#f59e0b' },
  { fieldName: 'coins_coinsFromCoinBonuses', displayName: 'Coin Bonuses', color: '#fb923c' },
  { fieldName: 'coins_orbs', displayName: 'Orbs', color: '#fda4af' },
  { fieldName: 'coins_goldenCombo', displayName: 'Golden Combo', color: '#eab308' },
  { fieldName: 'coins_bountyCoins', displayName: 'Bounty Coins', color: '#facc15' },
  { fieldName: 'coins_criticalCoin', displayName: 'Critical Coin', color: '#f97316' },
  { fieldName: 'coins_waveSkip', displayName: 'Wave Skip', color: '#84cc16' },
  { fieldName: 'coins_coinsWave', displayName: 'Coins / Wave', color: '#a3e635' },
];
