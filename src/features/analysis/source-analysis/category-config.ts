/**
 * Category Configuration for Source Analysis
 *
 * Defines the mapping between aggregate totals and their constituent sources.
 * Uses shared field configurations to ensure consistency with Run Details.
 */

import type { CategoryDefinition, SourceCategory } from './types';
import {
  DAMAGE_DEALT_CATEGORY as SHARED_DAMAGE_CATEGORY,
  COINS_EARNED_CATEGORY as SHARED_COINS_CATEGORY,
  COIN_FIELD_ALIASES,
} from '@/shared/domain/fields/breakdown-sources';

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
    startOpacity: 0.85,
    endColor: color,
    endOpacity: 0.15,
  };
}

/**
 * Damage Dealt category definition
 * Derived from shared configuration for consistency with Run Details
 */
const DAMAGE_DEALT_CATEGORY: CategoryDefinition = {
  id: 'damageDealt',
  name: SHARED_DAMAGE_CATEGORY.name,
  description: SHARED_DAMAGE_CATEGORY.description ?? 'Breakdown of damage sources contributing to total damage dealt',
  totalField: SHARED_DAMAGE_CATEGORY.totalField!,
  sources: SHARED_DAMAGE_CATEGORY.fields.map((f) => ({
    fieldName: f.fieldName,
    displayName: f.displayName,
    color: f.color,
  })),
};

/**
 * Coin Income category definition
 * Derived from shared configuration for consistency with Run Details
 */
const COIN_INCOME_CATEGORY: CategoryDefinition = {
  id: 'coinIncome',
  name: SHARED_COINS_CATEGORY.name,
  description: SHARED_COINS_CATEGORY.description ?? 'Breakdown of coin income sources',
  totalField: SHARED_COINS_CATEGORY.totalField!,
  sources: SHARED_COINS_CATEGORY.fields.map((f) => ({
    fieldName: f.fieldName,
    displayName: f.displayName,
    color: f.color,
  })),
};

/**
 * Field name aliases to handle variations in game data
 * Derived from shared configuration
 */
export const FIELD_ALIASES: Record<string, string[]> = COIN_FIELD_ALIASES;

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
