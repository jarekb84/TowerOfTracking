/**
 * Tests for Source Extraction Logic
 */

import { describe, it, expect } from 'vitest';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type { CategoryDefinition } from '../types';
import {
  extractFieldValue,
  extractSourceValues,
  calculateRunTotal,
  sumSourceValues,
  calculatePercentage,
  filterNonZeroSources,
  sortSourcesByPercentage,
  sortByPercentageDescending,
  hasSourceData,
} from './source-extraction';

// Test fixtures
function createMockRun(fields: Record<string, number>): ParsedGameRun {
  const runFields: Record<string, { value: number; rawValue: string; displayValue: string; originalKey: string; dataType: 'number' }> = {};

  for (const [key, value] of Object.entries(fields)) {
    runFields[key] = {
      value,
      rawValue: String(value),
      displayValue: String(value),
      originalKey: key,
      dataType: 'number'
    };
  }

  return {
    id: 'test-run-1',
    timestamp: new Date('2024-01-15'),
    fields: runFields,
    tier: 11,
    wave: 1000,
    coinsEarned: 100000,
    cellsEarned: 50,
    realTime: 3600,
    gameSpeed: 2.0,
    runType: 'farm'
  };
}

const mockCategory: CategoryDefinition = {
  id: 'damageDealt',
  name: 'Damage Dealt',
  description: 'Test category',
  totalField: 'damageDealt',
  sources: [
    { fieldName: 'orbDamage', displayName: 'Orb Damage', color: '#f97316' },
    { fieldName: 'thornDamage', displayName: 'Thorn Damage', color: '#84cc16' },
    { fieldName: 'deathRayDamage', displayName: 'Death Ray', color: '#ef4444' },
  ]
};

describe('extractFieldValue', () => {
  it('extracts value from existing field', () => {
    const run = createMockRun({ orbDamage: 1000 });
    expect(extractFieldValue(run, 'orbDamage')).toBe(1000);
  });

  it('returns 0 for missing field', () => {
    const run = createMockRun({});
    expect(extractFieldValue(run, 'orbDamage')).toBe(0);
  });

  it('uses field alias when primary field is missing', () => {
    const run = createMockRun({ coinsFromBlackhole: 5000 });
    expect(extractFieldValue(run, 'coinsFromBlackHole')).toBe(5000);
  });

  it('prefers primary field over alias', () => {
    const run = createMockRun({
      coinsFromBlackHole: 1000,
      coinsFromBlackhole: 500
    });
    expect(extractFieldValue(run, 'coinsFromBlackHole')).toBe(1000);
  });
});

describe('calculatePercentage', () => {
  it('calculates correct percentage', () => {
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 1);
    expect(calculatePercentage(50, 200)).toBe(25);
  });

  it('returns 0 when total is 0', () => {
    expect(calculatePercentage(100, 0)).toBe(0);
  });

  it('returns 0 when value is 0', () => {
    expect(calculatePercentage(0, 100)).toBe(0);
  });

  it('handles very small percentages', () => {
    expect(calculatePercentage(1, 1000)).toBe(0.1);
    expect(calculatePercentage(3, 10000)).toBe(0.03);
  });
});

describe('sumSourceValues', () => {
  it('sums all source values from run', () => {
    const run = createMockRun({
      orbDamage: 1000,
      thornDamage: 500,
      deathRayDamage: 200
    });

    const sum = sumSourceValues(run, mockCategory.sources);
    expect(sum).toBe(1700);
  });

  it('handles missing sources gracefully', () => {
    const run = createMockRun({ orbDamage: 1000 });

    const sum = sumSourceValues(run, mockCategory.sources);
    expect(sum).toBe(1000);
  });

  it('returns 0 for empty run', () => {
    const run = createMockRun({});
    const sum = sumSourceValues(run, mockCategory.sources);
    expect(sum).toBe(0);
  });
});

describe('calculateRunTotal', () => {
  it('uses totalField when available', () => {
    const run = createMockRun({
      damageDealt: 5000,
      orbDamage: 1000,
      thornDamage: 500
    });

    const total = calculateRunTotal(run, mockCategory);
    expect(total).toBe(5000);
  });

  it('falls back to sum of sources when totalField is 0', () => {
    const run = createMockRun({
      orbDamage: 1000,
      thornDamage: 500,
      deathRayDamage: 200
    });

    const total = calculateRunTotal(run, mockCategory);
    expect(total).toBe(1700);
  });
});

