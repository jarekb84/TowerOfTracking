import { useState, useEffect } from 'react';
import { parseGameRun } from '../utils/data-parser';
import { extractTimestampFromFields } from '../utils/field-utils';
import type { ParsedGameRun } from '../types/game-run.types';
import type { DuplicateDetectionResult } from '../utils/duplicate-detection';
import type { DuplicateResolution } from '../components/duplicate-info';
import { useData } from './use-data';

export interface DataInputFormState {
  inputData: string;
  previewData: ParsedGameRun | null;
  selectedRunType: 'farm' | 'tournament' | 'milestone';
  selectedDate: Date;
  selectedTime: { hours: string; minutes: string };
  notes: string;
  duplicateResult: DuplicateDetectionResult | null;
  resolution: DuplicateResolution;
}

export interface DataInputFormActions {
  setInputData: (data: string) => void;
  setSelectedRunType: (type: 'farm' | 'tournament' | 'milestone') => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTime: (time: { hours: string; minutes: string }) => void;
  setNotes: (notes: string) => void;
  setResolution: (resolution: DuplicateResolution) => void;
  handleInputChange: (value: string) => void;
  handleDateSelect: (date: Date | undefined) => void;
  handleTimeChange: (field: 'hours' | 'minutes', value: string) => void;
  handlePaste: () => Promise<void>;
  handleSave: () => void;
  resetForm: () => void;
  getDateTimeFromSelection: () => Date;
}

export function useDataInputForm(): DataInputFormState & DataInputFormActions {
  const [inputData, setInputData] = useState('');
  const [previewData, setPreviewData] = useState<ParsedGameRun | null>(null);
  const [selectedRunType, setSelectedRunType] = useState<'farm' | 'tournament' | 'milestone'>('farm');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<{ hours: string; minutes: string }>(() => {
    const now = new Date();
    return {
      hours: now.getHours().toString().padStart(2, '0'),
      minutes: now.getMinutes().toString().padStart(2, '0')
    };
  });
  const [notes, setNotes] = useState('');
  const [duplicateResult, setDuplicateResult] = useState<DuplicateDetectionResult | null>(null);
  const [resolution, setResolution] = useState<DuplicateResolution>('new-only');
  
  const { addRun, checkDuplicate, overwriteRun } = useData();

  const getDateTimeFromSelection = (): Date => {
    const dateTime = new Date(selectedDate);
    dateTime.setHours(parseInt(selectedTime.hours, 10));
    dateTime.setMinutes(parseInt(selectedTime.minutes, 10));
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);
    return dateTime;
  };

  const updateDateTimeFromParsedData = (parsed: ParsedGameRun): void => {
    const extractedTimestamp = extractTimestampFromFields(parsed.fields);
    if (extractedTimestamp) {
      setSelectedDate(extractedTimestamp);
      setSelectedTime({
        hours: extractedTimestamp.getHours().toString().padStart(2, '0'),
        minutes: extractedTimestamp.getMinutes().toString().padStart(2, '0')
      });
      parsed.timestamp = extractedTimestamp;
    }
  };

  const updateNotesFromParsedData = (parsed: ParsedGameRun): void => {
    const notesField = parsed.fields.notes;
    if (notesField && notesField.rawValue) {
      setNotes(notesField.rawValue);
    }
  };

  const parseInputData = (data: string): void => {
    if (data.trim()) {
      try {
        const parsed = parseGameRun(data, getDateTimeFromSelection());
        setPreviewData(parsed);
        setSelectedRunType(parsed.runType);
        updateDateTimeFromParsedData(parsed);
        updateNotesFromParsedData(parsed);
      } catch (error) {
        setPreviewData(null);
      }
    } else {
      setPreviewData(null);
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

  const handleSave = (): void => {
    if (previewData) {
      const updatedFields = {
        ...previewData.fields,
        notes: {
          value: notes,
          rawValue: notes,
          displayValue: notes,
          originalKey: 'Notes',
          dataType: 'string' as const
        }
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
    setInputData('');
    setPreviewData(null);
    setNotes('');
    setDuplicateResult(null);
    setResolution('new-only');
  };

  return {
    // State
    inputData,
    previewData,
    selectedRunType,
    selectedDate,
    selectedTime,
    notes,
    duplicateResult,
    resolution,
    
    // Actions
    setInputData,
    setSelectedRunType,
    setSelectedDate,
    setSelectedTime,
    setNotes,
    setResolution,
    handleInputChange,
    handleDateSelect,
    handleTimeChange,
    handlePaste,
    handleSave,
    resetForm,
    getDateTimeFromSelection,
  };
}