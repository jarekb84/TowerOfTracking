import humanFormat from 'human-format';

/**
 * Multiplier map for parsing and mathematical operations.
 * Use this when you need the numeric value of scale suffixes.
 *
 * Supports both single-letter (K, M, B, T, q, Q, s, S, O, N, D)
 * and two-letter (aa, ab, ac, ad, ae, af, ag, ah, ai, aj) suffixes.
 */
const SCALE_MULTIPLIERS: Record<string, number> = {
  '': 1,
  K: 1e3, // Thousand
  M: 1e6, // Million
  B: 1e9, // Billion
  T: 1e12, // Trillion
  q: 1e15, // Quadrillion
  Q: 1e18, // Quintillion
  s: 1e21, // Sextillion
  S: 1e24, // Septillion
  O: 1e27, // Octillion
  N: 1e30, // Nonillion
  D: 1e33, // Decillion
  aa: 1e36, // Undecillion
  ab: 1e39, // Duodecillion
  ac: 1e42, // Tredecillion  
  ad: 1e45, // Quattuordecillion
  ae: 1e48, // Quindecillion
  af: 1e51, // Sexdecillion
  ag: 1e54, // Septendecillion
  ah: 1e57, // Octodecillion
  ai: 1e60, // Novemdecillion
  aj: 1e63, // Vigintillion
};

/**
 * human-format Scale instance for formatting operations.
 * Use this with humanFormat() for display formatting.
 */
const NUMBER_SCALE = new humanFormat.Scale(SCALE_MULTIPLIERS);

/**
 * Parse shorthand number strings like "100K", "10.9M", "15.2B" into numeric values.
 * Handles various input formats including:
 * - Plain numbers: "1234.56"
 * - Currency: "$1.5M"
 * - Multipliers: "x8.00"
 * - Commas: "1,234.56"
 * - Single-letter scale suffixes: "100K", "1.5B", "2.3q" (case-sensitive)
 * - Two-letter scale suffixes: "1aa", "2.5ab", "10ac"
 *
 * @param value - String representation of a number
 * @returns Numeric value, or 0 if parsing fails
 */
export function parseShorthandNumber(value: string): number {
  if (!value || typeof value !== 'string') return 0;

  // Remove $ signs, commas and trim
  let cleaned = value.replace(/[$,]/g, '').trim();

  // Handle x multipliers like "x8.00"
  if (cleaned.startsWith('x')) {
    cleaned = cleaned.substring(1);
  }

  // If it's just a number, return it
  if (/^\d+\.?\d*$/.test(cleaned)) {
    return parseFloat(cleaned);
  }

  // Check for shorthand notation with single or two-letter suffixes
  // Supports: K, M, B, T, q, Q, s, S, O, N, D, aa, ab, ac, ad, ae, af, ag, ah, ai, aj
  const shorthandRegex = /^(\d+\.?\d*)\s*([a-z]{2}|[KMBTqQsSOND])?$/i;
  const match = cleaned.match(shorthandRegex);

  if (!match) return 0;

  const number = parseFloat(match[1]);
  const suffix = match[2] || '';

  return number * (SCALE_MULTIPLIERS[suffix] || 1);
}

/**
 * Format a numeric value to human-readable shorthand format using scale suffixes.
 * Examples: 1000 -> "1K", 1500000 -> "1.5M", 2300000000 -> "2.3B"
 *
 * For values < 1000, returns the value rounded to nearest integer with no suffix.
 * For larger values, uses scale suffixes with 1 decimal place.
 *
 * @param value - Numeric value to format
 * @returns Formatted string representation
 */
export function formatLargeNumber(value: number): string {
  if (Math.abs(value) < 1000) return Math.round(value).toString();
  return humanFormat(value, { decimals: 1, separator: '', scale: NUMBER_SCALE });
}