describe('extractSourceValues', () => {
  it('extracts all source values with percentages', () => {
    const run = createMockRun({
      damageDealt: 1000,
      orbDamage: 500,
      thornDamage: 300,
      deathRayDamage: 200
    });

    const sources = extractSourceValues(run, mockCategory);

    expect(sources).toHaveLength(3);
    expect(sources[0]).toEqual({
      fieldName: 'orbDamage',
      displayName: 'Orb Damage',
      color: '#f97316',
      value: 500,
      percentage: 50
    });
    expect(sources[1]).toEqual({
      fieldName: 'thornDamage',
      displayName: 'Thorn Damage',
      color: '#84cc16',
      value: 300,
      percentage: 30
    });
    expect(sources[2]).toEqual({
      fieldName: 'deathRayDamage',
      displayName: 'Death Ray',
      color: '#ef4444',
      value: 200,
      percentage: 20
    });
  });

  it('handles missing sources with 0 values', () => {
    const run = createMockRun({
      damageDealt: 1000,
      orbDamage: 1000
    });

    const sources = extractSourceValues(run, mockCategory);

    expect(sources[0].value).toBe(1000);
    expect(sources[0].percentage).toBe(100);
    expect(sources[1].value).toBe(0);
    expect(sources[1].percentage).toBe(0);
  });
});

describe('filterNonZeroSources', () => {
  it('filters out sources with zero values', () => {
    const sources = [
      { fieldName: 'a', displayName: 'A', color: '#000', value: 100, percentage: 50 },
      { fieldName: 'b', displayName: 'B', color: '#000', value: 0, percentage: 0 },
      { fieldName: 'c', displayName: 'C', color: '#000', value: 100, percentage: 50 },
    ];

    const filtered = filterNonZeroSources(sources);

    expect(filtered).toHaveLength(2);
    expect(filtered.map(s => s.fieldName)).toEqual(['a', 'c']);
  });
});

describe('sortSourcesByPercentage', () => {
  it('sorts sources by percentage descending', () => {
    const sources = [
      { fieldName: 'a', displayName: 'A', color: '#000', value: 10, percentage: 10 },
      { fieldName: 'b', displayName: 'B', color: '#000', value: 50, percentage: 50 },
      { fieldName: 'c', displayName: 'C', color: '#000', value: 40, percentage: 40 },
    ];

    const sorted = sortSourcesByPercentage(sources);

    expect(sorted.map(s => s.fieldName)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate original array', () => {
    const sources = [
      { fieldName: 'a', displayName: 'A', color: '#000', value: 10, percentage: 10 },
      { fieldName: 'b', displayName: 'B', color: '#000', value: 50, percentage: 50 },
    ];

    sortSourcesByPercentage(sources);

    expect(sources[0].fieldName).toBe('a');
  });
});

describe('sortByPercentageDescending', () => {
  it('sorts any objects with percentage property descending', () => {
    const items = [
      { id: 'a', percentage: 10, extra: 'data' },
      { id: 'b', percentage: 50, extra: 'data' },
      { id: 'c', percentage: 30, extra: 'data' },
    ];

    const sorted = sortByPercentageDescending(items);

    expect(sorted.map(i => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('works with SourceSummaryValue-like objects', () => {
    const items = [
      { fieldName: 'x', displayName: 'X', color: '#fff', totalValue: 100, percentage: 25 },
      { fieldName: 'y', displayName: 'Y', color: '#fff', totalValue: 300, percentage: 75 },
    ];

    const sorted = sortByPercentageDescending(items);

    expect(sorted[0].fieldName).toBe('y');
    expect(sorted[1].fieldName).toBe('x');
  });

  it('does not mutate original array', () => {
    const items = [
      { id: 'a', percentage: 10 },
      { id: 'b', percentage: 50 },
    ];

    sortByPercentageDescending(items);

    expect(items[0].id).toBe('a');
  });

  it('handles empty array', () => {
    const sorted = sortByPercentageDescending([]);
    expect(sorted).toEqual([]);
  });

  it('handles single item array', () => {
    const items = [{ id: 'a', percentage: 50 }];
    const sorted = sortByPercentageDescending(items);
    expect(sorted).toEqual([{ id: 'a', percentage: 50 }]);
  });
});

describe('hasSourceData', () => {
  it('returns true when totalField has value', () => {
    const run = createMockRun({ damageDealt: 1000 });
    expect(hasSourceData(run, mockCategory)).toBe(true);
  });

  it('returns true when any source has value', () => {
    const run = createMockRun({ orbDamage: 100 });
    expect(hasSourceData(run, mockCategory)).toBe(true);
  });

  it('returns false when no data exists', () => {
    const run = createMockRun({});
    expect(hasSourceData(run, mockCategory)).toBe(false);
  });
});
