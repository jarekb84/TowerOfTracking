/**
 * Field Discovery
 *
 * Utilities for discovering field names from existing data in localStorage.
 * This enables dynamic field matching against actual user data rather than
 * a static list of supported fields.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types';

const DATA_KEY = 'tower-tracking-csv-data';

/**
 * Extract all unique field names from stored data
 *
 * @returns Set of field names found in stored data
 */
export function extractFieldNamesFromStorage(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const storedData = localStorage.getItem(DATA_KEY);
    if (!storedData) {
      return new Set();
    }

    // Parse the CSV data
    const lines = storedData.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return new Set();
    }

    // First line is headers
    const headers = lines[0].split('\t').map(h => h.trim().replace(/["']/g, ''));

    return new Set(headers);
  } catch (error) {
    console.warn('Failed to extract field names from storage:', error);
    return new Set();
  }
}

/**
 * Extract all unique field names from an array of ParsedGameRun objects
 *
 * @param runs - Array of parsed game runs
 * @returns Set of field names found in the runs
 */
export function extractFieldNamesFromRuns(runs: ParsedGameRun[]): Set<string> {
  const fieldNames = new Set<string>();

  for (const run of runs) {
    for (const fieldName of Object.keys(run.fields)) {
      fieldNames.add(fieldName);
    }
  }

  return fieldNames;
}

/**
 * Get all known field names from both static configuration and stored data
 * This provides the most comprehensive list of fields the user has ever used.
 *
 * @param supportedFields - Static list of supported fields from configuration
 * @returns Combined set of all known field names
 */
export function getAllKnownFields(supportedFields: string[]): Set<string> {
  const storageFields = extractFieldNamesFromStorage();
  const allFields = new Set([...supportedFields, ...storageFields]);

  return allFields;
}
