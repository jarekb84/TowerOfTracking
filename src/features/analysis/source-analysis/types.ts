/**
 * Source Analysis Type Definitions
 *
 * These types are owned by the source-analysis feature and support
 * analyzing aggregate metrics like damage dealt and coin income by their
 * constituent sources.
 */

import { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'
import type { RunInfo } from '@/features/analysis/shared/tooltips/run-info-header'
import { Duration } from '@/shared/domain/filters/types'
import type { PeriodCountFilter } from '@/shared/domain/filters/types'

// Re-export shared types for source analysis consumers
export type { RunInfo as SourceRunInfo } from '@/features/analysis/shared/tooltips/run-info-header'
export { Duration }
export type { RunTypeFilter, PeriodCountFilter }

// Local alias for use within this file
type SourceRunInfo = RunInfo

/**
 * Available analysis categories
 */
export type SourceCategory = 'damageDealt' | 'coinIncome';

/**
 * Filter configuration for source analysis
 */
export interface SourceAnalysisFilters {
  category: SourceCategory;
  runType: RunTypeFilter;
  tier: number | 'all';
  duration: Duration;
  quantity: PeriodCountFilter;
}

/**
 * Definition of a source category and its constituent fields
 */
export interface CategoryDefinition {
  id: SourceCategory;
  name: string;
  description: string;
  totalField: string; // The field containing the aggregate total (e.g., 'damageDealt')
  sources: SourceFieldDefinition[];
}

/**
 * Definition of a source field within a category
 */
export interface SourceFieldDefinition {
  fieldName: string; // camelCase field name in ParsedGameRun.fields
  displayName: string; // Human-readable display name
  color: string; // Chart color (hex)
}

/**
 * Breakdown of sources for a single time period
 */
export interface PeriodSourceBreakdown {
  periodLabel: string; // Display label (e.g., "Run #5", "Nov 15", "Week 46")
  periodKey: string; // Unique key for the period
  total: number; // Total value for the period
  runCount: number; // Number of runs included in this period
  sources: SourceValue[]; // Individual source values
  runInfo?: SourceRunInfo; // Optional run info for per-run periods
}

/**
 * Value for a single source in a period
 */
export interface SourceValue {
  fieldName: string;
  displayName: string;
  color: string;
  value: number; // Absolute value
  percentage: number; // Percentage of total (0-100)
  /** True if this is a discrepancy entry (Unknown/Overage) */
  isDiscrepancy?: boolean;
  /** Type of discrepancy if isDiscrepancy is true */
  discrepancyType?: 'unknown' | 'overage';
}

/**
 * Complete source analysis result
 */
export interface SourceAnalysisData {
  category: CategoryDefinition;
  filters: SourceAnalysisFilters;
  periods: PeriodSourceBreakdown[]; // Ordered by time (oldest first)
  summary: SourceSummary; // Aggregate across all periods
}

/**
 * Summary breakdown across all analyzed periods
 */
export interface SourceSummary {
  totalValue: number; // Sum of all totals across periods
  periodCount: number;
  sources: SourceSummaryValue[]; // Sorted by percentage descending
}

/**
 * Summary value for a source across all periods
 */
export interface SourceSummaryValue {
  fieldName: string;
  displayName: string;
  color: string;
  totalValue: number; // Sum across all periods
  percentage: number; // Percentage of grand total (0-100)
  /** True if this is a discrepancy entry (Unknown/Overage) */
  isDiscrepancy?: boolean;
  /** Type of discrepancy if isDiscrepancy is true */
  discrepancyType?: 'unknown' | 'overage';
}

/**
 * Get the default run type for a given category
 * - Damage analysis is most meaningful for tournament runs
 * - Coin analysis is most meaningful for farm runs
 */
export function getDefaultRunTypeForCategory(category: SourceCategory): RunTypeFilter {
  return category === 'damageDealt' ? 'tournament' : 'farm';
}

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: SourceAnalysisFilters = {
  category: 'damageDealt',
  runType: 'tournament', // Match default category (damageDealt → tournament)
  tier: 'all',
  duration: Duration.PER_RUN,
  quantity: 10
};
