import { describe, it, expect } from 'vitest';
import {
  sumAggregation,
  averageAggregation,
  minAggregation,
  maxAggregation,
  hourlyAggregation
} from './aggregation-strategies';
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

describe('aggregation-strategies', () => {
  describe('sumAggregation', () => {
    it('should sum all values', () => {
      const result = sumAggregation([100, 200, 300]);
      expect(result).toBe(600);
    });

    it('should return 0 for empty array', () => {
      const result = sumAggregation([]);
      expect(result).toBe(0);
    });

    it('should handle single value', () => {
      const result = sumAggregation([42]);
      expect(result).toBe(42);
    });

    it('should handle negative values', () => {
      const result = sumAggregation([100, -50, 200]);
      expect(result).toBe(250);
    });
  });

  describe('averageAggregation', () => {
    it('should calculate average of values', () => {
      const result = averageAggregation([100, 200, 300]);
      expect(result).toBe(200);
    });

    it('should return 0 for empty array', () => {
      const result = averageAggregation([]);
      expect(result).toBe(0);
    });

    it('should handle single value', () => {
      const result = averageAggregation([42]);
      expect(result).toBe(42);
    });

    it('should handle fractional averages', () => {
      const result = averageAggregation([100, 150, 200]);
      expect(result).toBe(150);
    });
  });

  describe('minAggregation', () => {
    it('should find minimum value', () => {
      const result = minAggregation([300, 100, 200]);
      expect(result).toBe(100);
    });

    it('should return 0 for empty array', () => {
      const result = minAggregation([]);
      expect(result).toBe(0);
    });

    it('should handle single value', () => {
      const result = minAggregation([42]);
      expect(result).toBe(42);
    });

    it('should handle negative values', () => {
      const result = minAggregation([100, -50, 200]);
      expect(result).toBe(-50);
    });
  });

  describe('maxAggregation', () => {
    it('should find maximum value', () => {
      const result = maxAggregation([100, 300, 200]);
      expect(result).toBe(300);
    });

    it('should return 0 for empty array', () => {
      const result = maxAggregation([]);
      expect(result).toBe(0);
    });

    it('should handle single value', () => {
      const result = maxAggregation([42]);
      expect(result).toBe(42);
    });

    it('should handle negative values', () => {
      const result = maxAggregation([100, -50, 200]);
      expect(result).toBe(200);
    });
  });

  describe('hourlyAggregation', () => {
    it('should calculate hourly rate from total value and total duration', () => {
      const runs = [
        createMockRun(36000),  // 10 hours
        createMockRun(36000),  // 10 hours
      ];
      const values = [9_000_000_000, 10_000_000_000]; // 9B, 10B

      // Total: 19B coins, 20 hours => 950M/hour
      const result = hourlyAggregation(values, runs);
      expect(result).toBe(950_000_000);
    });

    it('should return 0 for empty values array', () => {
      const runs = [createMockRun(3600)];
      const result = hourlyAggregation([], runs);
      expect(result).toBe(0);
    });

    it('should handle single run', () => {
      const runs = [createMockRun(3600)]; // 1 hour
      const values = [1_000_000_000]; // 1B

      const result = hourlyAggregation(values, runs);
      expect(result).toBe(1_000_000_000); // 1B/hour
    });

    it('should return 0 when total duration is 0', () => {
      const runs = [createMockRun(0)];
      const values = [1000];

      const result = hourlyAggregation(values, runs);
      expect(result).toBe(0);
    });

    it('should handle fractional hours', () => {
      const runs = [createMockRun(1800)]; // 0.5 hours
      const values = [500_000_000]; // 500M

      const result = hourlyAggregation(values, runs);
      expect(result).toBe(1_000_000_000); // 1B/hour
    });
  });
});
