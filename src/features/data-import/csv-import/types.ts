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
import type { ImportFormatSettings } from '@/shared/locale/types';
import type { BattleDateValidationError } from '@/shared/formatting/date-validation.types';

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
  importFormat?: ImportFormatSettings;
}

/**
 * Context information for a row with date validation warning
 * Helps users identify which run has the issue in bulk imports
 */
interface DateWarningContext {
  tier?: number;
  wave?: number;
  duration?: string;
}

/**
 * Warning for a row with invalid battleDate
 * The row still imports successfully but uses a fallback timestamp
 */
export interface DateValidationWarning {
  /** 1-indexed row number in the CSV (excluding header) */
  rowNumber: number;
  /** The original invalid value */
  rawValue: string;
  /** Detailed error information */
  error: BattleDateValidationError;
  /** Context to help identify the run */
  context: DateWarningContext;
  /** What fallback was used for the timestamp */
  fallbackUsed: 'import-time' | 'custom-timestamp';

  // Fixability detection for deriving battleDate from _date/_time
  /** Whether this row can be auto-fixed using _date/_time fields */
  isFixable: boolean;
  /** Raw _date field value if present (ISO format: yyyy-MM-dd) */
  dateFieldValue?: string;
  /** Raw _time field value if present (ISO format: HH:mm:ss) */
  timeFieldValue?: string;
  /** Derived battleDate computed from _date/_time (only set if isFixable) */
  derivedBattleDate?: Date;
}

/**
 * Result of CSV parsing operation
 */
export interface CsvParseResult {
  success: ParsedGameRun[];
  failed: number;
  errors: string[];
  fieldMappingReport: FieldMappingReport;
  /** Rows that imported with date validation warnings */
  dateWarnings?: DateValidationWarning[];
  /** True if the CSV is missing a battleDate column entirely */
  missingBattleDateColumn?: boolean;
}

/**
 * Individual field mapping entry
 */
export interface FieldMapping {
  csvHeader: string;
  camelCase: string;
  supported: boolean;
  /** Field classification: exact-match, new-field, or similar-field */
  status?: 'exact-match' | 'new-field' | 'similar-field';
  /** If similar-field, the suggested existing field */
  similarTo?: string;
  /** Type of similarity detected */
  similarityType?: 'exact' | 'normalized' | 'levenshtein' | 'case-variation';
}

/**
 * Enhanced field mapping report with similarity detection
 */
export interface FieldMappingReport {
  /** All mapped fields with their classification */
  mappedFields: FieldMapping[];
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
