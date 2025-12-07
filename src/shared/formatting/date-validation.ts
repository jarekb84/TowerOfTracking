/**
 * Battle Date Validation Functions
 *
 * Pure functions for validating battleDate fields during import.
 * Returns detailed error information for user feedback.
 */

import type { DateFormat } from '../locale/types';
import type {
  BattleDateErrorCode,
  BattleDateValidationError,
  BattleDateValidationResult,
  ValidateBattleDateOptions,
} from './date-validation.types';
import { MONTH_MAPPINGS } from '../locale/locale-config';
import { getImportFormat } from '../locale/locale-store';

// Regex pattern for battle date format: "Oct 14, 2025 13:14" or "nov. 20, 2025 22:28"
// Captures: [1] month, [2] day, [3] year, [4] hour, [5] minute
const BATTLE_DATE_REGEX = /^(\S+?)\.?\s+(\d{1,2}),?\s+(\d{4})\s+(\d{1,2}):(\d{2})/i;

/**
 * Create a validation error with consistent structure
 */
function createError(
  code: BattleDateErrorCode,
  rawValue: string,
  message: string,
  suggestion?: string
): BattleDateValidationError {
  return { code, rawValue, message, suggestion };
}

/**
 * Check if a value is empty or whitespace-only
 */
export function validateNotEmpty(
  value: string
): BattleDateValidationError | null {
  if (!value || typeof value !== 'string') {
    return createError(
      'empty',
      value ?? '',
      'Battle date is empty',
      'Ensure the Battle Date field contains a value'
    );
  }

  if (value.trim() === '') {
    return createError(
      'empty',
      value,
      'Battle date contains only whitespace',
      'Ensure the Battle Date field contains a valid date'
    );
  }

  return null;
}

/**
 * Match the battle date against the expected format regex
 * Returns the match array on success, or an error on failure
 */
export function validateFormatMatch(
  value: string
): RegExpMatchArray | BattleDateValidationError {
  const match = value.match(BATTLE_DATE_REGEX);

  if (!match) {
    return createError(
      'invalid-format',
      value,
      `Battle date format not recognized: "${value}"`,
      'Expected format: "Oct 14, 2025 13:14" or "nov. 20, 2025 22:28"'
    );
  }

  return match;
}

/**
 * Validate month name against locale mappings
 * Returns the month index (0-11) on success, or an error on failure
 */
export function validateMonthName(
  monthStr: string,
  format: DateFormat,
  rawValue: string
): number | BattleDateValidationError {
  const monthMappings = MONTH_MAPPINGS[format];
  const monthKey = monthStr.toLowerCase();

  // Try with and without period
  const month = monthMappings[monthKey] ?? monthMappings[monthKey + '.'];

  if (month === undefined) {
    return createError(
      'invalid-month',
      rawValue,
      `Unknown month name: "${monthStr}"`,
      'Use abbreviated month names like Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec'
    );
  }

  return month;
}

/**
 * Validate hour and minute ranges
 */
export function validateTimeRange(
  hour: number,
  minute: number,
  rawValue: string
): BattleDateValidationError | null {
  if (hour < 0 || hour > 23) {
    return createError(
      'invalid-hour',
      rawValue,
      `Invalid hour: ${hour}`,
      'Hour must be between 0 and 23'
    );
  }

  if (minute < 0 || minute > 59) {
    return createError(
      'invalid-minute',
      rawValue,
      `Invalid minute: ${minute}`,
      'Minute must be between 0 and 59'
    );
  }

  return null;
}

/**
 * Get the number of days in a given month
 */
function getDaysInMonth(year: number, month: number): number {
  // Month is 0-indexed, so we pass month+1 and day 0 to get last day of month
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the month name for display
 */
function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month] ?? 'Unknown';
}

/**
 * Validate that the day exists for the given month and year
 */
export function validateDateExists(
  year: number,
  month: number,
  day: number,
  rawValue: string
): BattleDateValidationError | null {
  const maxDays = getDaysInMonth(year, month);

  if (day < 1 || day > maxDays) {
    const monthName = getMonthName(month);
    return createError(
      'invalid-day',
      rawValue,
      `Invalid day ${day} for ${monthName}`,
      `${monthName} ${year} has ${maxDays} days`
    );
  }

  return null;
}

/**
 * Check if date is in the future (warning, not hard error)
 */
export function validateNotFuture(
  date: Date,
  rawValue: string
): BattleDateValidationError | null {
  const now = new Date();
  // Add 1 day buffer for timezone differences
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  if (date > tomorrow) {
    return createError(
      'future-date',
      rawValue,
      'Date is in the future',
      'Check that the year and date are correct'
    );
  }

  return null;
}

/**
 * Check if date is too old (warning, not hard error)
 * Default minimum is 2020-01-01 (approximate game release timeframe)
 */
