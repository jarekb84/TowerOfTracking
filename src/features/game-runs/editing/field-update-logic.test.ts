import { describe, it, expect } from 'vitest';
import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types';
import {
  createUpdatedNotesFields,
  createUpdatedRunTypeFields,
  extractNotesValue,
  extractRunTypeValue,
} from './field-update-logic';

describe('field-update-logic', () => {
  describe('createUpdatedNotesFields', () => {
    it('should update existing notes field', () => {
      const currentFields: Record<string, GameRunField> = {
        _notes: {
          value: 'old notes',
          rawValue: 'old notes',
          displayValue: 'old notes',
          originalKey: '_notes',
          dataType: 'string',
        },
        tier: {
          value: 5,
          rawValue: '5',
          displayValue: '5',
          originalKey: 'Tier',
          dataType: 'number',
        },
      };

      const result = createUpdatedNotesFields(currentFields, 'new notes');

      expect(result._notes).toEqual({
        value: 'new notes',
        rawValue: 'new notes',
        displayValue: 'new notes',
        originalKey: '_notes',
        dataType: 'string',
      });
      expect(result.tier).toEqual(currentFields.tier);
    });

    it('should create notes field if it does not exist', () => {
      const currentFields: Record<string, GameRunField> = {
        tier: {
          value: 5,
          rawValue: '5',
          displayValue: '5',
          originalKey: 'Tier',
          dataType: 'number',
        },
      };

      const result = createUpdatedNotesFields(currentFields, 'brand new notes');

      expect(result._notes).toEqual({
        value: 'brand new notes',
        rawValue: 'brand new notes',
        displayValue: 'brand new notes',
        originalKey: '_notes',
        dataType: 'string',
      });
      expect(result.tier).toEqual(currentFields.tier);
    });

    it('should handle empty notes', () => {
      const currentFields: Record<string, GameRunField> = {
        _notes: {
          value: 'some notes',
          rawValue: 'some notes',
          displayValue: 'some notes',
          originalKey: '_notes',
          dataType: 'string',
        },
      };

      const result = createUpdatedNotesFields(currentFields, '');

      expect(result._notes.value).toBe('');
      expect(result._notes.rawValue).toBe('');
      expect(result._notes.displayValue).toBe('');
    });
  });

  describe('createUpdatedRunTypeFields', () => {
    it('should update existing run type field', () => {
      const currentFields: Record<string, GameRunField> = {
        _runType: {
          value: 'farm',
          rawValue: 'farm',
          displayValue: 'farm',
          originalKey: '_runType',
          dataType: 'string',
        },
        tier: {
          value: 5,
          rawValue: '5',
          displayValue: '5',
          originalKey: 'Tier',
          dataType: 'number',
        },
      };

      const result = createUpdatedRunTypeFields(currentFields, 'tournament');

      expect(result._runType).toEqual({
        value: 'tournament',
        rawValue: 'tournament',
        displayValue: 'tournament',
        originalKey: '_runType',
        dataType: 'string',
      });
      expect(result.tier).toEqual(currentFields.tier);
    });

    it('should create run type field if it does not exist', () => {
      const currentFields: Record<string, GameRunField> = {
        tier: {
          value: 5,
          rawValue: '5',
          displayValue: '5',
          originalKey: 'Tier',
          dataType: 'number',
        },
      };

      const result = createUpdatedRunTypeFields(currentFields, 'milestone');

      expect(result._runType).toEqual({
        value: 'milestone',
        rawValue: 'milestone',
        displayValue: 'milestone',
        originalKey: '_runType',
        dataType: 'string',
      });
      expect(result.tier).toEqual(currentFields.tier);
    });

    it('should handle all run type values', () => {
      const currentFields: Record<string, GameRunField> = {};

      const farmResult = createUpdatedRunTypeFields(currentFields, 'farm');
      expect(farmResult._runType.value).toBe('farm');

      const tournamentResult = createUpdatedRunTypeFields(currentFields, 'tournament');
      expect(tournamentResult._runType.value).toBe('tournament');

      const milestoneResult = createUpdatedRunTypeFields(currentFields, 'milestone');
      expect(milestoneResult._runType.value).toBe('milestone');
    });
  });

  describe('extractNotesValue', () => {
    it('should extract notes from fields', () => {
      const fields: Record<string, GameRunField> = {
        _notes: {
          value: 'test notes',
          rawValue: 'test notes',
          displayValue: 'test notes',
          originalKey: '_notes',
          dataType: 'string',
        },
      };

      const result = extractNotesValue(fields);

      expect(result).toBe('test notes');
    });

    it('should return empty string when notes field does not exist', () => {
      const fields: Record<string, GameRunField> = {};

      const result = extractNotesValue(fields);

      expect(result).toBe('');
    });

    it('should return empty string when notes displayValue is undefined', () => {
      const fields: Record<string, GameRunField> = {
        _notes: {
          value: 'test',
          rawValue: 'test',
          displayValue: '',
          originalKey: '_notes',
          dataType: 'string',
        },
      };

      const result = extractNotesValue(fields);

      expect(result).toBe('');
    });
  });

  describe('extractRunTypeValue', () => {
    it('should extract run type from fields when available', () => {
      const run = {
        id: '1',
        timestamp: new Date(),
        fields: {
          _runType: {
            value: 'tournament',
            rawValue: 'tournament',
            displayValue: 'tournament',
            originalKey: '_runType',
            dataType: 'string' as const,
          },
        },
        tier: 5,
        wave: 10,
        coinsEarned: 1000,
        cellsEarned: 100,
        realTime: 3600,
        runType: 'farm' as const,
      } as ParsedGameRun;

      const result = extractRunTypeValue(run);

      expect(result).toBe('tournament');
    });

    it('should fallback to runType property when field not available', () => {
      const run = {
        id: '1',
        timestamp: new Date(),
        fields: {},
        tier: 5,
        wave: 10,
        coinsEarned: 1000,
        cellsEarned: 100,
        realTime: 3600,
        runType: 'farm' as const,
      } as ParsedGameRun;

      const result = extractRunTypeValue(run);

      expect(result).toBe('farm');
    });

    it('should handle all run type values', () => {
      const baseRun = {
        id: '1',
        timestamp: new Date(),
        fields: {},
        tier: 5,
        wave: 10,
        coinsEarned: 1000,
        cellsEarned: 100,
        realTime: 3600,
      };

      const farmRun = { ...baseRun, runType: 'farm' as const } as ParsedGameRun;
      expect(extractRunTypeValue(farmRun)).toBe('farm');

      const tournamentRun = { ...baseRun, runType: 'tournament' as const } as ParsedGameRun;
      expect(extractRunTypeValue(tournamentRun)).toBe('tournament');

      const milestoneRun = { ...baseRun, runType: 'milestone' as const } as ParsedGameRun;
      expect(extractRunTypeValue(milestoneRun)).toBe('milestone');
    });
  });
});
