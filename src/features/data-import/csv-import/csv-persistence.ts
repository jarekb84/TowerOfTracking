import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { parseGenericCsv } from './csv-parser';
import { exportToCsv } from '../../data-export/csv-export/csv-exporter';
import { CANONICAL_STORAGE_FORMAT } from '@/shared/locale/types';

// Storage configuration
const STORAGE_KEY = 'tower-tracking-csv-data';
const CSV_DELIMITER = '\t'; // Tab-separated for maximum compatibility

/**
 * Convert runs to CSV format suitable for localStorage storage.
 *
 * CRITICAL: Always uses 'canonical' output format to ensure consistent storage.
 * This normalizes all numeric values to US format (period decimal), preventing
 * data corruption when users change their locale settings.
 */
export function runsToStorageCsv(runs: ParsedGameRun[]): string {
  if (runs.length === 0) {
    return '';
  }

  // Use existing CSV exporter with specific configuration for storage
  const result = exportToCsv(runs, {
    delimiter: 'tab',
    includeAppFields: true, // Include Date/Time columns for complete storage
    outputFormat: 'canonical', // Always canonical format for localStorage
  });

  const lines = result.csvContent.split('\n');
  if (lines.length === 0) return '';

  return lines.join('\n');
}

/**
 * Parse CSV from localStorage back to ParsedGameRun objects.
 *
 * CRITICAL: Always uses CANONICAL_STORAGE_FORMAT for reading localStorage.
 * This prevents data corruption when users change their locale settings.
 * Previously used getImportFormat() which caused corruption on setting change.
 *
 * @see CANONICAL_STORAGE_FORMAT for why US format is used as canonical
 */
export function storageCsvToRuns(csvData: string): ParsedGameRun[] {
  if (!csvData.trim()) {
    return [];
  }

  try {
    // Always use canonical format for reading localStorage
    const result = parseGenericCsv(csvData, {
      delimiter: CSV_DELIMITER,
      importFormat: CANONICAL_STORAGE_FORMAT,
    });

    if (result.errors.length > 0) {
      console.warn('CSV parsing warnings:', result.errors);
    }

    return result.success;
  } catch (error) {
    console.error('Failed to parse CSV from storage:', error);
    throw new Error('Failed to load data from storage');
  }
}

/**
 * Save runs to localStorage in CSV format
 */
export function saveRunsToStorage(runs: ParsedGameRun[]): void {
  try {
    const csvData = runsToStorageCsv(runs);
    localStorage.setItem(STORAGE_KEY, csvData);
  } catch (error) {
    console.error('Failed to save runs to localStorage:', error);
    throw new Error('Failed to save data to storage');
  }
}

/**
 * Load runs from localStorage CSV format
 */
export function loadRunsFromStorage(): ParsedGameRun[] {
  try {
    const csvData = localStorage.getItem(STORAGE_KEY);
    if (!csvData) {
      return [];
    }
    return storageCsvToRuns(csvData);
  } catch (error) {
    console.error('Failed to load runs from localStorage:', error);
    return [];
  }
}
