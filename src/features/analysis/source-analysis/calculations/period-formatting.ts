/**
 * Period Formatting Logic
 *
 * Pure functions for generating period keys and formatting period labels
 * for display in charts and tables.
 */

import type { SourceDuration } from '../types';
import {
  formatDisplayDate,
  formatDisplayMonthDay,
  formatDisplayMonth,
} from '@/shared/formatting/date-formatters';

/**
 * Get the period key for a timestamp based on duration
 */
export function getPeriodKey(
  timestamp: Date,
  duration: SourceDuration
): string {
  const date = new Date(timestamp);

  switch (duration) {
    case 'per-run':
      return date.toISOString();
    case 'daily':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    case 'weekly':
      return getWeekKey(date);
    case 'monthly':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    case 'yearly':
      return `${date.getFullYear()}`;
    default:
      return date.toISOString();
  }
}

/**
 * Get week-based key for a date (Sunday start)
 * Returns the Sunday date as the key (YYYY-MM-DD format)
 */
function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Get the Sunday of this week (subtract day of week)
  const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
  d.setDate(d.getDate() - dayOfWeek);
  // Return as YYYY-MM-DD for the Sunday
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Format period key for display
 */
export function formatPeriodLabel(
  key: string,
  duration: SourceDuration,
  index?: number,
  totalRuns?: number
): string {
  switch (duration) {
    case 'per-run':
      if (index !== undefined && totalRuns !== undefined) {
        return `Run #${totalRuns - index}`;
      }
      return formatDisplayDate(new Date(key));
    case 'daily':
      return formatDailyLabel(key);
    case 'weekly':
      return formatWeeklyLabel(key);
    case 'monthly':
      return formatMonthlyLabel(key);
    case 'yearly':
      return key;
    default:
      return key;
  }
}

/**
 * Format daily period key (YYYY-MM-DD) to display label using user's locale
 */
function formatDailyLabel(key: string): string {
  const [year, month, day] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return formatDisplayMonthDay(date);
}

/**
 * Format weekly period key (YYYY-MM-DD) to display label using user's locale
 * Shows the Sunday date (start of the week).
 */
function formatWeeklyLabel(key: string): string {
  // Key is now YYYY-MM-DD format (the Sunday date)
  const [year, month, day] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return formatDisplayMonthDay(date);
}

/**
 * Format monthly period key (YYYY-MM) to display label using user's locale
 * Shows month abbreviation and 2-digit year (e.g., "Mar '24" or "März '24")
 */
function formatMonthlyLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  const yearSuffix = `'${year.slice(-2)}`;
  return `${formatDisplayMonth(date)} ${yearSuffix}`;
}
