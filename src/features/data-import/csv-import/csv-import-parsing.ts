import { parseGenericCsv, getDelimiterString } from './csv-parser';
import type { CsvDelimiter, CsvParseResult } from './types';
import type { ImportFormatSettings } from '@/shared/locale/types';

/**
 * Creates an error parse result with the given error message.
 */
export function createErrorParseResult(error: unknown): CsvParseResult {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return {
    success: [],
    failed: 0,
    errors: ['Failed to parse data: ' + errorMessage],
    fieldMappingReport: {
      mappedFields: [],
      newFields: [],
      similarFields: [],
      unsupportedFields: [],
      skippedFields: []
    }
  };
}

/**
 * Resolves the delimiter string from the selected delimiter type.
 */
export function resolveDelimiter(selectedDelimiter: CsvDelimiter, customDelimiter: string): string {
  return selectedDelimiter === 'custom' ? customDelimiter : getDelimiterString(selectedDelimiter);
}

/**
 * Parses CSV text with the given delimiter, returning a parse result or error result.
 */
export function parseCsvSafe(
  text: string,
  delimiter: string,
  importFormat?: ImportFormatSettings
): CsvParseResult {
  try {
    return parseGenericCsv(text, { delimiter, importFormat });
  } catch (error) {
    return createErrorParseResult(error);
  }
}
