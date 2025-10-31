import { TrendsDuration, TrendsAggregation } from '@/features/data-tracking/types/game-run.types';

/**
 * Option for UI selection components
 */
export interface SelectOption<T> {
  value: T;
  label: string;
}

/**
 * Get aggregation options based on the selected duration mode
 *
 * Per-run mode shows only "Actual" (average) and "Per Hour" (hourly) options.
 * Time-based modes show all aggregation types: Sum, Avg, Min, Max, and Per Hour.
 */
export function getAggregationOptions(duration: TrendsDuration): SelectOption<TrendsAggregation>[] {
  if (duration === TrendsDuration.PER_RUN) {
    return [
      { value: TrendsAggregation.AVERAGE, label: 'Actual' },
      { value: TrendsAggregation.HOURLY, label: 'Per Hour' }
    ];
  }

  return [
    { value: TrendsAggregation.SUM, label: 'Sum' },
    { value: TrendsAggregation.AVERAGE, label: 'Avg' },
    { value: TrendsAggregation.MIN, label: 'Min' },
    { value: TrendsAggregation.MAX, label: 'Max' },
    { value: TrendsAggregation.HOURLY, label: 'Per Hour' }
  ];
}
