import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseShorthandNumber,
  formatLargeNumber
} from './number-scale';
import {
  __resetForTesting,
  __setStateForTesting,
} from '@/shared/locale/locale-store';
import type { ImportFormatSettings } from '@/shared/locale/types';
import { CANONICAL_STORAGE_FORMAT } from '@/shared/locale/types';

// Test format configuration for comma-decimal locales (e.g., Germany, France)
const COMMA_DECIMAL_FORMAT: ImportFormatSettings = {
  decimalSeparator: ',',
  thousandsSeparator: '.',
  dateFormat: 'month-first',
};

describe('comma-decimal format support', () => {
  describe('parseShorthandNumber with comma-decimal format', () => {
    it('should parse comma as decimal separator with scale suffix', () => {
      expect(parseShorthandNumber('43,91T', COMMA_DECIMAL_FORMAT)).toBe(43.91e12);
      expect(parseShorthandNumber('1,5M', COMMA_DECIMAL_FORMAT)).toBe(1.5e6);
      expect(parseShorthandNumber('248,55K', COMMA_DECIMAL_FORMAT)).toBe(248.55e3);
      expect(parseShorthandNumber('3,79B', COMMA_DECIMAL_FORMAT)).toBe(3.79e9);
    });

    it('should parse period as thousands separator', () => {
      expect(parseShorthandNumber('1.234', COMMA_DECIMAL_FORMAT)).toBe(1234);
      expect(parseShorthandNumber('1.234.567', COMMA_DECIMAL_FORMAT)).toBe(1234567);
    });

    it('should parse comma-decimal with thousands separator', () => {
      expect(parseShorthandNumber('1.234,56', COMMA_DECIMAL_FORMAT)).toBe(1234.56);
      expect(parseShorthandNumber('1.234.567,89', COMMA_DECIMAL_FORMAT)).toBe(1234567.89);
    });

    it('should parse two-letter suffixes with comma decimal', () => {
      expect(parseShorthandNumber('4,96aa', COMMA_DECIMAL_FORMAT)).toBeCloseTo(4.96e36, -34);
      expect(parseShorthandNumber('2,5ab', COMMA_DECIMAL_FORMAT)).toBeCloseTo(2.5e39, -37);
    });

    it('should handle currency with comma decimal', () => {
      expect(parseShorthandNumber('$3,74B', COMMA_DECIMAL_FORMAT)).toBe(3.74e9);
      expect(parseShorthandNumber('$5,02M', COMMA_DECIMAL_FORMAT)).toBe(5.02e6);
    });

    it('should parse whole numbers without decimal', () => {
      expect(parseShorthandNumber('100K', COMMA_DECIMAL_FORMAT)).toBe(100e3);
      expect(parseShorthandNumber('50M', COMMA_DECIMAL_FORMAT)).toBe(50e6);
    });

    it('should parse x multiplier with comma decimal', () => {
      expect(parseShorthandNumber('x0,00', COMMA_DECIMAL_FORMAT)).toBe(0);
      expect(parseShorthandNumber('x2,5', COMMA_DECIMAL_FORMAT)).toBe(2.5);
    });
  });

  describe('formatLargeNumber with comma-decimal display locale', () => {
    beforeEach(() => {
      __setStateForTesting({
        importFormat: COMMA_DECIMAL_FORMAT,
        displayLocale: 'de-DE',
      });
    });

    afterEach(() => {
      __resetForTesting();
    });

    it('should format with comma as decimal separator', () => {
      expect(formatLargeNumber(43.91e12)).toBe('43,9T');
      expect(formatLargeNumber(1.5e6)).toBe('1,5M');
      expect(formatLargeNumber(248.55e3)).toBe('248,6K');
    });

    it('should format small numbers without separator', () => {
      expect(formatLargeNumber(123)).toBe('123');
      expect(formatLargeNumber(999)).toBe('999');
    });

    it('should format two-letter suffixes with comma decimal', () => {
      expect(formatLargeNumber(1e36)).toBe('1aa');
      expect(formatLargeNumber(2.5e39)).toBe('2,5ab');
    });

    it('should format negative numbers with comma decimal', () => {
      expect(formatLargeNumber(-1.5e6)).toBe('-1,5M');
      expect(formatLargeNumber(-2.3e9)).toBe('-2,3B');
    });
  });

  describe('round-trip with comma-decimal format', () => {
    beforeEach(() => {
      __setStateForTesting({
        importFormat: COMMA_DECIMAL_FORMAT,
        displayLocale: 'de-DE',
      });
    });

    afterEach(() => {
      __resetForTesting();
    });

    it('should accurately round-trip comma-decimal values', () => {
      const testCases = ['1,5K', '43,91T', '248,55M', '3,79B'];

      testCases.forEach((input) => {
        const parsed = parseShorthandNumber(input, COMMA_DECIMAL_FORMAT);
        const formatted = formatLargeNumber(parsed);
        const reparsed = parseShorthandNumber(formatted, COMMA_DECIMAL_FORMAT);

        expect(Math.abs(parsed - reparsed) / parsed).toBeLessThan(0.01);
      });
    });
  });

  describe('real-world EU data examples', () => {
    it('should parse EU format game data correctly', () => {
      expect(parseShorthandNumber('43,91T', COMMA_DECIMAL_FORMAT)).toBe(43.91e12);
      expect(parseShorthandNumber('3,79T', COMMA_DECIMAL_FORMAT)).toBe(3.79e12);
      expect(parseShorthandNumber('$3,74B', COMMA_DECIMAL_FORMAT)).toBe(3.74e9);
      expect(parseShorthandNumber('$5,02M', COMMA_DECIMAL_FORMAT)).toBe(5.02e6);
      expect(parseShorthandNumber('248,55K', COMMA_DECIMAL_FORMAT)).toBe(248.55e3);
      expect(parseShorthandNumber('21,49K', COMMA_DECIMAL_FORMAT)).toBe(21.49e3);
      expect(parseShorthandNumber('4,96aa', COMMA_DECIMAL_FORMAT)).toBeCloseTo(4.96e36, -34);
      expect(parseShorthandNumber('35,38q', COMMA_DECIMAL_FORMAT)).toBeCloseTo(35.38e15, -13);
      expect(parseShorthandNumber('1,76Q', COMMA_DECIMAL_FORMAT)).toBeCloseTo(1.76e18, -16);
      expect(parseShorthandNumber('x0,00', COMMA_DECIMAL_FORMAT)).toBe(0);
    });
  });
});

