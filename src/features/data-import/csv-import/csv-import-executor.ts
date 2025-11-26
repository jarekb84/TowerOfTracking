import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type { DuplicateResolution } from '@/shared/domain/duplicate-detection/duplicate-info';
import type { BatchDuplicateDetectionResult } from '@/shared/domain/duplicate-detection/duplicate-detection';
import type { CsvParseResult } from './types';

interface ImportExecutorParams {
  parseResult: CsvParseResult | null;
  duplicateResult: BatchDuplicateDetectionResult | null;
  resolution: DuplicateResolution;
  addRuns: (runs: ParsedGameRun[], addToFront: boolean) => void;
  overwriteRun: (id: string, data: ParsedGameRun, preserveDateTime: boolean) => void;
}

/**
 * Executes the import based on parse result and duplicate resolution.
 * Returns true if import was executed, false if nothing to import.
 */
export function executeImport({
  parseResult,
  duplicateResult,
  resolution,
  addRuns,
  overwriteRun
}: ImportExecutorParams): boolean {
  if (!parseResult?.success || parseResult.success.length === 0) {
    return false;
  }

  // Handle based on duplicate detection and user resolution choice
  if (duplicateResult && duplicateResult.duplicates.length > 0) {
    if (resolution === 'new-only') {
      // Only import new runs
      addRuns(duplicateResult.newRuns, false);
    } else if (resolution === 'overwrite') {
      // Import new runs + overwrite existing duplicates
      if (duplicateResult.newRuns.length > 0) {
        addRuns(duplicateResult.newRuns, false);
      }
      // Overwrite existing runs with duplicate data
      duplicateResult.duplicates.forEach(({ newRun, existingRun }) => {
        if (existingRun) {
          overwriteRun(existingRun.id, newRun, true);
        }
      });
    }
  } else {
    // No duplicates, import all runs
    addRuns(parseResult.success, false);
  }

  return true;
}
