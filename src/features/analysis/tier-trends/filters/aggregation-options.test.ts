import { describe, it, expect } from 'vitest';
import { getAggregationOptions } from './aggregation-options';
import { TrendsDuration, TrendsAggregation } from '../types';

describe('tier-trends-ui-options', () => {
  describe('getAggregationOptions', () => {
    it('should return only Actual and Per Hour options for per-run duration', () => {
      const options = getAggregationOptions(TrendsDuration.PER_RUN);

      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({ value: TrendsAggregation.AVERAGE, label: 'Actual' });
      expect(options[1]).toEqual({ value: TrendsAggregation.HOURLY, label: 'Per Hour' });
    });

    it('should return all 5 aggregation options for daily duration', () => {
      const options = getAggregationOptions(TrendsDuration.DAILY);

      expect(options).toHaveLength(5);
      expect(options[0]).toEqual({ value: TrendsAggregation.SUM, label: 'Sum' });
      expect(options[1]).toEqual({ value: TrendsAggregation.AVERAGE, label: 'Avg' });
      expect(options[2]).toEqual({ value: TrendsAggregation.MIN, label: 'Min' });
      expect(options[3]).toEqual({ value: TrendsAggregation.MAX, label: 'Max' });
      expect(options[4]).toEqual({ value: TrendsAggregation.HOURLY, label: 'Per Hour' });
    });

    it('should return all 5 aggregation options for weekly duration', () => {
      const options = getAggregationOptions(TrendsDuration.WEEKLY);

      expect(options).toHaveLength(5);
      expect(options.map(o => o.value)).toEqual([
        TrendsAggregation.SUM,
        TrendsAggregation.AVERAGE,
        TrendsAggregation.MIN,
        TrendsAggregation.MAX,
        TrendsAggregation.HOURLY
      ]);
    });

    it('should return all 5 aggregation options for monthly duration', () => {
      const options = getAggregationOptions(TrendsDuration.MONTHLY);

      expect(options).toHaveLength(5);
      expect(options.map(o => o.value)).toEqual([
        TrendsAggregation.SUM,
        TrendsAggregation.AVERAGE,
        TrendsAggregation.MIN,
        TrendsAggregation.MAX,
        TrendsAggregation.HOURLY
      ]);
    });

    it('should maintain consistent option order across all time-based durations', () => {
      const dailyOptions = getAggregationOptions(TrendsDuration.DAILY);
      const weeklyOptions = getAggregationOptions(TrendsDuration.WEEKLY);
      const monthlyOptions = getAggregationOptions(TrendsDuration.MONTHLY);

      expect(dailyOptions).toEqual(weeklyOptions);
      expect(weeklyOptions).toEqual(monthlyOptions);
    });
  });
});
