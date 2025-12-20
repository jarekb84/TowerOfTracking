/**
 * Rarity Configuration
 *
 * Defines all rarity tiers with their probabilities, colors, and display properties.
 * Probabilities are based on in-game data: Common 46.2%, Rare 40%, Epic 10%,
 * Legendary 2.5%, Mythic 1%, Ancestral 0.3%.
 */

import type { Rarity, RarityConfig } from '../types';

/**
 * All rarity configurations ordered from common to ancestral
 */
const RARITY_CONFIGS: RarityConfig[] = [
  {
    id: 'common',
    displayName: 'Common',
    shortName: 'C',
    probability: 0.462,
    color: '#9ca3af', // Gray
    sortOrder: 0,
  },
  {
    id: 'rare',
    displayName: 'Rare',
    shortName: 'R',
    probability: 0.4,
    color: '#3b82f6', // Blue
    sortOrder: 1,
  },
  {
    id: 'epic',
    displayName: 'Epic',
    shortName: 'E',
    probability: 0.1,
    color: '#a855f7', // Purple
    sortOrder: 2,
  },
  {
    id: 'legendary',
    displayName: 'Legendary',
    shortName: 'L',
    probability: 0.025,
    color: '#f97316', // Orange
    sortOrder: 3,
  },
  {
    id: 'mythic',
    displayName: 'Mythic',
    shortName: 'M',
    probability: 0.01,
    color: '#ef4444', // Red
    sortOrder: 4,
  },
  {
    id: 'ancestral',
    displayName: 'Ancestral',
    shortName: 'A',
    probability: 0.003,
    color: '#64D462', // Green
    sortOrder: 5,
  },
];

/**
 * Lookup map for quick access by rarity ID
 */
export const RARITY_CONFIG_MAP: Record<Rarity, RarityConfig> = Object.fromEntries(
  RARITY_CONFIGS.map((config) => [config.id, config])
) as Record<Rarity, RarityConfig>;

/**
 * Ordered list of all rarity IDs from common to ancestral
 */
export const RARITY_ORDER: Rarity[] = RARITY_CONFIGS.map((c) => c.id);


/**
 * Get probability for a specific rarity
 */
export function getRarityProbability(rarity: Rarity): number {
  return RARITY_CONFIG_MAP[rarity].probability;
}

/**
 * Get display color for a specific rarity
 */
export function getRarityColor(rarity: Rarity): string {
  return RARITY_CONFIG_MAP[rarity].color;
}
