import type { DuplicateDetectionResult } from '../utils/duplicate-detection';
import type { DuplicateResolution } from '../components/duplicate-info';
import { RunType, RunTypeValue } from '../types/game-run.types';

export interface DataInputFormInitialState {
  inputData: string;
  notes: string;
  selectedRunType: RunTypeValue;
  duplicateResult: DuplicateDetectionResult | null;
  resolution: DuplicateResolution;
}

export interface DateTimeState {
  selectedDate: Date;
  selectedTime: { hours: string; minutes: string };
}

/**
 * Creates the initial form state with optional context-aware default run type
 * @param defaultRunType - Optional default run type from URL context or other sources
 */
export function createInitialFormState(defaultRunType?: RunTypeValue): DataInputFormInitialState {
  return {
    inputData: '',
    notes: '',
    selectedRunType: defaultRunType || RunType.FARM,
    duplicateResult: null,
    resolution: 'new-only',
  };
}

/**
 * Creates initial date/time state based on current time
 */
export function createInitialDateTimeState(): DateTimeState {
  const now = new Date();
  return {
    selectedDate: now,
    selectedTime: {
      hours: now.getHours().toString().padStart(2, '0'),
      minutes: now.getMinutes().toString().padStart(2, '0'),
    },
  };
}

/**
 * Formats time values consistently with zero-padding
 */
export function formatTimeFromDate(date: Date): { hours: string; minutes: string } {
  return {
    hours: date.getHours().toString().padStart(2, '0'),
    minutes: date.getMinutes().toString().padStart(2, '0'),
  };
}

/**
 * Creates a complete DateTime object from date and time components
 */
export function createDateTimeFromComponents(
  selectedDate: Date,
  selectedTime: { hours: string; minutes: string }
): Date {
  const dateTime = new Date(selectedDate);
  dateTime.setHours(parseInt(selectedTime.hours, 10));
  dateTime.setMinutes(parseInt(selectedTime.minutes, 10));
  dateTime.setSeconds(0);
  dateTime.setMilliseconds(0);
  return dateTime;
}