import type { ParsedGameRun, TierTrendsFilters } from '../types';
import { TrendsAggregation } from '../types';
import { isTrendableField } from './field-type-detection';
import type { PeriodData } from './period-grouping';
import {
  sumAggregation,
  averageAggregation,
  minAggregation,
  maxAggregation,
  hourlyAggregation
} from './aggregation-strategies';

/**
 * Get all numerical fields from all periods
 *
 * @param periods - Array of period data with runs
 * @returns Array of field names that are trendable across periods
 *
 * @remarks
 * Collects all numerical and duration fields that appear in any run
 * within any period. Uses isTrendableField to determine eligibility.
 */
export function getNumericalFieldsFromPeriods(periods: PeriodData[]): string[] {
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
 *
 * @param runs - Game runs to aggregate
 * @param fieldNames - Field names to aggregate
 * @param aggregationType - Type of aggregation to apply
 * @returns Record mapping field names to aggregated values
 *
 * @remarks
 * For each field, extracts values from all runs and applies the specified
 * aggregation strategy. Missing fields are treated as having value 0.
 */
export function aggregatePeriodValues(
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
 *
 * @param values - Array of numerical values to aggregate
 * @param runs - Associated runs (needed for hourly aggregation)
 * @param aggregationType - Strategy to apply
 * @returns Aggregated value
 *
 * @remarks
 * - SUM: Total of all values
 * - AVERAGE: Mean of all values (default)
 * - MIN: Minimum value
 * - MAX: Maximum value
 * - HOURLY: Sum divided by total hours from run durations
 * - Empty array returns 0
 */
export function applyAggregationStrategy(
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
