import { useMemo } from 'react';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { useLocaleStore } from '@/shared/locale';
import { detectFormatMismatch, type FormatMismatchResult } from '@/shared/locale/format-detection';
import { DATE_FORMAT_CONFIGS } from '@/shared/locale/locale-config';
import { extractRawFieldData } from './extract-raw-field-data';

interface FormatMismatchInfo extends FormatMismatchResult {
  /** User-friendly description of the detected number format */
  detectedNumberDescription: string | null;
  /** User-friendly description of the detected date format */
  detectedDateDescription: string | null;
  /** True if any mismatch was detected */
  hasMismatch: boolean;
}

/**
 * Get example text for a decimal separator.
 */
function getDecimalSeparatorExample(separator: '.' | ','): string {
  return separator === '.' ? '43.91T (period decimal)' : '43,91T (comma decimal)';
}

/**
 * Hook to detect format mismatches between parsed data and user settings.
 *
 * @param parsedRuns - The successfully parsed game runs
 * @returns Format mismatch information or null if no data to check
 */
export function useFormatMismatch(
  parsedRuns: ParsedGameRun[] | undefined
): FormatMismatchInfo | null {
  const { importFormat } = useLocaleStore();

  return useMemo(() => {
    // Need at least one parsed run to check
    if (!parsedRuns || parsedRuns.length === 0) {
      return null;
    }

    // Extract raw data from first run for format detection
    const rawData = extractRawFieldData(parsedRuns[0]);
    const result = detectFormatMismatch(rawData, importFormat);

    // Build user-friendly descriptions
    const detectedNumberDescription = result.detectedDecimalSeparator
      ? getDecimalSeparatorExample(result.detectedDecimalSeparator)
      : null;

    const detectedDateDescription = result.detectedDateFormat
      ? DATE_FORMAT_CONFIGS[result.detectedDateFormat].example
      : null;

    return {
      ...result,
      detectedNumberDescription,
      detectedDateDescription,
      hasMismatch: result.numberMismatch || result.dateMismatch,
    };
  }, [parsedRuns, importFormat]);
}
