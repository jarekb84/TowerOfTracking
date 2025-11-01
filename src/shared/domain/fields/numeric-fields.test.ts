import { describe, it, expect } from 'vitest';
import {
  extractNumericFieldNames,
  getFieldDataType
} from './field-discovery';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

describe('extractNumericFieldNames', () => {
  it('should return empty array for empty runs', () => {
    const result = extractNumericFieldNames([]);
    expect(result).toEqual([]);
  });

  it('should include cached numeric properties', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {}
    };

    const result = extractNumericFieldNames([run]);

    expect(result).toContain('tier');
    expect(result).toContain('wave');
    expect(result).toContain('coinsEarned');
    expect(result).toContain('cellsEarned');
    expect(result).toContain('realTime');
  });

  it('should include dynamic fields with number dataType', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        damageDealt: {
          value: 100000,
          rawValue: '100K',
          displayValue: '100.00K',
          originalKey: 'Damage Dealt',
          dataType: 'number'
        },
        enemiesDefeated: {
          value: 500,
          rawValue: '500',
          displayValue: '500',
          originalKey: 'Enemies Defeated',
          dataType: 'number'
        }
      }
    };

    const result = extractNumericFieldNames([run]);

    expect(result).toContain('damageDealt');
    expect(result).toContain('enemiesDefeated');
  });

  it('should include dynamic fields with duration dataType', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        waveDuration: {
          value: 120,
          rawValue: '2m',
          displayValue: '2m 0s',
          originalKey: 'Wave Duration',
          dataType: 'duration'
        }
      }
    };

    const result = extractNumericFieldNames([run]);

    expect(result).toContain('waveDuration');
  });

  it('should exclude string fields', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        notes: {
          value: 'Test notes',
          rawValue: 'Test notes',
          displayValue: 'Test notes',
          originalKey: 'Notes',
          dataType: 'string'
        },
        damageDealt: {
          value: 100000,
          rawValue: '100K',
          displayValue: '100.00K',
          originalKey: 'Damage Dealt',
          dataType: 'number'
        }
      }
    };

    const result = extractNumericFieldNames([run]);

    expect(result).not.toContain('notes');
    expect(result).toContain('damageDealt');
  });

  it('should deduplicate fields across runs', () => {
    const run1: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        damageDealt: {
          value: 100000,
          rawValue: '100K',
          displayValue: '100.00K',
          originalKey: 'Damage Dealt',
          dataType: 'number'
        }
      }
    };

    const run2: ParsedGameRun = {
      id: '2',
      timestamp: new Date('2025-01-16'),
      tier: 11,
      wave: 1100,
      coinsEarned: 60000,
      cellsEarned: 1100,
      realTime: 3700,
      runType: 'farm',
      fields: {
        damageDealt: {
          value: 120000,
          rawValue: '120K',
          displayValue: '120.00K',
          originalKey: 'Damage Dealt',
          dataType: 'number'
        },
        enemiesDefeated: {
          value: 600,
          rawValue: '600',
          displayValue: '600',
          originalKey: 'Enemies Defeated',
          dataType: 'number'
        }
      }
    };

    const result = extractNumericFieldNames([run1, run2]);

    // Should not have duplicates
    const damageDealtCount = result.filter(f => f === 'damageDealt').length;
    expect(damageDealtCount).toBe(1);
    expect(result).toContain('damageDealt');
    expect(result).toContain('enemiesDefeated');
  });

  it('should return sorted array', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        zebra: {
          value: 1,
          rawValue: '1',
          displayValue: '1',
          originalKey: 'Zebra',
          dataType: 'number'
        },
        apple: {
          value: 2,
          rawValue: '2',
          displayValue: '2',
          originalKey: 'Apple',
          dataType: 'number'
        }
      }
    };

    const result = extractNumericFieldNames([run]);

    // Check if array is sorted
    const sortedResult = [...result].sort();
    expect(result).toEqual(sortedResult);
  });
});

describe('getFieldDataType', () => {
  it('should return "number" for cached numeric properties', () => {
    const runs: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {}
    }];

    expect(getFieldDataType(runs, 'tier')).toBe('number');
    expect(getFieldDataType(runs, 'wave')).toBe('number');
    expect(getFieldDataType(runs, 'coinsEarned')).toBe('number');
    expect(getFieldDataType(runs, 'cellsEarned')).toBe('number');
    expect(getFieldDataType(runs, 'realTime')).toBe('number');
  });

  it('should return dataType from dynamic fields', () => {
    const runs: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        damageDealt: {
          value: 100000,
          rawValue: '100K',
          displayValue: '100.00K',
          originalKey: 'Damage Dealt',
          dataType: 'number'
        },
        waveDuration: {
          value: 120,
          rawValue: '2m',
          displayValue: '2m 0s',
          originalKey: 'Wave Duration',
          dataType: 'duration'
        }
      }
    }];

    expect(getFieldDataType(runs, 'damageDealt')).toBe('number');
    expect(getFieldDataType(runs, 'waveDuration')).toBe('duration');
  });

  it('should return "number" for unknown fields', () => {
    const runs: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {}
    }];

    expect(getFieldDataType(runs, 'unknownField')).toBe('number');
  });

  it('should find field in later runs if not in first', () => {
    const runs: ParsedGameRun[] = [
      {
        id: '1',
        timestamp: new Date('2025-01-15'),
        tier: 10,
        wave: 1000,
        coinsEarned: 50000,
        cellsEarned: 1000,
        realTime: 3600,
        runType: 'farm',
        fields: {}
      },
      {
        id: '2',
        timestamp: new Date('2025-01-16'),
        tier: 11,
        wave: 1100,
        coinsEarned: 60000,
        cellsEarned: 1100,
        realTime: 3700,
        runType: 'farm',
        fields: {
          damageDealt: {
            value: 100000,
            rawValue: '100K',
            displayValue: '100.00K',
            originalKey: 'Damage Dealt',
            dataType: 'number'
          }
        }
      }
    ];

    expect(getFieldDataType(runs, 'damageDealt')).toBe('number');
  });
});
