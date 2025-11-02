import { useState, useEffect, useCallback } from 'react';
import { parseGenericCsv, getDelimiterString } from './csv-parser';
import { useData } from '@/shared/domain/use-data';
import { useFileImport } from './input/csv-file-upload';
import type { CsvDelimiter, CsvParseResult } from './types';
import type { DuplicateResolution } from '@/shared/domain/duplicate-detection/duplicate-info';
import type { BatchDuplicateDetectionResult } from '@/shared/domain/duplicate-detection/duplicate-detection';

interface UseCsvImportReturn {
  // State
  inputData: string;
  isDialogOpen: boolean;
  parseResult: CsvParseResult | null;
  selectedDelimiter: CsvDelimiter;
  customDelimiter: string;
  duplicateResult: BatchDuplicateDetectionResult | null;
  resolution: DuplicateResolution;

  // Actions
  setIsDialogOpen: (open: boolean) => void;
  handlePaste: () => Promise<void>;
  handleInputChange: (value: string) => void;
  handleDelimiterChange: (delimiter: CsvDelimiter) => void;
  handleCustomDelimiterChange: (value: string) => void;
  handleImport: () => void;
  handleCancel: () => void;
  setResolution: (resolution: DuplicateResolution) => void;
  importFile: () => void;
}

export function useCsvImport(): UseCsvImportReturn {
  const [inputData, setInputData] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [selectedDelimiter, setSelectedDelimiter] = useState<CsvDelimiter>('tab');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [duplicateResult, setDuplicateResult] = useState<BatchDuplicateDetectionResult | null>(null);
  const [resolution, setResolution] = useState<DuplicateResolution>('new-only');
  const { addRuns, detectBatchDuplicates, overwriteRun } = useData();

  // Parse data helper
  const parseData = useCallback((text: string): void => {
    if (!text.trim()) {
      setParseResult(null);
      setDuplicateResult(null);
      return;
    }

    try {
      const delimiter = selectedDelimiter === 'custom' ? customDelimiter : getDelimiterString(selectedDelimiter);
      const result = parseGenericCsv(text, { delimiter });
      setParseResult(result);
    } catch (error) {
      setParseResult({
        success: [],
        failed: 0,
        errors: ['Failed to parse data: ' + (error instanceof Error ? error.message : 'Unknown error')],
        fieldMappingReport: {
          mappedFields: [],
          newFields: [],
          similarFields: [],
          unsupportedFields: [],
          skippedFields: []
        }
      });
    }
  }, [selectedDelimiter, customDelimiter]);

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
      try {
        const delimiterStr = delimiter === 'custom' ? customDelimiter : getDelimiterString(delimiter);
        const result = parseGenericCsv(inputData, { delimiter: delimiterStr });
        setParseResult(result);
      } catch (error) {
        setParseResult({
          success: [],
          failed: 0,
          errors: ['Failed to parse data: ' + (error instanceof Error ? error.message : 'Unknown error')],
          fieldMappingReport: {
            mappedFields: [],
            newFields: [],
            similarFields: [],
            unsupportedFields: [],
            skippedFields: []
          }
        });
      }
    }
  }, [inputData, customDelimiter]);

  // Custom delimiter change handler
  const handleCustomDelimiterChange = useCallback((value: string): void => {
    setCustomDelimiter(value);
    if (selectedDelimiter === 'custom' && inputData.trim()) {
      // Manually parse with new custom delimiter since state hasn't updated yet
      try {
        const result = parseGenericCsv(inputData, { delimiter: value });
        setParseResult(result);
      } catch (error) {
        setParseResult({
          success: [],
          failed: 0,
          errors: ['Failed to parse data: ' + (error instanceof Error ? error.message : 'Unknown error')],
          fieldMappingReport: {
            mappedFields: [],
            newFields: [],
            similarFields: [],
            unsupportedFields: [],
            skippedFields: []
          }
        });
      }
    }
  }, [selectedDelimiter, inputData]);

  // Reset form helper
  const resetForm = useCallback((): void => {
    setInputData('');
    setParseResult(null);
    setSelectedDelimiter('tab');
    setCustomDelimiter('');
    setDuplicateResult(null);
    setResolution('new-only');
    setIsDialogOpen(false);
  }, []);

  // Import runs
  const handleImport = useCallback((): void => {
    if (parseResult?.success && parseResult.success.length > 0) {
      // Handle based on duplicate detection and user resolution choice
      if (duplicateResult && duplicateResult.duplicates.length > 0) {
        if (resolution === 'new-only') {
          // Only import new runs
          addRuns(duplicateResult.newRuns, false);
        } else if (resolution === 'overwrite') {
          // Import new runs + overwrite existing duplicates
          if (duplicateResult.newRuns.length > 0) {
            addRuns(duplicateResult.newRuns, false);
          }
          // Overwrite existing runs with duplicate data
          duplicateResult.duplicates.forEach(({ newRun, existingRun }) => {
            if (existingRun) {
              // Use the new overwriteRun method with date/time preservation
              overwriteRun(existingRun.id, newRun, true);
            }
          });
        }
      } else {
        // No duplicates, import all runs
        addRuns(parseResult.success, false);
      }

      resetForm();
    }
  }, [parseResult, duplicateResult, resolution, addRuns, overwriteRun, resetForm]);

  // Cancel handler
  const handleCancel = useCallback((): void => {
    resetForm();
  }, [resetForm]);

  return {
    inputData,
    isDialogOpen,
    parseResult,
    selectedDelimiter,
    customDelimiter,
    duplicateResult,
    resolution,
    setIsDialogOpen,
    handlePaste,
    handleInputChange,
    handleDelimiterChange,
    handleCustomDelimiterChange,
    handleImport,
    handleCancel,
    setResolution,
    importFile
  };
}
