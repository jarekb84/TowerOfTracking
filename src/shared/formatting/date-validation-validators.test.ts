import { describe, it, expect, vi } from 'vitest';
import {
  validateNotEmpty,
  validateFormatMatch,
  validateMonthName,
  validateTimeRange,
  validateDateExists,
  validateNotFuture,
  validateNotTooOld,
} from './date-validation';

// Mock the locale store to avoid store initialization issues in tests
vi.mock('../locale/locale-store', () => ({
  getImportFormat: () => ({ dateFormat: 'month-first' as const }),
}));

describe('validateNotEmpty', () => {
  it('should return null for valid non-empty string', () => {
    expect(validateNotEmpty('Oct 14, 2025 13:14')).toBeNull();
  });

  it('should return error for empty string', () => {
    const result = validateNotEmpty('');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('empty');
    expect(result?.message).toBe('Battle date is empty');
  });

  it('should return error for whitespace-only string', () => {
    const result = validateNotEmpty('   ');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('empty');
    expect(result?.message).toBe('Battle date contains only whitespace');
  });

  it('should return error for null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateNotEmpty(null as any);
    expect(result).not.toBeNull();
    expect(result?.code).toBe('empty');
  });

  it('should return error for undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateNotEmpty(undefined as any);
    expect(result).not.toBeNull();
    expect(result?.code).toBe('empty');
  });

  it('should include suggestion in error', () => {
    const result = validateNotEmpty('');
    expect(result?.suggestion).toBeDefined();
    expect(result?.suggestion).toContain('Battle Date');
  });
});

describe('validateFormatMatch', () => {
  it('should return match array for valid format', () => {
    const result = validateFormatMatch('Oct 14, 2025 13:14');
    expect(Array.isArray(result)).toBe(true);
    expect((result as RegExpMatchArray)[1]).toBe('Oct'); // month
    expect((result as RegExpMatchArray)[2]).toBe('14'); // day
    expect((result as RegExpMatchArray)[3]).toBe('2025'); // year
    expect((result as RegExpMatchArray)[4]).toBe('13'); // hour
    expect((result as RegExpMatchArray)[5]).toBe('14'); // minute
  });

  it('should return match for format without comma', () => {
    const result = validateFormatMatch('Oct 14 2025 13:14');
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return match for lowercase month with period', () => {
    const result = validateFormatMatch('nov. 20, 2025 22:28');
    expect(Array.isArray(result)).toBe(true);
    expect((result as RegExpMatchArray)[1]).toBe('nov');
  });

  it('should return error for invalid format', () => {
    const result = validateFormatMatch('invalid');
    expect('code' in result).toBe(true);
    expect((result as { code: string }).code).toBe('invalid-format');
  });

  it('should return error for date without time', () => {
    const result = validateFormatMatch('Oct 14, 2025');
    expect('code' in result).toBe(true);
    expect((result as { code: string }).code).toBe('invalid-format');
  });

  it('should return error for numeric date format', () => {
    const result = validateFormatMatch('2025-10-14 13:14');
    expect('code' in result).toBe(true);
    expect((result as { code: string }).code).toBe('invalid-format');
  });

  it('should return error for European date format', () => {
    const result = validateFormatMatch('14.10.2025');
    expect('code' in result).toBe(true);
    expect((result as { code: string }).code).toBe('invalid-format');
  });

  it('should include the raw value in error', () => {
    const input = 'some invalid format';
    const result = validateFormatMatch(input);
    expect('rawValue' in result).toBe(true);
    expect((result as { rawValue: string }).rawValue).toBe(input);
  });

  it('should include suggestion in error', () => {
    const result = validateFormatMatch('invalid');
    expect('suggestion' in result).toBe(true);
    expect((result as { suggestion: string }).suggestion).toContain('Expected format');
  });
});

describe('validateMonthName', () => {
  it('should return month index for valid English month', () => {
    expect(validateMonthName('Oct', 'month-first', 'test')).toBe(9);
    expect(validateMonthName('Jan', 'month-first', 'test')).toBe(0);
    expect(validateMonthName('Dec', 'month-first', 'test')).toBe(11);
  });

  it('should be case-insensitive', () => {
    expect(validateMonthName('OCT', 'month-first', 'test')).toBe(9);
    expect(validateMonthName('oct', 'month-first', 'test')).toBe(9);
  });

  it('should handle month-first-lowercase format', () => {
    expect(validateMonthName('nov', 'month-first-lowercase', 'test')).toBe(10);
    expect(validateMonthName('nov.', 'month-first-lowercase', 'test')).toBe(10);
  });

  it('should handle French month abbreviations', () => {
    expect(validateMonthName('janv.', 'month-first-lowercase', 'test')).toBe(0);
    expect(validateMonthName('févr.', 'month-first-lowercase', 'test')).toBe(1);
    expect(validateMonthName('mars', 'month-first-lowercase', 'test')).toBe(2);
  });

  it('should handle German month abbreviations', () => {
    expect(validateMonthName('jän', 'month-first-lowercase', 'test')).toBe(0);
    expect(validateMonthName('mär', 'month-first-lowercase', 'test')).toBe(2);
    expect(validateMonthName('okt', 'month-first-lowercase', 'test')).toBe(9);
  });

  it('should return error for invalid month name', () => {
    const result = validateMonthName('xyz', 'month-first', 'Oct 14, 2025 13:14');
    expect(typeof result).toBe('object');
    expect((result as { code: string }).code).toBe('invalid-month');
  });

  it('should include suggestion for invalid month', () => {
    const result = validateMonthName('Octob', 'month-first', 'Octob 14, 2025 13:14');
    expect((result as { suggestion: string }).suggestion).toContain('Jan');
  });
});

