/**
 * Date Derivation Fixer
 *
 * Pure functions for categorizing date validation warnings and applying
 * fixes to derive battleDate from _date/_time fields.
 */

import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types';
import type { DateValidationWarning } from '../types';

/**
 * Format a date for battleDate rawValue in a format parseable by parseBattleDate.
 * Uses "Oct 14, 2025 13:14" format (month-first with capitalized month).
 *
 * @param date - Date to format
 * @returns Formatted date string
 */
function formatBattleDateRawValue(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

/**
 * Categorized warnings split by fixability
 */
interface CategorizedWarnings {
  /** Warnings that can be fixed (have valid _date/_time fields) */
  fixable: DateValidationWarning[];
  /** Warnings that cannot be fixed (missing _date/_time fields) */
  unfixable: DateValidationWarning[];
}

/**
 * Result of applying date derivation fixes
 */
interface DateDerivationResult {
  /** Updated runs with derived timestamps applied */
  fixedRuns: ParsedGameRun[];
  /** Number of rows that were fixed */
  fixedCount: number;
  /** Number of rows that could not be fixed */
  unfixableCount: number;
}

/**
 * Separates warnings into fixable and unfixable categories.
 *
 * Fixable: Row has valid _date and _time fields that can derive a battleDate
 * Unfixable: Row is missing _date or _time fields
 *
 * @param warnings - Array of date validation warnings
 * @returns Object with fixable and unfixable warning arrays
 */
export function categorizeWarnings(
  warnings: DateValidationWarning[]
): CategorizedWarnings {
  const fixable: DateValidationWarning[] = [];
  const unfixable: DateValidationWarning[] = [];

  for (const warning of warnings) {
    if (warning.isFixable && warning.derivedBattleDate) {
      fixable.push(warning);
    } else {
      unfixable.push(warning);
    }
  }

  return { fixable, unfixable };
}

/**
 * Applies date derivation fixes to parsed runs.
 *
 * For each fixable warning, updates the corresponding run's timestamp
 * to use the derived battleDate from _date/_time fields.
 *
 * @param runs - Array of parsed game runs
 * @param warnings - Array of date validation warnings
 * @returns Object with fixed runs, fixed count, and unfixable count
 */
export function applyDateDerivationFixes(
  runs: ParsedGameRun[],
  warnings: DateValidationWarning[]
): DateDerivationResult {
  // Create a map of row numbers to fixable warnings for O(1) lookup
  const fixableWarnings = new Map<number, DateValidationWarning>();
  let unfixableCount = 0;

  for (const warning of warnings) {
    if (warning.isFixable && warning.derivedBattleDate) {
      fixableWarnings.set(warning.rowNumber, warning);
    } else {
      unfixableCount++;
    }
  }

  // Apply fixes to runs - rowNumber is 1-indexed in warnings,
  // but we iterate by run index which aligns with how parseGenericCsv works
  const fixedRuns = runs.map((run, index) => {
    // CSV row numbers start at 1 (after header), matching index + 1
    // But parseGenericCsv uses i (starting from 1 for first data row)
    // The rowNumber in warnings corresponds to the line index in the CSV
    const warning = fixableWarnings.get(index + 1);

    if (warning?.derivedBattleDate) {
      // Create the formatted date string for rawValue/displayValue
      const formattedDate = formatBattleDateRawValue(warning.derivedBattleDate);

      // Create a proper battleDate field
      const battleDateField: GameRunField = {
        rawValue: formattedDate,
        value: warning.derivedBattleDate,
        displayValue: formattedDate,
        originalKey: 'Battle Date',
        dataType: 'date',
      };

      return {
        ...run,
        timestamp: warning.derivedBattleDate,
        // Clear the validation error since we've fixed the date
        dateValidationError: undefined,
        fields: {
          ...run.fields,
          battleDate: battleDateField,
        },
      };
    }

    return run;
  });

  return {
    fixedRuns,
    fixedCount: fixableWarnings.size,
    unfixableCount,
  };
}

/**
 * Counts how many warnings are fixable vs unfixable.
 *
 * @param warnings - Array of date validation warnings
 * @returns Object with fixable and unfixable counts
 */
export function countWarningsByFixability(
  warnings: DateValidationWarning[]
): { fixableCount: number; unfixableCount: number } {
  let fixableCount = 0;
  let unfixableCount = 0;

  for (const warning of warnings) {
    if (warning.isFixable && warning.derivedBattleDate) {
      fixableCount++;
    } else {
      unfixableCount++;
    }
  }

  return { fixableCount, unfixableCount };
}
