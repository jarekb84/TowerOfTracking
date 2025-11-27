import type { ParsedGameRun } from '@/shared/types/game-run.types';

/**
 * Extract raw field data from a ParsedGameRun for format detection.
 * Creates a Record mapping original field keys to their raw string values.
 *
 * @param run - The parsed game run to extract raw data from
 * @returns A Record of original field keys to raw values
 */
export function extractRawFieldData(run: ParsedGameRun): Record<string, string> {
  const rawData: Record<string, string> = {};

  for (const field of Object.values(run.fields)) {
    rawData[field.originalKey] = field.rawValue;
  }

  return rawData;
}
