import type { ParsedGameRun, RunTypeValue, GameRunField } from '@/shared/types/game-run.types';

/**
 * Creates updated fields object with new notes value
 */
export function createUpdatedNotesFields(
  currentFields: Record<string, GameRunField>,
  newNotes: string
): Record<string, GameRunField> {
  const notesField = currentFields._notes || {
    originalKey: '_notes',
    dataType: 'string' as const,
  };

  return {
    ...currentFields,
    _notes: {
      ...notesField,
      value: newNotes,
      rawValue: newNotes,
      displayValue: newNotes,
    },
  };
}

/**
 * Creates updated fields object with new run type value
 */
export function createUpdatedRunTypeFields(
  currentFields: Record<string, GameRunField>,
  newRunType: RunTypeValue
): Record<string, GameRunField> {
  const runTypeField = currentFields._runType || {
    originalKey: '_runType',
    dataType: 'string' as const,
  };

  return {
    ...currentFields,
    _runType: {
      ...runTypeField,
      value: newRunType,
      rawValue: newRunType,
      displayValue: newRunType,
    },
  };
}

/**
 * Extracts notes value from run fields
 */
export function extractNotesValue(fields: Record<string, GameRunField>): string {
  return fields._notes?.displayValue || '';
}

/**
 * Extracts run type value from run fields or fallback to runType property
 */
export function extractRunTypeValue(run: ParsedGameRun): RunTypeValue {
  return (run.fields._runType?.value || run.runType) as RunTypeValue;
}

/**
 * Tournament rank value type - number 1-30 or empty string for "not set"
 */
export type RankValue = number | '';

/**
 * Creates updated fields object with new rank value
 * Empty string clears the rank field
 */
export function createUpdatedRankFields(
  currentFields: Record<string, GameRunField>,
  newRank: RankValue
): Record<string, GameRunField> {
  // If clearing the rank, remove the field entirely
  if (newRank === '') {
    const { _rank: _removed, ...fieldsWithoutRank } = currentFields;
    void _removed; // Explicitly mark as intentionally unused
    return fieldsWithoutRank;
  }

  const rankField = currentFields._rank || {
    originalKey: '_rank',
    dataType: 'string' as const,
  };

  const rankString = String(newRank);

  return {
    ...currentFields,
    _rank: {
      ...rankField,
      value: rankString,
      rawValue: rankString,
      displayValue: rankString,
    },
  };
}

/**
 * Extracts rank value from run fields
 * Returns empty string if not set
 */
export function extractRankValue(fields: Record<string, GameRunField>): RankValue {
  const rankField = fields._rank;
  if (!rankField || !rankField.displayValue || rankField.displayValue.trim() === '') {
    return '';
  }
  const parsed = parseInt(rankField.displayValue, 10);
  return isNaN(parsed) ? '' : parsed;
}
