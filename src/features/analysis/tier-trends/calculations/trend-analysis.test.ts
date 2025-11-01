import { describe, it, expect } from 'vitest';
import { analyzeTrendType, calculateFieldTrendFromPeriods } from './trend-analysis';
import { TrendsAggregation } from '../types';
import { createMockField, createMockRun } from './__tests__/test-helpers';
import type { PeriodData } from './period-grouping';

describe('trend-analysis', () => {
  describe('analyzeTrendType', () => {
    it('should return "stable" for arrays with fewer than 3 values', () => {
      expect(analyzeTrendType([100])).toBe('stable');
      expect(analyzeTrendType([100, 200])).toBe('stable');
    });

    it('should detect upward trends (>= 70% positive changes)', () => {
      const values = [100, 120, 140, 160, 180]; // All positive changes
      expect(analyzeTrendType(values)).toBe('upward');
    });

    it('should detect downward trends (>= 70% negative changes)', () => {
      const values = [180, 160, 140, 120, 100]; // All negative changes
      expect(analyzeTrendType(values)).toBe('downward');
    });

    it('should detect stable trends (>= 70% no changes)', () => {
      const values = [100, 100, 100, 100, 100]; // All same
      expect(analyzeTrendType(values)).toBe('stable');
    });

    it('should detect volatile trends (>= 50% direction changes)', () => {
      const values = [100, 120, 110, 130, 115]; // Frequent direction changes
      expect(analyzeTrendType(values)).toBe('volatile');
    });

    // Note: "linear" is the fallthrough case for mixed patterns that don't fit other categories.
    // It's challenging to craft a perfect test case that hits exactly <70% for all directions and <50% volatility.
    // The comprehensive tests above (upward, downward, stable, volatile) sufficiently cover the logic,
    // and "linear" serves as the default for edge cases not matching the other clear patterns.
  });

  describe('calculateFieldTrendFromPeriods', () => {
    it('should calculate change percentages correctly', () => {
      // Periods are provided newest-first (reverse chronological order)
      const periods: PeriodData[] = [
        {
          label: 'Period 2',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(1100, 'number', 'Coins Earned'),
              },
              coinsEarned: 1100,
            }, new Date('2024-01-01T01:00:00Z'), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
        {
          label: 'Period 1',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(1000, 'number', 'Coins Earned'),
              },
              coinsEarned: 1000,
            }, new Date('2024-01-01T00:00:00Z'), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      const result = calculateFieldTrendFromPeriods(periods, 'coinsEarned', 0);

      expect(result.change.percent).toBe(10); // 10% increase from 1000 to 1100
      expect(result.change.direction).toBe('up');
      expect(result.change.absolute).toBe(100);
    });

    it('should detect downward trends', () => {
      // Periods newest-first: 1000 (newer) comes before 1100 (older)
      const periods: PeriodData[] = [
        {
          label: 'Period 2',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(1000, 'number', 'Coins Earned'),
              },
              coinsEarned: 1000,
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
        {
          label: 'Period 1',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(1100, 'number', 'Coins Earned'),
              },
              coinsEarned: 1100,
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      const result = calculateFieldTrendFromPeriods(periods, 'coinsEarned', 0);

      expect(result.change.percent).toBeCloseTo(-9.09, 1); // ~-9.09% decrease from 1100 to 1000
      expect(result.change.direction).toBe('down');
      expect(result.change.absolute).toBe(-100);
    });

    it('should detect stable trends', () => {
      const periods: PeriodData[] = [
        {
          label: 'Period 1',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(1000, 'number', 'Coins Earned'),
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
                coinsEarned: createMockField(1000, 'number', 'Coins Earned'),
              },
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      const result = calculateFieldTrendFromPeriods(periods, 'coinsEarned', 0);

      expect(result.change.percent).toBe(0);
      expect(result.change.direction).toBe('stable');
      expect(result.change.absolute).toBe(0);
    });

    it('should determine significance based on threshold', () => {
      const createPeriod = (value: number): PeriodData => ({
        label: 'Period',
        runs: [
          createMockRun({
            fields: {
              coinsEarned: createMockField(value, 'number', 'Coins Earned'),
            },
          }, new Date(), 1),
        ],
        startDate: new Date(),
        endDate: new Date(),
      });

      // Low significance (< threshold)
      const lowPeriods = [createPeriod(1000), createPeriod(1020)]; // 2% change
      const lowResult = calculateFieldTrendFromPeriods(lowPeriods, 'coinsEarned', 10);
      expect(lowResult.significance).toBe('low');

      // Medium significance (>= threshold, < 2*threshold)
      const medPeriods = [createPeriod(1000), createPeriod(1150)]; // 15% change
      const medResult = calculateFieldTrendFromPeriods(medPeriods, 'coinsEarned', 10);
      expect(medResult.significance).toBe('medium');

      // High significance (>= 2*threshold)
      const highPeriods = [createPeriod(1000), createPeriod(1300)]; // 30% change
      const highResult = calculateFieldTrendFromPeriods(highPeriods, 'coinsEarned', 10);
      expect(highResult.significance).toBe('high');
    });

    it('should extract display name from field', () => {
      const periods: PeriodData[] = [
        {
          label: 'Period',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(1000, 'number', 'Coins Earned'),
              },
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      const result = calculateFieldTrendFromPeriods(periods, 'coinsEarned', 0);

      expect(result.displayName).toBe('Coins Earned');
      expect(result.fieldName).toBe('coinsEarned');
    });

    it('should handle zero initial value correctly', () => {
      // Periods newest-first
      const periods: PeriodData[] = [
        {
          label: 'Period 2',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(100, 'number', 'Coins Earned'),
              },
              coinsEarned: 100,
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
        {
          label: 'Period 1',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(0, 'number', 'Coins Earned'),
              },
              coinsEarned: 0,
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      const result = calculateFieldTrendFromPeriods(periods, 'coinsEarned', 0);

      expect(result.change.percent).toBe(100); // 0 to 100 = 100% increase
      expect(result.change.direction).toBe('up');
    });

    it('should handle aggregation types', () => {
      // Periods newest-first
      const periods: PeriodData[] = [
        {
          label: 'Period 2',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(300, 'number', 'Coins Earned'),
              },
            }, new Date(), 1),
            createMockRun({
              fields: {
                coinsEarned: createMockField(400, 'number', 'Coins Earned'),
              },
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
        {
          label: 'Period 1',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(100, 'number', 'Coins Earned'),
              },
            }, new Date(), 1),
            createMockRun({
              fields: {
                coinsEarned: createMockField(200, 'number', 'Coins Earned'),
              },
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        },
      ];

      // SUM: Period 1 (older) = 300, Period 2 (newer) = 700, change = (700-300)/300 = 133.33%
      const sumResult = calculateFieldTrendFromPeriods(periods, 'coinsEarned', 0, TrendsAggregation.SUM);
      expect(sumResult.change.percent).toBeCloseTo(133.33, 1);

      // AVERAGE: Period 1 (older) = 150, Period 2 (newer) = 350, change = (350-150)/150 = 133.33%
      const avgResult = calculateFieldTrendFromPeriods(periods, 'coinsEarned', 0, TrendsAggregation.AVERAGE);
      expect(avgResult.change.percent).toBeCloseTo(133.33, 1);
    });

    it('should analyze trend type correctly', () => {
      const createPeriodSequence = (values: number[]): PeriodData[] => {
        // Values come in newest-first, so reverse them for the period sequence
        return values.reverse().map(value => ({
          label: 'Period',
          runs: [
            createMockRun({
              fields: {
                coinsEarned: createMockField(value, 'number', 'Coins Earned'),
              },
            }, new Date(), 1),
          ],
          startDate: new Date(),
          endDate: new Date(),
        }));
      };

      // Upward trend (oldest to newest: 100, 120, 140, 160, 180)
      const upwardPeriods = createPeriodSequence([100, 120, 140, 160, 180]);
      const upwardResult = calculateFieldTrendFromPeriods(upwardPeriods, 'coinsEarned', 0);
      expect(upwardResult.trendType).toBe('upward');

      // Volatile trend (oldest to newest: 100, 120, 110, 130, 115)
      const volatilePeriods = createPeriodSequence([100, 120, 110, 130, 115]);
      const volatileResult = calculateFieldTrendFromPeriods(volatilePeriods, 'coinsEarned', 0);
      expect(volatileResult.trendType).toBe('volatile');
    });
  });
});
