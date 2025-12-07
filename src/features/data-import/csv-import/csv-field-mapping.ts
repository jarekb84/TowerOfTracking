/**
 * CSV Field Mapping and Classification
 *
 * Functions for mapping CSV headers to field names and creating
 * field mapping reports with similarity detection.
 */

import type { GameRunField } from '@/shared/types/game-run.types';
import type { FieldMappingReport } from './types';
import { toCamelCase } from '@/features/analysis/shared/parsing/field-utils';
import { isLegacyField, getMigratedFieldName } from '@/shared/domain/fields/internal-field-config';
import { extractFieldNamesFromStorage } from '@/shared/domain/fields/field-discovery';
import { classifyFields } from '@/shared/domain/fields/field-similarity';
import { detectRunTypeFromFields, extractNumericStats } from '@/shared/domain/run-types/run-type-detection';

/**
 * Create enhanced field mapping report with similarity detection
 *
 * CRITICAL LOGIC:
 * 1. Check if field is "supported" (in supportedFields.json) for UI indicators
 * 2. Check if field exists in localStorage for "new field" detection
 * 3. Compare display names for similarity warnings
 *
 * A field is NOT new if:
 * - It's in supportedFields.json (recognized by system)
 * - It's in localStorage (previously imported)
 * - It's similar to something in localStorage (user warning, but not "new")
 */
export function createFieldMappingReport(
  headers: string[],
  supportedFields: string[]
): FieldMappingReport {
  // Get all known DISPLAY NAMES from localStorage CSV headers
  const knownDisplayNames = extractFieldNamesFromStorage();
  const knownDisplayNamesArray: string[] = Array.from(knownDisplayNames);

  // Convert headers to camelCase for supportedFields.json lookups
  const camelCaseHeaders = headers.map(header => {
    // Handle underscore-prefixed headers (v2 internal fields)
    if (header.startsWith('_')) {
      const withoutUnderscore = header.substring(1);
      return '_' + toCamelCase(withoutUnderscore);
    } else {
      let camelCase = toCamelCase(header);

      // Apply legacy field migration
      if (isLegacyField(camelCase)) {
        const migratedName = getMigratedFieldName(camelCase);
        if (migratedName) {
          camelCase = migratedName;
        }
      }

      return camelCase;
    }
  });

  // Classify each field using DISPLAY NAMES for similarity detection against localStorage
  const classifications = classifyFields(headers, knownDisplayNamesArray);

  // Build enhanced mapped fields
  const mappedFields = headers.map((header, index) => {
    const camelCase = camelCaseHeaders[index];
    const classification = classifications[index];
    const supported = supportedFields.includes(camelCase);

    // Determine final status: supported fields are always "exact-match" even if not in localStorage
    let finalStatus = classification.status;
    if (supported && classification.status === 'new-field') {
      finalStatus = 'exact-match'; // It's in supportedFields.json, so it's recognized
    }

    return {
      csvHeader: header,
      camelCase: header, // Show display name to user, not camelCase
      supported,
      status: finalStatus,
      similarTo: classification.similarTo,
      similarityType: classification.similarityType
    };
  });

  // Collect TRULY new fields (not in localStorage AND not in supportedFields.json)
  const newFields = mappedFields
    .filter(f => f.status === 'new-field')
    .map(f => f.csvHeader);

  // Collect similar fields with their suggestions (only from localStorage comparison)
  const similarFields = classifications
    .filter(c => c.status === 'similar-field')
    .map(c => ({
      importedField: c.fieldName,
      existingField: c.similarTo!,
      similarityType: c.similarityType! as 'normalized' | 'levenshtein' | 'case-variation'
    }));

  // "Unsupported" fields = not in supportedFields.json (but will still be imported!)
  const unsupportedFields = mappedFields
    .filter(field => !field.supported)
    .map(field => field.csvHeader);

  return {
    mappedFields,
    newFields,
    similarFields,
    unsupportedFields,
    skippedFields: [] // No fields are skipped anymore
  };
}

/**
 * Extract key statistics from fields for cached properties
 */
export function extractKeyStatsFromFields(fields: Record<string, GameRunField>): {
  tier: number;
  wave: number;
  coinsEarned: number;
  cellsEarned: number;
  realTime: number;
  runType: 'farm' | 'tournament' | 'milestone';
} {
  const numericStats = extractNumericStats(fields);

  // Check if _runType field exists (from CSV), otherwise detect from tier
  let runType: 'farm' | 'tournament' | 'milestone';
  const runTypeField = fields._runType;
  if (runTypeField && runTypeField.rawValue) {
    runType = runTypeField.rawValue as 'farm' | 'tournament' | 'milestone';
  } else {
    runType = detectRunTypeFromFields(fields);
  }

  return {
    ...numericStats,
    runType,
  };
}