describe('formatLargeNumber with explicit format override', () => {
  describe('CANONICAL_STORAGE_FORMAT (US period-decimal)', () => {
    it('should format with period as decimal separator', () => {
      expect(formatLargeNumber(43.91e12, CANONICAL_STORAGE_FORMAT)).toBe('43.9T');
      expect(formatLargeNumber(1.5e6, CANONICAL_STORAGE_FORMAT)).toBe('1.5M');
      expect(formatLargeNumber(248.55e3, CANONICAL_STORAGE_FORMAT)).toBe('248.6K');
      expect(formatLargeNumber(3.79e9, CANONICAL_STORAGE_FORMAT)).toBe('3.8B');
    });

    it('should format whole numbers without trailing .0', () => {
      expect(formatLargeNumber(1e12, CANONICAL_STORAGE_FORMAT)).toBe('1T');
      expect(formatLargeNumber(2e6, CANONICAL_STORAGE_FORMAT)).toBe('2M');
      expect(formatLargeNumber(100e3, CANONICAL_STORAGE_FORMAT)).toBe('100K');
    });

    it('should format small numbers as plain integers', () => {
      expect(formatLargeNumber(123, CANONICAL_STORAGE_FORMAT)).toBe('123');
      expect(formatLargeNumber(999, CANONICAL_STORAGE_FORMAT)).toBe('999');
      expect(formatLargeNumber(0, CANONICAL_STORAGE_FORMAT)).toBe('0');
    });

    it('should format two-letter suffixes', () => {
      expect(formatLargeNumber(1e36, CANONICAL_STORAGE_FORMAT)).toBe('1aa');
      expect(formatLargeNumber(2.5e39, CANONICAL_STORAGE_FORMAT)).toBe('2.5ab');
    });

    it('should format negative numbers', () => {
      expect(formatLargeNumber(-1.5e6, CANONICAL_STORAGE_FORMAT)).toBe('-1.5M');
      expect(formatLargeNumber(-2.3e9, CANONICAL_STORAGE_FORMAT)).toBe('-2.3B');
    });
  });

  describe('comma-decimal format (Italian style)', () => {
    it('should format with comma as decimal separator', () => {
      expect(formatLargeNumber(43.91e12, COMMA_DECIMAL_FORMAT)).toBe('43,9T');
      expect(formatLargeNumber(1.5e6, COMMA_DECIMAL_FORMAT)).toBe('1,5M');
      expect(formatLargeNumber(248.55e3, COMMA_DECIMAL_FORMAT)).toBe('248,6K');
      expect(formatLargeNumber(3.79e9, COMMA_DECIMAL_FORMAT)).toBe('3,8B');
    });

    it('should format whole numbers without trailing ,0', () => {
      expect(formatLargeNumber(1e12, COMMA_DECIMAL_FORMAT)).toBe('1T');
      expect(formatLargeNumber(2e6, COMMA_DECIMAL_FORMAT)).toBe('2M');
      expect(formatLargeNumber(100e3, COMMA_DECIMAL_FORMAT)).toBe('100K');
    });

    it('should format small numbers as plain integers', () => {
      expect(formatLargeNumber(123, COMMA_DECIMAL_FORMAT)).toBe('123');
      expect(formatLargeNumber(999, COMMA_DECIMAL_FORMAT)).toBe('999');
    });

    it('should format two-letter suffixes with comma decimal', () => {
      expect(formatLargeNumber(1e36, COMMA_DECIMAL_FORMAT)).toBe('1aa');
      expect(formatLargeNumber(2.5e39, COMMA_DECIMAL_FORMAT)).toBe('2,5ab');
    });

    it('should format negative numbers with comma decimal', () => {
      expect(formatLargeNumber(-1.5e6, COMMA_DECIMAL_FORMAT)).toBe('-1,5M');
      expect(formatLargeNumber(-2.3e9, COMMA_DECIMAL_FORMAT)).toBe('-2,3B');
    });
  });

  describe('format override vs display locale', () => {
    beforeEach(() => {
      __setStateForTesting({
        importFormat: COMMA_DECIMAL_FORMAT,
        displayLocale: 'de-DE',
      });
    });

    afterEach(() => {
      __resetForTesting();
    });

    it('should use explicit format regardless of display locale', () => {
      expect(formatLargeNumber(43.91e12, CANONICAL_STORAGE_FORMAT)).toBe('43.9T');
      expect(formatLargeNumber(1.5e6, CANONICAL_STORAGE_FORMAT)).toBe('1.5M');
    });

    it('should use display locale when no explicit format provided', () => {
      expect(formatLargeNumber(43.91e12)).toBe('43,9T');
      expect(formatLargeNumber(1.5e6)).toBe('1,5M');
    });
  });
});
