/**
 * Coverage Report Configuration
 *
 * Defines the 9 coverage metrics with their display properties.
 * Metrics are grouped into Economic (4) and Combat (5) categories.
 */

import type { CoverageMetricDefinition, CoverageFieldName, MetricCategory } from './types'

/**
 * Color palette for coverage metrics
 */
const COLORS = {
  // Economic
  deathWave: '#ef4444',      // Red
  spotlight: '#e2e8f0',       // Slate-200 (soft white - less harsh on dark theme)
  goldenBot: '#fbbf24',       // Amber
  summonedEnemies: '#3b82f6', // Blue

  // Combat
  orbHits: '#f87171',         // Red-400 (orbs have red border)
  orbKills: '#fca5a5',        // Red-300 (lighter variant)
  deathRay: '#ff5722',        // Deep Orange
  thorns: '#22d3ee',          // Cyan
  landMine: '#9333ea',        // Purple
} as const

/**
 * All 9 coverage metric definitions
 */
const COVERAGE_METRICS: readonly CoverageMetricDefinition[] = [
  // Economic Category (4)
  {
    fieldName: 'taggedByDeathwave',
    label: 'Death Wave',
    category: 'economic',
    color: COLORS.deathWave,
  },
  {
    fieldName: 'destroyedInSpotlight',
    label: 'Spotlight',
    category: 'economic',
    color: COLORS.spotlight,
  },
  {
    fieldName: 'destroyedInGoldenBot',
    label: 'Golden Bot',
    category: 'economic',
    color: COLORS.goldenBot,
  },
  {
    fieldName: 'summonedEnemies',
    label: 'Enemy Summoned',
    category: 'economic',
    color: COLORS.summonedEnemies,
  },

  // Combat Category (5)
  {
    fieldName: 'enemiesHitByOrbs',
    label: 'Orb Hits',
    category: 'combat',
    color: COLORS.orbHits,
  },
  {
    fieldName: 'destroyedByOrbs',
    label: 'Orbs',
    category: 'combat',
    color: COLORS.orbKills,
  },
  {
    fieldName: 'destroyedByDeathRay',
    label: 'Death Ray',
    category: 'combat',
    color: COLORS.deathRay,
  },
  {
    fieldName: 'destroyedByThorns',
    label: 'Thorns',
    category: 'combat',
    color: COLORS.thorns,
  },
  {
    fieldName: 'destroyedByLandMine',
    label: 'Land Mine',
    category: 'combat',
    color: COLORS.landMine,
  },
] as const

/**
 * Get metrics by category
 */
function getMetricsByCategory(category: MetricCategory): CoverageMetricDefinition[] {
  return COVERAGE_METRICS.filter(m => m.category === category)
}

/**
 * Get a metric definition by field name
 */
export function getMetricByFieldName(fieldName: CoverageFieldName): CoverageMetricDefinition | undefined {
  return COVERAGE_METRICS.find(m => m.fieldName === fieldName)
}

/**
 * Get all economic metrics
 */
export function getEconomicMetrics(): CoverageMetricDefinition[] {
  return getMetricsByCategory('economic')
}

/**
 * Get all combat metrics
 */
export function getCombatMetrics(): CoverageMetricDefinition[] {
  return getMetricsByCategory('combat')
}

/**
 * Gradient configuration for chart fills
 */
export interface GradientConfig {
  id: string
  color: string
  startOpacity: number
  endOpacity: number
}

/**
 * Get gradient config for a metric
 */
export function getGradientConfig(fieldName: CoverageFieldName, color: string): GradientConfig {
  return {
    id: `gradient-${fieldName}`,
    color,
    startOpacity: 0.85,
    endOpacity: 0.15,
  }
}
