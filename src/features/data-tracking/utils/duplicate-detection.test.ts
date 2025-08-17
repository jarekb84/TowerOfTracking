import { describe, it, expect } from 'vitest';
import { 
  generateCompositeKey, 
  detectDuplicate, 
  detectBatchDuplicates,
  generateCompositeKeysSet,
  analyzeKeyCollisions
} from './duplicate-detection';
import type { ParsedGameRun } from '../types/game-run.types';

// Helper function to create a mock ParsedGameRun for testing
function createMockRun(overrides: Partial<ParsedGameRun> = {}): ParsedGameRun {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date('2024-01-01T12:00:00Z'),
    fields: {},
    tier: 10,
    wave: 5000,
    coinsEarned: 1000000,
    cellsEarned: 50000,
    realTime: 7200, // 2 hours
    runType: 'farm',
    _fieldsByOriginalKey: new Map(),
    ...overrides
  };
}

describe('Duplicate Detection', () => {
  describe('generateCompositeKey', () => {
    it('should generate consistent keys for identical runs', () => {
      const run1 = createMockRun();
      const run2 = createMockRun();
      
      expect(generateCompositeKey(run1)).toBe(generateCompositeKey(run2));
    });

    it('should generate different keys for different runs', () => {
      const run1 = createMockRun({ tier: 10 });
      const run2 = createMockRun({ tier: 11 });
      
      expect(generateCompositeKey(run1)).not.toBe(generateCompositeKey(run2));
    });

    it('should use human-readable duration format', () => {
      const run = createMockRun({ realTime: 7265 }); // 2h 1m 5s
      const key = generateCompositeKey(run);
      
      expect(key).toBe('10|5000|2h 1m 5s');
    });

    it('should handle zero duration', () => {
      const run = createMockRun({ realTime: 0 });
      const key = generateCompositeKey(run);
      
      expect(key).toBe('10|5000|0h 0m 0s');
    });

    it('should be consistent for exact same duration', () => {
      const run1 = createMockRun({ realTime: 7265 });
      const run2 = createMockRun({ realTime: 7265 });
      
      expect(generateCompositeKey(run1)).toBe(generateCompositeKey(run2));
    });
  });

  describe('detectDuplicate', () => {
    it('should detect no duplicate when keys are empty', () => {
      const run = createMockRun();
      const result = detectDuplicate(run, new Set(), []);
      
      expect(result.isDuplicate).toBe(false);
      expect(result.existingRun).toBeUndefined();
    });

    it('should detect duplicate when key exists', () => {
      const existingRun = createMockRun();
      const newRun = createMockRun();
      const existingKeys = generateCompositeKeysSet([existingRun]);
      
      const result = detectDuplicate(newRun, existingKeys, [existingRun]);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.existingRun).toBe(existingRun);
    });

    it('should not detect duplicate for different runs', () => {
      const existingRun = createMockRun({ tier: 10 });
      const newRun = createMockRun({ tier: 11 });
      const existingKeys = generateCompositeKeysSet([existingRun]);
      
      const result = detectDuplicate(newRun, existingKeys, [existingRun]);
      
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('detectBatchDuplicates', () => {
    it('should separate new runs from duplicates', () => {
      const existingRun = createMockRun({ tier: 10 });
      const newRun1 = createMockRun({ tier: 10 }); // duplicate
      const newRun2 = createMockRun({ tier: 11 }); // unique
      
      const existingKeys = generateCompositeKeysSet([existingRun]);
      const result = detectBatchDuplicates([newRun1, newRun2], existingKeys, [existingRun]);
      
      expect(result.newRuns).toHaveLength(1);
      expect(result.duplicates).toHaveLength(1);
      expect(result.newRuns[0]).toBe(newRun2);
      expect(result.duplicates[0].newRun).toBe(newRun1);
    });

    it('should handle duplicates within the same batch', () => {
      const run1 = createMockRun({ tier: 10 });
      const run2 = createMockRun({ tier: 10 }); // duplicate of run1
      const run3 = createMockRun({ tier: 11 }); // unique
      
      const result = detectBatchDuplicates([run1, run2, run3], new Set(), []);
      
      expect(result.newRuns).toHaveLength(2); // run1 and run3
      expect(result.duplicates).toHaveLength(0); // run2 is duplicate within batch, so ignored
    });
  });

  describe('generateCompositeKeysSet', () => {
    it('should generate unique keys for different runs', () => {
      const runs = [
        createMockRun({ tier: 10 }),
        createMockRun({ tier: 11 }),
        createMockRun({ tier: 12 })
      ];
      
      const keys = generateCompositeKeysSet(runs);
      
      expect(keys.size).toBe(3);
    });

    it('should generate same key for identical runs', () => {
      const runs = [
        createMockRun({ tier: 10 }),
        createMockRun({ tier: 10 }),
        createMockRun({ tier: 11 })
      ];
      
      const keys = generateCompositeKeysSet(runs);
      
      expect(keys.size).toBe(2); // Two unique keys
    });
  });

  describe('analyzeKeyCollisions', () => {
    it('should detect no collisions for unique runs', () => {
      const runs = [
        createMockRun({ tier: 10 }),
        createMockRun({ tier: 11 }),
        createMockRun({ tier: 12 })
      ];
      
      const analysis = analyzeKeyCollisions(runs);
      
      expect(analysis.totalRuns).toBe(3);
      expect(analysis.uniqueKeys).toBe(3);
      expect(analysis.collisions).toHaveLength(0);
    });

    it('should detect collisions for identical runs', () => {
      const runs = [
        createMockRun({ tier: 10 }),
        createMockRun({ tier: 10 }), // collision
        createMockRun({ tier: 11 })
      ];
      
      const analysis = analyzeKeyCollisions(runs);
      
      expect(analysis.totalRuns).toBe(3);
      expect(analysis.uniqueKeys).toBe(2);
      expect(analysis.collisions).toHaveLength(1);
      expect(analysis.collisions[0].runs).toHaveLength(2);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      // Create 1000 unique runs
      const runs = Array.from({ length: 1000 }, (_, i) => 
        createMockRun({ tier: i % 20, wave: 5000 + i })
      );
      
      const start = performance.now();
      const keys = generateCompositeKeysSet(runs);
      const end = performance.now();
      
      expect(keys.size).toBe(1000);
      expect(end - start).toBeLessThan(100); // Should complete within 100ms
    });

    it('should efficiently detect duplicates in large batches', () => {
      // Create 500 existing runs
      const existingRuns = Array.from({ length: 500 }, (_, i) => 
        createMockRun({ tier: i % 10, wave: 5000 + i })
      );
      
      // Create batch with 100 new runs and 50 duplicates
      const newBatch = [
        ...Array.from({ length: 100 }, (_, i) => 
          createMockRun({ tier: 15, wave: 6000 + i }) // All unique
        ),
        ...existingRuns.slice(0, 50) // 50 duplicates
      ];
      
      const existingKeys = generateCompositeKeysSet(existingRuns);
      
      const start = performance.now();
      const result = detectBatchDuplicates(newBatch, existingKeys, existingRuns);
      const end = performance.now();
      
      expect(result.newRuns).toHaveLength(100);
      expect(result.duplicates).toHaveLength(50);
      expect(end - start).toBeLessThan(50); // Should complete within 50ms
    });
  });
});