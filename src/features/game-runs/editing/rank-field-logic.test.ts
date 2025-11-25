import { describe, it, expect } from 'vitest';
import type { GameRunField } from '@/shared/types/game-run.types';
import { createUpdatedRankFields, extractRankValue } from './field-update-logic';

describe('rank-field-logic', () => {
  describe('createUpdatedRankFields', () => {
    it('should update existing rank field with numeric value', () => {
      const currentFields: Record<string, GameRunField> = {
        _rank: {
          value: '5',
          rawValue: '5',
          displayValue: '5',
          originalKey: '_rank',
          dataType: 'string',
        },
        tier: {
          value: 11,
          rawValue: '11',
          displayValue: '11',
          originalKey: 'Tier',
          dataType: 'number',
        },
      };

      const result = createUpdatedRankFields(currentFields, 3);

      expect(result._rank).toEqual({
        value: '3',
        rawValue: '3',
        displayValue: '3',
        originalKey: '_rank',
        dataType: 'string',
      });
      expect(result.tier).toEqual(currentFields.tier);
    });

    it('should create rank field if it does not exist', () => {
      const currentFields: Record<string, GameRunField> = {
        tier: {
          value: 11,
          rawValue: '11',
          displayValue: '11',
          originalKey: 'Tier',
          dataType: 'number',
        },
      };

      const result = createUpdatedRankFields(currentFields, 7);

      expect(result._rank).toEqual({
        value: '7',
        rawValue: '7',
        displayValue: '7',
        originalKey: '_rank',
        dataType: 'string',
      });
      expect(result.tier).toEqual(currentFields.tier);
    });

    it('should remove rank field when value is empty string', () => {
      const currentFields: Record<string, GameRunField> = {
        _rank: {
          value: '5',
          rawValue: '5',
          displayValue: '5',
          originalKey: '_rank',
          dataType: 'string',
        },
        tier: {
          value: 11,
          rawValue: '11',
          displayValue: '11',
          originalKey: 'Tier',
          dataType: 'number',
        },
      };

      const result = createUpdatedRankFields(currentFields, '');

      expect(result._rank).toBeUndefined();
      expect(result.tier).toEqual(currentFields.tier);
    });

    it('should handle all valid rank values 1-30', () => {
      const currentFields: Record<string, GameRunField> = {};

      const result1 = createUpdatedRankFields(currentFields, 1);
      expect(result1._rank?.value).toBe('1');

      const result15 = createUpdatedRankFields(currentFields, 15);
      expect(result15._rank?.value).toBe('15');

      const result30 = createUpdatedRankFields(currentFields, 30);
      expect(result30._rank?.value).toBe('30');
    });
  });

  describe('extractRankValue', () => {
    it('should extract rank number from fields', () => {
      const fields: Record<string, GameRunField> = {
        _rank: {
          value: '5',
          rawValue: '5',
          displayValue: '5',
          originalKey: '_rank',
          dataType: 'string',
        },
      };

      const result = extractRankValue(fields);

      expect(result).toBe(5);
    });

    it('should return empty string when rank field does not exist', () => {
      const fields: Record<string, GameRunField> = {};

      const result = extractRankValue(fields);

      expect(result).toBe('');
    });

    it('should return empty string when rank displayValue is empty', () => {
      const fields: Record<string, GameRunField> = {
        _rank: {
          value: '',
          rawValue: '',
          displayValue: '',
          originalKey: '_rank',
          dataType: 'string',
        },
      };

      const result = extractRankValue(fields);

      expect(result).toBe('');
    });

    it('should return empty string when rank displayValue is whitespace only', () => {
      const fields: Record<string, GameRunField> = {
        _rank: {
          value: '   ',
          rawValue: '   ',
          displayValue: '   ',
          originalKey: '_rank',
          dataType: 'string',
        },
      };

      const result = extractRankValue(fields);

      expect(result).toBe('');
    });

    it('should return empty string for invalid numeric values', () => {
      const fields: Record<string, GameRunField> = {
        _rank: {
          value: 'not a number',
          rawValue: 'not a number',
          displayValue: 'not a number',
          originalKey: '_rank',
          dataType: 'string',
        },
      };

      const result = extractRankValue(fields);

      expect(result).toBe('');
    });

    it('should parse valid rank values correctly', () => {
      const createRankField = (value: string): Record<string, GameRunField> => ({
        _rank: {
          value,
          rawValue: value,
          displayValue: value,
          originalKey: '_rank',
          dataType: 'string',
        },
      });

      expect(extractRankValue(createRankField('1'))).toBe(1);
      expect(extractRankValue(createRankField('15'))).toBe(15);
      expect(extractRankValue(createRankField('30'))).toBe(30);
    });
  });
});
