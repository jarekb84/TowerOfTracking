/**
 * Data Migration System
 *
 * Centralized system for handling data structure migrations across versions.
 * All migration logic is contained here to minimize blast radius.
 *
 * Version History:
 * - v1 (legacy): Fields without underscore (date, time, notes, runType)
 * - v2 (current): Internal fields with underscore (_date, _time, _notes, _runType)
 *                 Added battleDate support
 */

import type { ParsedGameRun, GameRunField } from '../types/game-run.types';
import { INTERNAL_FIELD_NAMES } from './internal-field-config';
import { detectDelimiter } from './csv-helpers';

// Storage keys
const VERSION_KEY = 'tower-tracking-data-version';
const DATA_KEY = 'tower-tracking-csv-data';

// Current data version
export const CURRENT_DATA_VERSION = 2;

// Legacy field names that need migration
const LEGACY_FIELD_MIGRATIONS: Record<string, string> = {
  'date': INTERNAL_FIELD_NAMES.DATE,
  'time': INTERNAL_FIELD_NAMES.TIME,
  'notes': INTERNAL_FIELD_NAMES.NOTES,
  'runType': INTERNAL_FIELD_NAMES.RUN_TYPE
};

/**
 * Get the current data version from localStorage
 */
export function getDataVersion(): number {
  if (typeof window === 'undefined') return CURRENT_DATA_VERSION;

  const version = localStorage.getItem(VERSION_KEY);
  return version ? parseInt(version, 10) : 1; // Default to v1 (legacy)
}

/**
 * Set the data version in localStorage
 */
export function setDataVersion(version: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VERSION_KEY, version.toString());
}

/**
 * Migrate CSV data from v1 to v2
 *
 * Changes:
 * - Rename headers: "Date" → "_Date", "Time" → "_Time", etc.
 * - Ensure internal fields appear first
 * - Preserve all other fields
 *
 * @param csvData - CSV string to migrate
 * @param delimiter - CSV delimiter (tab or comma)
 * @returns Migrated CSV string
 */
function migrateV1ToV2(csvData: string, delimiter: string = '\t'): string {
  const lines = csvData.split('\n');
  if (lines.length === 0) return csvData;

  const headers = lines[0].split(delimiter);

  // Create header mapping
  const newHeaders: string[] = [];
  const columnMapping: number[] = [];

  // First, add internal fields (with underscore prefix)
  const internalFieldIndices = new Map<string, number>();
  headers.forEach((header, index) => {
    const trimmed = header.trim();
    if (trimmed === 'Date' || trimmed === 'date') {
      internalFieldIndices.set('_Date', index);
    } else if (trimmed === 'Time' || trimmed === 'time') {
      internalFieldIndices.set('_Time', index);
    } else if (trimmed === 'Notes' || trimmed === 'notes') {
      internalFieldIndices.set('_Notes', index);
    } else if (trimmed === 'Run Type' || trimmed === 'runType' || trimmed === 'run_type') {
      internalFieldIndices.set('_Run Type', index);
    }
  });

  // Add internal fields first (in order)
  const internalFieldOrder = ['_Date', '_Time', '_Notes', '_Run Type'];
  internalFieldOrder.forEach(fieldName => {
    if (internalFieldIndices.has(fieldName)) {
      newHeaders.push(fieldName);
      columnMapping.push(internalFieldIndices.get(fieldName)!);
    }
  });

  // Then add all other fields (game fields)
  headers.forEach((header, index) => {
    const trimmed = header.trim();
    // Skip if it's an internal field we already added
    if (trimmed === 'Date' || trimmed === 'date' ||
        trimmed === 'Time' || trimmed === 'time' ||
        trimmed === 'Notes' || trimmed === 'notes' ||
        trimmed === 'Run Type' || trimmed === 'runType' || trimmed === 'run_type') {
      return;
    }
    newHeaders.push(header);
    columnMapping.push(index);
  });

  // Rebuild CSV with new column order
  const newLines: string[] = [];
  newLines.push(newHeaders.join(delimiter));

  // Reorder data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(delimiter);
    const newValues = columnMapping.map(oldIndex => values[oldIndex] || '');
    newLines.push(newValues.join(delimiter));
  }

  return newLines.join('\n');
}

