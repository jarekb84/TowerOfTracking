import { describe, it, expect, afterEach } from 'vitest';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayShortDate,
  formatDisplayNumericDate,
  formatDisplayTime,
  formatDisplayMonthDay,
  formatDisplayMonth,
  formatWeekOfLabel,
  formatDisplayShortDateTime,
} from './date-formatters';
import { __resetForTesting, __setStateForTesting } from '../locale/locale-store';

// Test helpers to reduce boilerplate
const setLocale = (locale: 'en-US' | 'de-DE' | 'pl-PL') => {
  const configs = {
    'en-US': { decimalSeparator: '.', thousandsSeparator: ',', dateFormat: 'month-first' },
    'de-DE': { decimalSeparator: ',', thousandsSeparator: '.', dateFormat: 'month-first' },
    'pl-PL': { decimalSeparator: ',', thousandsSeparator: ' ', dateFormat: 'month-first' },
  } as const;
  __setStateForTesting({ importFormat: configs[locale], displayLocale: locale });
};

describe('date display formatters', () => {
  const testDate = new Date(2025, 10, 30, 15, 45, 0); // Nov 30, 2025 15:45
  afterEach(() => __resetForTesting());

  describe('formatDisplayDate', () => {
    it('formats date using en-US locale', () => {
      setLocale('en-US');
      const result = formatDisplayDate(testDate);
      expect(result).toContain('Nov');
      expect(result).toContain('30');
      expect(result).toContain('2025');
    });

    it('formats date using de-DE locale', () => {
      setLocale('de-DE');
      const result = formatDisplayDate(testDate);
      expect(result).toContain('30');
      expect(result).toContain('2025');
    });
  });

  describe('formatDisplayDateTime', () => {
    it('formats date and time using en-US locale', () => {
      setLocale('en-US');
      const result = formatDisplayDateTime(testDate);
      expect(result).toContain('Nov');
      expect(result).toContain('30');
      expect(result).toContain('2025');
      expect(result).toMatch(/15:45|3:45/);
    });

    it('formats date and time using de-DE locale', () => {
      setLocale('de-DE');
      const result = formatDisplayDateTime(testDate);
      expect(result).toContain('30');
      expect(result).toContain('2025');
      expect(result).toMatch(/15:45/);
    });
  });

  describe('formatDisplayShortDate', () => {
    it('formats short date using en-US locale (MM/DD)', () => {
      setLocale('en-US');
      expect(formatDisplayShortDate(testDate)).toMatch(/11.*30|30.*11/);
    });

    it('formats short date using de-DE locale (DD.MM.)', () => {
      setLocale('de-DE');
      const result = formatDisplayShortDate(testDate);
      expect(result).toContain('30');
      expect(result).toContain('11');
    });
  });

  describe('formatDisplayNumericDate', () => {
    it('formats numeric date using en-US locale (MM/DD/YYYY)', () => {
      setLocale('en-US');
      const result = formatDisplayNumericDate(testDate);
      expect(result).toContain('11');
      expect(result).toContain('30');
      expect(result).toContain('2025');
      expect(result).not.toMatch(/nov/i);
    });

    it('formats numeric date using de-DE locale (DD.MM.YYYY)', () => {
      setLocale('de-DE');
      const result = formatDisplayNumericDate(testDate);
      expect(result).toContain('30');
      expect(result).toContain('11');
      expect(result).toContain('2025');
      expect(result).not.toMatch(/nov/i);
    });

    it('formats numeric date using pl-PL locale (DD.MM.YYYY)', () => {
      setLocale('pl-PL');
      const result = formatDisplayNumericDate(testDate);
      expect(result).toContain('30');
      expect(result).toContain('11');
      expect(result).toContain('2025');
      expect(result).not.toMatch(/lis|nov/i);
    });
  });

  describe('formatDisplayTime', () => {
    it('formats time using en-US locale', () => {
      setLocale('en-US');
      expect(formatDisplayTime(testDate)).toMatch(/3:45.*PM|15:45/);
    });

    it('formats time using de-DE locale (24-hour)', () => {
      setLocale('de-DE');
      const result = formatDisplayTime(testDate);
      expect(result).toContain('15');
      expect(result).toContain('45');
    });

    it('handles midnight correctly', () => {
      setLocale('en-US');
      const midnight = new Date(2025, 10, 30, 0, 0, 0);
      expect(formatDisplayTime(midnight)).toMatch(/12:00.*AM|0:00|00:00/);
    });

    it('handles noon correctly', () => {
      setLocale('en-US');
      const noon = new Date(2025, 10, 30, 12, 0, 0);
      expect(formatDisplayTime(noon)).toMatch(/12:00.*PM|12:00/);
    });
  });

  describe('formatDisplayMonthDay', () => {
    it('formats month and day using en-US locale', () => {
      setLocale('en-US');
      const result = formatDisplayMonthDay(testDate);
      expect(result).toContain('Nov');
      expect(result).toContain('30');
    });

    it('formats month and day using de-DE locale (day-first)', () => {
      setLocale('de-DE');
      expect(formatDisplayMonthDay(testDate)).toContain('30');
    });
  });

  describe('formatDisplayMonth', () => {
    it('formats month using en-US locale', () => {
      setLocale('en-US');
      expect(formatDisplayMonth(testDate).toLowerCase()).toContain('nov');
    });

    it('formats month using de-DE locale', () => {
      setLocale('de-DE');
      expect(formatDisplayMonth(testDate).toLowerCase()).toContain('nov');
    });

    it('formats different months correctly', () => {
      setLocale('en-US');
      expect(formatDisplayMonth(new Date(2025, 0, 15)).toLowerCase()).toContain('jan');
      expect(formatDisplayMonth(new Date(2025, 6, 15)).toLowerCase()).toContain('jul');
      expect(formatDisplayMonth(new Date(2025, 11, 15)).toLowerCase()).toContain('dec');
    });
  });

  describe('formatWeekOfLabel', () => {
    it('formats week label using en-US locale', () => {
      setLocale('en-US');
      const result = formatWeekOfLabel(testDate);
      expect(result).toContain('Week of');
      expect(result).toMatch(/11.*30|30.*11/);
    });

    it('formats week label using de-DE locale', () => {
      setLocale('de-DE');
      const result = formatWeekOfLabel(testDate);
      expect(result).toContain('Week of');
      expect(result).toContain('30');
      expect(result).toContain('11');
    });
  });

  describe('formatDisplayShortDateTime', () => {
    it('combines short date and time using en-US locale', () => {
      setLocale('en-US');
      const result = formatDisplayShortDateTime(testDate);
      expect(result).toMatch(/11.*30|30.*11/);
      expect(result).toMatch(/3:45.*PM|15:45/);
    });

    it('combines short date and time using de-DE locale', () => {
      setLocale('de-DE');
      const result = formatDisplayShortDateTime(testDate);
      expect(result).toContain('30');
      expect(result).toContain('15');
      expect(result).toContain('45');
    });
  });

  describe('edge cases', () => {
    it('handles year boundaries', () => {
      setLocale('en-US');
      const result = formatDisplayDate(new Date(2025, 11, 31, 23, 59, 59));
      expect(result).toContain('Dec');
      expect(result).toContain('31');
      expect(result).toContain('2025');
    });

    it('handles leap year dates', () => {
      setLocale('en-US');
      const result = formatDisplayDate(new Date(2024, 1, 29, 12, 0, 0));
      expect(result).toContain('Feb');
      expect(result).toContain('29');
      expect(result).toContain('2024');
    });

    it('handles single digit dates', () => {
      setLocale('en-US');
      const result = formatDisplayDate(new Date(2025, 0, 5, 8, 5, 0));
      expect(result).toContain('Jan');
      expect(result).toContain('5');
    });
  });
});
