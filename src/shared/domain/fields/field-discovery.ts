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

/**
 * Extract all numeric field names from parsed game runs
 * Includes cached properties (tier, wave, coinsEarned, cellsEarned, realTime)
 * and dynamic fields with dataType === 'number' or 'duration'
 *
 * @param runs - Array of parsed game runs
 * @returns Array of numeric field names sorted alphabetically
 */
export function extractNumericFieldNames(runs: ParsedGameRun[]): string[] {
  if (runs.length === 0) return []

  const numericFields = new Set<string>()

  // Add cached numeric properties
  const cachedNumericProps = ['tier', 'wave', 'coinsEarned', 'cellsEarned', 'realTime', 'gameSpeed']
  cachedNumericProps.forEach(prop => numericFields.add(prop))

  // Scan all runs for dynamic numeric fields
  runs.forEach(run => {
    Object.entries(run.fields).forEach(([key, field]) => {
      if (field.dataType === 'number' || field.dataType === 'duration') {
        numericFields.add(key)
      }
    })
  })

  return Array.from(numericFields).sort()
}

/**
 * Get the data type for a specific field across all runs
 *
 * @param runs - Array of parsed game runs
 * @param fieldKey - Field name to check
 * @returns Data type of the field or 'number' for cached properties
 */
export function getFieldDataType(runs: ParsedGameRun[], fieldKey: string): string {
  // Check if it's a cached property
  const cachedNumericProps = ['tier', 'wave', 'coinsEarned', 'cellsEarned', 'realTime', 'gameSpeed']
  if (cachedNumericProps.includes(fieldKey)) {
    return 'number'
  }

  // Check dynamic fields in first run that has this field
  for (const run of runs) {
    const field = run.fields[fieldKey]
    if (field) {
      return field.dataType
    }
  }

  return 'number' // Default fallback
}