export function validateNotTooOld(
  date: Date,
  rawValue: string,
  minDate?: Date
): BattleDateValidationError | null {
  // Default to 2020-01-01 as reasonable minimum
  const minimumDate = minDate ?? new Date(2020, 0, 1);

  if (date < minimumDate) {
    return createError(
      'too-old',
      rawValue,
      'Date appears to be too old',
      'Check that the year is correct'
    );
  }

  return null;
}

/** Options for date range validation */
interface DateRangeValidationOptions {
  rawValue: string;
  warnFutureDates: boolean;
  minDate?: Date;
}

/**
 * Validate date range (future and too-old checks)
 * Returns error if validation fails, null if valid
 */
function validateDateRange(
  date: Date,
  options: DateRangeValidationOptions
): BattleDateValidationError | null {
  if (options.warnFutureDates) {
    const futureError = validateNotFuture(date, options.rawValue);
    if (futureError) return futureError;
  }

  return validateNotTooOld(date, options.rawValue, options.minDate);
}

/**
 * Extract and validate time components from a date string
 * Returns error if time is invalid, null if valid or no time found
 */
function validateTimeFromString(
  dateStr: string
): BattleDateValidationError | null {
  const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;

  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  return validateTimeRange(hour, minute, dateStr);
}

/**
 * Try parsing with native Date for month-first format
 * Returns validation result if native parsing succeeds, null to continue with manual parsing
 */
function tryNativeParsing(
  battleDateStr: string,
  options: DateRangeValidationOptions
): BattleDateValidationResult | null {
  try {
    const date = new Date(battleDateStr);
    if (isNaN(date.getTime())) return null;

    // Native parsing succeeded - validate time range from original string
    // JavaScript accepts invalid values like "13:65" by rolling over
    const timeError = validateTimeFromString(battleDateStr);
    if (timeError) return { success: false, error: timeError };

    const rangeError = validateDateRange(date, options);
    if (rangeError) return { success: false, error: rangeError };

    return { success: true, date };
  } catch {
    return null;
  }
}

/**
 * Parse and validate date using manual regex-based parsing
 * Used for non-English formats or when native parsing fails
 */
function parseManually(
  battleDateStr: string,
  format: DateFormat,
  options: DateRangeValidationOptions
): BattleDateValidationResult {
  // Match format pattern
  const matchResult = validateFormatMatch(battleDateStr);
  if ('code' in matchResult) {
    return { success: false, error: matchResult };
  }

  const [, monthStr, dayStr, yearStr, hourStr, minuteStr] = matchResult;

  // Validate month name
  const monthResult = validateMonthName(monthStr, format, battleDateStr);
  if (typeof monthResult !== 'number') {
    return { success: false, error: monthResult };
  }

  const year = parseInt(yearStr, 10);
  const month = monthResult;
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Validate time range
  const timeError = validateTimeRange(hour, minute, battleDateStr);
  if (timeError) return { success: false, error: timeError };

  // Validate day exists for month
  const dateError = validateDateExists(year, month, day, battleDateStr);
  if (dateError) return { success: false, error: dateError };

  // Construct the date
  const date = new Date(year, month, day, hour, minute);

  // Validate date range
  const rangeError = validateDateRange(date, options);
  if (rangeError) return { success: false, error: rangeError };

  return { success: true, date };
}

/**
 * Main validation function that orchestrates all validation steps
 *
 * @param battleDateStr - The raw battle date string to validate
 * @param options - Validation options
 * @returns Validation result with either the parsed date or detailed error
 *
 * @example
 * const result = validateBattleDate('Oct 14, 2025 13:14');
 * if (result.success) {
 *   console.log(result.date);
 * } else {
 *   console.log(result.error.message);
 * }
 */
export function validateBattleDate(
  battleDateStr: string,
  options?: ValidateBattleDateOptions
): BattleDateValidationResult {
  const format = options?.format ?? getImportFormat().dateFormat;
  const warnFutureDates = options?.warnFutureDates ?? true;
  const rangeOptions: DateRangeValidationOptions = {
    rawValue: battleDateStr,
    warnFutureDates,
    minDate: options?.minDate,
  };

  // Check for empty value
  const emptyError = validateNotEmpty(battleDateStr);
  if (emptyError) return { success: false, error: emptyError };

  // Try native Date parsing for 'month-first' format
  if (format === 'month-first') {
    const nativeResult = tryNativeParsing(battleDateStr, rangeOptions);
    if (nativeResult) return nativeResult;
  }

  // Fall back to manual parsing
  return parseManually(battleDateStr, format, rangeOptions);
}

/**
 * Convenience function that returns Date | null for backwards compatibility
 * Use validateBattleDate() when you need detailed error information
 */
export function parseBattleDateWithValidation(
  battleDateStr: string,
  format?: DateFormat
): Date | null {
  const result = validateBattleDate(battleDateStr, { format });
  return result.success ? result.date : null;
}
