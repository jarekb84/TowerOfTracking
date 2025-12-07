/**
 * Date formatting utilities for game run data
 *
 * Provides consistent date/time formatting across the application.
 * All date operations should use these utilities to ensure consistency.
 *
 * Display functions use Intl.DateTimeFormat with the user's locale from the store.
 * Parsing functions handle game-specific date formats for data import.
 */

import type { DateFormat } from '@/shared/locale/types';
import type { GameRunField } from '@/shared/types/game-run.types';
import { MONTH_MAPPINGS } from '@/shared/locale/locale-config';
export { validateBattleDate } from './date-validation';
import {
  getImportFormat,
  getDateFormatter,
  getDateTimeFormatter,
  getShortDateFormatter,
  getNumericDateFormatter,
  getTimeFormatter,
  getMonthDayFormatter,
  getMonthFormatter,
} from '@/shared/locale/locale-store';

// ============================================================================
// ISO format functions (locale-independent, for data storage/keys)
// ============================================================================

/**
 * Format date as ISO date string (yyyy-MM-dd)
 *
 * @param date - Date to format
 * @returns Formatted date string in yyyy-MM-dd format
 *
 * @example
 * formatIsoDate(new Date('2025-10-14T13:14:00')) // '2025-10-14'
 */
export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time as ISO time string (HH:mm:ss)
 *
 * @param date - Date to extract time from
 * @returns Formatted time string in HH:mm:ss format
 *
 * @example
 * formatIsoTime(new Date('2025-10-14T13:14:05')) // '13:14:05'
 */
export function formatIsoTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format date and time as ISO datetime string without seconds (yyyy-MM-ddTHH:mm)
 * Used for composite keys where minute precision is sufficient
 *
 * @param date - Date to format
 * @returns Formatted datetime string in yyyy-MM-ddTHH:mm format
 *
 * @example
 * formatIsoDateTimeMinute(new Date('2025-10-14T13:14:05')) // '2025-10-14T13:14'
 */
