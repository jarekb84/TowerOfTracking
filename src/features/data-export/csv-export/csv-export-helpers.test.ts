import { describe, it, expect } from 'vitest';
import {
  getDelimiterDisplayString,
  getCopyButtonClassName,
  getDownloadButtonClassName,
  isExportDisabled,
  formatConflictExamples,
  getExportStatsDisplay,
  getCopyButtonText,
  getDownloadButtonText
} from './csv-export-helpers';
import type { CsvExportResult } from './csv-exporter';

describe('csv-export-helpers', () => {
  describe('getDelimiterDisplayString', () => {
    it('should return tab character for tab delimiter', () => {
      expect(getDelimiterDisplayString('tab', '')).toBe('\t');
    });

    it('should return comma for comma delimiter', () => {
      expect(getDelimiterDisplayString('comma', '')).toBe(',');
    });

    it('should return semicolon for semicolon delimiter', () => {
      expect(getDelimiterDisplayString('semicolon', '')).toBe(';');
    });

    it('should return custom delimiter when custom is selected', () => {
      expect(getDelimiterDisplayString('custom', '|')).toBe('|');
    });

    it('should return comma as default when custom is selected but no delimiter provided', () => {
      expect(getDelimiterDisplayString('custom', '')).toBe(',');
    });
  });

  describe('getCopyButtonClassName', () => {
    it('should return success classes when copySuccess is true', () => {
      const result = getCopyButtonClassName(true);
      expect(result).toContain('gap-2');
      expect(result).toContain('bg-emerald-600');
      expect(result).toContain('hover:bg-emerald-700');
    });

    it('should return basic classes when copySuccess is false', () => {
      const result = getCopyButtonClassName(false);
      expect(result).toBe('gap-2');
    });
  });

  describe('getDownloadButtonClassName', () => {
    it('should return success classes when downloadSuccess is true', () => {
      const result = getDownloadButtonClassName(true);
      expect(result).toContain('gap-2');
      expect(result).toContain('border-emerald-500');
      expect(result).toContain('text-emerald-200');
    });

    it('should return basic classes when downloadSuccess is false', () => {
      const result = getDownloadButtonClassName(false);
      expect(result).toBe('gap-2');
    });
  });

  describe('isExportDisabled', () => {
    it('should return true when run count is 0', () => {
      expect(isExportDisabled(0)).toBe(true);
    });

    it('should return false when run count is greater than 0', () => {
      expect(isExportDisabled(1)).toBe(false);
      expect(isExportDisabled(10)).toBe(false);
      expect(isExportDisabled(100)).toBe(false);
    });
  });

  describe('formatConflictExamples', () => {
    it('should format single value with quotes', () => {
      const values = ['value1'];
      expect(formatConflictExamples(values)).toBe('"value1"');
    });

    it('should format two values with quotes and comma', () => {
      const values = ['value1', 'value2'];
      expect(formatConflictExamples(values)).toBe('"value1", "value2"');
    });

    it('should truncate to default max examples (2) and add ellipsis', () => {
      const values = ['value1', 'value2', 'value3', 'value4'];
      expect(formatConflictExamples(values)).toBe('"value1", "value2"...');
    });

    it('should respect custom maxExamples parameter', () => {
      const values = ['value1', 'value2', 'value3', 'value4'];
      expect(formatConflictExamples(values, 3)).toBe('"value1", "value2", "value3"...');
    });

    it('should not add ellipsis when values equal maxExamples', () => {
      const values = ['value1', 'value2', 'value3'];
      expect(formatConflictExamples(values, 3)).toBe('"value1", "value2", "value3"');
    });

    it('should handle empty array', () => {
      expect(formatConflictExamples([])).toBe('');
    });

    it('should handle values with special characters', () => {
      const values = ['val"ue1', 'val,ue2'];
      expect(formatConflictExamples(values)).toBe('"val"ue1", "val,ue2"');
    });
  });

  describe('getExportStatsDisplay', () => {
    const mockExportResult: CsvExportResult = {
      csvContent: 'test',
      rowCount: 10,
      fieldCount: 5,
      conflicts: []
    };

    it('should return array of stats with tab delimiter', () => {
      const result = getExportStatsDisplay(mockExportResult, 'tab', '');
      expect(result).toEqual([
        { label: 'Rows', value: '10' },
        { label: 'Columns', value: '5' },
        { label: 'Delimiter', value: '"\t"' }
      ]);
    });

    it('should return array of stats with comma delimiter', () => {
      const result = getExportStatsDisplay(mockExportResult, 'comma', '');
      expect(result).toEqual([
        { label: 'Rows', value: '10' },
        { label: 'Columns', value: '5' },
        { label: 'Delimiter', value: '","' }
      ]);
    });

    it('should return array of stats with custom delimiter', () => {
      const result = getExportStatsDisplay(mockExportResult, 'custom', '|');
      expect(result).toEqual([
        { label: 'Rows', value: '10' },
        { label: 'Columns', value: '5' },
        { label: 'Delimiter', value: '"|"' }
      ]);
    });

    it('should handle large numbers', () => {
      const largeResult: CsvExportResult = {
        ...mockExportResult,
        rowCount: 10000,
        fieldCount: 100
      };
      const result = getExportStatsDisplay(largeResult, 'tab', '');
      expect(result[0].value).toBe('10000');
      expect(result[1].value).toBe('100');
    });
  });

  describe('getCopyButtonText', () => {
    it('should return "Copied!" when copySuccess is true', () => {
      expect(getCopyButtonText(true)).toBe('Copied!');
    });

    it('should return "Copy to Clipboard" when copySuccess is false', () => {
      expect(getCopyButtonText(false)).toBe('Copy to Clipboard');
    });
  });

  describe('getDownloadButtonText', () => {
    it('should return "Downloaded!" when downloadSuccess is true', () => {
      expect(getDownloadButtonText(true)).toBe('Downloaded!');
    });

    it('should return "Download File" when downloadSuccess is false', () => {
      expect(getDownloadButtonText(false)).toBe('Download File');
    });
  });
});