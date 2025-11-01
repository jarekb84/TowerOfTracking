import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCsvImport } from './use-csv-import';
import * as csvParser from './csv-parser';
import * as useDataHook from '@/shared/domain/use-data';
import type { DataContextType } from '@/shared/domain/use-data';
import type { GameRun, CsvParseResult } from '@/shared/types/game-run.types';
import type { BatchDuplicateDetectionResult } from '@/shared/domain/duplicate-detection/duplicate-detection';

// Mock dependencies
vi.mock('./csv-parser');
vi.mock('@/shared/domain/use-data');
vi.mock('./input/csv-file-upload', () => ({
  useFileImport: ({ onFileContent }: { onFileContent: (text: string) => void }) => ({
    importFile: () => onFileContent('mocked file content')
  })
}));

describe('useCsvImport - Import Operations', () => {
  const mockAddRuns = vi.fn();
  const mockDetectBatchDuplicates = vi.fn();
  const mockOverwriteRun = vi.fn();

  const mockParseResult: CsvParseResult = {
    success: [
      {
        id: '1',
        timestamp: new Date('2024-01-15T14:30:00'),
        tier: 10,
        wave: 5881,
        realTime: 28000,
        coinsEarned: 1130000000000,
        cellsEarned: 45200
      } as GameRun,
      {
        id: '2',
        timestamp: new Date('2024-01-16T16:20:00'),
        tier: 11,
        wave: 6200,
        realTime: 29550,
        coinsEarned: 1450000000000,
        cellsEarned: 52100
      } as GameRun
    ],
    failed: 0,
    errors: [],
    fieldMappingReport: {
      mappedFields: [
        { csvHeader: 'Date', camelCase: 'date', supported: true },
        { csvHeader: 'Tier', camelCase: 'tier', supported: true }
      ],
      newFields: [],
      similarFields: [],
      unsupportedFields: [],
      skippedFields: []
    }
  };

  const mockDuplicateResult: BatchDuplicateDetectionResult = {
    duplicates: [
      {
        newRun: mockParseResult.success[0],
        existingRun: mockParseResult.success[0],
        matchType: 'exact'
      }
    ],
    newRuns: [mockParseResult.success[1]],
    allNew: false
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(useDataHook.useData).mockReturnValue({
      addRuns: mockAddRuns,
      detectBatchDuplicates: mockDetectBatchDuplicates,
      overwriteRun: mockOverwriteRun
    } as unknown as DataContextType);

    vi.mocked(csvParser.getDelimiterString).mockReturnValue('\t');
    vi.mocked(csvParser.parseGenericCsv).mockReturnValue(mockParseResult);
    mockDetectBatchDuplicates.mockReturnValue({
      duplicates: [],
      newRuns: mockParseResult.success,
      allNew: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Import Without Duplicates', () => {
    it('should import all runs when no duplicates exist', () => {
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleInputChange('Date\tTier\n2024-01-15\t10');
      });

      act(() => {
        result.current.handleImport();
      });

      expect(mockAddRuns).toHaveBeenCalledWith(mockParseResult.success, false);
      expect(result.current.inputData).toBe('');
      expect(result.current.parseResult).toBeNull();
      expect(result.current.isDialogOpen).toBe(false);
    });

    it('should not import when no successful runs exist', () => {
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleImport();
      });

      expect(mockAddRuns).not.toHaveBeenCalled();
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicates when parse result has successful runs', async () => {
      mockDetectBatchDuplicates.mockReturnValue(mockDuplicateResult);
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleInputChange('Date\tTier\n2024-01-15\t10');
      });

      await waitFor(() => {
        expect(mockDetectBatchDuplicates).toHaveBeenCalledWith(mockParseResult.success);
        expect(result.current.duplicateResult).toEqual(mockDuplicateResult);
        expect(result.current.resolution).toBe('new-only');
      });
    });

    it('should clear duplicate result when parse result is empty', () => {
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleInputChange('   ');
      });

      expect(result.current.duplicateResult).toBeNull();
    });
  });

  describe('Import With Duplicates - New Only Mode', () => {
    it('should import only new runs when duplicates exist and resolution is new-only', async () => {
      mockDetectBatchDuplicates.mockReturnValue(mockDuplicateResult);
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleInputChange('Date\tTier\n2024-01-15\t10');
      });

      await waitFor(() => {
        expect(result.current.duplicateResult).toEqual(mockDuplicateResult);
      });

      act(() => {
        result.current.handleImport();
      });

      expect(mockAddRuns).toHaveBeenCalledWith(mockDuplicateResult.newRuns, false);
      expect(mockOverwriteRun).not.toHaveBeenCalled();
    });
  });

  describe('Import With Duplicates - Overwrite Mode', () => {
    it('should import new runs and overwrite duplicates when resolution is overwrite', async () => {
      mockDetectBatchDuplicates.mockReturnValue(mockDuplicateResult);
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleInputChange('Date\tTier\n2024-01-15\t10');
      });

      await waitFor(() => {
        expect(result.current.duplicateResult).toEqual(mockDuplicateResult);
      });

      act(() => {
        result.current.setResolution('overwrite');
      });

      act(() => {
        result.current.handleImport();
      });

      expect(mockAddRuns).toHaveBeenCalledWith(mockDuplicateResult.newRuns, false);
      expect(mockOverwriteRun).toHaveBeenCalledWith(
        mockDuplicateResult.duplicates[0].existingRun?.id,
        mockDuplicateResult.duplicates[0].newRun,
        true
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle parsing errors gracefully', () => {
      vi.mocked(csvParser.parseGenericCsv).mockImplementation(() => {
        throw new Error('Parse error');
      });

      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleInputChange('invalid data');
      });

      expect(result.current.parseResult?.errors).toEqual(['Failed to parse data: Parse error']);
      expect(result.current.parseResult?.success).toEqual([]);
    });
  });
});
