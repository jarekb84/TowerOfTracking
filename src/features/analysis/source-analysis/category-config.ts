/**
 * Category Configuration for Source Analysis
 *
 * Defines the mapping between aggregate totals and their constituent sources.
 * This configuration-based approach enables easy addition of new categories.
 */

import type { CategoryDefinition, SourceCategory } from './types';

/**
 * Color palette for source visualization
 *
 * Design principles:
 * - Vibrant but not garish: Medium saturation with good luminance
 * - Highly distinguishable: Colors span the entire hue spectrum
 * - Dark theme optimized: Colors pop against slate-800/900 backgrounds
 * - Gradient-ready: Each color has a base (solid) and can generate gradients
 *
 * The palette uses distinct hues to ensure each source is easily identifiable,
 * even when many sources are stacked together.
 */
const SOURCE_COLORS = {
  // Damage sources - Game-aligned palette (Iteration 2)
  orbDamage: '#ffe4e6', // Rose-100 - White with a hint of red
  thornDamage: '#22d3ee', // Cyan-400 - Teal-ish (Bright)
  landMineDamage: '#9333ea', // Purple-600 - Purple-ish (Deep)
  deathRayDamage: '#ff5722', // Deep Orange - Orangish Red
  chainLightningDamage: '#3b82f6', // Blue-500 - Electric Blue
  deathWaveDamage: '#ef4444', // Red-500 - Reddish (Standard)
  blackHoleDamage: '#d946ef', // Fuchsia-500 - Purple-ish (Vibrant)
  smartMissileDamage: '#14b8a6', // Teal-500 - Tech Green
  swampDamage: '#84cc16', // Lime-500 - Toxic Green
  innerLandMineDamage: '#f59e0b', // Amber-500 - Gold/Orange
  rendArmorDamage: '#f472b6', // Pink-400 - Light Pink
  projectilesDamage: '#e879f9', // Fuchsia-400 - Pink-ish (Lighter than Black Hole)
  lifesteal: '#f43f5e', // Rose-500 - Red/Pink
  flameBotDamage: '#fca5a5', // Red-300 - Light Red

  // Coin sources - Aligned with source themes where possible
  coinsFromGoldenTower: '#eab308', // Yellow-500 - Pure Gold
  coinsFromBlackHole: '#e879f9', // Fuchsia-400 - Matches Black Hole theme (Lighter)
  coinsFromSpotlight: '#facc15', // Yellow-400 - Bright Light
  coinsFromOrbs: '#fda4af', // Rose-300 - Matches Orb theme (Darker than damage for visibility)
  coinsFromCoinBonuses: '#4ade80', // Green-400 - Money Green
  coinsFromDeathWave: '#f87171', // Red-400 - Matches Death Wave theme
  goldenBotCoinsEarned: '#fbbf24', // Amber-400 - Warm Gold
  coinsFromCoinUpgrade: '#22d3ee', // Cyan-400 - Digital/Future money
  coinsFetched: '#10b981', // Emerald-500 - Guardian wealth/emerald theme
};

/**
 * Gradient definitions for enhanced visual depth
 * Each gradient goes from the base color (top) to a darker/transparent variant (bottom)
 */
export interface GradientConfig {
  id: string;
  startColor: string;
  startOpacity: number;
  endColor: string;
  endOpacity: number;
}

/**
 * Generate gradient configuration for a source color
 * Creates a vertical gradient that fades from full color to semi-transparent
 */
export function getGradientConfig(fieldName: string, color: string): GradientConfig {
  return {
    id: `gradient-${fieldName}`,
    startColor: color,
    startOpacity: 0.85, // Slightly reduced from 0.9 for less harsh top edge
    endColor: color,
    endOpacity: 0.15, // Significantly reduced from 0.4 for better fade-out
  };
}


/**
 * Damage Dealt category definition
 */
