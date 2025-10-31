import { describe, it, expect } from 'vitest';
import {
  calculateTotalDurationHours,
  calculateHourlyRate,
  formatHoursSubheader
} from './hourly-rate-calculations';
import type { ParsedGameRun, GameRunField } from '@/features/data-tracking/types/game-run.types';

// Helper function to create a mock field
function createMockField(
  value: number | string | Date,
  dataType: GameRunField['dataType'],
  originalKey: string
): GameRunField {
  return {
    value,
    rawValue: String(value),
    displayValue: String(value),
    originalKey,
    dataType,
  };
}

// Helper function to create a minimal mock run with specific duration
function createMockRun(realTimeSeconds: number): ParsedGameRun {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    fields: {
      realTime: createMockField(realTimeSeconds, 'duration', 'Real Time'),
      tier: createMockField('1', 'number', 'Tier'),
    },
    tier: 1,
    wave: 10,
    coinsEarned: 1000,
    cellsEarned: 500,
    realTime: realTimeSeconds,
    runType: 'farm',
  };
}

describe('hourly-rate-calculations', () => {
  describe('calculateTotalDurationHours', () => {
    it('should calculate total duration from multiple runs in hours', () => {
      const runs = [
        createMockRun(3600),  // 1 hour
        createMockRun(7200),  // 2 hours
        createMockRun(1800),  // 0.5 hours
      ];

      const result = calculateTotalDurationHours(runs);
      expect(result).toBe(3.5); // 1 + 2 + 0.5
    });

    it('should return 0 for empty runs array', () => {
      const result = calculateTotalDurationHours([]);
      expect(result).toBe(0);
    });

    it('should handle single run', () => {
      const runs = [createMockRun(36000)]; // 10 hours
      const result = calculateTotalDurationHours(runs);
      expect(result).toBe(10);
    });

    it('should handle runs with zero duration', () => {
      const runs = [
        createMockRun(0),
        createMockRun(3600),
      ];
      const result = calculateTotalDurationHours(runs);
      expect(result).toBe(1);
    });
  });

  describe('calculateHourlyRate', () => {
    it('should calculate hourly rate correctly', () => {
      const result = calculateHourlyRate(1000, 2);
      expect(result).toBe(500); // 1000 / 2 hours
    });

    it('should handle fractional hours', () => {
      const result = calculateHourlyRate(1500, 0.5);
      expect(result).toBe(3000); // 1500 / 0.5 hours
    });

    it('should return 0 when duration is 0 to prevent division-by-zero', () => {
      // Business rationale: Runs with zero duration have no meaningful hourly rate.
      // Returning 0 (rather than throwing or returning Infinity) treats these as
      // having no production value, which is semantically correct for comparison purposes.
      const result = calculateHourlyRate(1000, 0);
      expect(result).toBe(0);
    });

    it('should handle zero value', () => {
      const result = calculateHourlyRate(0, 5);
      expect(result).toBe(0);
    });

    it('should handle large values', () => {
      const result = calculateHourlyRate(10_000_000_000, 10);
      expect(result).toBe(1_000_000_000); // 10B / 10 hours = 1B/hour
    });
  });

  describe('calculateHourlyRate - per-run and aggregated period scenarios', () => {
    it('should calculate field hourly rate correctly', () => {
      const result = calculateHourlyRate(9_000_000_000, 10);
      expect(result).toBe(900_000_000); // 9B coins / 10 hours = 900M/hour
    });

    it('should handle per-run calculation (single run)', () => {
      const result = calculateHourlyRate(1000, 1);
      expect(result).toBe(1000); // 1000 coins / 1 hour = 1000/hour
    });

    it('should handle aggregated period calculation (multiple runs)', () => {
      // Total coins: 19B, Total duration: 20 hours
      const result = calculateHourlyRate(19_000_000_000, 20);
      expect(result).toBe(950_000_000); // 19B / 20h = 950M/hour
    });

    it('should return 0 when duration is 0 to prevent division-by-zero', () => {
      // Consistent with calculateHourlyRate: zero-duration periods have no hourly rate
      const result = calculateHourlyRate(5000, 0);
      expect(result).toBe(0);
    });

    it('should handle fractional durations', () => {
      const result = calculateHourlyRate(750, 0.5);
      expect(result).toBe(1500); // 750 / 0.5 hours = 1500/hour
    });
  });

  describe('formatHoursSubheader', () => {
    it('should format hours with 1 decimal place', () => {
      expect(formatHoursSubheader(25.75)).toBe('25.8 hours');
      expect(formatHoursSubheader(11.5)).toBe('11.5 hours');
      expect(formatHoursSubheader(21.46)).toBe('21.5 hours');
    });

    it('should use singular "hour" when value is 1', () => {
      expect(formatHoursSubheader(1.0)).toBe('1 hour');
      expect(formatHoursSubheader(1.04)).toBe('1 hour'); // Rounds to 1.0
    });

    it('should use plural "hours" for all other values', () => {
      expect(formatHoursSubheader(0)).toBe('0 hours');
      expect(formatHoursSubheader(0.5)).toBe('0.5 hours');
      expect(formatHoursSubheader(2.0)).toBe('2 hours');
      expect(formatHoursSubheader(100.123)).toBe('100.1 hours');
    });

    it('should round to nearest tenth', () => {
      expect(formatHoursSubheader(5.14)).toBe('5.1 hours');
      expect(formatHoursSubheader(5.15)).toBe('5.2 hours');
      expect(formatHoursSubheader(5.24)).toBe('5.2 hours');
      expect(formatHoursSubheader(5.25)).toBe('5.3 hours');
    });

    it('should handle whole numbers cleanly', () => {
      expect(formatHoursSubheader(10)).toBe('10 hours');
      expect(formatHoursSubheader(25)).toBe('25 hours');
    });
  });
});
