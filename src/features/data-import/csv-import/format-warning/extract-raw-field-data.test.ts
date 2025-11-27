import { describe, it, expect } from 'vitest';
import { extractRawFieldData } from './extract-raw-field-data';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

describe('extractRawFieldData', () => {
  it('should extract raw values from parsed game run fields', () => {
    const mockRun: ParsedGameRun = {
      id: 'test-1',
      timestamp: new Date('2025-11-26T22:28:00'),
      fields: {
        coinsEarned: {
          value: 43.91e12,
          rawValue: '43,91T',
          displayValue: '43,91T',
          originalKey: 'Coins earned',
          dataType: 'number',
        },
        battleDate: {
          value: new Date('2025-11-20T22:28:00'),
          rawValue: 'nov. 20, 2025 22:28',
          displayValue: 'Nov 20, 2025',
          originalKey: 'Battle Date',
          dataType: 'date',
        },
        tier: {
          value: 16,
          rawValue: '16',
          displayValue: '16',
          originalKey: 'Tier',
          dataType: 'number',
        },
      },
      tier: 16,
      wave: 5000,
      coinsEarned: 43.91e12,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
    };

    const result = extractRawFieldData(mockRun);

    expect(result['Coins earned']).toBe('43,91T');
    expect(result['Battle Date']).toBe('nov. 20, 2025 22:28');
    expect(result['Tier']).toBe('16');
  });

  it('should return empty object for run with no fields', () => {
    const mockRun: ParsedGameRun = {
      id: 'test-2',
      timestamp: new Date(),
      fields: {},
      tier: 1,
      wave: 100,
      coinsEarned: 0,
      cellsEarned: 0,
      realTime: 0,
      runType: 'farm',
    };

    const result = extractRawFieldData(mockRun);

    expect(result).toEqual({});
  });

  it('should preserve original key casing', () => {
    const mockRun: ParsedGameRun = {
      id: 'test-3',
      timestamp: new Date(),
      fields: {
        someField: {
          value: 100,
          rawValue: '100',
          displayValue: '100',
          originalKey: 'Some_Field_Name',
          dataType: 'number',
        },
      },
      tier: 1,
      wave: 100,
      coinsEarned: 0,
      cellsEarned: 0,
      realTime: 0,
      runType: 'farm',
    };

    const result = extractRawFieldData(mockRun);

    expect(result['Some_Field_Name']).toBe('100');
    expect(result['someField']).toBeUndefined();
  });
});
