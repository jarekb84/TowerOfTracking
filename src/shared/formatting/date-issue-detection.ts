/**
 * Date Issue Detection
 *
 * Shared pure functions for detecting date issues and applying fixes.
 * Used by both single-entry and bulk import flows to ensure consistent behavior.
 */

import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types';
import type { BattleDateValidationError } from './date-validation.types';
import { INTERNAL_FIELD_NAMES } from '@/shared/domain/fields/internal-field-config';
import { constructDate, createBattleDateField } from './date-formatters';

/**
 * Source of the derived date for fixing
 */
type DateFixSource = 'internal-fields' | 'user-selected';

/**
 * Information about a date issue detected in a game run
 */
export interface DateIssueInfo {
  /** Whether there's a date issue (missing or invalid battleDate) */
  hasIssue: boolean;
  /** Type of issue: missing battleDate field, or invalid value */
  issueType: 'missing' | 'invalid' | null;
  /** Validation error details (for invalid battleDate) */
  validationError: BattleDateValidationError | null;
  /** Whether the issue can be fixed */
  isFixable: boolean;
  /** Source of the fix: from _date/_time fields or user-selected date */
  fixSource: DateFixSource | null;
  /** The date that would be used for the fix */
  derivedDate: Date | null;
  /** Raw _date field value (for display in UI) */
  dateFieldValue?: string;
  /** Raw _time field value (for display in UI) */
  timeFieldValue?: string;
}

/**
 * Result of attempting to derive a date from internal _date/_time fields.
 * Used by both single-entry and bulk import flows for consistent detection.
 */
interface DateDerivationResult {
  /** Whether derivation succeeded */
  success: boolean;
  /** The derived date (null if unsuccessful) */
  date: Date | null;
  /** Raw _date field value (for display in UI) */
  dateValue?: string;
  /** Raw _time field value (for display in UI) */
  timeValue?: string;
}

/**
 * Try to derive a date from internal _date/_time fields.
 *
 * This is the single source of truth for date derivation logic,
 * used by both single-entry and bulk import flows.
 *
 * @param fields - Record of GameRunField to check for _date/_time
 * @returns DateDerivationResult with success status and derived date
 *
 * @example
 * const result = tryDeriveFromInternalFields(run.fields);
 * if (result.success && result.date) {
 *   // Use result.date for the fix
 * }
 */
export function tryDeriveFromInternalFields(
  fields: Record<string, GameRunField>
): DateDerivationResult {
  const dateField = fields[INTERNAL_FIELD_NAMES.DATE];
  const timeField = fields[INTERNAL_FIELD_NAMES.TIME];

  const dateValue = dateField?.rawValue;
  const timeValue = timeField?.rawValue;

  // Both fields must exist
  if (!dateValue || !timeValue) {
    return { success: false, date: null, dateValue, timeValue };
  }

  // Try to construct a date
  const derivedDate = constructDate(dateValue, timeValue);
  return {
    success: derivedDate !== null,
    date: derivedDate,
    dateValue,
    timeValue,
  };
}

/**
 * Detect date issues in a parsed game run.
 *
 * Checks for:
 * 1. Missing battleDate field
 * 2. Invalid battleDate value (has dateValidationError)
 *
 * Determines fixability:
 * - From _date/_time internal fields (preferred)
 * - From user-selected date (if provided)
 *
 * @param run - The parsed game run to check
 * @param userSelectedDate - Optional date from user's date/time picker
 * @returns DateIssueInfo with detection results
 *
 * @example
 * const info = detectDateIssue(run);
 * if (info.hasIssue && info.isFixable) {
 *   // Show auto-fix toggle to user
 * }
 */
export function detectDateIssue(
  run: ParsedGameRun,
  userSelectedDate?: Date
): DateIssueInfo {
  const hasBattleDateField = !!run.fields.battleDate;
  const hasValidationError = !!run.dateValidationError;

  // No issue if battleDate exists and is valid
  if (hasBattleDateField && !hasValidationError) {
    return {
      hasIssue: false,
      issueType: null,
      validationError: null,
      isFixable: false,
      fixSource: null,
      derivedDate: null,
    };
  }

  // Determine issue type
  const issueType: 'missing' | 'invalid' = hasBattleDateField ? 'invalid' : 'missing';

  // Try to derive from internal fields first
  const internalResult = tryDeriveFromInternalFields(run.fields);
  if (internalResult.success && internalResult.date) {
    return {
      hasIssue: true,
      issueType,
      validationError: run.dateValidationError ?? null,
      isFixable: true,
      fixSource: 'internal-fields',
      derivedDate: internalResult.date,
      dateFieldValue: internalResult.dateValue,
      timeFieldValue: internalResult.timeValue,
    };
  }

  // Fall back to user-selected date if available
  if (userSelectedDate) {
    return {
      hasIssue: true,
      issueType,
      validationError: run.dateValidationError ?? null,
      isFixable: true,
      fixSource: 'user-selected',
      derivedDate: userSelectedDate,
      dateFieldValue: internalResult.dateValue,
      timeFieldValue: internalResult.timeValue,
    };
  }

  // Issue exists but cannot be fixed
  return {
    hasIssue: true,
    issueType,
    validationError: run.dateValidationError ?? null,
    isFixable: false,
    fixSource: null,
    derivedDate: null,
    dateFieldValue: internalResult.dateValue,
    timeFieldValue: internalResult.timeValue,
  };
}

/**
 * Apply a date fix to a parsed game run.
 *
 * Creates or updates the battleDate field with the derived date,
 * updates the timestamp, and clears any validation error.
 *
 * @param run - The run to fix
 * @param derivedDate - The date to use for the fix
 * @returns Updated ParsedGameRun with battleDate field and corrected timestamp
 *
 * @example
 * const info = detectDateIssue(run, userDate);
 * if (info.isFixable && info.derivedDate) {
 *   const fixedRun = applyDateFix(run, info.derivedDate);
 * }
 */
export function applyDateFix(
  run: ParsedGameRun,
  derivedDate: Date
): ParsedGameRun {
  const battleDateField = createBattleDateField(derivedDate);

  return {
    ...run,
    timestamp: derivedDate,
    dateValidationError: undefined,
    fields: {
      ...run.fields,
      battleDate: battleDateField,
    },
  };
}
