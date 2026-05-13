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
import { updateField } from '@/shared/domain/field-graph';
import {
  BATTLE_REPORT__BATTLE_DATE_NODE,
  _NOTES_NODE,
  _RANK_NODE,
  _RUN_TYPE_NODE,
} from '@/shared/domain/field-graph/catalog/fields.nodes';
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
 * Prepare a ParsedGameRun for saving. Applies date fix when enabled, ensures
 * battleDate is materialized, and adds notes / runType / rank fields.
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

  let run = previewData;
  if (autoFixDateEnabled && dateIssueInfo?.isFixable && dateIssueInfo.derivedDate) {
    run = applyDateFix(previewData, dateIssueInfo.derivedDate);
  } else if (!run.fields[BATTLE_REPORT__BATTLE_DATE_NODE.id]) {
    run = applyDateFix(run, run.timestamp);
  }

  run = updateField(run, _NOTES_NODE.id, createInternalField('Notes', notes));
  run = updateField(run, _RUN_TYPE_NODE.id, createInternalField('Run Type', selectedRunType));
  if (selectedRunType === RunType.TOURNAMENT && rank !== '') {
    run = updateField(run, _RANK_NODE.id, createInternalField('Rank', String(rank)));
  }

  return { ...run, runType: selectedRunType };
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