describe('validateTimeRange', () => {
  it('should return null for valid time', () => {
    expect(validateTimeRange(13, 14, 'test')).toBeNull();
    expect(validateTimeRange(0, 0, 'test')).toBeNull();
    expect(validateTimeRange(23, 59, 'test')).toBeNull();
  });

  it('should return error for hour > 23', () => {
    const result = validateTimeRange(24, 0, 'Oct 14 2025 24:00');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('invalid-hour');
    expect(result?.message).toContain('24');
  });

  it('should return error for hour = 25', () => {
    const result = validateTimeRange(25, 14, 'Oct 14 2025 25:14');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('invalid-hour');
    expect(result?.message).toContain('25');
  });

  it('should return error for negative hour', () => {
    const result = validateTimeRange(-1, 0, 'test');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('invalid-hour');
  });

  it('should return error for minute > 59', () => {
    const result = validateTimeRange(13, 60, 'Oct 14 2025 13:60');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('invalid-minute');
    expect(result?.message).toContain('60');
  });

  it('should return error for negative minute', () => {
    const result = validateTimeRange(13, -1, 'test');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('invalid-minute');
  });

  it('should check hour before minute', () => {
    // Both invalid, should report hour error first
    const result = validateTimeRange(25, 70, 'test');
    expect(result?.code).toBe('invalid-hour');
  });

  it('should include suggestion for invalid time', () => {
    const result = validateTimeRange(25, 0, 'test');
    expect(result?.suggestion).toContain('0');
    expect(result?.suggestion).toContain('23');
  });
});

describe('validateDateExists', () => {
  it('should return null for valid dates', () => {
    expect(validateDateExists(2025, 0, 15, 'test')).toBeNull(); // Jan 15
    expect(validateDateExists(2025, 1, 28, 'test')).toBeNull(); // Feb 28
    expect(validateDateExists(2025, 11, 31, 'test')).toBeNull(); // Dec 31
  });

  it('should return error for Feb 30', () => {
    const result = validateDateExists(2025, 1, 30, 'Feb 30, 2025 13:14');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('invalid-day');
    expect(result?.message).toContain('30');
    expect(result?.message).toContain('February');
  });

  it('should return error for Feb 29 in non-leap year', () => {
    const result = validateDateExists(2025, 1, 29, 'Feb 29, 2025 13:14');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('invalid-day');
  });

  it('should allow Feb 29 in leap year', () => {
    expect(validateDateExists(2024, 1, 29, 'test')).toBeNull();
  });

  it('should return error for Apr 31', () => {
    const result = validateDateExists(2025, 3, 31, 'Apr 31, 2025 13:14');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('invalid-day');
    expect(result?.message).toContain('April');
  });

  it('should return error for day 0', () => {
    const result = validateDateExists(2025, 0, 0, 'test');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('invalid-day');
  });

  it('should return error for day 32 in any month', () => {
    const result = validateDateExists(2025, 0, 32, 'Jan 32, 2025 13:14');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('invalid-day');
  });

  it('should include days in month in suggestion', () => {
    const result = validateDateExists(2025, 1, 30, 'test');
    expect(result?.suggestion).toContain('28'); // Feb 2025 has 28 days
  });
});

describe('validateNotFuture', () => {
  it('should return null for past dates', () => {
    const pastDate = new Date('2023-01-01T12:00:00');
    expect(validateNotFuture(pastDate, 'test')).toBeNull();
  });

  it('should return null for current date', () => {
    const now = new Date();
    expect(validateNotFuture(now, 'test')).toBeNull();
  });

  it('should return error for future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const result = validateNotFuture(futureDate, 'Oct 14, 2030 13:14');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('future-date');
  });

  it('should allow dates within 1 day buffer', () => {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 12); // 12 hours in future
    expect(validateNotFuture(tomorrow, 'test')).toBeNull();
  });

  it('should include suggestion for future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const result = validateNotFuture(futureDate, 'test');
    expect(result?.suggestion).toContain('year');
  });
});

describe('validateNotTooOld', () => {
  it('should return null for recent dates', () => {
    const recentDate = new Date('2024-06-15T12:00:00');
    expect(validateNotTooOld(recentDate, 'test')).toBeNull();
  });

  it('should return error for dates before 2020', () => {
    const oldDate = new Date('2019-12-31T23:59:59');
    const result = validateNotTooOld(oldDate, 'Dec 31, 2019 23:59');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('too-old');
  });

  it('should use custom minimum date if provided', () => {
    const customMin = new Date('2023-01-01');
    const dateBeforeMin = new Date('2022-06-15');
    const result = validateNotTooOld(dateBeforeMin, 'test', customMin);
    expect(result).not.toBeNull();
    expect(result?.code).toBe('too-old');
  });

  it('should allow dates after custom minimum', () => {
    const customMin = new Date('2023-01-01');
    const dateAfterMin = new Date('2023-06-15');
    expect(validateNotTooOld(dateAfterMin, 'test', customMin)).toBeNull();
  });

  it('should include suggestion for old date', () => {
    const oldDate = new Date('2015-01-01');
    const result = validateNotTooOld(oldDate, 'test');
    expect(result?.suggestion).toContain('year');
  });
});
