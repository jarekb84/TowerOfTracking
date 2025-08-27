import { useState, useEffect, useCallback } from 'react';
import { exportToCsv, generateExportFilename, copyToClipboard, downloadAsFile } from '../utils/csv-exporter';
import type { CsvDelimiter, ParsedGameRun } from '../types/game-run.types';
import type { CsvExportConfig, CsvExportResult } from '../utils/csv-exporter';

export interface UseCsvExportState {
  selectedDelimiter: CsvDelimiter;
  customDelimiter: string;
  includeAppFields: boolean;
  exportResult: CsvExportResult | null;
  isGenerating: boolean;
  copySuccess: boolean;
  downloadSuccess: boolean;
  error: string | null;
}

export interface UseCsvExportActions {
  setSelectedDelimiter: (delimiter: CsvDelimiter) => void;
  setCustomDelimiter: (delimiter: string) => void;
  setIncludeAppFields: (include: boolean) => void;
  handleCopyToClipboard: () => Promise<void>;
  handleDownloadFile: () => Promise<void>;
  resetState: () => void;
}

export interface UseCsvExportReturn extends UseCsvExportState, UseCsvExportActions {}

export function useCsvExport(runs: ParsedGameRun[], isDialogOpen: boolean): UseCsvExportReturn {
  const [selectedDelimiter, setSelectedDelimiter] = useState<CsvDelimiter>('tab');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [includeAppFields, setIncludeAppFields] = useState(true);
  const [exportResult, setExportResult] = useState<CsvExportResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateExport = useCallback(() => {
    if (runs.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    setCopySuccess(false);
    setDownloadSuccess(false);
    
    try {
      const config: CsvExportConfig = {
        delimiter: selectedDelimiter,
        customDelimiter: selectedDelimiter === 'custom' ? customDelimiter : undefined,
        includeAppFields
      };
      
      const result = exportToCsv(runs, config);
      setExportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate export');
      setExportResult(null);
    } finally {
      setIsGenerating(false);
    }
  }, [runs, selectedDelimiter, customDelimiter, includeAppFields]);

  // Auto-regenerate export when settings change
  useEffect(() => {
    if (isDialogOpen && runs.length > 0) {
      generateExport();
    }
  }, [generateExport, isDialogOpen, runs.length]);

  const handleCopyToClipboard = useCallback(async (): Promise<void> => {
    if (!exportResult?.csvContent) return;
    
    try {
      await copyToClipboard(exportResult.csvContent);
      setCopySuccess(true);
      setError(null);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy to clipboard');
      setCopySuccess(false);
    }
  }, [exportResult?.csvContent]);

  const handleDownloadFile = useCallback(async (): Promise<void> => {
    if (!exportResult?.csvContent) return;
    
    try {
      const filename = generateExportFilename(exportResult.rowCount);
      await downloadAsFile(exportResult.csvContent, filename);
      setDownloadSuccess(true);
      setError(null);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
      setDownloadSuccess(false);
    }
  }, [exportResult?.csvContent, exportResult?.rowCount]);

  const resetState = useCallback(() => {
    setExportResult(null);
    setError(null);
    setCopySuccess(false);
    setDownloadSuccess(false);
  }, []);

  return {
    selectedDelimiter,
    customDelimiter,
    includeAppFields,
    exportResult,
    isGenerating,
    copySuccess,
    downloadSuccess,
    error,
    setSelectedDelimiter,
    setCustomDelimiter,
    setIncludeAppFields,
    handleCopyToClipboard,
    handleDownloadFile,
    resetState
  };
}