import { describe, it, expect } from 'vitest';
import { formatTrendValue } from './trend-value-formatting';
import { TrendsAggregation } from '../types';

describe('trend-value-formatting', () => {
  describe('formatTrendValue', () => {
    it('should add "/h" suffix for hourly aggregation', () => {
      expect(formatTrendValue(1350000, TrendsAggregation.HOURLY)).toBe('1.4M/h');
      expect(formatTrendValue(950000000, TrendsAggregation.HOURLY)).toBe('950.0M/h');
      expect(formatTrendValue(13500, TrendsAggregation.HOURLY)).toBe('13.5K/h');
    });

    it('should not add suffix for other aggregation types', () => {
      expect(formatTrendValue(1350000, TrendsAggregation.SUM)).toBe('1.4M');
      expect(formatTrendValue(1350000, TrendsAggregation.AVERAGE)).toBe('1.4M');
      expect(formatTrendValue(1350000, TrendsAggregation.MIN)).toBe('1.4M');
      expect(formatTrendValue(1350000, TrendsAggregation.MAX)).toBe('1.4M');
    });

    it('should not add suffix when aggregationType is undefined', () => {
      expect(formatTrendValue(1350000)).toBe('1.4M');
      expect(formatTrendValue(1350000, undefined)).toBe('1.4M');
    });

    it('should handle zero values correctly', () => {
      expect(formatTrendValue(0, TrendsAggregation.HOURLY)).toBe('0/h');
      expect(formatTrendValue(0, TrendsAggregation.SUM)).toBe('0');
      expect(formatTrendValue(0)).toBe('0');
    });

    it('should handle negative values correctly', () => {
      expect(formatTrendValue(-1000, TrendsAggregation.HOURLY)).toBe('-1.0K/h');
      expect(formatTrendValue(-1000, TrendsAggregation.SUM)).toBe('-1.0K');
    });

    it('should handle small values correctly', () => {
      expect(formatTrendValue(50, TrendsAggregation.HOURLY)).toBe('50/h');
      expect(formatTrendValue(999, TrendsAggregation.HOURLY)).toBe('999/h');
    });

    it('should handle large values correctly', () => {
      expect(formatTrendValue(1000000000000, TrendsAggregation.HOURLY)).toBe('1.0T/h');
      expect(formatTrendValue(5500000000, TrendsAggregation.HOURLY)).toBe('5.5B/h');
    });
  });
});
