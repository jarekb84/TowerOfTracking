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

    describe('date validation warnings', () => {
      it('should collect warning for empty battleDate', () => {
        const data = 'Battle Date\tTier\tWave\tReal Time\n\t12\t7639\t2h 30m';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        expect(result.dateWarnings).toBeDefined();
        expect(result.dateWarnings?.length).toBe(1);
        expect(result.dateWarnings?.[0].error.code).toBe('empty');
        expect(result.dateWarnings?.[0].rowNumber).toBe(1);
        expect(result.dateWarnings?.[0].context.tier).toBe(12);
        expect(result.dateWarnings?.[0].context.wave).toBe(7639);
      });

      it('should collect warning for invalid battleDate format', () => {
        const data = 'Battle Date\tTier\tWave\n14.10.2025\t12\t7639';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        expect(result.dateWarnings?.length).toBe(1);
        expect(result.dateWarnings?.[0].error.code).toBe('invalid-format');
        expect(result.dateWarnings?.[0].rawValue).toBe('14.10.2025');
      });

      it('should collect warning for invalid hour in battleDate', () => {
        const data = 'Battle Date\tTier\tWave\nOct 14, 2025 25:14\t12\t7639';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        expect(result.dateWarnings?.length).toBe(1);
        expect(result.dateWarnings?.[0].error.code).toBe('invalid-hour');
      });

      it('should collect warning for invalid minute in battleDate', () => {
        const data = 'Battle Date\tTier\tWave\nOct 14, 2025 13:65\t12\t7639';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        expect(result.dateWarnings?.length).toBe(1);
        expect(result.dateWarnings?.[0].error.code).toBe('invalid-minute');
      });

      it('should collect multiple warnings for mixed valid/invalid dates', () => {
        const data = [
          'Battle Date\tTier\tWave',
          'Oct 14, 2025 13:14\t12\t7639',    // valid
          '\t11\t5000',                        // empty - warning
          'Oct 15, 2025 25:00\t10\t3000',    // invalid hour - warning
          'Oct 16, 2025 10:30\t9\t2000'      // valid
        ].join('\n');
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(4);
        expect(result.dateWarnings?.length).toBe(2);

        // Check first warning (empty)
        expect(result.dateWarnings?.[0].rowNumber).toBe(2);
        expect(result.dateWarnings?.[0].error.code).toBe('empty');
        expect(result.dateWarnings?.[0].context.tier).toBe(11);

        // Check second warning (invalid hour)
        expect(result.dateWarnings?.[1].rowNumber).toBe(3);
        expect(result.dateWarnings?.[1].error.code).toBe('invalid-hour');
        expect(result.dateWarnings?.[1].context.tier).toBe(10);
      });

      it('should not have warnings when all dates are valid', () => {
        const data = 'Battle Date\tTier\tWave\nOct 14, 2025 13:14\t12\t7639';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        expect(result.dateWarnings).toBeUndefined();
      });

      it('should not have warnings when no battleDate column exists', () => {
        const data = 'Tier\tWave\n12\t7639';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        expect(result.dateWarnings).toBeUndefined();
      });

      it('should include duration in warning context when available', () => {
        const data = 'Battle Date\tTier\tWave\tReal Time\n\t12\t7639\t4h 32m 15s';
        const result = parseCsvSafe(data, '\t');

        expect(result.dateWarnings?.length).toBe(1);
        expect(result.dateWarnings?.[0].context.duration).toBe('4h 32m 15s');
      });

      it('should still warn about invalid battleDate when _Date and _Time columns exist', () => {
        // User-reported bug: when _Date/_Time exist, battleDate validation was being skipped
        const data = 'Battle Date\t_Date\t_Time\tTier\tWave\n\t2025-01-01\t00:00:00\t12\t7639';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        // Should preserve existing _date/_time
        const run = result.success[0];
        expect(run.fields[INTERNAL_FIELD_NAMES.DATE].rawValue).toBe('2025-01-01');
        expect(run.fields[INTERNAL_FIELD_NAMES.TIME].rawValue).toBe('00:00:00');
        // Should still generate warning for empty battleDate
        expect(result.dateWarnings?.length).toBe(1);
        expect(result.dateWarnings?.[0].error.code).toBe('empty');
      });

      it('should warn about invalid battleDate format even when _Date/_Time exist', () => {
        const data = 'Battle Date\t_Date\t_Time\tTier\tWave\n14.10.2025\t2025-01-01\t00:00:00\t12\t7639';
        const result = parseCsvSafe(data, '\t');

        expect(result.success.length).toBe(1);
        // Should preserve existing _date/_time
        const run = result.success[0];
        expect(run.fields[INTERNAL_FIELD_NAMES.DATE].rawValue).toBe('2025-01-01');
        expect(run.fields[INTERNAL_FIELD_NAMES.TIME].rawValue).toBe('00:00:00');
        // Should still generate warning for invalid format
        expect(result.dateWarnings?.length).toBe(1);
        expect(result.dateWarnings?.[0].error.code).toBe('invalid-format');
      });
    });
  });
});
