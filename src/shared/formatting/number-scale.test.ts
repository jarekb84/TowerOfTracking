import { describe, it, expect } from 'vitest';
import {
  parseShorthandNumber,
  formatLargeNumber
} from './number-scale';

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
      expect(formatLargeNumber(1e36)).toBe('1.0aa');
      expect(formatLargeNumber(2.5e39)).toBe('2.5ab');
      expect(formatLargeNumber(3.7e42)).toBe('3.7ac');
      expect(formatLargeNumber(1e45)).toBe('1.0ad');
      expect(formatLargeNumber(1e48)).toBe('1.0ae');
      expect(formatLargeNumber(1e51)).toBe('1.0af');
      expect(formatLargeNumber(1e54)).toBe('1.0ag');
      expect(formatLargeNumber(1e57)).toBe('1.0ah');
      expect(formatLargeNumber(1e60)).toBe('1.0ai');
      expect(formatLargeNumber(1e63)).toBe('1.0aj');
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
      expect(formatLargeNumber(-1_000)).toBe('-1.0K');
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
