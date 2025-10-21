import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createInitialFormState,
  createInitialDateTimeState,
  formatTimeFromDate,
  createDateTimeFromComponents,
} from './data-input-state';
import { RunType } from '../types/game-run.types';

describe('data-input-state utilities', () => {
  let mockDate: Date;

  beforeEach(() => {
    // Mock a consistent date for testing
    mockDate = new Date('2024-01-15T14:30:45.123Z');
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createInitialFormState', () => {
    it('should return consistent initial state with default farm type', () => {
      const state = createInitialFormState();

      expect(state).toEqual({
        inputData: '',
        notes: '',
        selectedRunType: RunType.FARM,
        duplicateResult: null,
        resolution: 'new-only',
      });
    });

    it('should accept tournament as default run type', () => {
      const state = createInitialFormState(RunType.TOURNAMENT);

      expect(state.selectedRunType).toBe(RunType.TOURNAMENT);
      expect(state.inputData).toBe('');
      expect(state.notes).toBe('');
      expect(state.duplicateResult).toBeNull();
      expect(state.resolution).toBe('new-only');
    });

    it('should accept milestone as default run type', () => {
      const state = createInitialFormState(RunType.MILESTONE);

      expect(state.selectedRunType).toBe(RunType.MILESTONE);
    });

    it('should default to farm when provided undefined', () => {
      const state = createInitialFormState(undefined);

      expect(state.selectedRunType).toBe(RunType.FARM);
    });

    it('should return new objects on each call', () => {
      const state1 = createInitialFormState();
      const state2 = createInitialFormState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });

  describe('createInitialDateTimeState', () => {
    it('should create state based on current time', () => {
      const state = createInitialDateTimeState();

      expect(state.selectedDate).toEqual(mockDate);
      expect(state.selectedTime).toEqual({
        hours: mockDate.getHours().toString().padStart(2, '0'),
        minutes: mockDate.getMinutes().toString().padStart(2, '0'),
      });
    });

    it('should zero-pad single digit times', () => {
      // Create a time that we know will have single digits in current timezone
      const localEarlyTime = new Date(2024, 0, 15, 8, 5, 0); // Local time
      vi.setSystemTime(localEarlyTime);

      const state = createInitialDateTimeState();

      expect(state.selectedTime).toEqual({
        hours: '08',
        minutes: '05',
      });
    });
  });

  describe('formatTimeFromDate', () => {
    it('should format time with zero-padding', () => {
      const date = new Date(2024, 0, 15, 9, 5, 30); // Local time
      const time = formatTimeFromDate(date);

      expect(time).toEqual({
        hours: '09',
        minutes: '05',
      });
    });

    it('should handle double-digit times', () => {
      const date = new Date(2024, 0, 15, 23, 59, 0); // Local time
      const time = formatTimeFromDate(date);

      expect(time).toEqual({
        hours: '23',
        minutes: '59',
      });
    });

    it('should handle midnight', () => {
      const date = new Date(2024, 0, 15, 0, 0, 0); // Local time
      const time = formatTimeFromDate(date);

      expect(time).toEqual({
        hours: '00',
        minutes: '00',
      });
    });
  });

  describe('createDateTimeFromComponents', () => {
    it('should combine date and time components correctly', () => {
      const selectedDate = new Date('2024-01-15T12:34:56.789Z');
      const selectedTime = { hours: '09', minutes: '15' };

      const result = createDateTimeFromComponents(selectedDate, selectedTime);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(15);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should reset seconds and milliseconds', () => {
      const selectedDate = new Date('2024-01-15T12:34:56.789Z');
      const selectedTime = { hours: '14', minutes: '30' };

      const result = createDateTimeFromComponents(selectedDate, selectedTime);

      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should handle string parsing for hours and minutes', () => {
      const selectedDate = new Date('2024-01-15');
      const selectedTime = { hours: '08', minutes: '05' };

      const result = createDateTimeFromComponents(selectedDate, selectedTime);

      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(5);
    });
  });
});