import { describe, it, expect } from 'vitest';
import { parseBattleDate } from './date-formatters';

/**
 * Tests for locale-aware date parsing functionality.
 * Covers lowercase month formats, French/German abbreviations, and regional variations.
 *
 * Split from date-formatters.test.ts to keep test files under 300 lines.
 */
describe('parseBattleDate - locale formats', () => {
  describe('lowercase month format support', () => {
    it('should parse lowercase month with period', () => {
      const result = parseBattleDate('nov. 20, 2025 22:28', 'month-first-lowercase');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(10); // November is month 10 (0-indexed)
      expect(result?.getDate()).toBe(20);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getHours()).toBe(22);
      expect(result?.getMinutes()).toBe(28);
    });

    it('should parse lowercase month without period', () => {
      const result = parseBattleDate('nov 20, 2025 22:28', 'month-first-lowercase');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(10);
    });

    it('should parse various lowercase month abbreviations', () => {
      const testCases = [
        { input: 'jan. 15, 2025 10:30', month: 0 },
        { input: 'feb. 20, 2025 14:45', month: 1 },
        { input: 'mar. 5, 2025 09:00', month: 2 },
        { input: 'dec. 25, 2025 12:00', month: 11 },
      ];

      testCases.forEach(({ input, month }) => {
        const result = parseBattleDate(input, 'month-first-lowercase');
        expect(result).toBeInstanceOf(Date);
        expect(result?.getMonth()).toBe(month);
      });
    });

    it('should return null for invalid lowercase format', () => {
      expect(parseBattleDate('xyz. 20, 2025 22:28', 'month-first-lowercase')).toBeNull();
    });

    it('should still parse capitalized format when using month-first format', () => {
      const result = parseBattleDate('Nov 20, 2025 22:28', 'month-first');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(10);
    });
  });

  describe('French month abbreviations', () => {
    it('should parse French month abbreviations', () => {
      const testCases = [
        { input: 'janv. 15, 2025 10:30', month: 0 },
        { input: 'févr. 20, 2025 14:45', month: 1 },
        { input: 'mars 5, 2025 09:00', month: 2 },
        { input: 'avr. 10, 2025 11:00', month: 3 },
        { input: 'mai 15, 2025 12:00', month: 4 },
        { input: 'juin 20, 2025 13:00', month: 5 },
        { input: 'juil. 25, 2025 14:00', month: 6 },
        { input: 'août 1, 2025 15:00', month: 7 },
        { input: 'sept. 5, 2025 16:00', month: 8 },
        { input: 'déc. 25, 2025 12:00', month: 11 },
      ];

      testCases.forEach(({ input, month }) => {
        const result = parseBattleDate(input, 'month-first-lowercase');
        expect(result).toBeInstanceOf(Date);
        expect(result?.getMonth()).toBe(month);
      });
    });
  });

  describe('German month abbreviations', () => {
    it('should parse German month abbreviations', () => {
      const testCases = [
        { input: 'jän. 15, 2025 10:30', month: 0 },
        { input: 'mär. 5, 2025 09:00', month: 2 },
        { input: 'okt. 14, 2025 13:14', month: 9 },
        { input: 'dez. 25, 2025 12:00', month: 11 },
      ];

      testCases.forEach(({ input, month }) => {
        const result = parseBattleDate(input, 'month-first-lowercase');
        expect(result).toBeInstanceOf(Date);
        expect(result?.getMonth()).toBe(month);
      });
    });
  });

  describe('real-world EU date examples', () => {
    it('should parse EU format from sample data', () => {
      // From regional-localization-example_2025-11-26.txt
      const result = parseBattleDate('nov. 20, 2025 22:28', 'month-first-lowercase');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(10);
      expect(result?.getDate()).toBe(20);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getHours()).toBe(22);
      expect(result?.getMinutes()).toBe(28);
    });
  });
});
