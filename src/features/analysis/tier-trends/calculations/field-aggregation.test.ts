import { describe, it, expect } from 'vitest';
import {
  getNumericalFieldsFromPeriods,
  aggregatePeriodValues,
  applyAggregationStrategy
} from './field-aggregation';
import { TrendsAggregation } from '../types';
import { createMockField, createMockRun } from './__tests__/test-helpers';
import type { PeriodData } from './period-grouping';

describe('field-aggregation', () => {
  describe('getNumericalFieldsFromPeriods', () => {
    it('should extract all numerical and duration fields', () => {
      const periods: PeriodData[] = [
        {
          label: 'Period 1',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(1000, 'number', 'Coins Earned'),
                cellsEarned: createMockField(500, 'number', 'Cells Earned'),
                realTime: createMockField(1800, 'duration', 'Real Time'),
              },
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
        {
          label: 'Period 2',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(1100, 'number', 'Coins Earned'),
                wave: createMockField(15, 'number', 'Wave'),
              },
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      const fields = getNumericalFieldsFromPeriods(periods);

      expect(fields).toContain('coinsEarned');
      expect(fields).toContain('cellsEarned');
      expect(fields).toContain('realTime');
      expect(fields).toContain('wave');
    });

    it('should return empty array for periods with no runs', () => {
      const periods: PeriodData[] = [
        {
          label: 'Empty Period',
          runs: [],
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      const fields = getNumericalFieldsFromPeriods(periods);

      expect(fields).toEqual([]);
    });
  });

  describe('aggregatePeriodValues', () => {
    it('should aggregate values using SUM strategy', () => {
      const runs = [
        createMockRun({
          fields: {
            coinsEarned: createMockField(100, 'number', 'Coins Earned'),
          },
          coinsEarned: 100,
        }, new Date(), 1),
        createMockRun({
          fields: {
            coinsEarned: createMockField(200, 'number', 'Coins Earned'),
          },
          coinsEarned: 200,
        }, new Date(), 1),
      ];

      const result = aggregatePeriodValues(runs, ['coinsEarned'], TrendsAggregation.SUM);

      expect(result.coinsEarned).toBe(300); // 100 + 200
    });

    it('should aggregate values using AVERAGE strategy', () => {
      const runs = [
        createMockRun({
          fields: {
            coinsEarned: createMockField(100, 'number', 'Coins Earned'),
          },
          coinsEarned: 100,
        }, new Date(), 1),
        createMockRun({
          fields: {
            coinsEarned: createMockField(200, 'number', 'Coins Earned'),
          },
          coinsEarned: 200,
        }, new Date(), 1),
      ];

      const result = aggregatePeriodValues(runs, ['coinsEarned'], TrendsAggregation.AVERAGE);

      expect(result.coinsEarned).toBe(150); // (100 + 200) / 2
    });

    it('should aggregate values using MIN strategy', () => {
      const runs = [
        createMockRun({
          fields: {
            coinsEarned: createMockField(100, 'number', 'Coins Earned'),
          },
          coinsEarned: 100,
        }, new Date(), 1),
        createMockRun({
          fields: {
            coinsEarned: createMockField(200, 'number', 'Coins Earned'),
          },
          coinsEarned: 200,
        }, new Date(), 1),
      ];

      const result = aggregatePeriodValues(runs, ['coinsEarned'], TrendsAggregation.MIN);

      expect(result.coinsEarned).toBe(100); // min(100, 200)
    });

    it('should aggregate values using MAX strategy', () => {
      const runs = [
        createMockRun({
          fields: {
            coinsEarned: createMockField(100, 'number', 'Coins Earned'),
          },
          coinsEarned: 100,
        }, new Date(), 1),
        createMockRun({
          fields: {
            coinsEarned: createMockField(200, 'number', 'Coins Earned'),
          },
          coinsEarned: 200,
        }, new Date(), 1),
      ];

      const result = aggregatePeriodValues(runs, ['coinsEarned'], TrendsAggregation.MAX);

      expect(result.coinsEarned).toBe(200); // max(100, 200)
    });

    it('should aggregate values using HOURLY strategy', () => {
      const runs = [
        createMockRun({
          fields: {
            coinsEarned: createMockField(10_000_000_000, 'number', 'Coins Earned'),
            realTime: createMockField(36000, 'duration', 'Real Time'),
          },
          coinsEarned: 10_000_000_000,
          realTime: 36000, // 10 hours
        }, new Date(), 1),
        createMockRun({
          fields: {
            coinsEarned: createMockField(5_000_000_000, 'number', 'Coins Earned'),
            realTime: createMockField(18000, 'duration', 'Real Time'),
          },
          coinsEarned: 5_000_000_000,
          realTime: 18000, // 5 hours
        }, new Date(), 1),
      ];

      const result = aggregatePeriodValues(runs, ['coinsEarned'], TrendsAggregation.HOURLY);

      // Total: 15B coins / 15 hours = 1B/hour
      expect(result.coinsEarned).toBe(1_000_000_000);
    });

    it('should handle missing fields gracefully', () => {
      const runs = [
        createMockRun({
          fields: {
            coinsEarned: createMockField(100, 'number', 'Coins Earned'),
          },
        }, new Date(), 1),
        createMockRun({
          fields: {
            cellsEarned: createMockField(500, 'number', 'Cells Earned'),
          },
        }, new Date(), 1),
      ];

      const result = aggregatePeriodValues(runs, ['coinsEarned', 'cellsEarned'], TrendsAggregation.AVERAGE);

      expect(result.coinsEarned).toBe(100); // Only one run has this field
      expect(result.cellsEarned).toBe(500); // Only one run has this field
    });

    it('should return 0 for fields with no values', () => {
      const runs = [
        createMockRun({
          fields: {
            coinsEarned: createMockField(100, 'number', 'Coins Earned'),
          },
        }, new Date(), 1),
      ];

      const result = aggregatePeriodValues(runs, ['nonExistentField'], TrendsAggregation.SUM);

      expect(result.nonExistentField).toBe(0);
    });
  });

  describe('applyAggregationStrategy', () => {
    const mockRuns = [
      createMockRun({ realTime: 3600 }, new Date(), 1), // 1 hour
      createMockRun({ realTime: 7200 }, new Date(), 1), // 2 hours
    ];

    it('should apply SUM aggregation', () => {
      const values = [100, 200, 300];
      const result = applyAggregationStrategy(values, mockRuns, TrendsAggregation.SUM);
      expect(result).toBe(600);
    });

    it('should apply AVERAGE aggregation', () => {
      const values = [100, 200, 300];
      const result = applyAggregationStrategy(values, mockRuns, TrendsAggregation.AVERAGE);
      expect(result).toBe(200);
    });

    it('should apply MIN aggregation', () => {
      const values = [100, 200, 300];
      const result = applyAggregationStrategy(values, mockRuns, TrendsAggregation.MIN);
      expect(result).toBe(100);
    });

    it('should apply MAX aggregation', () => {
      const values = [100, 200, 300];
      const result = applyAggregationStrategy(values, mockRuns, TrendsAggregation.MAX);
      expect(result).toBe(300);
    });

    it('should apply HOURLY aggregation', () => {
      const values = [3_000_000_000]; // 3B coins
      const runs = [
        createMockRun({ realTime: 10800 }, new Date(), 1), // 3 hours
      ];
      const result = applyAggregationStrategy(values, runs, TrendsAggregation.HOURLY);
      expect(result).toBe(1_000_000_000); // 3B / 3 hours = 1B/hour
    });

    it('should default to AVERAGE when no aggregation type specified', () => {
      const values = [100, 200, 300];
      const result = applyAggregationStrategy(values, mockRuns, undefined);
      expect(result).toBe(200);
    });

    it('should return 0 for empty values array', () => {
      const values: number[] = [];
      const result = applyAggregationStrategy(values, mockRuns, TrendsAggregation.SUM);
      expect(result).toBe(0);
    });
  });
});
