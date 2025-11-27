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

// Test format configuration for comma-decimal locales (e.g., Germany, France)
const COMMA_DECIMAL_FORMAT: ImportFormatSettings = {
  decimalSeparator: ',',
  thousandsSeparator: '.',
  dateFormat: 'month-first',
};

describe('parseShorthandNumber', () => {
  describe('edge cases', () => {
    it('should return 0 for empty string', () => {
      expect(parseShorthandNumber('')).toBe(0);
    });

    it('should return 0 for null/undefined input', () => {
      expect(parseShorthandNumber(null as unknown as string)).toBe(0);
      expect(parseShorthandNumber(undefined as unknown as string)).toBe(0);
    });

    it('should return 0 for invalid formats', () => {
      expect(parseShorthandNumber('invalid')).toBe(0);
      expect(parseShorthandNumber('1.2.3')).toBe(0);
      expect(parseShorthandNumber('abc123')).toBe(0);
    });
  });

  describe('plain numbers', () => {
    it('should parse integer strings', () => {
      expect(parseShorthandNumber('123')).toBe(123);
      expect(parseShorthandNumber('0')).toBe(0);
      expect(parseShorthandNumber('999')).toBe(999);
    });

    it('should parse decimal strings', () => {
      expect(parseShorthandNumber('123.45')).toBe(123.45);
      expect(parseShorthandNumber('0.5')).toBe(0.5);
      expect(parseShorthandNumber('999.999')).toBe(999.999);
    });
  });

  describe('formatted numbers', () => {
    it('should handle currency symbols', () => {
      expect(parseShorthandNumber('$100')).toBe(100);
      expect(parseShorthandNumber('$1.5M')).toBe(1_500_000);
      expect(parseShorthandNumber('$2.3B')).toBe(2_300_000_000);
    });

    it('should handle commas', () => {
      expect(parseShorthandNumber('1,234')).toBe(1234);
      expect(parseShorthandNumber('1,234,567')).toBe(1_234_567);
      expect(parseShorthandNumber('$1,234.56')).toBe(1234.56);
    });

    it('should handle multiplier prefix', () => {
      expect(parseShorthandNumber('x8.00')).toBe(8);
      expect(parseShorthandNumber('x2.5')).toBe(2.5);
      expect(parseShorthandNumber('x100')).toBe(100);
    });
  });

  describe('scale suffixes', () => {
    it('should parse single-letter suffixes (K through D)', () => {
      expect(parseShorthandNumber('1K')).toBe(1e3);
      expect(parseShorthandNumber('1.5M')).toBe(1.5e6);
      expect(parseShorthandNumber('2.3B')).toBe(2.3e9);
      expect(parseShorthandNumber('2.5T')).toBe(2.5e12);
      expect(parseShorthandNumber('1q')).toBe(1e15); // lowercase
      expect(parseShorthandNumber('1Q')).toBe(1e18); // uppercase
      expect(parseShorthandNumber('1s')).toBe(1e21); // lowercase
      expect(parseShorthandNumber('1S')).toBe(1e24); // uppercase
      expect(parseShorthandNumber('1O')).toBe(1e27);
      expect(parseShorthandNumber('3.5N')).toBeCloseTo(3.5e30, -28);
      expect(parseShorthandNumber('7.2D')).toBeCloseTo(7.2e33, -31);
    });

    it('should parse two-letter suffixes (aa through aj)', () => {
      expect(parseShorthandNumber('1aa')).toBe(1e36);
      expect(parseShorthandNumber('2.5ab')).toBeCloseTo(2.5e39, -37);
      expect(parseShorthandNumber('3.7ac')).toBeCloseTo(3.7e42, -40);
      expect(parseShorthandNumber('1ad')).toBe(1e45);
      expect(parseShorthandNumber('1ae')).toBe(1e48);
      expect(parseShorthandNumber('1af')).toBe(1e51);
      expect(parseShorthandNumber('1ag')).toBe(1e54);
      expect(parseShorthandNumber('1ah')).toBe(1e57);
      expect(parseShorthandNumber('1ai')).toBe(1e60);
      expect(parseShorthandNumber('1aj')).toBe(1e63);
    });
  });

  describe('whitespace handling', () => {
    it('should handle spaces between number and suffix', () => {
      expect(parseShorthandNumber('1 K')).toBe(1_000);
      expect(parseShorthandNumber('2.5 M')).toBe(2_500_000);
      expect(parseShorthandNumber('10 B')).toBe(10_000_000_000);
    });

    it('should handle leading/trailing whitespace', () => {
      expect(parseShorthandNumber('  100K  ')).toBe(100_000);
      expect(parseShorthandNumber(' 1.5M ')).toBe(1_500_000);
    });
  });
});

