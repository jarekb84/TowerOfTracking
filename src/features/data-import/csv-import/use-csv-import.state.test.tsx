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

describe('useCsvImport - State Management', () => {
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

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useCsvImport());

      expect(result.current.inputData).toBe('');
      expect(result.current.isDialogOpen).toBe(false);
      expect(result.current.parseResult).toBeNull();
      expect(result.current.selectedDelimiter).toBe('tab');
      expect(result.current.customDelimiter).toBe('');
      expect(result.current.duplicateResult).toBeNull();
      expect(result.current.resolution).toBe('new-only');
    });
  });

  describe('Dialog State', () => {
    it('should open and close dialog', () => {
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.setIsDialogOpen(true);
      });

      expect(result.current.isDialogOpen).toBe(true);

      act(() => {
        result.current.setIsDialogOpen(false);
      });

      expect(result.current.isDialogOpen).toBe(false);
    });

    it('should reset all state on cancel', () => {
      const { result } = renderHook(() => useCsvImport());

      // Set some state
      act(() => {
        result.current.setIsDialogOpen(true);
        result.current.handleInputChange('Date\tTier\n2024-01-15\t10');
        result.current.handleDelimiterChange('comma');
        result.current.setResolution('overwrite');
      });

      // Cancel
      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.inputData).toBe('');
      expect(result.current.parseResult).toBeNull();
      expect(result.current.selectedDelimiter).toBe('tab');
      expect(result.current.customDelimiter).toBe('');
      expect(result.current.duplicateResult).toBeNull();
      expect(result.current.resolution).toBe('new-only');
      expect(result.current.isDialogOpen).toBe(false);
    });
  });

  describe('Resolution Strategy', () => {
    it('should allow changing resolution strategy', () => {
      const { result } = renderHook(() => useCsvImport());

      act(() => {
        result.current.setResolution('overwrite');
      });

      expect(result.current.resolution).toBe('overwrite');
    });
  });
});
