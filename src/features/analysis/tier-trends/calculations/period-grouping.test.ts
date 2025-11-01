import { describe, it, expect } from 'vitest';
import { groupRunsByPeriod, getPeriodBounds } from './period-grouping';
import { TrendsDuration } from '../types';
import { createMockRun, createRunsWithVariation } from './__tests__/test-helpers';

describe('period-grouping', () => {
  describe('groupRunsByPeriod', () => {
    describe('PER_RUN mode', () => {
      it('should create individual period for each run', () => {
        const runs = createRunsWithVariation(3, 1);
        const periods = groupRunsByPeriod(runs, TrendsDuration.PER_RUN, 3);

        expect(periods).toHaveLength(3);
        expect(periods[0].runs).toHaveLength(1);
        expect(periods[1].runs).toHaveLength(1);
        expect(periods[2].runs).toHaveLength(1);
      });

      it('should use enhanced headers for per-run periods', () => {
        const runs = createRunsWithVariation(2, 1);
        const periods = groupRunsByPeriod(runs, TrendsDuration.PER_RUN, 2);

        // Check that labels have enhanced format (multi-line tier/wave/duration/date)
        const headerLines = periods[0].label.split('\n');
        expect(headerLines).toHaveLength(3);
        expect(headerLines[0]).toMatch(/T\d+ \d+,?\d*/); // T1 12 format
        expect(headerLines[1]).toMatch(/\d+min|\d+hr \d+min/); // duration format
        expect(headerLines[2]).toMatch(/\d+\/\d+ \d+:\d+ [AP]M/); // date format
      });

      it('should limit runs to requested quantity', () => {
        const runs = createRunsWithVariation(5, 1);
        const periods = groupRunsByPeriod(runs, TrendsDuration.PER_RUN, 3);

        expect(periods).toHaveLength(3);
      });
    });

    describe('DAILY mode', () => {
      it('should group runs by day', () => {
        const day1 = new Date('2024-01-01T00:00:00Z');
        const day2 = new Date('2024-01-02T00:00:00Z');
        const runs = [
          createMockRun({}, day2, 1),
          createMockRun({}, day2, 1),
          createMockRun({}, day1, 1),
        ];

        const periods = groupRunsByPeriod(runs, TrendsDuration.DAILY, 2);

        expect(periods).toHaveLength(2);
        expect(periods[0].runs).toHaveLength(2); // Day 2 (most recent)
        expect(periods[1].runs).toHaveLength(1); // Day 1
      });

      it('should format daily labels correctly', () => {
        const runs = createRunsWithVariation(1, 1);
        const periods = groupRunsByPeriod(runs, TrendsDuration.DAILY, 1);

        expect(periods[0].label).toMatch(/\d+\/\d+/); // Month/Day format
      });
    });

    describe('WEEKLY mode', () => {
      it('should group runs by week', () => {
        const week1 = new Date('2024-01-01T00:00:00Z'); // Monday
        const week2 = new Date('2024-01-08T00:00:00Z'); // Next Monday
        const runs = [
          createMockRun({}, week2, 1),
          createMockRun({}, week2, 1),
          createMockRun({}, week1, 1),
        ];

        const periods = groupRunsByPeriod(runs, TrendsDuration.WEEKLY, 2);

        expect(periods).toHaveLength(2);
        expect(periods[0].runs).toHaveLength(2); // Week 2 (most recent)
        expect(periods[1].runs).toHaveLength(1); // Week 1
      });

      it('should format weekly labels correctly', () => {
        const runs = createRunsWithVariation(1, 1);
        const periods = groupRunsByPeriod(runs, TrendsDuration.WEEKLY, 1);

        expect(periods[0].label).toMatch(/Week of \d+\/\d+/);
      });
    });

    describe('MONTHLY mode', () => {
      it('should group runs by month', () => {
        const month1 = new Date('2024-01-15T00:00:00Z');
        const month2 = new Date('2024-02-15T00:00:00Z');
        const runs = [
          createMockRun({}, month2, 1),
          createMockRun({}, month2, 1),
          createMockRun({}, month1, 1),
        ];

        const periods = groupRunsByPeriod(runs, TrendsDuration.MONTHLY, 2);

        expect(periods).toHaveLength(2);
        expect(periods[0].runs).toHaveLength(2); // Month 2 (most recent)
        expect(periods[1].runs).toHaveLength(1); // Month 1
      });

      it('should format monthly labels correctly', () => {
        const runs = createRunsWithVariation(1, 1);
        const periods = groupRunsByPeriod(runs, TrendsDuration.MONTHLY, 1);

        expect(periods[0].label).toMatch(/^[A-Z][a-z]{2}$/); // Short month name like "Jan"
      });
    });

    it('should use latest run timestamp as reference point', () => {
      const latestRun = new Date('2024-06-15T12:00:00Z');
      const olderRun = new Date('2024-06-14T12:00:00Z');
      const runs = [
        createMockRun({}, latestRun, 1),
        createMockRun({}, olderRun, 1),
      ];

      const periods = groupRunsByPeriod(runs, TrendsDuration.DAILY, 2);

      // Should group relative to latest run (6/15), not current date
      expect(periods[0].startDate.getDate()).toBe(15); // Today (relative to latest run)
      expect(periods[1].startDate.getDate()).toBe(14); // Yesterday (relative to latest run)
    });

    it('should include empty periods for consistency', () => {
      const runs = [createMockRun({}, new Date('2024-01-01T00:00:00Z'), 1)];
      const periods = groupRunsByPeriod(runs, TrendsDuration.DAILY, 3);

      expect(periods).toHaveLength(3);
      expect(periods[0].runs).toHaveLength(1); // Run is in first period
      expect(periods[1].runs).toHaveLength(0); // Empty period
      expect(periods[2].runs).toHaveLength(0); // Empty period
    });
  });

  describe('getPeriodBounds', () => {
    const referenceDate = new Date('2024-06-15T12:00:00Z'); // Saturday

    describe('DAILY', () => {
      it('should return correct bounds for current day', () => {
        const { startDate, endDate, label } = getPeriodBounds(referenceDate, TrendsDuration.DAILY, 0);

        expect(startDate.getHours()).toBe(0);
        expect(startDate.getMinutes()).toBe(0);
        expect(endDate.getHours()).toBe(23);
        expect(endDate.getMinutes()).toBe(59);
        expect(startDate.getDate()).toBe(15);
        expect(label).toBe('6/15');
      });

      it('should return correct bounds for previous day', () => {
        const { startDate, endDate, label } = getPeriodBounds(referenceDate, TrendsDuration.DAILY, 1);

        expect(startDate.getDate()).toBe(14);
        expect(endDate.getDate()).toBe(14);
        expect(label).toBe('6/14');
      });
    });

    describe('WEEKLY', () => {
      it('should return correct bounds for current week', () => {
        const { startDate, endDate, label } = getPeriodBounds(referenceDate, TrendsDuration.WEEKLY, 0);

        // Week should start on Sunday (6/9) and end on Saturday (6/15)
        expect(startDate.getDay()).toBe(0); // Sunday
        expect(endDate.getDay()).toBe(6); // Saturday
        expect(startDate.getDate()).toBe(9);
        expect(endDate.getDate()).toBe(15);
        expect(label).toBe('Week of 6/9');
      });

      it('should return correct bounds for previous week', () => {
        const { startDate, endDate, label } = getPeriodBounds(referenceDate, TrendsDuration.WEEKLY, 1);

        expect(startDate.getDay()).toBe(0); // Sunday
        expect(endDate.getDay()).toBe(6); // Saturday
        expect(startDate.getDate()).toBe(2);
        expect(endDate.getDate()).toBe(8);
        expect(label).toBe('Week of 6/2');
      });
    });

    describe('MONTHLY', () => {
      it('should return correct bounds for current month', () => {
        const { startDate, endDate, label } = getPeriodBounds(referenceDate, TrendsDuration.MONTHLY, 0);

        expect(startDate.getDate()).toBe(1); // First day of month
        expect(endDate.getDate()).toBe(30); // Last day of June
        expect(startDate.getMonth()).toBe(5); // June (0-indexed)
        expect(label).toBe('Jun');
      });

      it('should return correct bounds for previous month', () => {
        const { startDate, endDate, label } = getPeriodBounds(referenceDate, TrendsDuration.MONTHLY, 1);

        expect(startDate.getDate()).toBe(1); // First day of month
        expect(endDate.getDate()).toBe(31); // Last day of May
        expect(startDate.getMonth()).toBe(4); // May (0-indexed)
        expect(label).toBe('May');
      });
    });

    describe('edge cases', () => {
      it('should throw error for unsupported duration type', () => {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getPeriodBounds(referenceDate, 'INVALID' as any, 0);
        }).toThrow('Unsupported duration: INVALID');
      });
    });
  });
});
