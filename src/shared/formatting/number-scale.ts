import type { ImportFormatSettings } from '@/shared/locale/types';
import { getNumberFormatter, getImportFormat } from '@/shared/locale/locale-store';

/**
 * SINGLE SOURCE OF TRUTH for scale suffixes and multipliers.
 *
 * Game numbers are stored as JavaScript numbers internally (not strings).
 * This enables math operations (aggregations, averages, sorting).
 * JavaScript's Number type (64-bit float) supports up to ~1.8e308,
 * which is plenty for the game's values.
 *
 * This array serves two purposes:
 * 1. PARSING: Convert "43.91T" string → 43910000000000 number (via derived SCALE_MULTIPLIERS dict)
 * 2. FORMATTING: Convert 43910000000000 number → "43.9T" string (via O(1) index lookup below)
 *
 * All multipliers are exactly 1000x apart (powers of 10^3), which enables
 * O(1) lookup using: index = floor(log10(value) / 3) - 1
 */
export const SCALE_DEFINITIONS = [
  { suffix: 'K', multiplier: 1e3 },   // Thousand
  { suffix: 'M', multiplier: 1e6 },   // Million
  { suffix: 'B', multiplier: 1e9 },   // Billion
  { suffix: 'T', multiplier: 1e12 },  // Trillion
  { suffix: 'q', multiplier: 1e15 },  // Quadrillion
  { suffix: 'Q', multiplier: 1e18 },  // Quintillion
  { suffix: 's', multiplier: 1e21 },  // Sextillion
  { suffix: 'S', multiplier: 1e24 },  // Septillion
  { suffix: 'O', multiplier: 1e27 },  // Octillion
  { suffix: 'N', multiplier: 1e30 },  // Nonillion
  { suffix: 'D', multiplier: 1e33 },  // Decillion
  { suffix: 'aa', multiplier: 1e36 }, // Undecillion
  { suffix: 'ab', multiplier: 1e39 }, // Duodecillion
  { suffix: 'ac', multiplier: 1e42 }, // Tredecillion
  { suffix: 'ad', multiplier: 1e45 }, // Quattuordecillion
  { suffix: 'ae', multiplier: 1e48 }, // Quindecillion
  { suffix: 'af', multiplier: 1e51 }, // Sexdecillion
  { suffix: 'ag', multiplier: 1e54 }, // Septendecillion
  { suffix: 'ah', multiplier: 1e57 }, // Octodecillion
  { suffix: 'ai', multiplier: 1e60 }, // Novemdecillion
  { suffix: 'aj', multiplier: 1e63 }, // Vigintillion
] as const;

/**
 * Derived dictionary for O(1) suffix → multiplier lookup (used in parsing).
 * Example: SCALE_MULTIPLIERS['T'] → 1e12
 */
const SCALE_MULTIPLIERS: Record<string, number> = Object.fromEntries([
  ['', 1], // No suffix = multiply by 1
  ...SCALE_DEFINITIONS.map(({ suffix, multiplier }) => [suffix, multiplier]),
]);

/**
 * Find the appropriate scale suffix for a value using O(1) logarithmic calculation.
 *
 * Since all multipliers are powers of 1000 (1e3, 1e6, 1e9...):
 * - log10(1e3) = 3, log10(1e6) = 6, log10(1e12) = 12
 * - Dividing by 3 gives: 1, 2, 4
 * - Subtracting 1 gives array index: 0 (K), 1 (M), 3 (T)
 *
 * This is a HOT PATH called frequently during table/chart rendering.
 * O(1) lookup is significantly faster than O(n) iteration through 21 items,
 * especially for end-game players with values at 1e36+ (would require 11+ iterations).
 */
function findScaleForValue(value: number): {
  scaledValue: number;
  suffix: string;
} {
  const absValue = Math.abs(value);

  if (absValue < 1000) {
    return { scaledValue: value, suffix: '' };
  }

  // O(1) index calculation using logarithm
  // floor(log10(value) / 3) gives us which "thousand" level we're at
  // Subtract 1 because index 0 = K (1e3), not 1e0
  const rawIndex = Math.floor(Math.log10(absValue) / 3) - 1;

  // Clamp to valid array bounds
  const index = Math.min(Math.max(0, rawIndex), SCALE_DEFINITIONS.length - 1);

  const { suffix, multiplier } = SCALE_DEFINITIONS[index];

  return {
    scaledValue: value / multiplier,
    suffix,
  };
}

/**
 * Parse shorthand number strings like "100K", "10.9M", "15.2B" into numeric values.
 * Handles various input formats including:
 * - Plain numbers: "1234.56"
 * - Currency: "$1.5M"
 * - Multipliers: "x8.00"
 * - Commas: "1,234.56" (period-decimal format) or "1.234,56" (comma-decimal format)
 * - Single-letter scale suffixes: "100K", "1.5B", "2.3q" (case-sensitive)
 * - Two-letter scale suffixes: "1aa", "2.5ab", "10ac"
 *
 * @param value - String representation of a number
 * @param importFormat - Import format settings to use for parsing (defaults to store settings)
 * @returns Numeric value, or 0 if parsing fails
 */
