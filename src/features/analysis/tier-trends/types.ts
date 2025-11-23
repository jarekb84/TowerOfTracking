/**
 * Tier Trends Analysis Type Definitions
 *
 * These types are owned by the tier-trends feature and should only be
 * imported by components within this feature or features directly using
 * tier trends functionality.
 *
 * Co-located with tier-trends feature per Migration Story 11B.
 */

import type { GameRunField } from '@/shared/types/game-run.types';

/**
 * Duration options for tier trends analysis
 */
export enum TrendsDuration {
  PER_RUN = 'per-run',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * Aggregation methods for combining run data within time periods
 */
export enum TrendsAggregation {
  SUM = 'sum',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  HOURLY = 'hourly'
}

/**
 * Filter configuration for tier trends analysis
 */
export interface TierTrendsFilters {
  tier: number;
  duration: TrendsDuration; // Time span for analysis
  quantity: number; // Number of periods to analyze (2-7)
  aggregationType?: TrendsAggregation; // Only used when duration is not 'per-run'
}

/**
 * Trend data for a single field across time periods
 */
export interface FieldTrendData {
  fieldName: string;
  displayName: string;
  dataType: GameRunField['dataType'];
  values: number[]; // Values from oldest to newest run
  change: {
    absolute: number; // Absolute change from first to last
    percent: number; // Percentage change from first to last
    direction: 'up' | 'down' | 'stable'; // Trend direction
  };
  trendType: 'linear' | 'upward' | 'downward' | 'volatile' | 'stable';
  significance: 'high' | 'medium' | 'low'; // Based on change threshold
}

/**
 * Column definition for trend comparison table
 */
export interface ComparisonColumn {
  header: string; // Display header
  subHeader?: string; // Optional second line for header
  values: Record<string, number>; // fieldName -> value mapping
}

/**
 * Complete tier trends analysis result
 */
export interface TierTrendsData {
  tier: number;
  periodCount: number; // How many periods were actually analyzed
  periodLabels: string[]; // Labels for each period (newest to oldest)
  comparisonColumns: ComparisonColumn[]; // Dynamic comparison columns (2-7)
  fieldTrends: FieldTrendData[];
  summary: {
    totalFields: number;
    fieldsChanged: number; // Replaces significantChanges
    topGainers: FieldTrendData[]; // Top 3 fields with highest positive change
    topDecliners: FieldTrendData[]; // Top 3 fields with highest negative change
  };
}
