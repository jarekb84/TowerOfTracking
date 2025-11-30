/**
 * Date format types based on how the game displays battle dates.
 *
 * - 'month-first': Capitalized month abbreviation (e.g., "Nov 20, 2025 22:28")
 * - 'month-first-lowercase': Lowercase month with period (e.g., "nov. 20, 2025 22:28")
 */
export type DateFormat = 'month-first' | 'month-first-lowercase';

/**
 * Thousands separator options for import parsing.
 * Different regions use different separators for grouping digits.
 *
 * - ',': US/UK style (1,234,567)
 * - '.': EU style (1.234.567)
 * - ' ': Space separator used in France, Poland, Russia (1 234 567)
 * - '': No separator
 */
export type ThousandsSeparator = ',' | '.' | ' ' | '';

/**
 * Decimal separator options for import parsing.
 */
export type DecimalSeparator = '.' | ',';

/**
 * Import format settings - defines how game-exported data is formatted.
 * Used for PARSING imported data from clipboard/files.
 */
export interface ImportFormatSettings {
  decimalSeparator: DecimalSeparator;
  thousandsSeparator: ThousandsSeparator;
  dateFormat: DateFormat;
}

/**
 * Display locale - BCP 47 language tag for Intl APIs.
 * Used for DISPLAYING data to the user.
 * Examples: 'en-US', 'de-DE', 'fr-FR', 'ja-JP'
 */
export type DisplayLocale = string;

/**
 * Combined locale store state.
 * Separates parsing concerns (importFormat) from display concerns (displayLocale).
 */
export interface LocaleStoreState {
  importFormat: ImportFormatSettings;
  displayLocale: DisplayLocale;
}

/**
 * Configuration for date formatting/parsing UI.
 */
export interface DateFormatConfig {
  /** Display label for settings UI */
  label: string;
  /** Example showing how dates look in this format */
  example: string;
}

/**
 * Context type for store-based locale settings.
 * Separates import format (parsing) from display locale (rendering).
 */
export interface LocaleStoreContextType {
  /** Import format settings for parsing game data */
  importFormat: ImportFormatSettings;
  /** Display locale for Intl formatting */
  displayLocale: DisplayLocale;
  /** Update import format settings */
  setImportFormat: (format: ImportFormatSettings) => void;
  /** Update display locale */
  setDisplayLocale: (locale: DisplayLocale) => void;
}

/**
 * Canonical US-centric format used for all internal storage.
 * This ensures data consistency regardless of user's locale preferences.
 * Data is normalized to this format on import, formatted from it on display/export.
 *
 * Benefits:
 * - Data is always in predictable format - no ambiguity
 * - Locale setting changes are safe - just affects presentation
 * - Multi-device sync friendly - same data everywhere, different display per device
 * - No risk of corruption from interrupted operations or setting changes
 */
export const CANONICAL_STORAGE_FORMAT: ImportFormatSettings = {
  decimalSeparator: '.',
  thousandsSeparator: ',',
  dateFormat: 'month-first',
} as const;
