import type { DateFormat, DecimalSeparator, ImportFormatSettings } from './types';

/**
 * Result of format mismatch detection.
 */
export interface FormatMismatchResult {
  /** True if detected decimal separator differs from user settings */
  numberMismatch: boolean;
  /** True if detected date format differs from user settings */
  dateMismatch: boolean;
  /** Detected decimal separator (null if unable to detect) */
  detectedDecimalSeparator: DecimalSeparator | null;
  /** Detected date format (null if unable to detect) */
  detectedDateFormat: DateFormat | null;
}

/**
 * Detect decimal separator from a shorthand number value.
 * Checks for comma-decimal pattern (e.g., "43,91T") vs period-decimal (e.g., "43.91T").
 *
 * @param value - The raw number string value
 * @returns The detected decimal separator or null if unable to determine
 */
export function detectDecimalSeparatorFromValue(
  value: string | undefined
): DecimalSeparator | null {
  if (!value) return null;

  // Comma-decimal pattern: comma followed by 1-2 digits before suffix
  // e.g., "43,91T", "1,5M", "248,55K"
  if (/\d,\d{1,2}[KMBTqQsSONDa-j]/i.test(value)) {
    return ',';
  }

  // Period-decimal pattern: period followed by digits before suffix
  // e.g., "43.91T", "1.5M", "248.55K"
  if (/\d\.\d+[KMBTqQsSONDa-j]/i.test(value)) {
    return '.';
  }

  return null;
}

/**
 * Detect date format from a battle date string.
 * Checks for lowercase month with period (e.g., "nov. 26, 2025")
 * vs capitalized month (e.g., "Nov 26, 2025").
 *
 * @param value - The raw battle date string
 * @returns The detected format or null if unable to determine
 */
export function detectDateFormatFromValue(
  value: string | undefined
): DateFormat | null {
  if (!value) return null;

  const trimmed = value.trim();

  // Capitalized pattern: uppercase first letter (ASCII A-Z), no period after month
  // e.g., "Nov 26, 2025"
  // Check this first since it's more specific
  if (/^[A-Z][a-z]{2}\s+\d/.test(trimmed)) {
    return 'month-first';
  }

  // Lowercase pattern: starts with lowercase letter (including accented),
  // possibly with period after month abbreviation
  // e.g., "nov. 26, 2025", "déc. 25, 2025", "août 15, 2025"
  // Uses Unicode property escapes for proper lowercase detection
  const firstChar = trimmed.charAt(0);
  if (
    firstChar === firstChar.toLowerCase() &&
    firstChar !== firstChar.toUpperCase()
  ) {
    // First char is lowercase letter - check if it looks like a date
    if (/^\S+\.?\s+\d/.test(trimmed)) {
      return 'month-first-lowercase';
    }
  }

  return null;
}

/**
 * Detect format mismatches between raw data and user's import format settings.
 * Checks specific "canary" fields that reliably indicate the format:
 * - coins_earned and damage_dealt for decimal separator (no currency symbols)
 * - battle_date for date format
 *
 * @param rawData - The raw field data from parsed clipboard content
 * @param userSettings - The user's configured import format settings
 * @returns Mismatch detection result
 */
export function detectFormatMismatch(
  rawData: Record<string, string>,
  userSettings: ImportFormatSettings
): FormatMismatchResult {
  // Check coins_earned and damage_dealt for decimal separator
  // These fields are reliably present and don't have currency symbols
  const coinsEarned = rawData['coins_earned'] || rawData['Coins earned'];
  const damageDealt = rawData['damage_dealt'] || rawData['Damage dealt'];

  const detectedDecimalSeparator =
    detectDecimalSeparatorFromValue(coinsEarned) ??
    detectDecimalSeparatorFromValue(damageDealt);

  // Check battle_date for date format
  const battleDate = rawData['battle_date'] || rawData['Battle Date'];
  const detectedDateFormat = detectDateFormatFromValue(battleDate);

  return {
    numberMismatch:
      detectedDecimalSeparator !== null &&
      detectedDecimalSeparator !== userSettings.decimalSeparator,
    dateMismatch:
      detectedDateFormat !== null &&
      detectedDateFormat !== userSettings.dateFormat,
    detectedDecimalSeparator,
    detectedDateFormat,
  };
}
