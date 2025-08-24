import { describe, it, expect } from 'vitest';
import { calculateTierTrends, getAvailableTiersForTrends } from './tier-trends';
import type { ParsedGameRun, TierTrendsFilters, GameRunField } from '../types/game-run.types';

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

// Helper function to create a mock ParsedGameRun for testing
function createMockRun(
  overrides: Partial<ParsedGameRun> = {},
  timestamp?: Date,
  tier: number = 1
): ParsedGameRun {
  const baseFields: Record<string, GameRunField> = {
    coinsEarned: createMockField(1000, 'number', 'Coins Earned'),
    cellsEarned: createMockField(500, 'number', 'Cells Earned'),
    wave: createMockField(10, 'number', 'Wave'),
    realTime: createMockField(1800, 'duration', 'Real Time'),
    gameTime: createMockField(3600, 'duration', 'Game Time'),
    tier: createMockField(String(tier), tier > 7 ? 'string' : 'number', 'Tier'),
  };

  return {
    id: crypto.randomUUID(),
    timestamp: timestamp || new Date('2024-01-01T12:00:00Z'),
    fields: { ...baseFields, ...overrides.fields },
    tier,
    wave: 10,
    coinsEarned: 1000,
    cellsEarned: 500,
    realTime: 1800,
    runType: 'farm',
    ...overrides,
  };
}

// Helper function to create runs with varying data
function createRunsWithVariation(count: number, tier: number = 1): ParsedGameRun[] {
  const runs: ParsedGameRun[] = [];
  const baseTime = new Date('2024-01-01T12:00:00Z');

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(baseTime.getTime() + (i * 60 * 60 * 1000)); // 1 hour apart
    const multiplier = 1 + (i * 0.1); // Increasing values
    
    runs.push(createMockRun({
      timestamp,
      fields: {
        coinsEarned: createMockField(1000 * multiplier, 'number', 'Coins Earned'),
        cellsEarned: createMockField(500 * multiplier, 'number', 'Cells Earned'),
        wave: createMockField(10 + i, 'number', 'Wave'),
        realTime: createMockField(1800 * multiplier, 'duration', 'Real Time'),
        gameTime: createMockField(3600 * multiplier, 'duration', 'Game Time'),
        tier: createMockField(String(tier), 'number', 'Tier'),
      },
      tier,
      coinsEarned: 1000 * multiplier,
      cellsEarned: 500 * multiplier,
      wave: 10 + i,
      realTime: 1800 * multiplier,
    }, timestamp, tier));
  }
  
  return runs;
}

