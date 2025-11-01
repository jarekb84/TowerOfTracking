/**
 * Date formatting utilities for game run data
 *
 * Provides consistent date/time formatting across the application.
 * All date operations should use these utilities to ensure consistency.
 */

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

/**
 * Parse battle_date field from game export format
 * Format: "Oct 14, 2025 13:14" (abbreviated month, 24-hour time)
 *
 * @param battleDateStr - Battle date string from game export
 * @returns Date object or null if parsing fails
 *
 * @example
 * parseBattleDate('Oct 14, 2025 13:14') // Date object
 * parseBattleDate('invalid') // null
 */
export function parseBattleDate(battleDateStr: string): Date | null {
  if (!battleDateStr || typeof battleDateStr !== 'string') return null;

  try {
    const date = new Date(battleDateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch {
    // Fall through to null
  }

  return null;
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