export function formatIsoDateTimeMinute(date: Date): string {
  const datePart = formatIsoDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${datePart}T${hours}:${minutes}`;
}

/**
 * Format duration in seconds to human-readable format (7h 45m 33s)
 * Always includes all units for consistency in composite keys
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 *
 * @example
 * formatDurationForKey(27933) // '7h 45m 33s'
 * formatDurationForKey(3600) // '1h 0m 0s'
 */
export function formatDurationForKey(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

// Canonical month abbreviations for storage format (US-centric, English)
const CANONICAL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a Date to canonical battleDate storage format.
 *
 * Uses "Oct 14, 2025 13:14" format (month-first with capitalized English months)
 * which is parseable by parseBattleDate() with 'month-first' format.
 *
 * This is the inverse of parseBattleDate() - they form a symmetrical format/parse pair.
 * Use this for internal storage only - for user-facing display, use formatDisplayDateTime().
 *
 * @param date - Date to format
 * @returns Formatted date string in canonical storage format
 *
 * @example
 * formatCanonicalBattleDate(new Date('2025-10-14T13:14:00')) // 'Oct 14, 2025 13:14'
 * formatCanonicalBattleDate(new Date('2025-01-05T08:05:00')) // 'Jan 5, 2025 08:05'
 */
export function formatCanonicalBattleDate(date: Date): string {
  const month = CANONICAL_MONTHS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

/**
 * Create a complete battleDate GameRunField from a Date.
 *
 * This centralizes battleDate field creation to ensure:
 * - rawValue uses canonical storage format (formatCanonicalBattleDate)
 * - displayValue uses locale-aware formatting (formatDisplayDateTime)
 * - Consistent metadata (originalKey, dataType)
 *
 * Use this function whenever you need to create a battleDate field,
 * whether in bulk import auto-fix or single-entry import.
 *
 * @param date - Date to create field from
 * @returns Complete GameRunField for battleDate
 *
 * @example
 * const field = createBattleDateField(new Date('2025-01-15T13:45:00'));
 * // field.rawValue = 'Jan 15, 2025 13:45' (canonical)
 * // field.displayValue = locale-dependent
 * // field.value = Date object
 */
export function createBattleDateField(date: Date): GameRunField {
  return {
    rawValue: formatCanonicalBattleDate(date),
    value: date,
    displayValue: formatDisplayDateTime(date),
    originalKey: 'Battle Date',
    dataType: 'date',
  };
}

/**
 * Parse battle_date field from game export format
 * Supports multiple formats:
 * - "Oct 14, 2025 13:14" (capitalized month)
 * - "nov. 20, 2025 22:28" (lowercase month with period)
 *
 * Uses the import format from the locale store if not explicitly provided.
 *
 * @param battleDateStr - Battle date string from game export
 * @param format - Date format to use for parsing (defaults to store's import format)
 * @returns Date object or null if parsing fails
 *
 * @example
 * parseBattleDate('Oct 14, 2025 13:14') // Date object
 * parseBattleDate('nov. 20, 2025 22:28', 'month-first-lowercase') // Date object
 * parseBattleDate('invalid') // null
 */
export function parseBattleDate(
  battleDateStr: string,
  format?: DateFormat
): Date | null {
  if (!battleDateStr || typeof battleDateStr !== 'string') return null;

  // Use provided format or get from store
  const dateFormat = format ?? getImportFormat().dateFormat;

  // For capitalized month format, try native parsing first (usually works)
  if (dateFormat === 'month-first') {
    try {
      const date = new Date(battleDateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch {
      // Fall through to manual parsing
    }
  }

  // Manual parsing for formats that native Date() doesn't handle
  return parseWithFormat(battleDateStr, dateFormat);
}

/**
 * Parse date string using format-specific month mappings
 *
 * @param dateStr - Date string to parse
 * @param format - Date format to use
 * @returns Date object or null if parsing fails
 */
function parseWithFormat(dateStr: string, format: DateFormat): Date | null {
  const monthMappings = MONTH_MAPPINGS[format];

  // Pattern: "nov. 20, 2025 22:28" or "Nov 20, 2025 22:28"
  // Captures: month, day, year, hour, minute
  const match = dateStr.match(
    /^(\S+?)\.?\s+(\d{1,2}),?\s+(\d{4})\s+(\d{1,2}):(\d{2})/i
  );

  if (!match) return null;

  const [, monthStr, day, year, hour, minute] = match;
  const monthKey = monthStr.toLowerCase();

  // Try with and without period
  const month = monthMappings[monthKey] ?? monthMappings[monthKey + '.'];

  if (month === undefined) return null;

  return new Date(
    parseInt(year),
    month,
    parseInt(day),
    parseInt(hour),
    parseInt(minute)
  );
}

/**
 * Construct Date from separate date and time strings
 *
 * @param dateStr - Date string (e.g., '2025-10-14')
 * @param timeStr - Optional time string (e.g., '13:14:00')
 * @returns Date object or null if construction fails
 *
 * @example
 * constructDate('2025-10-14', '13:14:00') // Date object
 * constructDate('2025-10-14', '') // Date object (time defaults to 00:00:00)
 * constructDate('invalid', '13:14:00') // null
 */
export function constructDate(dateStr: string, timeStr?: string): Date | null {
  if (!dateStr) return null;

  try {
    const combinedStr = timeStr ? `${dateStr} ${timeStr}` : dateStr;
    const date = new Date(combinedStr);

    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch {
    // Fall through to null
  }

  return null;
}

/**
 * Format datetime for filename (yyyy-MM-dd_HH-mm-ss)
 * Uses hyphens instead of colons for filesystem compatibility
 *
 * @param date - Date to format
 * @returns Formatted datetime string suitable for filenames
 *
 * @example
 * formatFilenameDateTime(new Date('2025-10-14T13:14:05')) // '2025-10-14_13-14-05'
 */
export function formatFilenameDateTime(date: Date): string {
  const datePart = formatIsoDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${datePart}_${hours}-${minutes}-${seconds}`;
}

/**
 * Parse timestamp from game run fields with priority hierarchy
 *
 * Priority order:
 * 1. battle_date field (new game export format)
 * 2. _date/_time or date/time fields (legacy or internal fields)
 * 3. Fallback date (customTimestamp or current time)
 *
 * @param fields - Game run fields record
 * @param fallbackDate - Optional fallback date if parsing fails
 * @returns Parsed Date object
 *
 * @example
 * parseTimestampFromFields({ battleDate: { rawValue: 'Oct 14, 2025 13:14', ... } })
 * parseTimestampFromFields({ _date: { rawValue: '2025-10-14', ... }, _time: { rawValue: '13:14:00', ... } })
 */
export function parseTimestampFromFields(
  fields: Record<string, { rawValue: string; value?: unknown }>,
  fallbackDate?: Date
): Date {
  // Priority 1: Check for battle_date field (new game export format)
  if (fields.battleDate) {
    const battleDate = parseBattleDate(fields.battleDate.rawValue);
    if (battleDate) {
      return battleDate;
    }
  }

  // Priority 2: Check for _date/_time fields (internal) or date/time fields (legacy)
  const dateField = fields._date || fields.date;
  const timeField = fields._time || fields.time;

  if (dateField) {
    const dateStr = dateField.rawValue;
    const timeStr = timeField?.rawValue;
    const timestamp = constructDate(dateStr, timeStr);
    if (timestamp) {
      return timestamp;
    }
  }

  // Priority 3: Fallback to provided date or current time
  return fallbackDate || new Date();
}

// ============================================================================
// Display format functions (locale-aware, for UI rendering)
// ============================================================================

