/**
 * Tests for Source Sorting Functions
 *
 * Tests for sortSourceSummaryByPercentage and sortSourcesByValue functions
 * which provide stable sorting for source analysis data.
 */

import { describe, it, expect } from 'vitest';
import {
  sortSourceSummaryByPercentage,
  sortSourcesByValue,
} from './source-extraction';

describe('sortSourceSummaryByPercentage', () => {
  it('sorts by percentage descending', () => {
    const sources = [
      { fieldName: 'a', displayName: 'A', color: '#000', totalValue: 100, percentage: 10 },
      { fieldName: 'b', displayName: 'B', color: '#000', totalValue: 500, percentage: 50 },
      { fieldName: 'c', displayName: 'C', color: '#000', totalValue: 200, percentage: 20 },
    ];

    const sorted = sortSourceSummaryByPercentage(sources);

    expect(sorted.map(s => s.fieldName)).toEqual(['b', 'c', 'a']);
  });

  it('uses totalValue as tiebreaker when percentages are equal', () => {
    const sources = [
      { fieldName: 'a', displayName: 'A', color: '#000', totalValue: 1e21, percentage: 0 },  // 1 sextillion
      { fieldName: 'b', displayName: 'B', color: '#000', totalValue: 1e24, percentage: 0 },  // 1 septillion (larger)
      { fieldName: 'c', displayName: 'C', color: '#000', totalValue: 1e18, percentage: 0 },  // 1 quintillion
    ];

    const sorted = sortSourceSummaryByPercentage(sources);

    // Should be sorted by totalValue descending: b (1e24), a (1e21), c (1e18)
    expect(sorted.map(s => s.fieldName)).toEqual(['b', 'a', 'c']);
    expect(sorted.map(s => s.totalValue)).toEqual([1e24, 1e21, 1e18]);
  });

  it('handles mix of equal and different percentages', () => {
    const sources = [
      { fieldName: 'a', displayName: 'A', color: '#000', totalValue: 100, percentage: 0 },
      { fieldName: 'b', displayName: 'B', color: '#000', totalValue: 500, percentage: 5 },
      { fieldName: 'c', displayName: 'C', color: '#000', totalValue: 200, percentage: 0 },
      { fieldName: 'd', displayName: 'D', color: '#000', totalValue: 300, percentage: 5 },
    ];

    const sorted = sortSourceSummaryByPercentage(sources);

    // 5% items first (b=500 before d=300), then 0% items (c=200 before a=100)
    expect(sorted.map(s => s.fieldName)).toEqual(['b', 'd', 'c', 'a']);
    expect(sorted.map(s => s.totalValue)).toEqual([500, 300, 200, 100]);
  });

  it('does not mutate original array', () => {
    const sources = [
      { fieldName: 'a', displayName: 'A', color: '#000', totalValue: 100, percentage: 10 },
      { fieldName: 'b', displayName: 'B', color: '#000', totalValue: 500, percentage: 50 },
    ];

    sortSourceSummaryByPercentage(sources);

    expect(sources[0].fieldName).toBe('a');
  });

  it('handles empty array', () => {
    const sorted = sortSourceSummaryByPercentage([]);
    expect(sorted).toEqual([]);
  });
});

describe('sortSourcesByValue', () => {
  it('sorts by value descending', () => {
    const sources = [
      { fieldName: 'a', displayName: 'A', color: '#000', value: 10, percentage: 10 },
      { fieldName: 'b', displayName: 'B', color: '#000', value: 50, percentage: 50 },
      { fieldName: 'c', displayName: 'C', color: '#000', value: 30, percentage: 30 },
    ];

    const sorted = sortSourcesByValue(sources);

    expect(sorted.map(s => s.fieldName)).toEqual(['b', 'c', 'a']);
  });

  it('correctly sorts large numbers with different scales', () => {
    const sources = [
      { fieldName: 'a', displayName: 'A', color: '#000', value: 5.5e21, percentage: 0 },  // 5.5 sextillion
      { fieldName: 'b', displayName: 'B', color: '#000', value: 35.3e24, percentage: 0 }, // 35.3 septillion (largest)
      { fieldName: 'c', displayName: 'C', color: '#000', value: 460.1e24, percentage: 0 }, // 460.1 septillion (even larger)
    ];

    const sorted = sortSourcesByValue(sources);

    // c (460.1S) > b (35.3S) > a (5.5s)
    expect(sorted.map(s => s.fieldName)).toEqual(['c', 'b', 'a']);
  });

  it('does not mutate original array', () => {
    const sources = [
      { fieldName: 'a', displayName: 'A', color: '#000', value: 10, percentage: 10 },
      { fieldName: 'b', displayName: 'B', color: '#000', value: 50, percentage: 50 },
    ];

    sortSourcesByValue(sources);

    expect(sources[0].fieldName).toBe('a');
  });

  it('handles empty array', () => {
    const sorted = sortSourcesByValue([]);
    expect(sorted).toEqual([]);
  });
});
