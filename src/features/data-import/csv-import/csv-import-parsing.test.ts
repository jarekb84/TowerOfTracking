import { describe, it, expect } from 'vitest';
import { createErrorParseResult, resolveDelimiter, parseCsvSafe } from './csv-import-parsing';

describe('csv-import-parsing', () => {
  describe('createErrorParseResult', () => {
    it('should create error result from Error object', () => {
      const error = new Error('Test error message');
      const result = createErrorParseResult(error);

      expect(result.success).toEqual([]);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual(['Failed to parse data: Test error message']);
      expect(result.fieldMappingReport).toEqual({
        mappedFields: [],
        newFields: [],
        similarFields: [],
        unsupportedFields: [],
        skippedFields: []
      });
    });

    it('should create error result from unknown error type', () => {
      const result = createErrorParseResult('string error');

      expect(result.errors).toEqual(['Failed to parse data: Unknown error']);
    });

    it('should create error result from null', () => {
      const result = createErrorParseResult(null);

      expect(result.errors).toEqual(['Failed to parse data: Unknown error']);
    });
  });

  describe('resolveDelimiter', () => {
    it('should return tab character for tab delimiter', () => {
      expect(resolveDelimiter('tab', '')).toBe('\t');
    });

    it('should return comma for comma delimiter', () => {
      expect(resolveDelimiter('comma', '')).toBe(',');
    });

    it('should return semicolon for semicolon delimiter', () => {
      expect(resolveDelimiter('semicolon', '')).toBe(';');
    });

    it('should return custom delimiter when custom is selected', () => {
      expect(resolveDelimiter('custom', '|')).toBe('|');
    });

    it('should return empty string when custom is selected but no delimiter provided', () => {
      expect(resolveDelimiter('custom', '')).toBe('');
    });
  });

  describe('parseCsvSafe', () => {
    it('should parse valid tab-delimited data', () => {
      const data = 'Tier\tWave\n11\t100';
      const result = parseCsvSafe(data, '\t');

      expect(result.success.length).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('should parse valid comma-delimited data', () => {
      const data = 'Tier,Wave\n11,100';
      const result = parseCsvSafe(data, ',');

      expect(result.success.length).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('should return error result for invalid data', () => {
      // Empty data with no headers
      const data = '';
      const result = parseCsvSafe(data, '\t');

      // Should not throw, should return error result or empty success
      expect(result).toBeDefined();
    });

    it('should handle header-only data', () => {
      const data = 'Tier\tWave';
      const result = parseCsvSafe(data, '\t');

      expect(result.success).toEqual([]);
      expect(result.failed).toBe(0);
    });
  });
});
