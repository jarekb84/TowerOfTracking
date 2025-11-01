import type { CsvDelimiter } from '@/features/data-import/csv-import/types';
import type { CsvExportResult } from './csv-exporter';
import { getDelimiterString } from '../../data-import/csv-import/csv-parser';

/**
 * Gets display string for the current delimiter selection
 */
export function getDelimiterDisplayString(
  selectedDelimiter: CsvDelimiter, 
  customDelimiter: string
): string {
  if (selectedDelimiter === 'custom') {
    return customDelimiter || ',';
  }
  return getDelimiterString(selectedDelimiter);
}

/**
 * Gets button class names based on success state
 */
export function getCopyButtonClassName(copySuccess: boolean): string {
  return `gap-2 ${copySuccess ? 'bg-green-600 hover:bg-green-700' : ''}`;
}

/**
 * Gets download button class names based on success state
 */
export function getDownloadButtonClassName(downloadSuccess: boolean): string {
  return `gap-2 ${downloadSuccess ? 'border-green-600 text-green-600' : ''}`;
}

/**
 * Determines if export button should be disabled
 */
export function isExportDisabled(runCount: number): boolean {
  return runCount === 0;
}

/**
 * Gets formatted conflict examples for display
 */
export function formatConflictExamples(conflictingValues: string[], maxExamples: number = 2): string {
  const examples = conflictingValues
    .slice(0, maxExamples)
    .map(v => `"${v}"`)
    .join(', ');
  
  if (conflictingValues.length > maxExamples) {
    return `${examples}...`;
  }
  
  return examples;
}

/**
 * Gets export statistics for display
 */
export function getExportStatsDisplay(
  exportResult: CsvExportResult,
  selectedDelimiter: CsvDelimiter,
  customDelimiter: string
): Array<{ label: string; value: string }> {
  return [
    { label: 'Rows', value: exportResult.rowCount.toString() },
    { label: 'Columns', value: exportResult.fieldCount.toString() },
    { label: 'Delimiter', value: `"${getDelimiterDisplayString(selectedDelimiter, customDelimiter)}"` }
  ];
}

/**
 * Gets copy button text based on state
 */
export function getCopyButtonText(copySuccess: boolean): string {
  return copySuccess ? 'Copied!' : 'Copy to Clipboard';
}

/**
 * Gets download button text based on state
 */
export function getDownloadButtonText(downloadSuccess: boolean): string {
  return downloadSuccess ? 'Downloaded!' : 'Download File';
}