/**
 * Migrate runs data structure (in-memory)
 * Converts legacy field names to new internal field names
 */
export function migrateRunsV1ToV2(runs: ParsedGameRun[]): ParsedGameRun[] {
  return runs.map(run => {
    const newFields: Record<string, GameRunField> = {};

    // Migrate fields
    for (const [fieldName, field] of Object.entries(run.fields)) {
      const migratedName = LEGACY_FIELD_MIGRATIONS[fieldName];
      if (migratedName) {
        // This is a legacy field, migrate it
        newFields[migratedName] = field;
      } else {
        // Keep as-is
        newFields[fieldName] = field;
      }
    }

    return {
      ...run,
      fields: newFields
    };
  });
}

/**
 * Main migration function - automatically detects version and migrates
 *
 * This should be called on app load to ensure data is up-to-date.
 * Returns true if migration occurred, false if already on current version.
 */
export function migrateDataIfNeeded(): { migrated: boolean; fromVersion: number; toVersion: number } {
  if (typeof window === 'undefined') {
    return { migrated: false, fromVersion: CURRENT_DATA_VERSION, toVersion: CURRENT_DATA_VERSION };
  }

  const currentVersion = getDataVersion();

  if (currentVersion === CURRENT_DATA_VERSION) {
    // Already on current version
    return { migrated: false, fromVersion: currentVersion, toVersion: CURRENT_DATA_VERSION };
  }

  // Perform migration
  if (currentVersion === 1) {
    console.group('[Data Migration] v1 → v2');
    console.log('Starting migration: Converting legacy field names to internal format');
    console.log('Changes: date → _Date, time → _Time, notes → _Notes, runType → _Run Type');

    try {
      const csvData = localStorage.getItem(DATA_KEY);
      if (csvData) {
        const lines = csvData.split('\n').length - 1;
        console.log(`Migrating ${lines} rows of data...`);

        const migratedData = migrateV1ToV2(csvData);
        localStorage.setItem(DATA_KEY, migratedData);

        console.log(`Successfully migrated ${lines} rows`);
      } else {
        console.log('No existing data to migrate');
      }

      setDataVersion(2);
      console.log('Migration complete - data version updated to v2');
      console.groupEnd();

      return { migrated: true, fromVersion: 1, toVersion: 2 };
    } catch (error) {
      console.error('Migration failed:', error);
      console.log('Data version NOT updated - migration will retry on next load');
      console.groupEnd();
      // Don't update version on failure - will retry next load
      return { migrated: false, fromVersion: currentVersion, toVersion: CURRENT_DATA_VERSION };
    }
  }

  // Future: Add more version migrations here
  // if (currentVersion === 2) { migrateV2ToV3(); }

  return { migrated: false, fromVersion: currentVersion, toVersion: CURRENT_DATA_VERSION };
}

/**
 * Migrate CSV string during import (for bulk import from external source)
 * Detects if CSV uses legacy format and migrates header names
 */
export function migrateCsvOnImport(csvData: string): string {
  if (!csvData.trim()) return csvData;

  const lines = csvData.split('\n');
  if (lines.length === 0) return csvData;

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map(h => h.trim());

  // Check if using legacy format (has "Date", "Time", etc. without underscore)
  const hasLegacyHeaders = headers.some(h =>
    h === 'Date' || h === 'Time' || h === 'Notes' || h === 'Run Type'
  );

  if (!hasLegacyHeaders) {
    // Already using new format (or no internal fields)
    return csvData;
  }

  // Migrate to new format with detected delimiter
  return migrateV1ToV2(csvData, delimiter);
}
