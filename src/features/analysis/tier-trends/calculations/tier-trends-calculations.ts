/* eslint-disable max-lines */
import type {
  ParsedGameRun,
  TierTrendsFilters,
  TierTrendsData,
  FieldTrendData,
  GameRunField,
} from '../types';
import { RunType } from '@/shared/domain/run-types/types';
import { TrendsDuration, TrendsAggregation } from '../types';
import { RunTypeFilter, filterRunsByType } from '@/features/analysis/shared/filtering/run-type-filter';
import { isTrendableField } from '@/features/analysis/tier-trends/calculations/field-type-detection';
import { createEnhancedRunHeader } from '@/features/analysis/tier-trends/calculations/run-header-formatting';
import {
  sumAggregation,
  averageAggregation,
  minAggregation,
  maxAggregation,
  hourlyAggregation
} from '@/features/analysis/tier-trends/calculations/aggregation-strategies';
import {
  calculateTotalDurationHours,
  formatHoursSubheader
} from '@/features/analysis/tier-trends/calculations/hourly-rate-calculations';

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

interface PeriodData {
  label: string;
  subLabel?: string;
  runs: ParsedGameRun[];
  startDate: Date;
  endDate: Date;
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
 * Analyze the type of trend in the values
 */
function analyzeTrendType(values: number[]): FieldTrendData['trendType'] {
  if (values.length < 3) return 'stable';
  
  // Calculate consecutive differences
  const differences = [];
  for (let i = 1; i < values.length; i++) {
    differences.push(values[i] - values[i - 1]);
  }
  
  // Check for consistent direction
  const positiveChanges = differences.filter(d => d > 0).length;
  const negativeChanges = differences.filter(d => d < 0).length;
  const noChanges = differences.filter(d => d === 0).length;
  
  // If most changes are in one direction, it's linear
  if (positiveChanges >= differences.length * 0.7) return 'upward';
  if (negativeChanges >= differences.length * 0.7) return 'downward';
  if (noChanges >= differences.length * 0.7) return 'stable';
  
  // Check for volatility (many direction changes)
  let directionChanges = 0;
  for (let i = 1; i < differences.length; i++) {
    if ((differences[i] > 0 && differences[i - 1] < 0) || 
        (differences[i] < 0 && differences[i - 1] > 0)) {
      directionChanges++;
    }
  }
  
  if (directionChanges >= differences.length * 0.5) return 'volatile';
  
  return 'linear';
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

/**
 * Group runs by the specified time period
 */
function groupRunsByPeriod(
  runs: ParsedGameRun[], 
  duration: TierTrendsFilters['duration'], 
  quantity: number
): PeriodData[] {
  if (duration === TrendsDuration.PER_RUN) {
    return runs.slice(0, quantity).map((run) => {
      // Use enhanced headers for per-run analysis
      const headerData = createEnhancedRunHeader(run);

      return {
        label: headerData.header,
        subLabel: headerData.subHeader,
        runs: [run],
        startDate: run.timestamp,
        endDate: run.timestamp
      };
    });
  }

  const periods: PeriodData[] = [];
  // Use the latest run's timestamp as the reference point instead of current time
  const referenceDate = runs.length > 0 ? runs[0].timestamp : new Date();

  for (let i = 0; i < quantity; i++) {
    const { startDate, endDate, label } = getPeriodBounds(referenceDate, duration, i);
    const periodRuns = runs.filter(run => 
      run.timestamp >= startDate && run.timestamp <= endDate
    );

    // For time-based grouping, include periods even if empty to maintain consistency
    periods.push({
      label,
      runs: periodRuns,
      startDate,
      endDate
    });
  }

  return periods;
}

/**
 * Get the start/end dates and label for a specific period
 */
function getPeriodBounds(now: Date, duration: TierTrendsFilters['duration'], periodOffset: number) {
  const currentDate = new Date(now);
  
  switch (duration) {
    case TrendsDuration.DAILY: {
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - periodOffset);

      const startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);

      return {
        startDate,
        endDate,
        label: targetDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      };
    }

    case TrendsDuration.WEEKLY: {
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - (periodOffset * 7));

      // Get start of week (Sunday)
      const startDate = new Date(targetDate);
      startDate.setDate(targetDate.getDate() - targetDate.getDay());
      startDate.setHours(0, 0, 0, 0);

      // Get end of week (Saturday)
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      return {
        startDate,
        endDate,
        label: `Week of ${startDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}`
      };
    }

