import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractFieldNamesFromStorage,
  extractFieldNamesFromRuns,
  getAllKnownFields
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
      runType: 'farm',
      fields: {
        _date: {
          value: '2025-01-15',
          rawValue: '2025-01-15',
          displayValue: '2025-01-15',
          originalKey: '_Date',
          dataType: 'date'
        },
        tier: {
          value: 10,
          rawValue: '10',
          displayValue: '10',
          originalKey: 'Tier',
          dataType: 'number'
        },
        coinsEarned: {
          value: 50000,
          rawValue: '50K',
          displayValue: '50.00K',
          originalKey: 'Coins Earned',
          dataType: 'number'
        }
      }
    };

    const result = extractFieldNamesFromRuns([run]);

    expect(result.size).toBe(3);
    expect(result.has('_date')).toBe(true);
    expect(result.has('tier')).toBe(true);
    expect(result.has('coinsEarned')).toBe(true);
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
      runType: 'farm',
      fields: {
        tier: {
          value: 10,
          rawValue: '10',
          displayValue: '10',
          originalKey: 'Tier',
          dataType: 'number'
        },
        wave: {
          value: 1000,
          rawValue: '1000',
          displayValue: '1.00K',
          originalKey: 'Wave',
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
        tier: {
          value: 11,
          rawValue: '11',
          displayValue: '11',
          originalKey: 'Tier',
          dataType: 'number'
        },
        coinsEarned: {
          value: 60000,
          rawValue: '60K',
          displayValue: '60.00K',
          originalKey: 'Coins Earned',
          dataType: 'number'
        }
      }
    };

    const result = extractFieldNamesFromRuns([run1, run2]);

    expect(result.size).toBe(3);
    expect(result.has('tier')).toBe(true);
    expect(result.has('wave')).toBe(true);
    expect(result.has('coinsEarned')).toBe(true);
  });
});

describe('getAllKnownFields', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return only supported fields when no storage data', () => {
    const supportedFields = ['tier', 'wave', 'coinsEarned'];

    const result = getAllKnownFields(supportedFields);

    expect(result.size).toBe(3);
    expect(result.has('tier')).toBe(true);
    expect(result.has('wave')).toBe(true);
    expect(result.has('coinsEarned')).toBe(true);
  });

  it('should combine supported fields and storage fields', () => {
    const supportedFields = ['tier', 'wave'];
    const csvData = `_Date\t_Time\ttier\tcoinsEarned\tcustomField
2025-01-15\t14:30:00\t10\t50000\ttest`;
    localStorage.setItem('tower-tracking-csv-data', csvData);

    const result = getAllKnownFields(supportedFields);

    // Should have: tier, wave (from supported) + _Date, _Time, coinsEarned, customField (from storage)
    expect(result.size).toBe(6);
    expect(result.has('tier')).toBe(true);
    expect(result.has('wave')).toBe(true);
    expect(result.has('_Date')).toBe(true);
    expect(result.has('_Time')).toBe(true);
    expect(result.has('coinsEarned')).toBe(true);
    expect(result.has('customField')).toBe(true);
  });

  it('should deduplicate fields present in both sources', () => {
    const supportedFields = ['tier', 'wave', 'coinsEarned'];
    const csvData = `tier\twave\tnewField
10\t1000\ttest`;
    localStorage.setItem('tower-tracking-csv-data', csvData);

    const result = getAllKnownFields(supportedFields);

    // Should have: tier, wave, coinsEarned, newField (no duplicates)
    expect(result.size).toBe(4);
    expect(result.has('tier')).toBe(true);
    expect(result.has('wave')).toBe(true);
    expect(result.has('coinsEarned')).toBe(true);
    expect(result.has('newField')).toBe(true);
  });
});
