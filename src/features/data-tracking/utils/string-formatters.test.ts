import { describe, it, expect } from 'vitest';
import { capitalizeFirst } from './string-formatters';

describe('string-formatters', () => {
  describe('capitalizeFirst', () => {
    it('should capitalize the first letter of a lowercase string', () => {
      expect(capitalizeFirst('farm')).toBe('Farm');
      expect(capitalizeFirst('tournament')).toBe('Tournament');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalizeFirst('Farm')).toBe('Farm');
      expect(capitalizeFirst('Tournament')).toBe('Tournament');
    });

    it('should handle empty string', () => {
      expect(capitalizeFirst('')).toBe('');
    });

    it('should handle single character strings', () => {
      expect(capitalizeFirst('a')).toBe('A');
      expect(capitalizeFirst('A')).toBe('A');
    });

    it('should handle strings with special characters', () => {
      expect(capitalizeFirst('test-mode')).toBe('Test-mode');
      expect(capitalizeFirst('test_mode')).toBe('Test_mode');
    });

    it('should handle strings with numbers', () => {
      expect(capitalizeFirst('5min')).toBe('5min');
      expect(capitalizeFirst('test123')).toBe('Test123');
    });
  });
});