describe('formatLargeNumber', () => {
  describe('small numbers (< 1000)', () => {
    it('should format as plain integers with no suffix', () => {
      expect(formatLargeNumber(0)).toBe('0');
      expect(formatLargeNumber(1)).toBe('1');
      expect(formatLargeNumber(999)).toBe('999');
    });

    it('should round decimal values', () => {
      expect(formatLargeNumber(123.4)).toBe('123');
      expect(formatLargeNumber(123.7)).toBe('124');
      expect(formatLargeNumber(0.1)).toBe('0');
      expect(formatLargeNumber(0.9)).toBe('1');
    });

    it('should handle negative small numbers', () => {
      expect(formatLargeNumber(-1)).toBe('-1');
      expect(formatLargeNumber(-999)).toBe('-999');
      expect(formatLargeNumber(-123.7)).toBe('-124');
    });
  });

  describe('large numbers (>= 1000)', () => {
    it('should format single-letter suffixes (K through D)', () => {
      expect(formatLargeNumber(1_500)).toBe('1.5K');
      expect(formatLargeNumber(2_500_000)).toBe('2.5M');
      expect(formatLargeNumber(3_700_000_000)).toBe('3.7B');
      expect(formatLargeNumber(2.5e12)).toBe('2.5T');
      expect(formatLargeNumber(2.3e15)).toBe('2.3q'); // lowercase
      expect(formatLargeNumber(3.7e18)).toBe('3.7Q'); // uppercase
      expect(formatLargeNumber(4.2e21)).toBe('4.2s'); // lowercase
      expect(formatLargeNumber(5.8e24)).toBe('5.8S'); // uppercase
      expect(formatLargeNumber(2.1e27)).toBe('2.1O');
      expect(formatLargeNumber(3.5e30)).toBe('3.5N');
      expect(formatLargeNumber(7.2e33)).toBe('7.2D');
    });

    it('should format two-letter suffixes (aa through aj)', () => {
      expect(formatLargeNumber(1e36)).toBe('1aa');
      expect(formatLargeNumber(2.5e39)).toBe('2.5ab');
      expect(formatLargeNumber(3.7e42)).toBe('3.7ac');
      expect(formatLargeNumber(1e45)).toBe('1ad');
      expect(formatLargeNumber(1e48)).toBe('1ae');
      expect(formatLargeNumber(1e51)).toBe('1af');
      expect(formatLargeNumber(1e54)).toBe('1ag');
      expect(formatLargeNumber(1e57)).toBe('1ah');
      expect(formatLargeNumber(1e60)).toBe('1ai');
      expect(formatLargeNumber(1e63)).toBe('1aj');
    });
  });

  describe('decimal precision', () => {
    it('should use 1 decimal place for formatted numbers', () => {
      expect(formatLargeNumber(1234)).toBe('1.2K');
      expect(formatLargeNumber(1567)).toBe('1.6K');
      expect(formatLargeNumber(1234567)).toBe('1.2M');
    });
  });

  describe('negative numbers', () => {
    it('should handle negative large numbers', () => {
      expect(formatLargeNumber(-1_000)).toBe('-1K');
      expect(formatLargeNumber(-1_500_000)).toBe('-1.5M');
      expect(formatLargeNumber(-2_300_000_000)).toBe('-2.3B');
    });
  });
});

describe('round-trip conversion', () => {
  it('should accurately round-trip parse and format operations', () => {
    const testCases = [
      '1K',
      '100K',
      '1.5M',
      '10.9M',
      '1B',
      '15.2B',
      '1T',
      '2.5T',
      '1q',
      '1Q',
      '1s',
      '1S',
      '1O',
      '1N',
      '1D',
      '1aa'
    ];

    testCases.forEach((input) => {
      const parsed = parseShorthandNumber(input);
      const formatted = formatLargeNumber(parsed);
      const reparsed = parseShorthandNumber(formatted);

      // Values should be equal within floating point precision
      expect(Math.abs(parsed - reparsed)).toBeLessThan(parsed * 0.01); // Within 1%
    });
  });
});

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
    // Set up German locale (uses comma as decimal separator) for these tests
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
      // Intl.NumberFormat doesn't add trailing zeros for whole numbers
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

        // Values should be equal within floating point precision
        expect(Math.abs(parsed - reparsed) / parsed).toBeLessThan(0.01); // Within 1%
      });
    });
  });

  describe('real-world EU data examples', () => {
    // These are actual values from the sample data file
    it('should parse EU format game data correctly', () => {
      // From regional-localization-example_2025-11-26.txt
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
