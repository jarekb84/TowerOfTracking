import { describe, it, expect } from 'vitest';
import { parseGameRun } from '@/features/analysis/shared/parsing/data-parser';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import {
  generateCompositeKey,
  detectDuplicate,
  detectBatchDuplicates,
  generateCompositeKeysSet
} from '@/shared/domain/duplicate-detection/duplicate-detection';

describe('Duplicate Detection Integration', () => {
  // Sample game data that would come from clipboard
  const sampleGameData1 = `
Game Time        1d 13h 24m 51s
Real Time        7h 46m 6s
Tier        10
Wave        5881
Coins Earned        1.13T
Cash Earned        $44.65B
Cells Earned        45.2K
Killed By        Wall
`;

  const sampleGameData2 = `
Game Time        1d 13h 24m 51s
Real Time        7h 46m 6s
Tier        10
Wave        5881
Coins Earned        1.15T
Cash Earned        $46.32B
Cells Earned        47.1K
Killed By        Wall
`;

  const sampleGameData3 = `
Game Time        2d 5h 12m 15s
Real Time        8h 12m 30s
Tier        11
Wave        6200
Coins Earned        1.45T
Cash Earned        $52.18B
Cells Earned        52.1K
Killed By        Elite
`;

  describe('Single Run Import with Duplicate Detection', () => {
    it('should detect no duplicate for first import', () => {
      const run1 = parseGameRun(sampleGameData1);
      const existingKeys = new Set<string>();
      const existingRuns: ParsedGameRun[] = [];
      
      const result = detectDuplicate(run1, existingKeys, existingRuns);
      
      expect(result.isDuplicate).toBe(false);
      expect(result.existingRun).toBeUndefined();
      expect(result.compositeKey).toBe('10|5881|7h 46m 6s');
    });

    it('should detect duplicate for same game data', () => {
      const run1 = parseGameRun(sampleGameData1);
      const run2 = parseGameRun(sampleGameData2); // Same tier, wave, realTime but different coins
      
      const existingRuns = [run1];
      const existingKeys = generateCompositeKeysSet(existingRuns);
      
      const result = detectDuplicate(run2, existingKeys, existingRuns);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.existingRun).toBe(run1);
      expect(result.compositeKey).toBe('10|5881|7h 46m 6s');
    });

    it('should not detect duplicate for different game data', () => {
      const run1 = parseGameRun(sampleGameData1);
      const run3 = parseGameRun(sampleGameData3);
      
      const existingRuns = [run1];
      const existingKeys = generateCompositeKeysSet(existingRuns);
      
      const result = detectDuplicate(run3, existingKeys, existingRuns);
      
      expect(result.isDuplicate).toBe(false);
      expect(result.compositeKey).toBe('11|6200|8h 12m 30s');
    });
  });

  describe('Batch Import with Duplicate Detection', () => {
    it('should separate new runs from duplicates in batch import', () => {
      const existingRun = parseGameRun(sampleGameData1);
      const existingRuns = [existingRun];
      const existingKeys = generateCompositeKeysSet(existingRuns);
      
      const batchRuns = [
        parseGameRun(sampleGameData2), // duplicate of existing
        parseGameRun(sampleGameData3), // new run
      ];
      
      const result = detectBatchDuplicates(batchRuns, existingKeys, existingRuns);
      
      expect(result.newRuns).toHaveLength(1);
      expect(result.duplicates).toHaveLength(1);
      expect(result.newRuns[0].tier).toBe(11); // The unique run
      expect(result.duplicates[0].newRun.tier).toBe(10); // The duplicate
      expect(result.duplicates[0].existingRun).toBe(existingRun);
    });

    it('should handle duplicates within the same batch', () => {
      const batchRuns = [
        parseGameRun(sampleGameData1),
        parseGameRun(sampleGameData2), // duplicate within batch
        parseGameRun(sampleGameData3), // unique
      ];
      
      const result = detectBatchDuplicates(batchRuns, new Set(), []);
      
      expect(result.newRuns).toHaveLength(2); // First occurrence + unique run
      expect(result.duplicates).toHaveLength(0); // Within-batch duplicates are ignored
    });
  });

  describe('Key Generation from Real Game Data', () => {
    it('should generate consistent keys from parsed game data', () => {
      const run1 = parseGameRun(sampleGameData1);
      const run2 = parseGameRun(sampleGameData2);
      
      expect(generateCompositeKey(run1)).toBe(generateCompositeKey(run2));
      expect(generateCompositeKey(run1)).toBe('10|5881|7h 46m 6s');
    });

    it('should extract correct values from game data', () => {
      const run = parseGameRun(sampleGameData1);
      
      expect(run.tier).toBe(10);
      expect(run.wave).toBe(5881);
      expect(run.realTime).toBe(27966); // 7h 46m 6s in seconds
      expect(run.coinsEarned).toBe(1130000000000); // 1.13T
      expect(run.cellsEarned).toBe(45200); // 45.2K
    });

    it('should handle different duration formats consistently', () => {
      const data1 = `
Real Time        7h 46m 6s
Tier        10
Wave        5881
`;
      
      const data2 = `
Real Time        7H 46M 6S
Tier        10
Wave        5881
`;
      
      const run1 = parseGameRun(data1);
      const run2 = parseGameRun(data2);
      
      expect(generateCompositeKey(run1)).toBe(generateCompositeKey(run2));
    });
  });

  describe('Performance with Realistic Data', () => {
    it('should efficiently handle typical user data volumes', () => {
      // Simulate a user with 6 months of data (4 runs per day)
      const existingRuns = Array.from({ length: 720 }, (_, i) => {
        const tier = 8 + (i % 8); // Tiers 8-15
        const wave = 4000 + (i * 10); // Progressive waves
        const realTime = 6000 + (i % 3600); // Varying durations
        
        return parseGameRun(`
Real Time        ${Math.floor(realTime / 3600)}h ${Math.floor((realTime % 3600) / 60)}m ${realTime % 60}s
Tier        ${tier}
Wave        ${wave}
`);
      });
      
      const existingKeys = generateCompositeKeysSet(existingRuns);
      
      // Simulate importing a week's worth of data with some duplicates
      const newBatch = Array.from({ length: 28 }, (_, i) => {
        if (i < 10) {
          // First 10 are duplicates from existing data
          return existingRuns[i];
        } else {
          // Rest are new unique runs
          const tier = 16 + (i % 4);
          const wave = 8000 + (i * 5);
          const realTime = 7200 + (i * 60);
          
          return parseGameRun(`
Real Time        ${Math.floor(realTime / 3600)}h ${Math.floor((realTime % 3600) / 60)}m ${realTime % 60}s
Tier        ${tier}
Wave        ${wave}
`);
        }
      });
      
      const start = performance.now();
      const result = detectBatchDuplicates(newBatch, existingKeys, existingRuns);
      const end = performance.now();
      
      expect(result.duplicates).toHaveLength(10);
      expect(result.newRuns).toHaveLength(18);
      expect(end - start).toBeLessThan(100); // Should complete within 100ms
    });
  });
});