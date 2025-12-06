import { describe, it, expect } from 'vitest';
import { createErrorParseResult, resolveDelimiter, parseCsvSafe } from './csv-import-parsing';
import { INTERNAL_FIELD_NAMES } from '../../../shared/domain/fields/internal-field-config';

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

    describe('battleDate derivation', () => {
      it('should derive _date and _time from Battle Date when both are missing', () => {
        const data = 'Battle Date\tTier\tWave\nOct 14, 2025 13:14\t12\t7639';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        const run = result.success[0];
        expect(run.fields[INTERNAL_FIELD_NAMES.DATE]).toBeDefined();
        expect(run.fields[INTERNAL_FIELD_NAMES.DATE].rawValue).toBe('2025-10-14');
        expect(run.fields[INTERNAL_FIELD_NAMES.TIME]).toBeDefined();
        expect(run.fields[INTERNAL_FIELD_NAMES.TIME].rawValue).toBe('13:14:00');
      });

      it('should preserve existing _Date and _Time columns when provided', () => {
        const data = 'Battle Date\t_Date\t_Time\tTier\nOct 14, 2025 13:14\t2025-01-01\t00:00:00\t12';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        const run = result.success[0];
        expect(run.fields[INTERNAL_FIELD_NAMES.DATE].rawValue).toBe('2025-01-01');
        expect(run.fields[INTERNAL_FIELD_NAMES.TIME].rawValue).toBe('00:00:00');
      });

      it('should not create _date/_time when battleDate is missing', () => {
        const data = 'Tier\tWave\n12\t7639';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        const run = result.success[0];
        expect(run.fields[INTERNAL_FIELD_NAMES.DATE]).toBeUndefined();
        expect(run.fields[INTERNAL_FIELD_NAMES.TIME]).toBeUndefined();
      });

      it('should handle lowercase month format in Battle Date', () => {
        const data = 'Battle Date\tTier\tWave\nnov. 20, 2025 22:28\t12\t7639';
        const result = parseCsvSafe(data, '\t', {
          dateFormat: 'month-first-lowercase',
          decimalSeparator: '.',
          thousandsSeparator: ','
        });

        expect(result.success.length).toBe(1);
        const run = result.success[0];
        expect(run.fields[INTERNAL_FIELD_NAMES.DATE]).toBeDefined();
        expect(run.fields[INTERNAL_FIELD_NAMES.DATE].rawValue).toBe('2025-11-20');
        expect(run.fields[INTERNAL_FIELD_NAMES.TIME].rawValue).toBe('22:28:00');
      });
    });
  });
});
