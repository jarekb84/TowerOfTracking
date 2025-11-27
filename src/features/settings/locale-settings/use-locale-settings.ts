import { useMemo, useCallback } from 'react';
import { useLocaleStore } from '@/shared/locale';
import type {
  DateFormat,
  DecimalSeparator,
  ThousandsSeparator,
  DisplayLocale,
} from '@/shared/locale';
import { DATE_FORMAT_CONFIGS } from '@/shared/locale/locale-config';
import {
  DECIMAL_SEPARATOR_OPTIONS,
  THOUSANDS_SEPARATOR_OPTIONS,
  DISPLAY_LOCALE_OPTIONS,
} from '@/shared/locale/locale-options';
import {
  getNumberFormatter,
  getDateFormatter,
  getDateTimeFormatter,
} from '@/shared/locale/locale-store';
import type { SelectionOption } from '@/components/ui/selection-button-group';

/**
 * Build selection options for decimal separator selector.
 */
function buildDecimalSeparatorOptions(): SelectionOption<DecimalSeparator>[] {
  return DECIMAL_SEPARATOR_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.example,
    tooltip: opt.label,
  }));
}

/**
 * Build selection options for thousands separator selector.
 */
function buildThousandsSeparatorOptions(): SelectionOption<ThousandsSeparator>[] {
  return THOUSANDS_SEPARATOR_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.example,
    tooltip: opt.label,
  }));
}

/**
 * Build selection options for date format selector.
 */
export function buildDateFormatOptions(): SelectionOption<DateFormat>[] {
  return (
    Object.entries(DATE_FORMAT_CONFIGS) as [
      DateFormat,
      (typeof DATE_FORMAT_CONFIGS)[DateFormat],
    ][]
  ).map(([value, config]) => ({
    value,
    label: config.example,
    tooltip: config.label,
  }));
}

/**
 * Preview values showing how numbers and dates will be displayed.
 */
interface LocalePreview {
  /** Example number: 1,234,567.89 */
  number: string;
  /** Example large number with suffix: 43.9T */
  largeNumber: string;
  /** Example percentage: 45.3% */
  percentage: string;
  /** Example date: Nov 20, 2025 */
  date: string;
  /** Example datetime: Nov 20, 2025, 22:28 */
  dateTime: string;
}

/**
 * Generate preview values for the current display locale.
 */
function generatePreview(): LocalePreview {
  const numberFormatter = getNumberFormatter();
  const dateFormatter = getDateFormatter();
  const dateTimeFormatter = getDateTimeFormatter();

  // Use a sample date for preview
  const sampleDate = new Date(2025, 10, 20, 22, 28, 0); // Nov 20, 2025 22:28

  // For large number, manually calculate to show the suffix
  const largeValue = 43910000000000; // 43.91T
  const scaledValue = largeValue / 1e12;
  const largeFormatted = numberFormatter.format(Math.round(scaledValue * 10) / 10) + 'T';

  return {
    number: numberFormatter.format(1234567.89),
    largeNumber: largeFormatted,
    percentage: numberFormatter.format(45.3) + '%',
    date: dateFormatter.format(sampleDate),
    dateTime: dateTimeFormatter.format(sampleDate),
  };
}

/**
 * Hook for locale settings page state and actions.
 * Provides both import format settings (for parsing) and display locale settings (for rendering).
 */
export function useLocaleSettings() {
  const { importFormat, displayLocale, setImportFormat, setDisplayLocale } =
    useLocaleStore();

  // Build options for selectors
  const decimalSeparatorOptions = useMemo(
    () => buildDecimalSeparatorOptions(),
    []
  );
  const thousandsSeparatorOptions = useMemo(
    () => buildThousandsSeparatorOptions(),
    []
  );
  const dateFormatOptions = useMemo(() => buildDateFormatOptions(), []);
  const displayLocaleOptions = DISPLAY_LOCALE_OPTIONS;

  // Generate preview values based on current display locale
  const preview = useMemo(() => generatePreview(), [displayLocale]);

  // Handlers for import format changes
  const onDecimalSeparatorChange = useCallback(
    (separator: DecimalSeparator) => {
      setImportFormat({
        ...importFormat,
        decimalSeparator: separator,
        // Auto-adjust thousands separator to avoid conflicts
        thousandsSeparator:
          separator === '.'
            ? importFormat.thousandsSeparator === '.'
              ? ','
              : importFormat.thousandsSeparator
            : importFormat.thousandsSeparator === ','
              ? '.'
              : importFormat.thousandsSeparator,
      });
    },
    [importFormat, setImportFormat]
  );

  const onThousandsSeparatorChange = useCallback(
    (separator: ThousandsSeparator) => {
      setImportFormat({
        ...importFormat,
        thousandsSeparator: separator,
      });
    },
    [importFormat, setImportFormat]
  );

  const onDateFormatChange = useCallback(
    (format: DateFormat) => {
      setImportFormat({
        ...importFormat,
        dateFormat: format,
      });
    },
    [importFormat, setImportFormat]
  );

  const onDisplayLocaleChange = useCallback(
    (locale: DisplayLocale) => {
      setDisplayLocale(locale);
    },
    [setDisplayLocale]
  );

  return {
    // Current state
    importFormat,
    displayLocale,

    // Options for selectors
    decimalSeparatorOptions,
    thousandsSeparatorOptions,
    dateFormatOptions,
    displayLocaleOptions,

    // Preview
    preview,

    // Change handlers
    onDecimalSeparatorChange,
    onThousandsSeparatorChange,
    onDateFormatChange,
    onDisplayLocaleChange,
  };
}
