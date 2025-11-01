import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCsvImport } from './use-csv-import';
import * as csvParser from './csv-parser';
import * as useDataHook from '../../data-tracking/hooks/use-data';
import type { DataContextType } from '../../data-tracking/hooks/use-data';
import type { GameRun, CsvParseResult } from '../../data-tracking/types/game-run.types';

// Mock dependencies
vi.mock('./csv-parser');
vi.mock('../../data-tracking/hooks/use-data');
vi.mock('./input/csv-file-upload', () => ({
  useFileImport: ({ onFileContent }: { onFileContent: (text: string) => void }) => ({
    importFile: () => onFileContent('mocked file content')
  })
}));

describe('useCsvImport - Delimiter Handling', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Standard Delimiters', () => {
    it('should change delimiter and re-parse data', () => {
      vi.mocked(csvParser.getDelimiterString).mockReturnValue(',');
      const { result } = renderHook(() => useCsvImport());

      // First set some input
      act(() => {
        result.current.handleInputChange('Date,Tier\n2024-01-15,10');
      });

      vi.clearAllMocks();

      // Change delimiter
      act(() => {
        result.current.handleDelimiterChange('comma');
      });

      expect(result.current.selectedDelimiter).toBe('comma');
      expect(csvParser.getDelimiterString).toHaveBeenCalledWith('comma');
      expect(csvParser.parseGenericCsv).toHaveBeenCalled();
    });

    it('should not re-parse when delimiter changes with empty input', () => {
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleDelimiterChange('comma');
      });

      expect(result.current.selectedDelimiter).toBe('comma');
      expect(csvParser.parseGenericCsv).not.toHaveBeenCalled();
    });
  });

  describe('Custom Delimiter', () => {
    it('should handle custom delimiter change', () => {
      const { result } = renderHook(() => useCsvImport());

      // Set to custom delimiter mode
      act(() => {
        result.current.handleDelimiterChange('custom');
      });

      // Set input data
      act(() => {
        result.current.handleInputChange('Date|Tier\n2024-01-15|10');
      });

      vi.clearAllMocks();

      // Change custom delimiter
      act(() => {
        result.current.handleCustomDelimiterChange('|');
      });

      expect(result.current.customDelimiter).toBe('|');
      expect(csvParser.parseGenericCsv).toHaveBeenCalledWith(
        'Date|Tier\n2024-01-15|10',
        { delimiter: '|' }
      );
    });

    it('should not re-parse when custom delimiter changes but not in custom mode', () => {
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.handleInputChange('Date\tTier\n2024-01-15\t10');
      });

      vi.clearAllMocks();

      act(() => {
        result.current.handleCustomDelimiterChange('|');
      });

      expect(result.current.customDelimiter).toBe('|');
      expect(csvParser.parseGenericCsv).not.toHaveBeenCalled();
    });
  });
});