const DAMAGE_DEALT_CATEGORY: CategoryDefinition = {
  id: 'damageDealt',
  name: 'Damage Dealt',
  description: 'Breakdown of damage sources contributing to total damage dealt',
  totalField: 'damageDealt',
  sources: [
    { fieldName: 'orbDamage', displayName: 'Orb Damage', color: SOURCE_COLORS.orbDamage },
    { fieldName: 'thornDamage', displayName: 'Thorn Damage', color: SOURCE_COLORS.thornDamage },
    { fieldName: 'landMineDamage', displayName: 'Land Mine Damage', color: SOURCE_COLORS.landMineDamage },
    { fieldName: 'deathRayDamage', displayName: 'Death Ray Damage', color: SOURCE_COLORS.deathRayDamage },
    { fieldName: 'chainLightningDamage', displayName: 'Chain Lightning', color: SOURCE_COLORS.chainLightningDamage },
    { fieldName: 'deathWaveDamage', displayName: 'Death Wave Damage', color: SOURCE_COLORS.deathWaveDamage },
    { fieldName: 'blackHoleDamage', displayName: 'Black Hole Damage', color: SOURCE_COLORS.blackHoleDamage },
    { fieldName: 'smartMissileDamage', displayName: 'Smart Missile Damage', color: SOURCE_COLORS.smartMissileDamage },
    { fieldName: 'swampDamage', displayName: 'Swamp Damage', color: SOURCE_COLORS.swampDamage },
    { fieldName: 'innerLandMineDamage', displayName: 'Inner Land Mine', color: SOURCE_COLORS.innerLandMineDamage },
    { fieldName: 'rendArmorDamage', displayName: 'Rend Armor Damage', color: SOURCE_COLORS.rendArmorDamage },
    { fieldName: 'projectilesDamage', displayName: 'Projectiles Damage', color: SOURCE_COLORS.projectilesDamage },
    { fieldName: 'lifesteal', displayName: 'Lifesteal', color: SOURCE_COLORS.lifesteal },
    { fieldName: 'flameBotDamage', displayName: 'Flame Bot Damage', color: SOURCE_COLORS.flameBotDamage },
  ]
};

/**
 * Coin Income category definition
 * Handles field name variations (e.g., coinsFromBlackHole vs coinsFromBlackhole)
 */
const COIN_INCOME_CATEGORY: CategoryDefinition = {
  id: 'coinIncome',
  name: 'Coin Income',
  description: 'Breakdown of coin income sources',
  totalField: 'coinsEarned',
  sources: [
    { fieldName: 'coinsFromGoldenTower', displayName: 'Golden Tower', color: SOURCE_COLORS.coinsFromGoldenTower },
    { fieldName: 'coinsFromBlackHole', displayName: 'Black Hole', color: SOURCE_COLORS.coinsFromBlackHole },
    { fieldName: 'coinsFromSpotlight', displayName: 'Spotlight', color: SOURCE_COLORS.coinsFromSpotlight },
    { fieldName: 'coinsFromOrbs', displayName: 'Orbs', color: SOURCE_COLORS.coinsFromOrbs },
    { fieldName: 'coinsFromCoinBonuses', displayName: 'Coin Bonuses', color: SOURCE_COLORS.coinsFromCoinBonuses },
    { fieldName: 'coinsFromDeathWave', displayName: 'Death Wave', color: SOURCE_COLORS.coinsFromDeathWave },
    { fieldName: 'goldenBotCoinsEarned', displayName: 'Golden Bot', color: SOURCE_COLORS.goldenBotCoinsEarned },
    { fieldName: 'coinsFromCoinUpgrade', displayName: 'Coin Upgrade', color: SOURCE_COLORS.coinsFromCoinUpgrade },
    { fieldName: 'coinsFetched', displayName: 'Coins Fetched', color: SOURCE_COLORS.coinsFetched },
  ]
};

/**
 * Field name aliases to handle variations in game data
 */
export const FIELD_ALIASES: Record<string, string[]> = {
  coinsFromGoldenTower: ['cashFromGoldenTower'],
  coinsFromBlackHole: ['coinsFromBlackhole'],
  coinsFromOrbs: ['coinsFromOrb'],
  coinsFromCoinBonuses: ['coinsFromCoinUpgrade'],
};

/**
 * All category definitions
 */
const CATEGORY_DEFINITIONS: Record<SourceCategory, CategoryDefinition> = {
  damageDealt: DAMAGE_DEALT_CATEGORY,
  coinIncome: COIN_INCOME_CATEGORY,
};

/**
 * Get category definition by ID
 */
export function getCategoryDefinition(categoryId: SourceCategory): CategoryDefinition {
  return CATEGORY_DEFINITIONS[categoryId];
}

/**
 * Get all available categories
 */
export function getAvailableCategories(): CategoryDefinition[] {
  return Object.values(CATEGORY_DEFINITIONS);
}