/**
 * Format date for display using user's locale (e.g., Nov 20, 2025 or 20 nov. 2025)
 *
 * @param date - Date to format
 * @returns Locale-formatted date string
 *
 * @example
 * // With en-US locale
 * formatDisplayDate(new Date('2025-11-20')) // 'Nov 20, 2025'
 * // With de-DE locale
 * formatDisplayDate(new Date('2025-11-20')) // '20. Nov. 2025'
 */
export function formatDisplayDate(date: Date): string {
  return getDateFormatter().format(date);
}

/**
 * Format date and time for display using user's locale
 *
 * @param date - Date to format
 * @returns Locale-formatted date+time string
 *
 * @example
 * // With en-US locale
 * formatDisplayDateTime(new Date('2025-11-20T15:45')) // 'Nov 20, 2025, 15:45'
 * // With de-DE locale
 * formatDisplayDateTime(new Date('2025-11-20T15:45')) // '20. Nov. 2025, 15:45'
 */
export function formatDisplayDateTime(date: Date): string {
  return getDateTimeFormatter().format(date);
}

/**
 * Format short date without year using user's locale (e.g., 11/30 or 30/11)
 *
 * @param date - Date to format
 * @returns Locale-formatted short date string
 *
 * @example
 * // With en-US locale
 * formatDisplayShortDate(new Date('2025-11-30')) // '11/30'
 * // With de-DE locale
 * formatDisplayShortDate(new Date('2025-11-30')) // '30.11.'
 */
export function formatDisplayShortDate(date: Date): string {
  return getShortDateFormatter().format(date);
}

/**
 * Format date with year in numeric-only format using user's locale (e.g., 11/30/2025 or 30/11/2025)
 * Uses locale conventions for day/month order but only numeric components (no month names)
 *
 * @param date - Date to format
 * @returns Locale-formatted numeric date string with year
 *
 * @example
 * // With en-US locale
 * formatDisplayNumericDate(new Date('2025-11-30')) // '11/30/2025'
 * // With de-DE locale
 * formatDisplayNumericDate(new Date('2025-11-30')) // '30.11.2025'
 */
export function formatDisplayNumericDate(date: Date): string {
  return getNumericDateFormatter().format(date);
}

/**
 * Format time only using user's locale (e.g., 3:45 PM or 15:45)
 *
 * @param date - Date to extract and format time from
 * @returns Locale-formatted time string
 *
 * @example
 * // With en-US locale
 * formatDisplayTime(new Date('2025-11-20T15:45')) // '3:45 PM'
 * // With de-DE locale
 * formatDisplayTime(new Date('2025-11-20T15:45')) // '15:45'
 */
export function formatDisplayTime(date: Date): string {
  return getTimeFormatter().format(date);
}

/**
 * Format month and day using user's locale (e.g., NOV 30 or 30 NOV)
 *
 * @param date - Date to format
 * @returns Locale-formatted month+day string
 *
 * @example
 * // With en-US locale
 * formatDisplayMonthDay(new Date('2025-11-30')) // 'Nov 30'
 * // With de-DE locale
 * formatDisplayMonthDay(new Date('2025-11-30')) // '30. Nov.'
 */
export function formatDisplayMonthDay(date: Date): string {
  return getMonthDayFormatter().format(date);
}

/**
 * Format month only using user's locale (e.g., Nov or nov.)
 *
 * @param date - Date to format
 * @returns Locale-formatted month string
 *
 * @example
 * // With en-US locale
 * formatDisplayMonth(new Date('2025-11-20')) // 'Nov'
 * // With de-DE locale
 * formatDisplayMonth(new Date('2025-11-20')) // 'Nov.'
 */
export function formatDisplayMonth(date: Date): string {
  return getMonthFormatter().format(date);
}

/**
 * Format week label using user's locale (e.g., "Week of 11/30" or "Week of 30/11")
 *
 * @param date - Start date of the week
 * @returns Formatted week label string
 *
 * @example
 * // With en-US locale
 * formatWeekOfLabel(new Date('2025-11-30')) // 'Week of 11/30'
 * // With de-DE locale
 * formatWeekOfLabel(new Date('2025-11-30')) // 'Week of 30.11.'
 */
export function formatWeekOfLabel(date: Date): string {
  return `Week of ${formatDisplayShortDate(date)}`;
}

/**
 * Format short date and time together (e.g., "11/30 3:45 PM" or "30/11 15:45")
 * Used for per-run tier trends column headers
 *
 * @param date - Date to format
 * @returns Locale-formatted short date + time string
 *
 * @example
 * // With en-US locale
 * formatDisplayShortDateTime(new Date('2025-11-30T15:45')) // '11/30 3:45 PM'
 * // With de-DE locale
 * formatDisplayShortDateTime(new Date('2025-11-30T15:45')) // '30.11. 15:45'
 */
export function formatDisplayShortDateTime(date: Date): string {
  return `${formatDisplayShortDate(date)} ${formatDisplayTime(date)}`;
}
