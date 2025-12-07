/**
 * Data Input Form Logic
 *
 * Pure functions for data input form operations.
 * Extracts complexity from the useDataInputForm hook.
 */

import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type { RunTypeValue } from '@/shared/domain/run-types/types';
import { RunType } from '@/shared/domain/run-types/types';
import { createInternalField } from '@/features/analysis/shared/parsing/field-utils';
import { applyDateFix, detectDateIssue, type DateIssueInfo } from '@/shared/formatting/date-issue-detection';
import { parseGameRun } from '@/features/analysis/shared/parsing/data-parser';
import { hasExplicitRunType } from '@/shared/domain/run-types/run-type-detection';
import type { RankValue } from '@/features/game-runs/editing/field-update-logic';
import type { ImportFormatSettings } from '@/shared/locale/types';

/**
 * Parameters for preparing a run for save
 */
interface PrepareRunForSaveParams {
  previewData: ParsedGameRun;
  autoFixDateEnabled: boolean;
  dateIssueInfo: DateIssueInfo | null;
  notes: string;
  selectedRunType: RunTypeValue;
  rank: RankValue;
}

/**
 * Prepare a ParsedGameRun for saving.
 *
 * Applies date fix if enabled, adds notes/runType/rank fields.
 *
 * @param params - Parameters for preparing the run
 * @returns The prepared run ready for saving
 */
export function prepareRunForSave(params: PrepareRunForSaveParams): ParsedGameRun {
  const {
    previewData,
    autoFixDateEnabled,
    dateIssueInfo,
    notes,
    selectedRunType,
    rank,
  } = params;

  // Apply date fix if enabled and there's a fixable issue
  let runToSave = previewData;
  if (autoFixDateEnabled && dateIssueInfo?.isFixable && dateIssueInfo.derivedDate) {
    runToSave = applyDateFix(previewData, dateIssueInfo.derivedDate);
  }

  const updatedFields = {
    ...runToSave.fields,
    _notes: createInternalField('Notes', notes),
    _runType: createInternalField('Run Type', selectedRunType),
    // Only include rank for tournament runs
    ...(selectedRunType === RunType.TOURNAMENT && rank !== ''
      ? { _rank: createInternalField('Rank', String(rank)) }
      : {}
    )
  };

  return {
    ...runToSave,
    runType: selectedRunType,
    fields: updatedFields
  };
}

/**
 * Reset state values for date issue detection.
 *
 * @returns Object with reset values
 */
export function createResetDateIssueState(): {
  hasBattleDate: boolean;
  dateIssueInfo: DateIssueInfo | null;
  autoFixDateEnabled: boolean;
} {
  return {
    hasBattleDate: false,
    dateIssueInfo: null,
    autoFixDateEnabled: false,
  };
}

/**
 * Result of parsing input data.
 */
interface ParseInputResult {
  success: true;
  parsed: ParsedGameRun;
  hasBattleDate: boolean;
  dateIssueInfo: DateIssueInfo;
  shouldAutoFix: boolean;
  shouldUpdateRunType: boolean;
  detectedRunType: RunTypeValue;
  extractedNotes: string | null;
}

interface ParseInputFailure {
  success: false;
}

type ParseInputDataResult = ParseInputResult | ParseInputFailure;

/**
 * Parse input data and compute all derived state.
 *
 * Returns all the values needed to update form state after parsing.
 */
export function parseAndAnalyzeInput(
  data: string,
  userSelectedDate: Date,
  importFormat: ImportFormatSettings | undefined
): ParseInputDataResult {
  const trimmed = data.trim();
  if (!trimmed) {
    return { success: false };
  }

  try {
    const parsed = parseGameRun(trimmed, userSelectedDate, importFormat);
    const hasBattleDateField = !!parsed.fields.battleDate;
    const issueInfo = detectDateIssue(parsed, userSelectedDate);
    const shouldAutoFix = issueInfo.hasIssue && issueInfo.isFixable;
    const shouldUpdateRunType = hasExplicitRunType(parsed.fields);

    // Extract notes from parsed data
    const notesField = parsed.fields._notes || parsed.fields.notes;
    const extractedNotes = notesField?.rawValue || null;

    return {
      success: true,
      parsed,
      hasBattleDate: hasBattleDateField,
      dateIssueInfo: issueInfo,
      shouldAutoFix,
      shouldUpdateRunType,
      detectedRunType: parsed.runType,
      extractedNotes,
    };
  } catch {
    return { success: false };
  }
}
