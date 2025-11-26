import type { CsvParseResult } from '../types';
import type { DuplicateResolution } from '@/shared/domain/duplicate-detection/duplicate-info';
import type { BatchDuplicateDetectionResult } from '@/shared/domain/duplicate-detection/duplicate-detection';

/**
 * Generate the import button text based on duplicate detection and resolution state.
 */
export function getImportButtonText(
  duplicateResult: BatchDuplicateDetectionResult | null,
  resolution: DuplicateResolution,
  parseResult: CsvParseResult | null
): string {
  if (duplicateResult && duplicateResult.duplicates.length > 0) {
    if (resolution === 'overwrite') {
      return `Import ${duplicateResult.newRuns.length} + Overwrite ${duplicateResult.duplicates.length}`;
    }
    return `Import ${duplicateResult.newRuns.length} New Only`;
  }
  return `Import ${parseResult?.success?.length || 0} Runs`;
}