    case TrendsDuration.MONTHLY: {
      const targetDate = new Date(currentDate);
      targetDate.setMonth(currentDate.getMonth() - periodOffset);

      const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

      return {
        startDate,
        endDate,
        label: targetDate.toLocaleDateString('en-US', { month: 'short' })
      };
    }

    default:
      throw new Error(`Unsupported duration: ${duration}`);
  }
}

/**
 * Get all numerical fields from all periods
 */
function getNumericalFieldsFromPeriods(periods: PeriodData[]): string[] {
  const allFields = new Set<string>();

  for (const period of periods) {
    for (const run of period.runs) {
      for (const [fieldName, field] of Object.entries(run.fields)) {
        if (isTrendableField(fieldName, field)) {
          allFields.add(fieldName);
        }
      }
    }
  }

  return Array.from(allFields);
}

/**
 * Aggregate values for a period using the specified aggregation type
 */
function aggregatePeriodValues(
  runs: ParsedGameRun[],
  fieldNames: string[],
  aggregationType?: TierTrendsFilters['aggregationType']
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const fieldName of fieldNames) {
    const values: number[] = [];

    for (const run of runs) {
      const field = run.fields[fieldName];
      if (field && (field.dataType === 'number' || field.dataType === 'duration') && typeof field.value === 'number') {
        values.push(field.value);
      }
    }

    result[fieldName] = applyAggregationStrategy(values, runs, aggregationType);
  }

  return result;
}

/**
 * Apply the appropriate aggregation strategy to values
 */
function applyAggregationStrategy(
  values: number[],
  runs: ParsedGameRun[],
  aggregationType?: TierTrendsFilters['aggregationType']
): number {
  if (values.length === 0) return 0;

  switch (aggregationType) {
    case TrendsAggregation.SUM:
      return sumAggregation(values);
    case TrendsAggregation.MIN:
      return minAggregation(values);
    case TrendsAggregation.MAX:
      return maxAggregation(values);
    case TrendsAggregation.HOURLY:
      return hourlyAggregation(values, runs);
    case TrendsAggregation.AVERAGE:
    default:
      return averageAggregation(values);
  }
}

/**
 * Calculate field trend from aggregated period data
 */
function calculateFieldTrendFromPeriods(
  periods: PeriodData[],
  fieldName: string,
  thresholdPercent: number,
  aggregationType?: TierTrendsFilters['aggregationType']
): FieldTrendData {
  const values: number[] = [];
  let displayName = fieldName;
  let dataType: GameRunField['dataType'] = 'number';
  
  // Extract aggregated values for each period (oldest to newest)
  const reversedPeriods = [...periods].reverse();
  for (const period of reversedPeriods) {
    const aggregatedValues = aggregatePeriodValues(period.runs, [fieldName], aggregationType);
    values.push(aggregatedValues[fieldName] || 0);
    
    // Get display name from first available field
    if (displayName === fieldName && period.runs.length > 0) {
      const firstRun = period.runs[0];
      const field = firstRun.fields[fieldName];
      if (field) {
        displayName = field.originalKey || fieldName;
        dataType = field.dataType;
      }
    }
  }
  
  // Calculate change metrics
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const absoluteChange = lastValue - firstValue;
  const percentChange = firstValue === 0 ? 
    (lastValue > 0 ? 100 : 0) : 
    (absoluteChange / Math.abs(firstValue)) * 100;
  
  // Determine direction
  const direction = Math.abs(percentChange) < 0.1 ? 'stable' : 
                   percentChange > 0 ? 'up' : 'down';
  
  // Determine significance based on threshold
  const significance = Math.abs(percentChange) >= thresholdPercent * 2 ? 'high' :
                      Math.abs(percentChange) >= thresholdPercent ? 'medium' : 'low';
  
  // Analyze trend type
  const trendType = analyzeTrendType(values);
  
  return {
    fieldName,
    displayName,
    dataType,
    values,
    change: {
      absolute: absoluteChange,
      percent: percentChange,
      direction
    },
    trendType,
    significance
  };
}