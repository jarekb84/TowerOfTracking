/**
 * Display locale options for the settings dropdown.
 *
 * These are common locales covering major regions.
 * The dropdown allows users to select their preferred display format.
 */

import type { DisplayLocale, ThousandsSeparator, DecimalSeparator } from './types';

/**
 * Display locale option for the settings dropdown.
 */
interface DisplayLocaleOption {
  /** BCP 47 locale tag (e.g., 'en-US', 'de-DE') */
  value: DisplayLocale;
  /** Human-readable label */
  label: string;
  /** Example number showing the format */
  example: string;
}

/**
 * Common display locale options covering major regions.
 * Ordered by rough population/usage.
 */
export const DISPLAY_LOCALE_OPTIONS: readonly DisplayLocaleOption[] = [
  // Americas
  { value: 'en-US', label: 'English (US)', example: '1,234.56' },
  { value: 'en-CA', label: 'English (Canada)', example: '1,234.56' },
  { value: 'es-MX', label: 'Spanish (Mexico)', example: '1,234.56' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)', example: '1.234,56' },
  { value: 'es-AR', label: 'Spanish (Argentina)', example: '1.234,56' },

  // Europe
  { value: 'en-GB', label: 'English (UK)', example: '1,234.56' },
  { value: 'de-DE', label: 'German (Germany)', example: '1.234,56' },
  { value: 'fr-FR', label: 'French (France)', example: '1 234,56' },
  { value: 'es-ES', label: 'Spanish (Spain)', example: '1.234,56' },
  { value: 'it-IT', label: 'Italian (Italy)', example: '1.234,56' },
  { value: 'nl-NL', label: 'Dutch (Netherlands)', example: '1.234,56' },
  { value: 'pl-PL', label: 'Polish (Poland)', example: '1 234,56' },
  { value: 'ru-RU', label: 'Russian (Russia)', example: '1 234,56' },
  { value: 'uk-UA', label: 'Ukrainian (Ukraine)', example: '1 234,56' },
  { value: 'cs-CZ', label: 'Czech (Czechia)', example: '1 234,56' },
  { value: 'sv-SE', label: 'Swedish (Sweden)', example: '1 234,56' },
  { value: 'da-DK', label: 'Danish (Denmark)', example: '1.234,56' },
  { value: 'fi-FI', label: 'Finnish (Finland)', example: '1 234,56' },
  { value: 'nb-NO', label: 'Norwegian (Norway)', example: '1 234,56' },
  { value: 'el-GR', label: 'Greek (Greece)', example: '1.234,56' },
  { value: 'pt-PT', label: 'Portuguese (Portugal)', example: '1 234,56' },
  { value: 'tr-TR', label: 'Turkish (Turkey)', example: '1.234,56' },

  // Asia Pacific
  { value: 'ja-JP', label: 'Japanese (Japan)', example: '1,234.56' },
  { value: 'ko-KR', label: 'Korean (Korea)', example: '1,234.56' },
  { value: 'zh-CN', label: 'Chinese (China)', example: '1,234.56' },
  { value: 'zh-TW', label: 'Chinese (Taiwan)', example: '1,234.56' },
  { value: 'th-TH', label: 'Thai (Thailand)', example: '1,234.56' },
  { value: 'vi-VN', label: 'Vietnamese (Vietnam)', example: '1.234,56' },
  { value: 'id-ID', label: 'Indonesian (Indonesia)', example: '1.234,56' },
  { value: 'en-AU', label: 'English (Australia)', example: '1,234.56' },
  { value: 'en-NZ', label: 'English (New Zealand)', example: '1,234.56' },
  { value: 'hi-IN', label: 'Hindi (India)', example: '1,23,456.78' },

  // Middle East & Africa
  { value: 'ar-SA', label: 'Arabic (Saudi Arabia)', example: '1,234.56' },
  { value: 'he-IL', label: 'Hebrew (Israel)', example: '1,234.56' },
  { value: 'en-ZA', label: 'English (South Africa)', example: '1 234,56' },
] as const;

/**
 * Thousands separator options for import format settings.
 */
interface ThousandsSeparatorOption {
  value: ThousandsSeparator;
  label: string;
  example: string;
}

export const THOUSANDS_SEPARATOR_OPTIONS: readonly ThousandsSeparatorOption[] = [
  { value: ',', label: 'Comma', example: '1,234,567' },
  { value: '.', label: 'Period', example: '1.234.567' },
  { value: ' ', label: 'Space', example: '1 234 567' },
  { value: '', label: 'None', example: '1234567' },
] as const;

/**
 * Decimal separator options for import format settings.
 */
interface DecimalSeparatorOption {
  value: DecimalSeparator;
  label: string;
  example: string;
}

export const DECIMAL_SEPARATOR_OPTIONS: readonly DecimalSeparatorOption[] = [
  { value: '.', label: 'Period', example: '43.91T' },
  { value: ',', label: 'Comma', example: '43,91T' },
] as const;
