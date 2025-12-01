import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/shared/domain/use-data';
import { useFileImport } from './input/csv-file-upload';
import { resolveDelimiter, parseCsvSafe } from './csv-import-parsing';
import { executeImport } from './csv-import-executor';
import type { CsvDelimiter, CsvParseResult } from './types';
import type { DuplicateResolution } from '@/shared/domain/duplicate-detection/duplicate-info';
import type { BatchDuplicateDetectionResult } from '@/shared/domain/duplicate-detection/duplicate-detection';
import { useLocaleStore } from '@/shared/locale';

interface UseCsvImportOptions {
  /** When true, hook operates in page context (no dialog state management) */
  pageMode?: boolean;
}

interface UseCsvImportReturn {
  // State
  inputData: string;
  isDialogOpen: boolean;
  parseResult: CsvParseResult | null;
  selectedDelimiter: CsvDelimiter;
  customDelimiter: string;
  duplicateResult: BatchDuplicateDetectionResult | null;
  resolution: DuplicateResolution;
  /** Only available in pageMode - indicates successful import */
  importSuccess: boolean;

  // Actions
  setIsDialogOpen: (open: boolean) => void;
  handlePaste: () => Promise<void>;
  handleInputChange: (value: string) => void;
  handleDelimiterChange: (delimiter: CsvDelimiter) => void;
  handleCustomDelimiterChange: (value: string) => void;
  handleImport: () => void;
  handleCancel: () => void;
  /** Clear form without closing dialog (useful in page mode) */
  handleClear: () => void;
  setResolution: (resolution: DuplicateResolution) => void;
  importFile: () => void;
}

export function useCsvImport({ pageMode = false }: UseCsvImportOptions = {}): UseCsvImportReturn {
  const [inputData, setInputData] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [selectedDelimiter, setSelectedDelimiter] = useState<CsvDelimiter>('tab');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [duplicateResult, setDuplicateResult] = useState<BatchDuplicateDetectionResult | null>(null);
  const [resolution, setResolution] = useState<DuplicateResolution>('new-only');
  const [importSuccess, setImportSuccess] = useState(false);
  const { addRuns, detectBatchDuplicates, overwriteRun } = useData();
  const { importFormat } = useLocaleStore();

  // Parse data helper using extracted pure function
  const parseData = useCallback((text: string): void => {
    if (!text.trim()) {
      setParseResult(null);
      setDuplicateResult(null);
      return;
    }
    const delimiter = resolveDelimiter(selectedDelimiter, customDelimiter);
    setParseResult(parseCsvSafe(text, delimiter, importFormat));
  }, [selectedDelimiter, customDelimiter, importFormat]);

  // Check for duplicates when parse result changes
  useEffect(() => {
    if (parseResult?.success && parseResult.success.length > 0) {
      const result = detectBatchDuplicates(parseResult.success);
      setDuplicateResult(result);
      // Default to 'new-only' when duplicates are found
      if (result.duplicates.length > 0) {
        setResolution('new-only');
      }
    } else {
      setDuplicateResult(null);
    }
  }, [parseResult, detectBatchDuplicates]);

  // Paste from clipboard
  const handlePaste = useCallback(async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      setInputData(text);
      parseData(text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  }, [parseData]);

  // File import integration
  const { importFile } = useFileImport({
    onFileContent: (text) => {
      setInputData(text);
      parseData(text);
    },
    onError: (error) => {
      console.error('Failed to import file:', error);
    }
  });

  // Input change handler
  const handleInputChange = useCallback((value: string): void => {
    setInputData(value);
    parseData(value);
  }, [parseData]);

  // Delimiter change handler
  const handleDelimiterChange = useCallback((delimiter: CsvDelimiter): void => {
    setSelectedDelimiter(delimiter);
    if (inputData.trim()) {
      // Manually parse with new delimiter since state hasn't updated yet
      const delimiterStr = resolveDelimiter(delimiter, customDelimiter);
      setParseResult(parseCsvSafe(inputData, delimiterStr, importFormat));
    }
  }, [inputData, customDelimiter, importFormat]);

  // Custom delimiter change handler
  const handleCustomDelimiterChange = useCallback((value: string): void => {
    setCustomDelimiter(value);
    if (selectedDelimiter === 'custom' && inputData.trim()) {
      // Manually parse with new custom delimiter since state hasn't updated yet
      setParseResult(parseCsvSafe(inputData, value, importFormat));
    }
  }, [selectedDelimiter, inputData, importFormat]);

  // Clear form state without closing dialog (useful for page mode)
  const clearFormState = useCallback((): void => {
    setInputData('');
    setParseResult(null);
    setSelectedDelimiter('tab');
    setCustomDelimiter('');
    setDuplicateResult(null);
    setResolution('new-only');
    setImportSuccess(false);
  }, []);

  // Reset form helper (closes dialog in modal mode)
  const resetForm = useCallback((): void => {
    clearFormState();
    if (!pageMode) {
      setIsDialogOpen(false);
    }
  }, [clearFormState, pageMode]);

  // Import runs
  const handleImport = useCallback((): void => {
    const imported = executeImport({
      parseResult,
      duplicateResult,
      resolution,
      addRuns,
      overwriteRun
    });

    if (imported) {
      // In page mode, show success feedback; in modal mode, close dialog
      if (pageMode) {
        setImportSuccess(true);
        clearFormState();
        // Auto-hide success after 3 seconds
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        resetForm();
      }
    }
  }, [parseResult, duplicateResult, resolution, addRuns, overwriteRun, resetForm, pageMode, clearFormState]);

  return {
    inputData,
    isDialogOpen,
    parseResult,
    selectedDelimiter,
    customDelimiter,
    duplicateResult,
    resolution,
    importSuccess,
    setIsDialogOpen,
    handlePaste,
    handleInputChange,
    handleDelimiterChange,
    handleCustomDelimiterChange,
    handleImport,
    handleCancel: resetForm,
    handleClear: clearFormState,
    setResolution,
    importFile
  };
}
