import { describe, it, expect } from 'vitest';
import { detectRunTypeFromFields, extractNumericStats, hasExplicitRunType } from './run-type-detection';
import { RunType } from '@/shared/types/game-run.types';
import type { GameRunField } from '@/shared/types/game-run.types';

describe('Run Type Detection', () => {
  describe('detectRunTypeFromFields', () => {
    it('should detect milestone from explicit run_type field', () => {
      const fields: Record<string, GameRunField> = {
        runType: {
          value: 'milestone',
          rawValue: 'milestone',
          displayValue: 'Milestone',
          originalKey: 'Run Type',
          dataType: 'string'
        }
      };

      const result = detectRunTypeFromFields(fields);
      expect(result).toBe(RunType.MILESTONE);
    });

    it('should detect tournament from explicit run_type field', () => {
      const fields: Record<string, GameRunField> = {
        runType: {
          value: 'tournament',
          rawValue: 'tournament',
          displayValue: 'Tournament',
          originalKey: 'Run Type',
          dataType: 'string'
        }
      };

      const result = detectRunTypeFromFields(fields);
      expect(result).toBe(RunType.TOURNAMENT);
    });

    it('should detect farm from explicit run_type field', () => {
      const fields: Record<string, GameRunField> = {
        runType: {
          value: 'farm',
          rawValue: 'farm',
          displayValue: 'Farm',
          originalKey: 'Run Type',
          dataType: 'string'
        }
      };

      const result = detectRunTypeFromFields(fields);
      expect(result).toBe(RunType.FARM);
    });

    it('should be case insensitive for explicit run_type field', () => {
      const fields: Record<string, GameRunField> = {
        runType: {
          value: 'MILESTONE',
          rawValue: 'MILESTONE',
          displayValue: 'MILESTONE',
          originalKey: 'Run Type',
          dataType: 'string'
        }
      };

      const result = detectRunTypeFromFields(fields);
      expect(result).toBe(RunType.MILESTONE);
    });

    it('should fallback to tier string detection when run_type is invalid', () => {
      const fields: Record<string, GameRunField> = {
        runType: {
          value: 'invalid',
          rawValue: 'invalid',
          displayValue: 'Invalid',
          originalKey: 'Run Type',
          dataType: 'string'
        },
        tier: {
          value: 10,
          rawValue: '10+',
          displayValue: 'Tier 10+',
          originalKey: 'Tier',
          dataType: 'number'
        }
      };

      const result = detectRunTypeFromFields(fields);
      expect(result).toBe(RunType.TOURNAMENT);
    });

    it('should detect tournament from tier string with + sign', () => {
      const fields: Record<string, GameRunField> = {
        tier: {
          value: 10,
          rawValue: '10+',
          displayValue: 'Tier 10+',
          originalKey: 'Tier',
          dataType: 'number'
        }
      };

      const result = detectRunTypeFromFields(fields);
      expect(result).toBe(RunType.TOURNAMENT);
    });

    it('should detect farm from tier string without + sign', () => {
      const fields: Record<string, GameRunField> = {
        tier: {
          value: 10,
          rawValue: '10',
          displayValue: 'Tier 10',
          originalKey: 'Tier',
          dataType: 'number'
        }
      };

      const result = detectRunTypeFromFields(fields);
      expect(result).toBe(RunType.FARM);
    });

    it('should default to farm when no tier field exists', () => {
      const fields: Record<string, GameRunField> = {};

      const result = detectRunTypeFromFields(fields);
      expect(result).toBe(RunType.FARM);
    });
  });

  describe('extractNumericStats', () => {
    it('should extract all numeric stats from fields', () => {
      const fields: Record<string, GameRunField> = {
        tier: {
          value: 15,
          rawValue: '15',
          displayValue: 'Tier 15',
          originalKey: 'Tier',
          dataType: 'number'
        },
        wave: {
          value: 5881,
          rawValue: '5881',
          displayValue: '5,881',
          originalKey: 'Wave',
          dataType: 'number'
        },
        coinsEarned: {
          value: 1130000000000,
          rawValue: '1.13T',
          displayValue: '1.13T',
          originalKey: 'Coins Earned',
          dataType: 'number'
        },
        cellsEarned: {
          value: 45200,
          rawValue: '45.2K',
          displayValue: '45.2K',
          originalKey: 'Cells Earned',
          dataType: 'number'
        },
        realTime: {
          value: 27966,
          rawValue: '7h 46m 6s',
          displayValue: '7h 46m 6s',
          originalKey: 'Real Time',
          dataType: 'number'
        }
      };

      const result = extractNumericStats(fields);
      expect(result).toEqual({
        tier: 15,
        wave: 5881,
        coinsEarned: 1130000000000,
        cellsEarned: 45200,
        realTime: 27966
      });
    });

    it('should use default values for missing fields', () => {
      const fields: Record<string, GameRunField> = {
        tier: {
          value: 5,
          rawValue: '5',
          displayValue: 'Tier 5',
          originalKey: 'Tier',
          dataType: 'number'
        }
      };

      const result = extractNumericStats(fields);
      expect(result).toEqual({
        tier: 5,
        wave: 0,
        coinsEarned: 0,
        cellsEarned: 0,
        realTime: 0
      });
    });

    it('should handle empty fields object', () => {
      const fields: Record<string, GameRunField> = {};

      const result = extractNumericStats(fields);
      expect(result).toEqual({
        tier: 0,
        wave: 0,
        coinsEarned: 0,
        cellsEarned: 0,
        realTime: 0
      });
    });
  });

  describe('hasExplicitRunType', () => {
    it('should return true when run_type field contains valid milestone value', () => {
      const fields: Record<string, GameRunField> = {
        runType: {
          value: 'milestone',
          rawValue: 'milestone',
          displayValue: 'Milestone',
          originalKey: 'Run Type',
          dataType: 'string'
        }
      };

      expect(hasExplicitRunType(fields)).toBe(true);
    });

    it('should return true when run_type field contains valid tournament value', () => {
      const fields: Record<string, GameRunField> = {
        runType: {
          value: 'tournament',
          rawValue: 'tournament',
          displayValue: 'Tournament',
          originalKey: 'Run Type',
          dataType: 'string'
        }
      };

      expect(hasExplicitRunType(fields)).toBe(true);
    });

    it('should return true when run_type field contains valid farm value', () => {
      const fields: Record<string, GameRunField> = {
        runType: {
          value: 'farm',
          rawValue: 'farm',
          displayValue: 'Farm',
          originalKey: 'Run Type',
          dataType: 'string'
        }
      };

      expect(hasExplicitRunType(fields)).toBe(true);
    });

    it('should be case insensitive', () => {
      const fields: Record<string, GameRunField> = {
        runType: {
          value: 'MILESTONE',
          rawValue: 'MILESTONE',
          displayValue: 'MILESTONE',
          originalKey: 'Run Type',
          dataType: 'string'
        }
      };

      expect(hasExplicitRunType(fields)).toBe(true);
    });

    it('should return false when run_type field is missing', () => {
      const fields: Record<string, GameRunField> = {
        tier: {
          value: 10,
          rawValue: '10+',
          displayValue: 'Tier 10+',
          originalKey: 'Tier',
          dataType: 'number'
        }
      };

      expect(hasExplicitRunType(fields)).toBe(false);
    });

    it('should return false when run_type field contains invalid value', () => {
      const fields: Record<string, GameRunField> = {
        runType: {
          value: 'invalid',
          rawValue: 'invalid',
          displayValue: 'Invalid',
          originalKey: 'Run Type',
          dataType: 'string'
        }
      };

      expect(hasExplicitRunType(fields)).toBe(false);
    });

    it('should return false when fields object is empty', () => {
      const fields: Record<string, GameRunField> = {};

      expect(hasExplicitRunType(fields)).toBe(false);
    });
  });
});