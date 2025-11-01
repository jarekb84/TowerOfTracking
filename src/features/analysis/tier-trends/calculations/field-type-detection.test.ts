import { describe, it, expect } from 'vitest';
import {
  isTrendableField,
  isTextCategoricalField,
  getExcludedTrendFields
} from './field-type-detection';
import type { GameRunField } from '@/features/data-tracking/types/game-run.types';

describe('field-type-detection', () => {
  describe('isTrendableField', () => {
    it('should return true for valid numerical fields', () => {
      const field: GameRunField = {
        value: 1000,
        rawValue: '1000',
        displayValue: '1,000',
        originalKey: 'Coins Earned',
        dataType: 'number'
      };

      expect(isTrendableField('coinsEarned', field)).toBe(true);
    });

    it('should return true for duration fields', () => {
      const field: GameRunField = {
        value: 3600000,
        rawValue: '1h',
        displayValue: '1h 0m 0s',
        originalKey: 'Real Time',
        dataType: 'duration'
      };

      expect(isTrendableField('realTime', field)).toBe(true);
    });

    it('should return false for string data type fields', () => {
      const field: GameRunField = {
        value: 'Some text',
        rawValue: 'Some text',
        displayValue: 'Some text',
        originalKey: 'Notes',
        dataType: 'string'
      };

      expect(isTrendableField('notes', field)).toBe(false);
    });

    it('should return false for internal string fields (_notes)', () => {
      const field: GameRunField = {
        value: 'Some notes',
        rawValue: 'Some notes',
        displayValue: 'Some notes',
        originalKey: '_Notes',
        dataType: 'string'
      };

      expect(isTrendableField('_notes', field)).toBe(false);
    });

    it('should return false for date data type fields', () => {
      const field: GameRunField = {
        value: new Date('2025-01-01'),
        rawValue: '2025-01-01',
        displayValue: '2025-01-01',
        originalKey: 'Date',
        dataType: 'date'
      };

      expect(isTrendableField('date', field)).toBe(false);
    });

    it('should return false for internal date fields (_date)', () => {
      const field: GameRunField = {
        value: new Date('2025-01-01'),
        rawValue: '2025-01-01',
        displayValue: '2025-01-01',
        originalKey: '_Date',
        dataType: 'date'
      };

      expect(isTrendableField('_date', field)).toBe(false);
    });

    it('should return false when value is not a number despite number dataType', () => {
      const field: GameRunField = {
        value: 'Not a number',
        rawValue: 'Not a number',
        displayValue: 'Not a number',
        originalKey: 'Invalid Field',
        dataType: 'number'
      };

      expect(isTrendableField('invalidField', field)).toBe(false);
    });

    it('should return false for run type field (_runType)', () => {
      const field: GameRunField = {
        value: 1,
        rawValue: 'farming',
        displayValue: 'Farming',
        originalKey: '_Run Type',
        dataType: 'number'
      };

      expect(isTrendableField('_runType', field)).toBe(false);
    });

    it('should return false for run type field (runType)', () => {
      const field: GameRunField = {
        value: 1,
        rawValue: 'farming',
        displayValue: 'Farming',
        originalKey: 'runType',
        dataType: 'number'
      };

      expect(isTrendableField('runType', field)).toBe(false);
    });

    it('should return false for run type field (run_type)', () => {
      const field: GameRunField = {
        value: 2,
        rawValue: 'tournament',
        displayValue: 'Tournament',
        originalKey: 'run_type',
        dataType: 'number'
      };

      expect(isTrendableField('run_type', field)).toBe(false);
    });

    it('should return false for run type field (Run Type)', () => {
      const field: GameRunField = {
        value: 1,
        rawValue: 'farming',
        displayValue: 'Farming',
        originalKey: 'Run Type',
        dataType: 'number'
      };

      expect(isTrendableField('Run Type', field)).toBe(false);
    });

    it('should return false for run type field (_Run Type)', () => {
      const field: GameRunField = {
        value: 1,
        rawValue: 'farming',
        displayValue: 'Farming',
        originalKey: '_Run Type',
        dataType: 'number'
      };

      expect(isTrendableField('_Run Type', field)).toBe(false);
    });

    it('should return false for "Killed By" field (exact match)', () => {
      const field: GameRunField = {
        value: 'Ranged',
        rawValue: 'Ranged',
        displayValue: 'Ranged',
        originalKey: 'Killed By',
        dataType: 'string'
      };

      expect(isTrendableField('Killed By', field)).toBe(false);
    });

    it('should return false for "killedBy" field (camelCase)', () => {
      const field: GameRunField = {
        value: 'Melee',
        rawValue: 'Melee',
        displayValue: 'Melee',
        originalKey: 'Killed By',
        dataType: 'string'
      };

      expect(isTrendableField('killedBy', field)).toBe(false);
    });

    it('should return false for "killed_by" field (snake_case)', () => {
      const field: GameRunField = {
        value: 'Boss',
        rawValue: 'Boss',
        displayValue: 'Boss',
        originalKey: 'Killed By',
        dataType: 'string'
      };

      expect(isTrendableField('killed_by', field)).toBe(false);
    });

    it('should return false for non-trend field "tier"', () => {
      const field: GameRunField = {
        value: 10,
        rawValue: '10',
        displayValue: '10',
        originalKey: 'tier',
        dataType: 'number'
      };

      expect(isTrendableField('tier', field)).toBe(false);
    });

    it('should return true for legitimate game stat fields', () => {
      const testFields = [
        { name: 'coinsEarned', originalKey: 'Coins Earned' },
        { name: 'cashEarned', originalKey: 'Cash Earned' },
        { name: 'wave', originalKey: 'Wave' },
        { name: 'damageTaken', originalKey: 'Damage Taken' },
        { name: 'damageDealt', originalKey: 'Damage Dealt' }
      ];

      testFields.forEach(({ name, originalKey }) => {
        const field: GameRunField = {
          value: 1000000,
          rawValue: '1M',
          displayValue: '1.00M',
          originalKey,
          dataType: 'number'
        };

        expect(isTrendableField(name, field)).toBe(true);
      });
    });

    it('should return true for internal numerical fields that are valid for trends', () => {
      // Hypothetical internal numerical field that should be included
      const field: GameRunField = {
        value: 1234,
        rawValue: '1234',
        displayValue: '1,234',
        originalKey: '_SomeInternalStat',
        dataType: 'number'
      };

      expect(isTrendableField('_someInternalStat', field)).toBe(true);
    });
  });

  describe('isTextCategoricalField', () => {
    it('should return true for known text game fields', () => {
      expect(isTextCategoricalField('killedBy')).toBe(true);
      expect(isTextCategoricalField('killed_by')).toBe(true);
      expect(isTextCategoricalField('Killed By')).toBe(true);
    });

    it('should return true for run type field variants', () => {
      expect(isTextCategoricalField('runType')).toBe(true);
      expect(isTextCategoricalField('run_type')).toBe(true);
      expect(isTextCategoricalField('Run Type')).toBe(true);
      expect(isTextCategoricalField('_runType')).toBe(true);
      expect(isTextCategoricalField('_Run Type')).toBe(true);
    });

    it('should return false for non-text game fields', () => {
      expect(isTextCategoricalField('coinsEarned')).toBe(false);
      expect(isTextCategoricalField('realTime')).toBe(false);
      expect(isTextCategoricalField('wave')).toBe(false);
    });
  });

  describe('getExcludedTrendFields', () => {
    it('should return a set containing all excluded field names', () => {
      const excludedFields = getExcludedTrendFields();

      // Text/categorical fields
      expect(excludedFields.has('killedBy')).toBe(true);
      expect(excludedFields.has('killed_by')).toBe(true);
      expect(excludedFields.has('Killed By')).toBe(true);
      expect(excludedFields.has('runType')).toBe(true);
      expect(excludedFields.has('run_type')).toBe(true);
      expect(excludedFields.has('Run Type')).toBe(true);
      expect(excludedFields.has('_runType')).toBe(true);
      expect(excludedFields.has('_Run Type')).toBe(true);

      // Non-trend fields
      expect(excludedFields.has('tier')).toBe(true);
    });

    it('should not contain valid trendable field names', () => {
      const excludedFields = getExcludedTrendFields();

      expect(excludedFields.has('coinsEarned')).toBe(false);
      expect(excludedFields.has('realTime')).toBe(false);
      expect(excludedFields.has('wave')).toBe(false);
      expect(excludedFields.has('damageTaken')).toBe(false);
    });

    it('should return a new Set instance each time', () => {
      const set1 = getExcludedTrendFields();
      const set2 = getExcludedTrendFields();

      expect(set1).not.toBe(set2);
      expect(set1).toEqual(set2);
    });
  });

  describe('edge cases', () => {
    it('should handle fields with zero values', () => {
      const field: GameRunField = {
        value: 0,
        rawValue: '0',
        displayValue: '0',
        originalKey: 'Coins Earned',
        dataType: 'number'
      };

      expect(isTrendableField('coinsEarned', field)).toBe(true);
    });

    it('should handle fields with negative values', () => {
      const field: GameRunField = {
        value: -100,
        rawValue: '-100',
        displayValue: '-100',
        originalKey: 'Some Stat',
        dataType: 'number'
      };

      expect(isTrendableField('someStat', field)).toBe(true);
    });

    it('should handle fields with very large values', () => {
      const field: GameRunField = {
        value: Number.MAX_SAFE_INTEGER,
        rawValue: String(Number.MAX_SAFE_INTEGER),
        displayValue: String(Number.MAX_SAFE_INTEGER),
        originalKey: 'Huge Number',
        dataType: 'number'
      };

      expect(isTrendableField('hugeNumber', field)).toBe(true);
    });

    it('should handle fields with decimal values', () => {
      const field: GameRunField = {
        value: 123.456,
        rawValue: '123.456',
        displayValue: '123.456',
        originalKey: 'Decimal Field',
        dataType: 'number'
      };

      expect(isTrendableField('decimalField', field)).toBe(true);
    });
  });
});
