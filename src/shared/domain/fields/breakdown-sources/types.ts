/**
 * Shared Field Configuration Types
 *
 * Extensible types for defining field configurations that can be reused
 * across different views (Run Details, Source Analysis, etc.).
 *
 * Design goals:
 * - Single source of truth for field definitions
 * - Extensible to any category (damage, coins, enemies, modules, etc.)
 * - Support both breakdown categories (with totals) and plain groupings
 */

/**
 * Single field definition - the atomic unit of configuration
 *
 * Used everywhere a field needs consistent identity (name, display, color).
 * This is the building block that ensures the same field looks identical
 * across all views in the application.
 */
export interface FieldConfig {
  /** camelCase key in ParsedGameRun.fields */
  fieldName: string;

  /** Human-readable display name (e.g., "Death Wave", not "Death Wave Damage") */
  displayName: string;

  /** Hex color for visualization (e.g., "#ef4444") */
  color: string;

  /** Alternative field names for data variations (e.g., casing differences like "coinsFromBlackhole") */
  aliases?: string[];
}

/**
 * Category that groups related fields with an optional aggregate total
 *
 * Examples:
 * - Damage Dealt: has totalField='damageDealt', fields are damage sources
 * - Enemies Destroyed: has totalField='totalEnemies', fields are enemy types
 * - Other Earnings: no totalField (grab-bag grouping), fields are misc currencies
 */
export interface FieldCategory {
  /** Unique identifier (e.g., 'damageDealt', 'enemiesDestroyed') */
  id: string;

  /** Display name for the category (e.g., 'Damage Dealt') */
  name: string;

  /** Optional help text describing the category */
  description?: string;

  /** Field containing the aggregate total (optional - not all categories have one) */
  totalField?: string;

  /** Optional rate field (e.g., 'coinsPerHour' for Coins Earned) */
  perHourField?: string;

  /** The fields in this category */
  fields: FieldConfig[];
}
