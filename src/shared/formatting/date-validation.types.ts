/**
 * Battle Date Validation Types
 *
 * Type definitions for detailed validation of battleDate fields during import.
 * These types enable clear user feedback for invalid date values.
 */

import type { DateFormat } from '@/shared/locale/types';

/**
 * Error codes for specific validation failures
 */
export type BattleDateErrorCode =
  | 'empty'          // Empty or whitespace-only value
  | 'invalid-format' // Regex pattern doesn't match expected format
  | 'invalid-month'  // Month name not found in mappings
  | 'invalid-hour'   // Hour > 23
  | 'invalid-minute' // Minute > 59
  | 'invalid-day'    // Day doesn't exist for month (e.g., Feb 30)
  | 'future-date'    // Date is in the future (warning, not error)
  | 'too-old';       // Date is before the game existed (warning)

/**
 * Detailed error information for a failed validation
 */
export interface BattleDateValidationError {
  /** Specific error code for programmatic handling */
  code: BattleDateErrorCode;
  /** Human-readable error message */
  message: string;
  /** The original invalid value */
  rawValue: string;
  /** Optional actionable suggestion for fixing the issue */
  suggestion?: string;
}

/**
 * Result of battle date validation
 *
 * Discriminated union that returns either:
 * - Success with parsed Date
 * - Failure with detailed error information
 */
export type BattleDateValidationResult =
  | { success: true; date: Date }
  | { success: false; error: BattleDateValidationError };

/**
 * Options for validateBattleDate function
 */
export interface ValidateBattleDateOptions {
  /** Date format to use for parsing (defaults to store's import format) */
  format?: DateFormat;
  /** Minimum valid date (for too-old check) */
  minDate?: Date;
  /** Whether to warn about future dates (default: true) */
  warnFutureDates?: boolean;
}
