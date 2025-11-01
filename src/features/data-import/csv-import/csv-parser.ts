import type {
  ParsedGameRun,
  GameRunField
} from '@/shared/types/game-run.types';
import type {
  CsvParseConfig,
  CsvParseResult,
  FieldMappingReport,
  CsvDelimiter
} from './types';
import { createGameRunField, toCamelCase } from '@/features/analysis/shared/parsing/field-utils';
import { detectRunTypeFromFields, extractNumericStats } from '@/shared/domain/run-types/run-type-detection';
import { parseTimestampFromFields } from '../../../shared/formatting/date-formatters';
import { isLegacyField, getMigratedFieldName } from '@/shared/domain/fields/internal-field-config';
import { detectDelimiter } from './csv-helpers';
import { extractFieldNamesFromStorage } from '@/shared/domain/fields/field-discovery';
import { classifyFields } from '@/shared/domain/fields/field-similarity';
import supportedFieldsData from '../../../../sampleData/supportedFields.json';

// Load supported fields from JSON
const SUPPORTED_FIELDS: string[] = supportedFieldsData;

// Delimiter mapping
const DELIMITER_MAP: Record<CsvDelimiter, string> = {
  tab: '\t',
  comma: ',',
  semicolon: ';',
  custom: ','  // Default fallback, will be overridden
};

/**
 * Generic CSV parser that works with any column headers by mapping them to supported fields
 */
export function parseGenericCsv(
  rawInput: string, 
  config: Partial<CsvParseConfig> = {}
): CsvParseResult {
  const fullConfig: CsvParseConfig = {
    delimiter: undefined, // Auto-detect if not provided
    supportedFields: SUPPORTED_FIELDS,
    ...config
  };

  const lines = rawInput.trim().split('\n');
  if (lines.length === 0) {
    return {
      success: [],
      failed: 0,
      errors: ['No data provided'],
      fieldMappingReport: {
        mappedFields: [],
        newFields: [],
        similarFields: [],
        unsupportedFields: [],
        skippedFields: []
      }
    };
  }

  const success: ParsedGameRun[] = [];
  const errors: string[] = [];
  let failed = 0;

  // Parse header and determine delimiter
  const firstLine = lines[0];
  const delimiter = config.delimiter || detectDelimiter(firstLine);
  
  // Parse headers and create field mapping
  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/["']/g, ''));
  const fieldMappingReport = createFieldMappingReport(headers, fullConfig.supportedFields);

  // Build mapping from CSV column index to camelCase field name (INCLUDE ALL FIELDS)
  // Note: We no longer filter by supportedFields to ensure all game fields persist
  const columnToFieldMap = new Map<number, string>();
  headers.forEach((header, index) => {
    let camelCase: string;

    // Handle underscore-prefixed headers (new format): "_Date" → "_date"
    // These are already in the correct format, just need camelCase conversion
    if (header.startsWith('_')) {
      // Keep the underscore and camelCase the rest
      const withoutUnderscore = header.substring(1);
      camelCase = '_' + toCamelCase(withoutUnderscore);
    } else {
      camelCase = toCamelCase(header);

      // Apply legacy field migration for old headers (e.g., "Date" → "_date", "Notes" → "_notes")
      if (isLegacyField(camelCase)) {
        const migratedName = getMigratedFieldName(camelCase);
        if (migratedName) {
          camelCase = migratedName;
        }
      }
    }

    // Always include the field, regardless of whether it's in supportedFields
    columnToFieldMap.set(index, camelCase);
  });

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = line.split(delimiter).map(v => v.trim().replace(/["']/g, ''));
      
      // Allow for fewer columns than headers (missing trailing columns are OK)
      if (values.length > headers.length) {
        errors.push(`Row ${i + 1}: Too many columns (expected max ${headers.length}, got ${values.length})`);
        failed++;
        continue;
      }

      // Build field structure using only supported fields
      const fields: Record<string, GameRunField> = {};
      
      // Process each column that maps to a supported field
      for (const [columnIndex, fieldName] of columnToFieldMap.entries()) {
        const rawValue = values[columnIndex] || '';
        if (!rawValue) continue; // Skip empty values
        
        const originalHeader = headers[columnIndex];
        const field = createGameRunField(originalHeader, rawValue);
        
        fields[fieldName] = field;
      }

      // Parse timestamp using unified parsing logic
      const timestamp = parseTimestampFromFields(fields);

      // Extract key stats from field structure
      const keyStats = extractKeyStatsFromFields(fields);

      const parsedRun: ParsedGameRun = {
        id: crypto.randomUUID(),
        timestamp,
        fields,
        ...keyStats,
      };

      success.push(parsedRun);
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failed++;
    }
  }

  return { 
    success, 
    failed, 
    errors, 
    fieldMappingReport 
  };
}

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
function createFieldMappingReport(
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
function extractKeyStatsFromFields(fields: Record<string, GameRunField>): {
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

/**
 * Get delimiter string from CsvDelimiter type
 */
export function getDelimiterString(delimiterType: CsvDelimiter, customDelimiter?: string): string {
  if (delimiterType === 'custom' && customDelimiter) {
    return customDelimiter;
  }
  return DELIMITER_MAP[delimiterType];
}

/**
 * Get list of supported fields for validation
 */
export function getSupportedFields(): string[] {
  return [...SUPPORTED_FIELDS];
}