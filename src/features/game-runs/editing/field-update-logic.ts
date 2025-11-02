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
