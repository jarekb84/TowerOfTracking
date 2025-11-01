import type {
  ParsedGameRun,
  TierTrendsFilters,
  TierTrendsData,
} from '../types';
import { RunType } from '@/shared/domain/run-types/types';
import { TrendsDuration, TrendsAggregation } from '../types';
import { RunTypeFilter, filterRunsByType } from '@/features/analysis/shared/filtering/run-type-filter';
import {
  calculateTotalDurationHours,
  formatHoursSubheader
} from '@/features/analysis/tier-trends/calculations/hourly-rate-calculations';
import { groupRunsByPeriod } from './period-grouping';
import {
  getNumericalFieldsFromPeriods,
  aggregatePeriodValues
} from './field-aggregation';
import { calculateFieldTrendFromPeriods } from './trend-analysis';

/**
 * Get the default aggregation type for a given duration mode
 *
 * @param duration - The selected duration mode
 * @returns AVERAGE for per-run mode, SUM for all time-based modes
 *
 * @remarks
 * Per-run mode defaults to AVERAGE to show actual raw values.
 * Time-based modes default to SUM to show total accumulation over the period.
 */
export function getDefaultAggregationType(duration: TrendsDuration): TrendsAggregation {
  return duration === TrendsDuration.PER_RUN
    ? TrendsAggregation.AVERAGE
    : TrendsAggregation.SUM;
}

/**
 * Get the quantity label for a given duration mode
 *
 * @param duration - The selected duration mode
 * @returns User-friendly label: "runs", "days", "weeks", or "months"
 *
 * @example
 * getQuantityLabel(TrendsDuration.PER_RUN); // Returns "runs"
 * getQuantityLabel(TrendsDuration.DAILY);   // Returns "days"
 */
export function getQuantityLabel(duration: TrendsDuration): string {
  switch (duration) {
    case TrendsDuration.PER_RUN:
      return 'runs';
    case TrendsDuration.DAILY:
      return 'days';
    case TrendsDuration.WEEKLY:
      return 'weeks';
    case TrendsDuration.MONTHLY:
      return 'months';
    default:
      return 'periods';
  }
}

/**
 * Calculate tier trends analysis for the specified duration and quantity
 */
export function calculateTierTrends(
  runs: ParsedGameRun[],
  filters: TierTrendsFilters,
  runTypeFilter: RunTypeFilter = RunType.FARM
): TierTrendsData {
  // Filter runs by type and tier, sorted by timestamp (newest first)
  const filteredRuns = filterRunsByType(runs, runTypeFilter);
  const tierRuns = filteredRuns
    .filter(run => filters.tier === 0 || run.tier === filters.tier)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  // Group runs by the specified duration
  const periodsData = groupRunsByPeriod(tierRuns, filters.duration, filters.quantity);
  
  if (periodsData.length < 2) {
    return {
      tier: filters.tier,
      periodCount: periodsData.length,
      periodLabels: periodsData.map(p => p.label),
      comparisonColumns: [],
      fieldTrends: [],
      summary: {
        totalFields: 0,
        fieldsChanged: 0,
        topGainers: [],
        topDecliners: []
      }
    };
  }

  // Get all numerical fields from all runs in all periods
  const allNumericalFields = getNumericalFieldsFromPeriods(periodsData);
  
  // Calculate comparison columns
  const comparisonColumns = periodsData.map(period => {
    // For hourly aggregation on time-based periods, add total hours to subheader
    let subHeader = period.subLabel;
    if (filters.aggregationType === TrendsAggregation.HOURLY &&
        filters.duration !== TrendsDuration.PER_RUN) {
      const totalHours = calculateTotalDurationHours(period.runs);
      subHeader = formatHoursSubheader(totalHours);
    }

    return {
      header: period.label,
      subHeader,
      values: aggregatePeriodValues(period.runs, allNumericalFields, filters.aggregationType)
    };
  });

  // Calculate trends for each field across periods
  const fieldTrends = allNumericalFields.map(fieldName => 
    calculateFieldTrendFromPeriods(periodsData, fieldName, filters.changeThresholdPercent, filters.aggregationType)
  ).filter(trend => filters.changeThresholdPercent === 0 || Math.abs(trend.change.percent) >= filters.changeThresholdPercent);

  // Generate summary statistics
  const fieldsChanged = fieldTrends.filter(t => Math.abs(t.change.percent) >= (filters.changeThresholdPercent || 1)).length;
  const topGainers = fieldTrends
    .filter(t => t.change.direction === 'up')
    .sort((a, b) => b.change.percent - a.change.percent)
    .slice(0, 3);
  const topDecliners = fieldTrends
    .filter(t => t.change.direction === 'down')
    .sort((a, b) => a.change.percent - b.change.percent)
    .slice(0, 3);

  return {
    tier: filters.tier,
    periodCount: periodsData.length,
    periodLabels: periodsData.map(p => p.label),
    comparisonColumns,
    fieldTrends: fieldTrends.sort((a, b) => Math.abs(b.change.percent) - Math.abs(a.change.percent)),
    summary: {
      totalFields: allNumericalFields.length,
      fieldsChanged,
      topGainers,
      topDecliners
    }
  };
}

/**
 * Get available tiers for trend analysis (tiers with at least 2 runs of the specified type)
 */
export function getAvailableTiersForTrends(runs: ParsedGameRun[], runTypeFilter: RunTypeFilter = RunType.FARM): number[] {
  const tierCounts = new Map<number, number>();
  
  const filteredRuns = filterRunsByType(runs, runTypeFilter);
  filteredRuns.forEach(run => {
    tierCounts.set(run.tier, (tierCounts.get(run.tier) || 0) + 1);
  });
  
  return Array.from(tierCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([tier, _]) => tier)
    .sort((a, b) => b - a); // Sort descending (highest tiers first)
}

/**
 * Format field names for display
 */
export function formatFieldDisplayName(fieldName: string, originalKey?: string): string {
  if (originalKey) return originalKey;
  
  // Convert camelCase to readable format
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Generate sparkline path data for mini visualizations
 */
export function generateSparklinePath(values: number[], width: number = 60, height: number = 20): string {
  if (values.length < 2) return '';
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) {
    // All values are the same - draw horizontal line
    const y = height / 2;
    return `M 0 ${y} L ${width} ${y}`;
  }
  
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  
  return path;
}