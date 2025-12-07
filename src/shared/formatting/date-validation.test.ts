import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateBattleDate,
  parseBattleDateWithValidation,
} from './date-validation';

// Mock the locale store to avoid store initialization issues in tests
vi.mock('../locale/locale-store', () => ({
  getImportFormat: () => ({ dateFormat: 'month-first' as const }),
}));

describe('validateBattleDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set mock time to December 2025 so test dates (Oct/Nov 2025) are in the past
    vi.setSystemTime(new Date('2025-12-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('valid dates', () => {
    it('should return success for valid date', () => {
      const result = validateBattleDate('Oct 14, 2025 13:14');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.date.getFullYear()).toBe(2025);
        expect(result.date.getMonth()).toBe(9);
        expect(result.date.getDate()).toBe(14);
        expect(result.date.getHours()).toBe(13);
        expect(result.date.getMinutes()).toBe(14);
      }
    });

    it('should parse lowercase month with period format', () => {
      const result = validateBattleDate('nov. 20, 2025 22:28', { format: 'month-first-lowercase' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.date.getMonth()).toBe(10); // November
      }
    });

    it('should parse French month abbreviations', () => {
      const result = validateBattleDate('janv. 15, 2025 10:30', { format: 'month-first-lowercase' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.date.getMonth()).toBe(0); // January
      }
    });

    it('should parse German month abbreviations', () => {
      const result = validateBattleDate('mär. 15, 2025 10:30', { format: 'month-first-lowercase' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.date.getMonth()).toBe(2); // March
      }
    });

    it('should handle leap year Feb 29', () => {
      const result = validateBattleDate('feb. 29, 2024 13:14', { format: 'month-first-lowercase' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.date.getDate()).toBe(29);
      }
    });
  });

  describe('empty and format errors', () => {
    it('should return error for empty string', () => {
      const result = validateBattleDate('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('empty');
      }
    });

    it('should return error for invalid format', () => {
      // Use a format that native Date() cannot parse
      const result = validateBattleDate('14/10/2025 13:14', { format: 'month-first-lowercase' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('invalid-format');
      }
    });

    it('should return error for invalid month name', () => {
      const result = validateBattleDate('xyz 14, 2025 13:14', { format: 'month-first-lowercase' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('invalid-month');
      }
    });
  });

  describe('time validation', () => {
    it('should return error for invalid hour (25:14)', () => {
      const result = validateBattleDate('Oct 14, 2025 25:14', { format: 'month-first-lowercase' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('invalid-hour');
        expect(result.error.rawValue).toBe('Oct 14, 2025 25:14');
      }
    });

    it('should return error for invalid minute', () => {
      const result = validateBattleDate('oct. 14, 2025 13:65', { format: 'month-first-lowercase' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('invalid-minute');
      }
    });
  });

  describe('day validation', () => {
    it('should return error for invalid day (Feb 30)', () => {
      const result = validateBattleDate('feb. 30, 2025 13:14', { format: 'month-first-lowercase' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('invalid-day');
      }
    });

    it('should reject non-leap year Feb 29', () => {
      const result = validateBattleDate('feb. 29, 2025 13:14', { format: 'month-first-lowercase' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('invalid-day');
      }
    });
  });

  describe('date range validation', () => {
    it('should return error for future date', () => {
      const result = validateBattleDate('Oct 14, 2030 13:14');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('future-date');
      }
    });

    it('should skip future date check when disabled', () => {
      const result = validateBattleDate('Oct 14, 2030 13:14', { warnFutureDates: false });
      // For month-first, native Date parsing will succeed for future dates
      expect(result.success).toBe(true);
    });

    it('should return error for too old date', () => {
      const result = validateBattleDate('Oct 14, 2015 13:14');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('too-old');
      }
    });
  });
});

describe('parseBattleDateWithValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set mock time to December 2025 so test dates are in the past
    vi.setSystemTime(new Date('2025-12-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return Date for valid input', () => {
    const result = parseBattleDateWithValidation('Oct 14, 2025 13:14');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2025);
    expect(result?.getMonth()).toBe(9);
  });

  it('should return null for invalid input', () => {
    expect(parseBattleDateWithValidation('')).toBeNull();
    expect(parseBattleDateWithValidation('invalid')).toBeNull();
    expect(parseBattleDateWithValidation('Oct 14, 2025 25:14', 'month-first-lowercase')).toBeNull();
  });

  it('should use specified format', () => {
    const result = parseBattleDateWithValidation('nov. 20, 2025 22:28', 'month-first-lowercase');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getMonth()).toBe(10);
  });
});
