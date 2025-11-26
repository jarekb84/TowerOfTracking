import { describe, it, expect } from 'vitest';
import { getImportButtonText } from './import-button-text';
import type { CsvParseResult } from '../types';
import type { BatchDuplicateDetectionResult } from '@/shared/domain/duplicate-detection/duplicate-detection';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

describe('import-button-text', () => {
  const createMockRun = (): ParsedGameRun => ({
    id: 'run-1',
    tier: 11,
    wave: 100,
    timestamp: new Date(),
    fields: {},
    coinsEarned: 0,
    cellsEarned: 0,
    realTime: 0,
    runType: 'farm'
  });

  const createMockParseResult = (successCount: number): CsvParseResult => ({
    success: Array(successCount).fill(null).map(createMockRun),
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

  describe('getImportButtonText', () => {
    it('should return import count when no duplicates', () => {
      const result = getImportButtonText(null, 'new-only', createMockParseResult(5));

      expect(result).toBe('Import 5 Runs');
    });

    it('should return import count when duplicates exist but none found', () => {
      const duplicateResult: BatchDuplicateDetectionResult = {
        newRuns: Array(3).fill(null).map(createMockRun),
        duplicates: [],
        compositeKeys: ['key1', 'key2', 'key3']
      };

      const result = getImportButtonText(duplicateResult, 'new-only', createMockParseResult(3));

      expect(result).toBe('Import 3 Runs');
    });

    it('should show new-only count when duplicates exist and resolution is new-only', () => {
      const duplicateResult: BatchDuplicateDetectionResult = {
        newRuns: Array(3).fill(null).map(createMockRun),
        duplicates: [{ newRun: createMockRun(), existingRun: createMockRun(), compositeKey: 'dup-key' }],
        compositeKeys: ['key1', 'key2', 'key3']
      };

      const result = getImportButtonText(duplicateResult, 'new-only', createMockParseResult(4));

      expect(result).toBe('Import 3 New Only');
    });

    it('should show overwrite count when resolution is overwrite', () => {
      const duplicateResult: BatchDuplicateDetectionResult = {
        newRuns: Array(2).fill(null).map(createMockRun),
        duplicates: [
          { newRun: createMockRun(), existingRun: createMockRun(), compositeKey: 'dup-key1' },
          { newRun: createMockRun(), existingRun: createMockRun(), compositeKey: 'dup-key2' }
        ],
        compositeKeys: ['key1', 'key2']
      };

      const result = getImportButtonText(duplicateResult, 'overwrite', createMockParseResult(4));

      expect(result).toBe('Import 2 + Overwrite 2');
    });

    it('should return 0 runs when parseResult is null', () => {
      const result = getImportButtonText(null, 'new-only', null);

      expect(result).toBe('Import 0 Runs');
    });

    it('should handle empty success array', () => {
      const result = getImportButtonText(null, 'new-only', createMockParseResult(0));

      expect(result).toBe('Import 0 Runs');
    });
  });
});
