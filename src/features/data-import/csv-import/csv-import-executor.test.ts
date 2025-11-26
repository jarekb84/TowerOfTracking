import { describe, it, expect, vi } from 'vitest';
import { executeImport } from './csv-import-executor';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type { CsvParseResult } from './types';
import type { BatchDuplicateDetectionResult } from '@/shared/domain/duplicate-detection/duplicate-detection';

describe('csv-import-executor', () => {
  const createMockRun = (tier: number, wave: number): ParsedGameRun => ({
    id: `run-${tier}-${wave}`,
    tier,
    wave,
    timestamp: new Date(),
    fields: {},
    coinsEarned: 0,
    cellsEarned: 0,
    realTime: 0,
    runType: 'farm'
  });

  const createMockParseResult = (runs: ParsedGameRun[]): CsvParseResult => ({
    success: runs,
    failed: 0,
    errors: [],
    fieldMappingReport: {
      mappedFields: [],
      newFields: [],
      similarFields: [],
      unsupportedFields: [],
      skippedFields: []
    }
  });

  describe('executeImport', () => {
    it('should return false when parseResult is null', () => {
      const addRuns = vi.fn();
      const overwriteRun = vi.fn();

      const result = executeImport({
        parseResult: null,
        duplicateResult: null,
        resolution: 'new-only',
        addRuns,
        overwriteRun
      });

      expect(result).toBe(false);
      expect(addRuns).not.toHaveBeenCalled();
      expect(overwriteRun).not.toHaveBeenCalled();
    });

    it('should return false when parseResult has no success runs', () => {
      const addRuns = vi.fn();
      const overwriteRun = vi.fn();

      const result = executeImport({
        parseResult: createMockParseResult([]),
        duplicateResult: null,
        resolution: 'new-only',
        addRuns,
        overwriteRun
      });

      expect(result).toBe(false);
      expect(addRuns).not.toHaveBeenCalled();
    });

    it('should import all runs when no duplicates detected', () => {
      const addRuns = vi.fn();
      const overwriteRun = vi.fn();
      const runs = [createMockRun(11, 100), createMockRun(11, 200)];

      const result = executeImport({
        parseResult: createMockParseResult(runs),
        duplicateResult: null,
        resolution: 'new-only',
        addRuns,
        overwriteRun
      });

      expect(result).toBe(true);
      expect(addRuns).toHaveBeenCalledWith(runs, false);
      expect(overwriteRun).not.toHaveBeenCalled();
    });

    it('should only import new runs when resolution is new-only', () => {
      const addRuns = vi.fn();
      const overwriteRun = vi.fn();
      const newRuns = [createMockRun(11, 100)];
      const duplicateResult: BatchDuplicateDetectionResult = {
        newRuns,
        duplicates: [{ newRun: createMockRun(11, 200), existingRun: createMockRun(11, 200), compositeKey: '11|200|0s' }],
        compositeKeys: ['11|100|0s']
      };

      const result = executeImport({
        parseResult: createMockParseResult([...newRuns, createMockRun(11, 200)]),
        duplicateResult,
        resolution: 'new-only',
        addRuns,
        overwriteRun
      });

      expect(result).toBe(true);
      expect(addRuns).toHaveBeenCalledWith(newRuns, false);
      expect(overwriteRun).not.toHaveBeenCalled();
    });

    it('should import new runs and overwrite duplicates when resolution is overwrite', () => {
      const addRuns = vi.fn();
      const overwriteRun = vi.fn();
      const newRuns = [createMockRun(11, 100)];
      const existingRun = createMockRun(11, 200);
      const newDuplicateRun = createMockRun(11, 200);
      const duplicateResult: BatchDuplicateDetectionResult = {
        newRuns,
        duplicates: [{ newRun: newDuplicateRun, existingRun, compositeKey: '11|200|0s' }],
        compositeKeys: ['11|100|0s']
      };

      const result = executeImport({
        parseResult: createMockParseResult([...newRuns, newDuplicateRun]),
        duplicateResult,
        resolution: 'overwrite',
        addRuns,
        overwriteRun
      });

      expect(result).toBe(true);
      expect(addRuns).toHaveBeenCalledWith(newRuns, false);
      expect(overwriteRun).toHaveBeenCalledWith(existingRun.id, newDuplicateRun, true);
    });

    it('should not call addRuns for new runs when there are none during overwrite', () => {
      const addRuns = vi.fn();
      const overwriteRun = vi.fn();
      const existingRun = createMockRun(11, 200);
      const newDuplicateRun = createMockRun(11, 200);
      const duplicateResult: BatchDuplicateDetectionResult = {
        newRuns: [],
        duplicates: [{ newRun: newDuplicateRun, existingRun, compositeKey: '11|200|0s' }],
        compositeKeys: []
      };

      const result = executeImport({
        parseResult: createMockParseResult([newDuplicateRun]),
        duplicateResult,
        resolution: 'overwrite',
        addRuns,
        overwriteRun
      });

      expect(result).toBe(true);
      expect(addRuns).not.toHaveBeenCalled();
      expect(overwriteRun).toHaveBeenCalledWith(existingRun.id, newDuplicateRun, true);
    });

    it('should handle duplicates with null existingRun gracefully', () => {
      const addRuns = vi.fn();
      const overwriteRun = vi.fn();
      const newDuplicateRun = createMockRun(11, 200);
      const duplicateResult: BatchDuplicateDetectionResult = {
        newRuns: [],
        duplicates: [{ newRun: newDuplicateRun, existingRun: null as unknown as ParsedGameRun, compositeKey: '11|200|0s' }],
        compositeKeys: []
      };

      const result = executeImport({
        parseResult: createMockParseResult([newDuplicateRun]),
        duplicateResult,
        resolution: 'overwrite',
        addRuns,
        overwriteRun
      });

      expect(result).toBe(true);
      expect(overwriteRun).not.toHaveBeenCalled();
    });
  });
});
