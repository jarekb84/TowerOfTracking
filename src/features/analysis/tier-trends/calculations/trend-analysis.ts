import type { FieldTrendData, GameRunField, TierTrendsFilters } from '../types';
import type { PeriodData } from './period-grouping';
import { aggregatePeriodValues } from './field-aggregation';

/**
 * Analyze the type of trend in the values
 *
 * @param values - Array of numerical values (oldest to newest)
 * @returns Trend pattern classification
 *
 * @remarks
 * Classifies trends based on consecutive differences:
 * - UPWARD: >= 70% of changes are positive
 * - DOWNWARD: >= 70% of changes are negative
 * - STABLE: >= 70% of changes are zero
 * - VOLATILE: >= 50% direction changes (frequent reversals)
 * - LINEAR: Mixed changes that don't fit other patterns
 * - Requires at least 3 values for analysis
 */
export function analyzeTrendType(values: number[]): FieldTrendData['trendType'] {
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
 * Calculate field trend from aggregated period data
 *
 * @param periods - Period data with runs
 * @param fieldName - Field to analyze
 * @param thresholdPercent - Change threshold for significance
 * @param aggregationType - Aggregation strategy to apply
 * @returns Complete field trend analysis
 *
 * @remarks
 * Workflow:
 * 1. Aggregate values for each period (oldest to newest)
 * 2. Calculate change metrics (absolute, percent, direction)
 * 3. Determine significance based on threshold
 * 4. Analyze trend pattern type
 * 5. Extract display name and data type from first available field
 */
export function calculateFieldTrendFromPeriods(
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
