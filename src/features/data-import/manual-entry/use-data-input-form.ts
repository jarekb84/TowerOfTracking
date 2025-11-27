import { useState, useEffect, useMemo } from 'react';
import { parseGameRun } from '@/features/analysis/shared/parsing/data-parser';
import { extractTimestampFromFields, createInternalField } from '@/features/analysis/shared/parsing/field-utils';
import {
  createInitialFormState,
  createInitialDateTimeState,
  formatTimeFromDate,
  createDateTimeFromComponents
} from './data-input-state';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type { RunTypeValue } from '@/shared/domain/run-types/types';
import { RunType } from '@/shared/domain/run-types/types';
import type { DuplicateDetectionResult } from '@/shared/domain/duplicate-detection/duplicate-detection';
import type { DuplicateResolution } from '@/shared/domain/duplicate-detection/duplicate-info';
import { useData } from '@/shared/domain/use-data';
import { useRunTypeContext } from '@/shared/domain/run-types/use-run-type-context';
import { hasExplicitRunType } from '@/shared/domain/run-types/run-type-detection';
import type { RankValue } from '@/features/game-runs/editing/field-update-logic';
import { useLocaleStore } from '@/shared/locale';

interface DataInputFormState {
  inputData: string;
  previewData: ParsedGameRun | null;
  selectedRunType: RunTypeValue;
  selectedDate: Date;
  selectedTime: { hours: string; minutes: string };
  notes: string;
  rank: RankValue;
  duplicateResult: DuplicateDetectionResult | null;
  resolution: DuplicateResolution;
  hasBattleDate: boolean;
}

interface DataInputFormActions {
  setInputData: (data: string) => void;
  setSelectedRunType: (type: RunTypeValue) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTime: (time: { hours: string; minutes: string }) => void;
  setNotes: (notes: string) => void;
  setRank: (rank: RankValue) => void;
  setResolution: (resolution: DuplicateResolution) => void;
  handleInputChange: (value: string) => void;
  handleDateSelect: (date: Date | undefined) => void;
  handleTimeChange: (field: 'hours' | 'minutes', value: string) => void;
  handleRunTypeChange: (type: RunTypeValue) => void;
  handlePaste: () => Promise<void>;
  handleSave: () => void;
  resetForm: () => void;
  getDateTimeFromSelection: () => Date;
}

