import { describe, it, expect } from 'vitest';
import {
  detectDecimalSeparatorFromValue,
  detectDateFormatFromValue,
  detectFormatMismatch,
} from './format-detection';
import type { ImportFormatSettings } from './types';

describe('format-detection', () => {
  describe('detectDecimalSeparatorFromValue', () => {
    describe('comma-decimal detection', () => {
      it('should detect comma decimal separator with T suffix', () => {
        expect(detectDecimalSeparatorFromValue('43,91T')).toBe(',');
      });

      it('should detect comma decimal separator with M suffix', () => {
        expect(detectDecimalSeparatorFromValue('1,5M')).toBe(',');
      });

      it('should detect comma decimal separator with K suffix', () => {
        expect(detectDecimalSeparatorFromValue('248,55K')).toBe(',');
      });

      it('should detect comma decimal separator with B suffix', () => {
        expect(detectDecimalSeparatorFromValue('3,79B')).toBe(',');
      });

      it('should detect comma decimal separator with aa suffix', () => {
        expect(detectDecimalSeparatorFromValue('4,96aa')).toBe(',');
      });
    });

    describe('period-decimal detection', () => {
      it('should detect period decimal separator with T suffix', () => {
        expect(detectDecimalSeparatorFromValue('43.91T')).toBe('.');
      });

      it('should detect period decimal separator with M suffix', () => {
        expect(detectDecimalSeparatorFromValue('1.5M')).toBe('.');
      });

      it('should detect period decimal separator with K suffix', () => {
        expect(detectDecimalSeparatorFromValue('248.55K')).toBe('.');
      });

      it('should detect period decimal separator with longer decimal', () => {
        expect(detectDecimalSeparatorFromValue('43.912T')).toBe('.');
      });
    });

    describe('unable to detect', () => {
      it('should return null for empty value', () => {
        expect(detectDecimalSeparatorFromValue('')).toBeNull();
      });

      it('should return null for undefined', () => {
        expect(detectDecimalSeparatorFromValue(undefined)).toBeNull();
      });

      it('should return null for whole numbers without decimal', () => {
        expect(detectDecimalSeparatorFromValue('100K')).toBeNull();
      });

      it('should return null for plain numbers', () => {
        expect(detectDecimalSeparatorFromValue('12345')).toBeNull();
      });
    });
  });

  describe('detectDateFormatFromValue', () => {
    describe('month-first-lowercase detection', () => {
      it('should detect lowercase month with period', () => {
        expect(detectDateFormatFromValue('nov. 20, 2025 22:28')).toBe(
          'month-first-lowercase'
        );
      });

      it('should detect lowercase month without period', () => {
        expect(detectDateFormatFromValue('nov 20, 2025 22:28')).toBe(
          'month-first-lowercase'
        );
      });

      it('should detect French lowercase month', () => {
        expect(detectDateFormatFromValue('déc. 25, 2025 10:00')).toBe(
          'month-first-lowercase'
        );
      });

      it('should detect 4-letter month with period', () => {
        expect(detectDateFormatFromValue('sept. 15, 2025 14:30')).toBe(
          'month-first-lowercase'
        );
      });
    });

    describe('month-first detection', () => {
      it('should detect capitalized month', () => {
        expect(detectDateFormatFromValue('Nov 20, 2025 22:28')).toBe(
          'month-first'
        );
      });

      it('should detect capitalized month with comma', () => {
        expect(detectDateFormatFromValue('Nov 20, 2025')).toBe('month-first');
      });

      it('should detect other capitalized months', () => {
        expect(detectDateFormatFromValue('Dec 25, 2025 10:00')).toBe(
          'month-first'
        );
        expect(detectDateFormatFromValue('Jan 1, 2025 00:00')).toBe(
          'month-first'
        );
      });
    });

    describe('unable to detect', () => {
      it('should return null for empty value', () => {
        expect(detectDateFormatFromValue('')).toBeNull();
      });

      it('should return null for undefined', () => {
        expect(detectDateFormatFromValue(undefined)).toBeNull();
      });

      it('should return null for ISO date format', () => {
        expect(detectDateFormatFromValue('2025-11-20')).toBeNull();
      });
    });
  });

  describe('detectFormatMismatch', () => {
    const periodDecimalSettings: ImportFormatSettings = {
      decimalSeparator: '.',
      thousandsSeparator: ',',
      dateFormat: 'month-first',
    };

    const commaDecimalSettings: ImportFormatSettings = {
      decimalSeparator: ',',
      thousandsSeparator: '.',
      dateFormat: 'month-first-lowercase',
    };

    describe('number format mismatch', () => {
      it('should detect mismatch when data is comma-decimal but settings are period-decimal', () => {
        const rawData = {
          'Coins earned': '43,91T',
          'Damage dealt': '4,96aa',
        };

        const result = detectFormatMismatch(rawData, periodDecimalSettings);

        expect(result.numberMismatch).toBe(true);
        expect(result.detectedDecimalSeparator).toBe(',');
      });

      it('should not detect mismatch when formats match', () => {
        const rawData = {
          'Coins earned': '43.91T',
          'Damage dealt': '4.96aa',
        };

        const result = detectFormatMismatch(rawData, periodDecimalSettings);

        expect(result.numberMismatch).toBe(false);
        expect(result.detectedDecimalSeparator).toBe('.');
      });

      it('should use damage_dealt if coins_earned detection fails', () => {
        const rawData = {
          'Coins earned': '100K', // No decimal, can't detect
          'Damage dealt': '4,96aa', // Comma-decimal
        };

        const result = detectFormatMismatch(rawData, periodDecimalSettings);

        expect(result.numberMismatch).toBe(true);
        expect(result.detectedDecimalSeparator).toBe(',');
      });

      it('should handle snake_case field names', () => {
        const rawData = {
          coins_earned: '43,91T',
          damage_dealt: '4,96aa',
        };

        const result = detectFormatMismatch(rawData, periodDecimalSettings);

        expect(result.numberMismatch).toBe(true);
      });
    });

    describe('date format mismatch', () => {
      it('should detect mismatch when data is lowercase but settings are capitalized', () => {
        const rawData = {
          'Battle Date': 'nov. 20, 2025 22:28',
        };

        const result = detectFormatMismatch(rawData, periodDecimalSettings);

        expect(result.dateMismatch).toBe(true);
        expect(result.detectedDateFormat).toBe('month-first-lowercase');
      });

      it('should not detect mismatch when formats match', () => {
        const rawData = {
          'Battle Date': 'Nov 20, 2025 22:28',
        };

        const result = detectFormatMismatch(rawData, periodDecimalSettings);

        expect(result.dateMismatch).toBe(false);
        expect(result.detectedDateFormat).toBe('month-first');
      });

      it('should handle snake_case field names', () => {
        const rawData = {
          battle_date: 'nov. 20, 2025 22:28',
        };

        const result = detectFormatMismatch(rawData, periodDecimalSettings);

        expect(result.dateMismatch).toBe(true);
      });
    });

    describe('both mismatches', () => {
      it('should detect both number and date mismatches', () => {
        const rawData = {
          'Coins earned': '43,91T',
          'Battle Date': 'nov. 20, 2025 22:28',
        };

        const result = detectFormatMismatch(rawData, periodDecimalSettings);

        expect(result.numberMismatch).toBe(true);
        expect(result.dateMismatch).toBe(true);
      });

      it('should not detect mismatch when comma-decimal settings match comma data', () => {
        const rawData = {
          'Coins earned': '43,91T',
          'Battle Date': 'nov. 20, 2025 22:28',
        };

        const result = detectFormatMismatch(rawData, commaDecimalSettings);

        expect(result.numberMismatch).toBe(false);
        expect(result.dateMismatch).toBe(false);
      });
    });

    describe('missing fields', () => {
      it('should not detect mismatch when fields are missing', () => {
        const rawData = {};

        const result = detectFormatMismatch(rawData, periodDecimalSettings);

        expect(result.numberMismatch).toBe(false);
        expect(result.dateMismatch).toBe(false);
        expect(result.detectedDecimalSeparator).toBeNull();
        expect(result.detectedDateFormat).toBeNull();
      });
    });
  });
});
