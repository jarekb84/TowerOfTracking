import { useState, useEffect, useMemo } from 'react';
import { extractTimestampFromFields } from '@/features/analysis/shared/parsing/field-utils';
import {
  createInitialFormState,
  createInitialDateTimeState,
  formatTimeFromDate,
  createDateTimeFromComponents
} from './data-input-state';
import { prepareRunForSave, createResetDateIssueState, parseAndAnalyzeInput } from './data-input-form-logic';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type { RunTypeValue } from '@/shared/domain/run-types/types';
import { RunType } from '@/shared/domain/run-types/types';
import type { DuplicateDetectionResult } from '@/shared/domain/duplicate-detection/duplicate-detection';
import type { DuplicateResolution } from '@/shared/domain/duplicate-detection/duplicate-info';
import { useData } from '@/shared/domain/use-data';
import { useRunTypeContext } from '@/shared/domain/run-types/use-run-type-context';
import type { RankValue } from '@/features/game-runs/editing/field-update-logic';
import { useLocaleStore } from '@/shared/locale';
import type { DateIssueInfo } from '@/shared/formatting/date-issue-detection';

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
  /** Date issue detection info (missing/invalid battleDate) */
  dateIssueInfo: DateIssueInfo | null;
  /** Whether to auto-fix date issues */
  autoFixDateEnabled: boolean;
}

interface DataInputFormActions {
  setInputData: (data: string) => void;
  setSelectedRunType: (type: RunTypeValue) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTime: (time: { hours: string; minutes: string }) => void;
  setNotes: (notes: string) => void;
  setRank: (rank: RankValue) => void;
  setResolution: (resolution: DuplicateResolution) => void;
  setAutoFixDateEnabled: (enabled: boolean) => void;
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
  const [dateIssueInfo, setDateIssueInfo] = useState<DateIssueInfo | null>(null);
  const [autoFixDateEnabled, setAutoFixDateEnabled] = useState(false);

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

  const parseInputData = (data: string): void => {
    const userSelectedDate = getDateTimeFromSelection();
    const result = parseAndAnalyzeInput(data, userSelectedDate, importFormat);

    if (!result.success) {
      setPreviewData(null);
      const resetState = createResetDateIssueState();
      setHasBattleDate(resetState.hasBattleDate);
      setDateIssueInfo(resetState.dateIssueInfo);
      setAutoFixDateEnabled(resetState.autoFixDateEnabled);
      return;
    }

    setPreviewData(result.parsed);
    setHasBattleDate(result.hasBattleDate);
    setDateIssueInfo(result.dateIssueInfo);
    setAutoFixDateEnabled(result.shouldAutoFix);

    if (result.shouldUpdateRunType) {
      setSelectedRunType(result.detectedRunType);
    }
    if (result.extractedNotes) {
      setNotes(result.extractedNotes);
    }

    updateDateTimeFromParsedData(result.parsed);
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
    if (!previewData) return;

    const runToSave = prepareRunForSave({
      previewData,
      autoFixDateEnabled,
      dateIssueInfo,
      notes,
      selectedRunType,
      rank,
    });

    if (duplicateResult?.isDuplicate && duplicateResult.existingRun && resolution === 'overwrite') {
      overwriteRun(duplicateResult.existingRun.id, runToSave, true);
    } else {
      addRun(runToSave);
    }

    resetForm();
  };

  const resetForm = (): void => {
    const newFormState = createInitialFormState(defaultRunType);
    const newDateTime = createInitialDateTimeState();
    const resetDateState = createResetDateIssueState();

    setInputData(newFormState.inputData);
    setPreviewData(null);
    setSelectedRunType(newFormState.selectedRunType);
    setSelectedDate(newDateTime.selectedDate);
    setSelectedTime(newDateTime.selectedTime);
    setNotes(newFormState.notes);
    setRank('');
    setDuplicateResult(newFormState.duplicateResult);
    setResolution(newFormState.resolution);
    setHasBattleDate(resetDateState.hasBattleDate);
    setDateIssueInfo(resetDateState.dateIssueInfo);
    setAutoFixDateEnabled(resetDateState.autoFixDateEnabled);
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
    dateIssueInfo,
    autoFixDateEnabled,

    // Actions
    setInputData,
    setSelectedRunType,
    setSelectedDate,
    setSelectedTime,
    setNotes,
    setRank,
    setResolution,
    setAutoFixDateEnabled,
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