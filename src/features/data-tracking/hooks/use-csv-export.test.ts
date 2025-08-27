import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCsvExport } from './use-csv-export';
import * as csvExporter from '../utils/csv-exporter';
import type { ParsedGameRun } from '../types/game-run.types';

vi.mock('../utils/csv-exporter', () => ({
  exportToCsv: vi.fn(),
  generateExportFilename: vi.fn(),
  copyToClipboard: vi.fn(),
  downloadAsFile: vi.fn()
}));

describe('useCsvExport', () => {
  const mockRuns: ParsedGameRun[] = [
    { id: '1', tier: 1, wave: 10, coinsEarned: 1000 } as ParsedGameRun,
    { id: '2', tier: 2, wave: 15, coinsEarned: 2000 } as ParsedGameRun
  ];

  const mockExportResult = {
    csvContent: 'tier,wave,coins\n1,10,1000\n2,15,2000',
    rowCount: 2,
    fieldCount: 3,
    conflicts: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(csvExporter, 'exportToCsv').mockReturnValue(mockExportResult);
    vi.spyOn(csvExporter, 'generateExportFilename').mockReturnValue('export-2024-01-01.csv');
    vi.spyOn(csvExporter, 'copyToClipboard').mockResolvedValue(undefined);
    vi.spyOn(csvExporter, 'downloadAsFile').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const { result } = renderHook(() => useCsvExport([], false));
      
      expect(result.current.selectedDelimiter).toBe('tab');
      expect(result.current.customDelimiter).toBe('');
      expect(result.current.includeAppFields).toBe(true);
      expect(result.current.exportResult).toBe(null);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.copySuccess).toBe(false);
      expect(result.current.downloadSuccess).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('export generation', () => {
    it('should generate export when dialog opens with runs', () => {
      const { result } = renderHook(() => useCsvExport(mockRuns, true));
      
      expect(csvExporter.exportToCsv).toHaveBeenCalledWith(mockRuns, {
        delimiter: 'tab',
        customDelimiter: undefined,
        includeAppFields: true
      });
      expect(result.current.exportResult).toEqual(mockExportResult);
    });

    it('should not generate export when dialog is closed', () => {
      renderHook(() => useCsvExport(mockRuns, false));
      
      expect(csvExporter.exportToCsv).not.toHaveBeenCalled();
    });

    it('should not generate export when runs array is empty', () => {
      renderHook(() => useCsvExport([], true));
      
      expect(csvExporter.exportToCsv).not.toHaveBeenCalled();
    });

    it('should regenerate export when delimiter changes', () => {
      const { result, rerender } = renderHook(
        ({ runs, isOpen }) => useCsvExport(runs, isOpen),
        { initialProps: { runs: mockRuns, isOpen: true } }
      );
      
      vi.clearAllMocks();
      
      act(() => {
        result.current.setSelectedDelimiter('comma');
      });
      
      rerender({ runs: mockRuns, isOpen: true });
      
      waitFor(() => {
        expect(csvExporter.exportToCsv).toHaveBeenCalledWith(mockRuns, {
          delimiter: 'comma',
          customDelimiter: undefined,
          includeAppFields: true
        });
      });
    });

    it('should handle export errors', () => {
      const error = new Error('Export failed');
      vi.spyOn(csvExporter, 'exportToCsv').mockImplementation(() => {
        throw error;
      });
      
      const { result } = renderHook(() => useCsvExport(mockRuns, true));
      
      expect(result.current.error).toBe('Export failed');
      expect(result.current.exportResult).toBe(null);
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('setters', () => {
    it('should update selectedDelimiter', () => {
      const { result } = renderHook(() => useCsvExport([], false));
      
      act(() => {
        result.current.setSelectedDelimiter('comma');
      });
      
      expect(result.current.selectedDelimiter).toBe('comma');
    });

    it('should update customDelimiter', () => {
      const { result } = renderHook(() => useCsvExport([], false));
      
      act(() => {
        result.current.setCustomDelimiter('|');
      });
      
      expect(result.current.customDelimiter).toBe('|');
    });

    it('should update includeAppFields', () => {
      const { result } = renderHook(() => useCsvExport([], false));
      
      act(() => {
        result.current.setIncludeAppFields(false);
      });
      
      expect(result.current.includeAppFields).toBe(false);
    });
  });

  describe('handleCopyToClipboard', () => {
    it('should copy to clipboard successfully', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useCsvExport(mockRuns, true));
      
      await act(async () => {
        await result.current.handleCopyToClipboard();
      });
      
      expect(csvExporter.copyToClipboard).toHaveBeenCalledWith(mockExportResult.csvContent);
      expect(result.current.copySuccess).toBe(true);
      expect(result.current.error).toBe(null);
      
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      expect(result.current.copySuccess).toBe(false);
    });

    it('should handle copy errors', async () => {
      const error = new Error('Copy failed');
      vi.spyOn(csvExporter, 'copyToClipboard').mockRejectedValue(error);
      
      const { result } = renderHook(() => useCsvExport(mockRuns, true));
      
      await act(async () => {
        await result.current.handleCopyToClipboard();
      });
      
      expect(result.current.error).toBe('Copy failed');
      expect(result.current.copySuccess).toBe(false);
    });

    it('should not copy when no export result', async () => {
      const { result } = renderHook(() => useCsvExport([], false));
      
      await act(async () => {
        await result.current.handleCopyToClipboard();
      });
      
      expect(csvExporter.copyToClipboard).not.toHaveBeenCalled();
    });
  });

  describe('handleDownloadFile', () => {
    it('should download file successfully', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useCsvExport(mockRuns, true));
      
      await act(async () => {
        await result.current.handleDownloadFile();
      });
      
      expect(csvExporter.generateExportFilename).toHaveBeenCalledWith(mockExportResult.rowCount);
      expect(csvExporter.downloadAsFile).toHaveBeenCalledWith(
        mockExportResult.csvContent,
        'export-2024-01-01.csv'
      );
      expect(result.current.downloadSuccess).toBe(true);
      expect(result.current.error).toBe(null);
      
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      expect(result.current.downloadSuccess).toBe(false);
    });

    it('should handle download errors', async () => {
      const error = new Error('Download failed');
      vi.spyOn(csvExporter, 'downloadAsFile').mockRejectedValue(error);
      
      const { result } = renderHook(() => useCsvExport(mockRuns, true));
      
      await act(async () => {
        await result.current.handleDownloadFile();
      });
      
      expect(result.current.error).toBe('Download failed');
      expect(result.current.downloadSuccess).toBe(false);
    });

    it('should not download when no export result', async () => {
      const { result } = renderHook(() => useCsvExport([], false));
      
      await act(async () => {
        await result.current.handleDownloadFile();
      });
      
      expect(csvExporter.downloadAsFile).not.toHaveBeenCalled();
    });
  });

  describe('resetState', () => {
    it('should reset all state values', async () => {
      const { result } = renderHook(() => useCsvExport(mockRuns, true));
      
      // Set some state
      await act(async () => {
        await result.current.handleCopyToClipboard();
      });
      
      expect(result.current.copySuccess).toBe(true);
      expect(result.current.exportResult).not.toBe(null);
      
      // Reset state
      act(() => {
        result.current.resetState();
      });
      
      expect(result.current.exportResult).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.copySuccess).toBe(false);
      expect(result.current.downloadSuccess).toBe(false);
    });
  });
});