export function parseShorthandNumber(
  value: string,
  importFormat?: ImportFormatSettings
): number {
  if (!value || typeof value !== 'string') return 0;

  // Use provided format or get from store
  const format = importFormat ?? getImportFormat();
  const { decimalSeparator, thousandsSeparator } = format;

  // Remove $ signs and trim
  let cleaned = value.replace(/\$/g, '').trim();

  // Handle x multipliers like "x8.00"
  if (cleaned.startsWith('x')) {
    cleaned = cleaned.substring(1);
  }

  // Normalize separators based on format:
  // 1. Remove thousands separators
  // 2. Convert decimal separator to period for parseFloat
  if (thousandsSeparator === '.') {
    // Period is thousands separator - remove all periods
    cleaned = cleaned.split('.').join('');
  } else if (thousandsSeparator === ',') {
    // Comma is thousands separator - remove all commas
    cleaned = cleaned.replace(/,/g, '');
  } else if (thousandsSeparator === ' ') {
    // Space is thousands separator - remove all spaces (but not other whitespace handling)
    cleaned = cleaned.replace(/ /g, '');
  }
  // thousandsSeparator === '' means no thousands separator, nothing to remove

  // Convert decimal separator to period for parseFloat
  if (decimalSeparator === ',') {
    cleaned = cleaned.replace(',', '.');
  }

  // If it's just a number, return it
  if (/^-?\d+\.?\d*$/.test(cleaned)) {
    return parseFloat(cleaned);
  }

  // Check for shorthand notation with single or two-letter suffixes
  // Supports: K, M, B, T, q, Q, s, S, O, N, D, aa, ab, ac, ad, ae, af, ag, ah, ai, aj
  const shorthandRegex = /^(-?\d+\.?\d*)\s*([a-z]{2}|[KMBTqQsSOND])?$/i;
  const match = cleaned.match(shorthandRegex);

  if (!match) return 0;

  const number = parseFloat(match[1]);
  const suffix = match[2] || '';

  return number * (SCALE_MULTIPLIERS[suffix] || 1);
}

/**
 * Format a number with explicit decimal separator (bypassing locale store).
 * Used for storage/export where we need predictable output regardless of display locale.
 */
function formatWithExplicitSeparators(
  value: number,
  format: ImportFormatSettings
): string {
  // Round to 2 decimal places, remove trailing .00 or .X0
  const fixed = value.toFixed(2).replace(/\.?0+$/, '');
  return format.decimalSeparator === ','
    ? fixed.replace('.', ',')
    : fixed;
}

/**
 * Format a numeric value to human-readable shorthand format using scale suffixes.
 * Examples: 1000 -> "1K", 1500000 -> "1.5M", 2300000000 -> "2.3B"
 *
 * For values < 1000, returns the value rounded to nearest integer with no suffix.
 * For larger values, uses scale suffixes with up to 2 decimal places.
 *
 * By default, uses the display locale from the locale store for number formatting.
 * Game-specific suffixes (K, M, B, T, etc.) are preserved regardless of locale.
 *
 * @param value - Numeric value to format
 * @param overrideFormat - Optional explicit format to use instead of display locale.
 *                         Use this for storage/export where format must be predictable.
 * @returns Formatted string representation
 */
export function formatLargeNumber(
  value: number,
  overrideFormat?: ImportFormatSettings
): string {
  if (Math.abs(value) < 1000) {
    return Math.round(value).toString();
  }

  const { scaledValue, suffix } = findScaleForValue(value);

  // Round to 2 decimal places for game display (preserves precision like 100.19K)
  const roundedValue = Math.round(scaledValue * 100) / 100;

  if (overrideFormat) {
    // Explicit format provided - use it (for storage/export)
    return formatWithExplicitSeparators(roundedValue, overrideFormat) + suffix;
  }

  // No override - use display locale from store (for UI rendering)
  const formatter = getNumberFormatter();
  const formatted = formatter.format(roundedValue);

  // Append game-specific suffix (K, M, B, T, etc.)
  return formatted + suffix;
}

/**
 * Format a percentage value with locale-aware formatting.
 * Examples: 45.3% (en-US) or 45,3% (de-DE)
 *
 * Uses the display locale from the locale store for number formatting.
 *
 * @param value - Percentage value (e.g., 45.3 for 45.3%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string with % suffix
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const formatter = getNumberFormatter();

  // Round to specified decimal places
  const multiplier = Math.pow(10, decimals);
  const roundedValue = Math.round(value * multiplier) / multiplier;

  // Format the number and append % sign
  return formatter.format(roundedValue) + '%';
}