export function useDataInputForm(): DataInputFormState & DataInputFormActions {
  // Memoize the context-aware default run type to avoid recalculating on every render
  const defaultRunType = useRunTypeContext();
  const { importFormat } = useLocaleStore();

  // Memoize initial states to ensure they're only created once
  const initialFormState = useMemo(() => createInitialFormState(defaultRunType), [defaultRunType]);
  const initialDateTime = useMemo(() => createInitialDateTimeState(), []);

  const [inputData, setInputData] = useState(initialFormState.inputData);
  const [previewData, setPreviewData] = useState<ParsedGameRun | null>(null);
  const [selectedRunType, setSelectedRunType] = useState(initialFormState.selectedRunType);
  const [selectedDate, setSelectedDate] = useState(initialDateTime.selectedDate);
  const [selectedTime, setSelectedTime] = useState(initialDateTime.selectedTime);
  const [notes, setNotes] = useState(initialFormState.notes);
  const [rank, setRank] = useState<RankValue>('');
  const [duplicateResult, setDuplicateResult] = useState(initialFormState.duplicateResult);
  const [resolution, setResolution] = useState(initialFormState.resolution);
  const [hasBattleDate, setHasBattleDate] = useState(false);

  const { addRun, checkDuplicate, overwriteRun } = useData();

  // Sync selectedRunType with URL context when it changes (e.g., switching tabs)
  useEffect(() => {
    setSelectedRunType(defaultRunType);
  }, [defaultRunType]);

  const getDateTimeFromSelection = (): Date => {
    return createDateTimeFromComponents(selectedDate, selectedTime);
  };

  const updateDateTimeFromParsedData = (parsed: ParsedGameRun): void => {
    const extractedTimestamp = extractTimestampFromFields(parsed.fields);
    if (extractedTimestamp) {
      setSelectedDate(extractedTimestamp);
      setSelectedTime(formatTimeFromDate(extractedTimestamp));
      parsed.timestamp = extractedTimestamp;
    }
  };

  const updateNotesFromParsedData = (parsed: ParsedGameRun): void => {
    // Check both _notes (internal field) and notes (legacy)
    const notesField = parsed.fields._notes || parsed.fields.notes;
    if (notesField && notesField.rawValue) {
      setNotes(notesField.rawValue);
    }
  };

  const parseInputData = (data: string): void => {
    if (data.trim()) {
      try {
        const parsed = parseGameRun(data, getDateTimeFromSelection(), importFormat);
        setPreviewData(parsed);

        // Only override run type if clipboard data has explicit run_type field
        // Otherwise preserve the context-aware default (e.g., tournament tab → tournament type)
        if (hasExplicitRunType(parsed.fields)) {
          setSelectedRunType(parsed.runType);
        }

        const hasBattleDateField = !!parsed.fields.battleDate;
        setHasBattleDate(hasBattleDateField);

        updateDateTimeFromParsedData(parsed);
        updateNotesFromParsedData(parsed);
      } catch (error) {
        setPreviewData(null);
        setHasBattleDate(false);
      }
    } else {
      setPreviewData(null);
      setHasBattleDate(false);
    }
  };

  const checkForDuplicates = (parsed: ParsedGameRun) => {
    const result = checkDuplicate(parsed);
    setDuplicateResult(result);
    if (result.isDuplicate) {
      setResolution('new-only');
    }
  };

  // Check for duplicates whenever preview data changes
  useEffect(() => {
    if (previewData) {
      checkForDuplicates(previewData);
    } else {
      setDuplicateResult(null);
    }
  }, [previewData, checkDuplicate]);

  const handlePaste = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      setInputData(text);
      parseInputData(text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleInputChange = (value: string): void => {
    setInputData(value);
    parseInputData(value);
  };

  const handleDateSelect = (date: Date | undefined): void => {
    if (date) {
      setSelectedDate(date);
      if (inputData.trim()) {
        const dateTime = new Date(date);
        dateTime.setHours(parseInt(selectedTime.hours, 10));
        dateTime.setMinutes(parseInt(selectedTime.minutes, 10));
        parseInputData(inputData);
      }
    }
  };

  const handleTimeChange = (field: 'hours' | 'minutes', value: string): void => {
    const newTime = { ...selectedTime, [field]: value };
    setSelectedTime(newTime);

    if (inputData.trim()) {
      parseInputData(inputData);
    }
  };

  const handleRunTypeChange = (type: RunTypeValue): void => {
    setSelectedRunType(type);
    // Clear rank when switching away from tournament
    if (type !== RunType.TOURNAMENT) {
      setRank('');
    }
  };

  const handleSave = (): void => {
    if (previewData) {
      const updatedFields = {
        ...previewData.fields,
        _notes: createInternalField('Notes', notes),
        _runType: createInternalField('Run Type', selectedRunType),
        // Only include rank for tournament runs
        ...(selectedRunType === RunType.TOURNAMENT && rank !== ''
          ? { _rank: createInternalField('Rank', String(rank)) }
          : {}
        )
      };

      const runWithNotes = {
        ...previewData,
        runType: selectedRunType,
        fields: updatedFields
      };

      if (duplicateResult?.isDuplicate && duplicateResult.existingRun) {
        if (resolution === 'overwrite') {
          overwriteRun(duplicateResult.existingRun.id, runWithNotes, true);
        }
      } else {
        addRun(runWithNotes);
      }

      resetForm();
    }
  };

  const resetForm = (): void => {
    const newFormState = createInitialFormState(defaultRunType);
    const newDateTime = createInitialDateTimeState();

    setInputData(newFormState.inputData);
    setPreviewData(null);
    setSelectedRunType(newFormState.selectedRunType);
    setSelectedDate(newDateTime.selectedDate);
    setSelectedTime(newDateTime.selectedTime);
    setNotes(newFormState.notes);
    setRank('');
    setDuplicateResult(newFormState.duplicateResult);
    setResolution(newFormState.resolution);
    setHasBattleDate(false);
  };

  return {
    // State
    inputData,
    previewData,
    selectedRunType,
    selectedDate,
    selectedTime,
    notes,
    rank,
    duplicateResult,
    resolution,
    hasBattleDate,

    // Actions
    setInputData,
    setSelectedRunType,
    setSelectedDate,
    setSelectedTime,
    setNotes,
    setRank,
    setResolution,
    handleInputChange,
    handleDateSelect,
    handleTimeChange,
    handleRunTypeChange,
    handlePaste,
    handleSave,
    resetForm,
    getDateTimeFromSelection,
  };
}