import type { DateFormat, DateFormatConfig } from './types';

/**
 * Date format configurations for the settings UI.
 * Examples include 24-hour time to match actual game export format.
 */
export const DATE_FORMAT_CONFIGS: Record<DateFormat, DateFormatConfig> = {
  'month-first': {
    label: 'Capitalized month (e.g., English default)',
    example: 'Nov 20, 2025 22:28',
  },
  'month-first-lowercase': {
    label: 'Lowercase month with period (e.g., French/German)',
    example: 'nov. 20, 2025 22:28',
  },
};

/**
 * Month name to zero-indexed month number mappings for date parsing.
 * Includes variations for different locales and abbreviation styles.
 */
export const MONTH_MAPPINGS: Record<DateFormat, Record<string, number>> = {
  'month-first': {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  },
  'month-first-lowercase': {
    // Standard lowercase abbreviations
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
    // With period (common in some locales)
    'jan.': 0,
    'feb.': 1,
    'mar.': 2,
    'apr.': 3,
    'may.': 4,
    'jun.': 5,
    'jul.': 6,
    'aug.': 7,
    'sep.': 8,
    'oct.': 9,
    'nov.': 10,
    'dec.': 11,
    // French abbreviations
    'janv.': 0,
    'févr.': 1,
    mars: 2,
    'avr.': 3,
    mai: 4,
    juin: 5,
    'juil.': 6,
    août: 7,
    'sept.': 8,
    // oct., nov. already covered above
    'déc.': 11,
    // German abbreviations
    jän: 0,
    'jän.': 0,
    mär: 2,
    'mär.': 2,
    okt: 9,
    'okt.': 9,
    dez: 11,
    'dez.': 11,
  },
};
