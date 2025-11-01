/**
 * CSV Import Type Definitions
 *
 * These types are owned by the csv-import feature and should only be
 * imported by components within this feature or the csv-export feature
 * (which shares the delimiter type).
 *
 * Co-located with csv-import feature per Migration Story 11B.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types';

/**
 * CSV delimiter options for parsing and exporting
 * Shared between csv-import and csv-export features
 */
export type CsvDelimiter = 'tab' | 'comma' | 'semicolon' | 'custom';

/**
 * Configuration for CSV parsing
 */
export interface CsvParseConfig {
  delimiter?: string;
  supportedFields: string[];
}

/**
 * Result of CSV parsing operation
 */
export interface CsvParseResult {
  success: ParsedGameRun[];
  failed: number;
  errors: string[];
  fieldMappingReport: FieldMappingReport;
}

/**
 * Enhanced field mapping report with similarity detection
 */
export interface FieldMappingReport {
  /** All mapped fields with their classification */
  mappedFields: Array<{
    csvHeader: string;
    camelCase: string;
    supported: boolean;
    /** Field classification: exact-match, new-field, or similar-field */
    status?: 'exact-match' | 'new-field' | 'similar-field';
    /** If similar-field, the suggested existing field */
    similarTo?: string;
    /** Type of similarity detected */
    similarityType?: 'exact' | 'normalized' | 'levenshtein' | 'case-variation';
  }>;
  /** Fields that are completely new (no similar matches) */
  newFields: string[];
  /** Fields that are similar to existing fields */
  similarFields: Array<{
    importedField: string;
    existingField: string;
    similarityType: 'normalized' | 'levenshtein' | 'case-variation';
  }>;
  /** @deprecated Use newFields instead - fields are never actually skipped */
  unsupportedFields: string[];
  /** @deprecated Fields are not skipped anymore, they're all imported */
  skippedFields: string[];
}
