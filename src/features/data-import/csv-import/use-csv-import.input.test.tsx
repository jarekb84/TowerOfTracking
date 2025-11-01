import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCsvImport } from './use-csv-import';
import * as csvParser from './csv-parser';
import * as useDataHook from '@/shared/domain/use-data';
import type { DataContextType } from '@/shared/domain/use-data';
import type { GameRun, CsvParseResult } from '@/shared/types/game-run.types';

// Mock dependencies
vi.mock('./csv-parser');
vi.mock('@/shared/domain/use-data');
vi.mock('./input/csv-file-upload', () => ({
  useFileImport: ({ onFileContent }: { onFileContent: (text: string) => void }) => ({
    importFile: () => onFileContent('mocked file content')
  })
}));

describe('useCsvImport - Input Handling', () => {
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

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        readText: vi.fn().mockResolvedValue('mocked clipboard content')
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Text Input', () => {
    it('should update input data and parse on input change', () => {
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleInputChange('Date\tTier\n2024-01-15\t10');
      });

      expect(result.current.inputData).toBe('Date\tTier\n2024-01-15\t10');
      expect(csvParser.parseGenericCsv).toHaveBeenCalledWith(
        'Date\tTier\n2024-01-15\t10',
        { delimiter: '\t' }
      );
      expect(result.current.parseResult).toEqual(mockParseResult);
    });

    it('should clear parse result when input is empty', () => {
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleInputChange('   ');
      });

      expect(result.current.parseResult).toBeNull();
      expect(result.current.duplicateResult).toBeNull();
    });
  });

  describe('Clipboard Paste', () => {
    it('should handle paste from clipboard', async () => {
      const { result } = renderHook(() => useCsvImport());

      await act(async () => {
        await result.current.handlePaste();
      });

      await waitFor(() => {
        expect(result.current.inputData).toBe('mocked clipboard content');
      });
      expect(csvParser.parseGenericCsv).toHaveBeenCalled();
    });

    it('should handle clipboard paste errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(navigator.clipboard.readText).mockRejectedValue(new Error('Clipboard error'));

      const { result } = renderHook(() => useCsvImport());

      await act(async () => {
        await result.current.handlePaste();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to read clipboard:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('File Import', () => {
    it('should handle file import', () => {
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.importFile();
      });

      expect(result.current.inputData).toBe('mocked file content');
      expect(csvParser.parseGenericCsv).toHaveBeenCalled();
    });
  });
});