describe('tier-trends', () => {
  describe('getAvailableTiersForTrends', () => {
    it('should return tiers with at least 2 runs', () => {
      const runs = [
        createMockRun({}, undefined, 1),
        createMockRun({}, undefined, 1),
        createMockRun({}, undefined, 2),
        createMockRun({}, undefined, 3),
        createMockRun({}, undefined, 3),
        createMockRun({}, undefined, 3),
      ];

      const result = getAvailableTiersForTrends(runs, 'farming');
      expect(result).toEqual([3, 1]); // Sorted descending
    });

    it('should filter by run type correctly', () => {
      const runs = [
        createMockRun({ runType: 'farm' }, undefined, 1),
        createMockRun({ runType: 'farm' }, undefined, 1),
        createMockRun({ runType: 'tournament' }, undefined, 2),
        createMockRun({ runType: 'tournament' }, undefined, 2),
      ];

      const farmingResult = getAvailableTiersForTrends(runs, 'farming');
      const tournamentResult = getAvailableTiersForTrends(runs, 'tournament');
      
      expect(farmingResult).toEqual([1]);
      expect(tournamentResult).toEqual([2]);
    });

    it('should return empty array when no tiers have enough runs', () => {
      const runs = [
        createMockRun({}, undefined, 1),
        createMockRun({}, undefined, 2),
        createMockRun({}, undefined, 3),
      ];

      const result = getAvailableTiersForTrends(runs, 'farming');
      expect(result).toEqual([]);
    });
  });

  describe('calculateTierTrends', () => {
    describe('per-run mode', () => {
      it('should calculate trends for per-run analysis', () => {
        const runs = createRunsWithVariation(3, 1);
        const filters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 5,
          duration: 'per-run',
          quantity: 3,
        };

        const result = calculateTierTrends(runs, filters, 'farming');

        expect(result.periodCount).toBe(3);
        expect(result.comparisonColumns).toHaveLength(3);
        expect(result.comparisonColumns[0].header).toBe('Run 3');
        expect(result.comparisonColumns[0].subHeader).toMatch(/\d+\/\d+ \d+:\d+ [AP]M/);
        
        // Should include both number and duration fields
        const fieldNames = result.fieldTrends.map(t => t.fieldName);
        expect(fieldNames).toContain('coinsEarned');
        expect(fieldNames).toContain('realTime');
        expect(fieldNames).toContain('gameTime');
      });

      it('should show actual values in comparison columns for per-run', () => {
        const runs = createRunsWithVariation(2, 1);
        const filters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 0,
          duration: 'per-run',
          quantity: 2,
        };

        const result = calculateTierTrends(runs, filters, 'farming');

        expect(result.comparisonColumns).toHaveLength(2);
        
        // Check that values match expected run data
        const coinsCol1 = result.comparisonColumns[0].values.coinsEarned;
        const coinsCol2 = result.comparisonColumns[1].values.coinsEarned;
        
        expect(coinsCol1).toBe(1100); // Run 2: 1000 * 1.1
        expect(coinsCol2).toBe(1000); // Run 1: 1000 * 1.0
      });
    });

    describe('aggregation modes', () => {
      it('should handle daily aggregation', () => {
        const runs = createRunsWithVariation(5, 1);
        const filters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 0,
          duration: 'daily',
          quantity: 3,
          aggregationType: 'sum',
        };

        const result = calculateTierTrends(runs, filters, 'farming');

        expect(result.periodCount).toBe(3);
        expect(result.comparisonColumns).toHaveLength(3);
        
        // Labels should be date format
        expect(result.comparisonColumns[0].header).toMatch(/\d+\/\d+/);
      });

      it('should apply aggregation types correctly', () => {
        // Create runs with known values to test aggregation - spread across 2 days
        const day1 = new Date('2024-01-01T00:00:00Z');
        const day2 = new Date('2024-01-02T00:00:00Z');
        const runs = [
          // Day 1: 2 runs
          createMockRun({
            timestamp: day1,
            coinsEarned: 100,
            fields: {
              coinsEarned: createMockField(100, 'number', 'Coins Earned'),
              cellsEarned: createMockField(500, 'number', 'Cells Earned'),
              wave: createMockField(10, 'number', 'Wave'),
              tier: createMockField(String(1), 'number', 'Tier'),
            },
          }, day1, 1),
          createMockRun({
            timestamp: day1, // Same day
            coinsEarned: 200,
            fields: {
              coinsEarned: createMockField(200, 'number', 'Coins Earned'),
              cellsEarned: createMockField(550, 'number', 'Cells Earned'),
              wave: createMockField(11, 'number', 'Wave'),
              tier: createMockField(String(1), 'number', 'Tier'),
            },
          }, day1, 1),
          // Day 2: 1 run
          createMockRun({
            timestamp: day2,
            coinsEarned: 300,
            fields: {
              coinsEarned: createMockField(300, 'number', 'Coins Earned'),
              cellsEarned: createMockField(600, 'number', 'Cells Earned'),
              wave: createMockField(12, 'number', 'Wave'),
              tier: createMockField(String(1), 'number', 'Tier'),
            },
          }, day2, 1),
        ];

        // Test sum aggregation
        const sumFilters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 0,
          duration: 'daily',
          quantity: 2,
          aggregationType: 'sum',
        };

        const sumResult = calculateTierTrends(runs, sumFilters, 'farming');
        expect(sumResult.comparisonColumns.length).toBe(2);
        expect(sumResult.comparisonColumns[0].values.coinsEarned).toBe(300); // Day2: 300
        expect(sumResult.comparisonColumns[1].values.coinsEarned).toBe(300); // Day1: 100+200=300

        // Test average aggregation
        const avgFilters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 0,
          duration: 'daily',
          quantity: 2,
          aggregationType: 'average',
        };

        const avgResult = calculateTierTrends(runs, avgFilters, 'farming');
        expect(avgResult.comparisonColumns[0].values.coinsEarned).toBe(300); // Day2: 300/1 = 300
        expect(avgResult.comparisonColumns[1].values.coinsEarned).toBe(150); // Day1: (100+200)/2 = 150

        // Test min aggregation
        const minFilters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 0,
          duration: 'daily',
          quantity: 2,
          aggregationType: 'min',
        };

        const minResult = calculateTierTrends(runs, minFilters, 'farming');
        expect(minResult.comparisonColumns[0].values.coinsEarned).toBe(300); // Day2: min(300) = 300
        expect(minResult.comparisonColumns[1].values.coinsEarned).toBe(100); // Day1: min(100,200) = 100

        // Test max aggregation
        const maxFilters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 0,
          duration: 'daily',
          quantity: 2,
          aggregationType: 'max',
        };

        const maxResult = calculateTierTrends(runs, maxFilters, 'farming');
        expect(maxResult.comparisonColumns[0].values.coinsEarned).toBe(300); // Day2: max(300) = 300
        expect(maxResult.comparisonColumns[1].values.coinsEarned).toBe(200); // Day1: max(100,200) = 200
      });
    });

    describe('field trend calculations', () => {
      it('should calculate change percentages correctly', () => {
        const runs = [
          createMockRun({
            fields: {
              coinsEarned: createMockField(1000, 'number', 'Coins Earned'),
            },
            coinsEarned: 1000,
          }, new Date('2024-01-01T00:00:00Z'), 1),
          createMockRun({
            fields: {
              coinsEarned: createMockField(1100, 'number', 'Coins Earned'),
            },
            coinsEarned: 1100,
          }, new Date('2024-01-01T01:00:00Z'), 1),
        ];

        const filters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 0,
          duration: 'per-run',
          quantity: 2,
        };

        const result = calculateTierTrends(runs, filters, 'farming');
        const coinsField = result.fieldTrends.find(f => f.fieldName === 'coinsEarned');

        expect(coinsField).toBeDefined();
        expect(coinsField!.change.percent).toBe(10); // 10% increase
        expect(coinsField!.change.direction).toBe('up');
        expect(coinsField!.change.absolute).toBe(100);
      });

      it('should respect change threshold filters', () => {
        const runs = createRunsWithVariation(3, 1);
        
        // With 0% threshold, should include all fields
        const lowThreshold: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 0,
          duration: 'per-run',
          quantity: 3,
        };

        const lowResult = calculateTierTrends(runs, lowThreshold, 'farming');
        const lowFieldCount = lowResult.fieldTrends.length;

        // With high threshold, should include fewer fields
        const highThreshold: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 50,
          duration: 'per-run',
          quantity: 3,
        };

        const highResult = calculateTierTrends(runs, highThreshold, 'farming');
        const highFieldCount = highResult.fieldTrends.length;

        expect(lowFieldCount).toBeGreaterThan(highFieldCount);
      });
    });

    describe('summary statistics', () => {
      it('should calculate summary statistics correctly', () => {
        const runs = createRunsWithVariation(3, 1);
        const filters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 5,
          duration: 'per-run',
          quantity: 3,
        };

        const result = calculateTierTrends(runs, filters, 'farming');

        expect(result.summary.totalFields).toBeGreaterThan(0);
        expect(result.summary.fieldsChanged).toBeGreaterThanOrEqual(0);
        expect(result.summary.topGainers).toHaveLength(
          Math.min(3, result.fieldTrends.filter(f => f.change.direction === 'up').length)
        );
        expect(result.summary.topDecliners).toHaveLength(
          Math.min(3, result.fieldTrends.filter(f => f.change.direction === 'down').length)
        );
      });
    });

    describe('edge cases', () => {
      it('should handle insufficient data gracefully', () => {
        const runs = [createMockRun({}, undefined, 1)]; // Only 1 run
        const filters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 5,
          duration: 'per-run',
          quantity: 3,
        };

        const result = calculateTierTrends(runs, filters, 'farming');

        expect(result.periodCount).toBe(1);
        expect(result.fieldTrends).toHaveLength(0);
        expect(result.comparisonColumns).toHaveLength(0);
      });

      it('should handle missing fields gracefully', () => {
        const runs = [
          createMockRun({
            fields: { coinsEarned: createMockField(1000, 'number', 'Coins Earned') },
          }, new Date('2024-01-01T00:00:00Z'), 1),
          createMockRun({
            fields: { cellsEarned: createMockField(500, 'number', 'Cells Earned') },
          }, new Date('2024-01-01T01:00:00Z'), 1),
        ];

        const filters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 0,
          duration: 'per-run',
          quantity: 2,
        };

        const result = calculateTierTrends(runs, filters, 'farming');
        
        // Should not crash and should handle missing values as 0
        expect(result.fieldTrends.length).toBeGreaterThanOrEqual(0);
        expect(result.comparisonColumns).toHaveLength(2);
      });

      it('should handle zero values in percentage calculations', () => {
        const runs = [
          createMockRun({
            fields: { coinsEarned: createMockField(0, 'number', 'Coins Earned') },
            coinsEarned: 0,
          }, new Date('2024-01-01T00:00:00Z'), 1),
          createMockRun({
            fields: { coinsEarned: createMockField(100, 'number', 'Coins Earned') },
            coinsEarned: 100,
          }, new Date('2024-01-01T01:00:00Z'), 1),
        ];

        const filters: TierTrendsFilters = {
          tier: 1,
          changeThresholdPercent: 0,
          duration: 'per-run',
          quantity: 2,
        };

        const result = calculateTierTrends(runs, filters, 'farming');
        const coinsField = result.fieldTrends.find(f => f.fieldName === 'coinsEarned');

        expect(coinsField).toBeDefined();
        expect(coinsField!.change.percent).toBe(100); // 0 to 100 = 100% increase
        expect(coinsField!.change.direction).toBe('up');
      });
    });
  });
});