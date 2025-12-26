import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractFieldNamesFromStorage,
  extractFieldNamesFromRuns
} from './field-discovery';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

describe('extractFieldNamesFromStorage', () => {
  const DATA_KEY = 'tower-tracking-csv-data';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return empty set when no data in storage', () => {
    const result = extractFieldNamesFromStorage();
    expect(result.size).toBe(0);
  });

  it('should extract field names from CSV headers', () => {
    const csvData = `_Date\t_Time\ttier\twave\tcoinsEarned
2025-01-15\t14:30:00\t10\t1000\t50000`;
    localStorage.setItem(DATA_KEY, csvData);

    const result = extractFieldNamesFromStorage();

    expect(result.size).toBe(5);
    expect(result.has('_Date')).toBe(true);
    expect(result.has('_Time')).toBe(true);
    expect(result.has('tier')).toBe(true);
    expect(result.has('wave')).toBe(true);
    expect(result.has('coinsEarned')).toBe(true);
  });

  it('should handle CSV with quoted fields', () => {
    const csvData = `"_Date"\t"_Time"\t"tier"
"2025-01-15"\t"14:30:00"\t"10"`;
    localStorage.setItem(DATA_KEY, csvData);

    const result = extractFieldNamesFromStorage();

    expect(result.size).toBe(3);
    expect(result.has('_Date')).toBe(true);
    expect(result.has('tier')).toBe(true);
  });

  it('should handle CSV with extra whitespace', () => {
    const csvData = `  _Date  \t  tier  \t  wave
2025-01-15\t10\t1000`;
    localStorage.setItem(DATA_KEY, csvData);

    const result = extractFieldNamesFromStorage();

    expect(result.size).toBe(3);
    expect(result.has('_Date')).toBe(true);
    expect(result.has('tier')).toBe(true);
  });

  it('should handle empty CSV', () => {
    localStorage.setItem(DATA_KEY, '');

    const result = extractFieldNamesFromStorage();

    expect(result.size).toBe(0);
  });

  it('should handle malformed CSV gracefully', () => {
    localStorage.setItem(DATA_KEY, 'invalid\x00data\xff');

    const result = extractFieldNamesFromStorage();

    // Should not throw, might return something or empty
    expect(result).toBeInstanceOf(Set);
  });

  it('should return empty set on parse error', () => {
    // Mock localStorage to throw an error
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    const result = extractFieldNamesFromStorage();

    expect(result.size).toBe(0);
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
    vi.restoreAllMocks();
  });
});

describe('extractFieldNamesFromRuns', () => {
  it('should return empty set for empty runs array', () => {
    const result = extractFieldNamesFromRuns([]);
    expect(result.size).toBe(0);
  });

  it('should extract field names from single run', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
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
        },
        notes: {
          value: 'Test notes',
          rawValue: 'Test notes',
          displayValue: 'Test notes',
          originalKey: 'Notes',
          dataType: 'string'
        }
      }
    };

    const result = extractFieldNamesFromRuns([run]);

    expect(result.size).toBe(3);
    expect(result.has('damageDealt')).toBe(true);
    expect(result.has('waveDuration')).toBe(true);
    expect(result.has('notes')).toBe(true);
  });

  it('should extract unique field names from multiple runs', () => {
    const run1: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
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

    const run2: ParsedGameRun = {
      id: '2',
      timestamp: new Date('2025-01-16'),
      tier: 11,
      wave: 1100,
      coinsEarned: 60000,
      cellsEarned: 1100,
      realTime: 3700,
      gameSpeed: 2.0,
      runType: 'farm',
      fields: {
        damageDealt: {
          value: 120000,
          rawValue: '120K',
          displayValue: '120.00K',
          originalKey: 'Damage Dealt',
          dataType: 'number'
        },
        newField: {
          value: 'new',
          rawValue: 'new',
          displayValue: 'new',
          originalKey: 'New Field',
          dataType: 'string'
        }
      }
    };

    const result = extractFieldNamesFromRuns([run1, run2]);

    expect(result.size).toBe(3);
    expect(result.has('damageDealt')).toBe(true);
    expect(result.has('enemiesDefeated')).toBe(true);
    expect(result.has('newField')).toBe(true);
  });
});
