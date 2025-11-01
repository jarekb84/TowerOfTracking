import { describe, it, expect } from 'vitest';
import { 
  filterFieldTrends, 
  normalizeSearchTerm, 
  matchesFieldName, 
  isValidSearchTerm 
} from './field-filter';
import type { FieldTrendData } from '../types/game-run.types';

// Mock field trend data for testing
const mockFieldTrends: FieldTrendData[] = [
  {
    fieldName: 'cashEarned',
    displayName: 'Cash Earned',
    dataType: 'number',
    values: [1000, 1200, 1400],
    change: { absolute: 400, percent: 40, direction: 'up' },
    trendType: 'upward',
    significance: 'high'
  },
  {
    fieldName: 'coinsEarned',
    displayName: 'Coins Earned',
    dataType: 'number',
    values: [50, 55, 60],
    change: { absolute: 10, percent: 20, direction: 'up' },
    trendType: 'linear',
    significance: 'medium'
  },
  {
    fieldName: 'cellsEarned',
    displayName: 'Cells Earned',
    dataType: 'number',
    values: [25, 30, 35],
    change: { absolute: 10, percent: 40, direction: 'up' },
    trendType: 'upward',
    significance: 'high'
  },
  {
    fieldName: 'totalCoins',
    displayName: 'Total Coins',
    dataType: 'number',
    values: [100, 150, 200],
    change: { absolute: 100, percent: 100, direction: 'up' },
    trendType: 'linear',
    significance: 'high'
  },
  {
    fieldName: 'enemiesKilled',
    displayName: 'Enemies Killed',
    dataType: 'number',
    values: [800, 850, 900],
    change: { absolute: 100, percent: 12.5, direction: 'up' },
    trendType: 'linear',
    significance: 'medium'
  }
];

describe('normalizeSearchTerm', () => {
  it('should convert to lowercase', () => {
    expect(normalizeSearchTerm('EARNED')).toBe('earned');
  });

  it('should trim whitespace', () => {
    expect(normalizeSearchTerm('  earned  ')).toBe('earned');
  });

  it('should handle empty strings', () => {
    expect(normalizeSearchTerm('')).toBe('');
    expect(normalizeSearchTerm('   ')).toBe('');
  });
});

describe('isValidSearchTerm', () => {
  it('should return false for terms shorter than 2 characters', () => {
    expect(isValidSearchTerm('')).toBe(false);
    expect(isValidSearchTerm('a')).toBe(false);
    expect(isValidSearchTerm(' ')).toBe(false);
  });

  it('should return true for terms with 2 or more characters', () => {
    expect(isValidSearchTerm('ab')).toBe(true);
    expect(isValidSearchTerm('earned')).toBe(true);
    expect(isValidSearchTerm('  co  ')).toBe(true); // trims to "co"
  });
});

describe('matchesFieldName', () => {
  const mockTrend: FieldTrendData = {
    fieldName: 'cashEarned',
    displayName: 'Cash Earned',
    dataType: 'number',
    values: [1000, 1200],
    change: { absolute: 200, percent: 20, direction: 'up' },
    trendType: 'linear',
    significance: 'medium'
  };

  it('should match field name substring', () => {
    expect(matchesFieldName(mockTrend, 'cash')).toBe(true);
    expect(matchesFieldName(mockTrend, 'earned')).toBe(true);
    expect(matchesFieldName(mockTrend, 'ashea')).toBe(true); // partial match
  });

  it('should match display name substring', () => {
    expect(matchesFieldName(mockTrend, 'cash')).toBe(true);
    expect(matchesFieldName(mockTrend, 'earned')).toBe(true);
    expect(matchesFieldName(mockTrend, 'ash ear')).toBe(true); // matches "Cash Earned"
  });

  it('should be case-insensitive', () => {
    expect(matchesFieldName(mockTrend, 'CASH')).toBe(true);
    expect(matchesFieldName(mockTrend, 'Earned')).toBe(true);
    expect(matchesFieldName(mockTrend, 'CaSh')).toBe(true);
  });

  it('should not match non-existent substrings', () => {
    expect(matchesFieldName(mockTrend, 'coins')).toBe(false);
    expect(matchesFieldName(mockTrend, 'xyz')).toBe(false);
  });
});

describe('filterFieldTrends', () => {
  it('should return all trends for empty or short search terms', () => {
    expect(filterFieldTrends(mockFieldTrends, '')).toEqual(mockFieldTrends);
    expect(filterFieldTrends(mockFieldTrends, 'a')).toEqual(mockFieldTrends);
    expect(filterFieldTrends(mockFieldTrends, '  ')).toEqual(mockFieldTrends);
  });

  it('should filter trends by "earned" substring', () => {
    const filtered = filterFieldTrends(mockFieldTrends, 'earned');
    expect(filtered).toHaveLength(3);
    expect(filtered.map(t => t.fieldName)).toEqual([
      'cashEarned',
      'coinsEarned',
      'cellsEarned'
    ]);
  });

  it('should filter trends by "coin" substring', () => {
    const filtered = filterFieldTrends(mockFieldTrends, 'coin');
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.fieldName)).toEqual([
      'coinsEarned',
      'totalCoins'
    ]);
  });

  it('should handle case-insensitive search', () => {
    const filtered1 = filterFieldTrends(mockFieldTrends, 'EARNED');
    const filtered2 = filterFieldTrends(mockFieldTrends, 'earned');
    expect(filtered1).toEqual(filtered2);
  });

  it('should return empty array when no matches found', () => {
    const filtered = filterFieldTrends(mockFieldTrends, 'nonexistent');
    expect(filtered).toEqual([]);
  });

  it('should trim search terms', () => {
    const filtered1 = filterFieldTrends(mockFieldTrends, '  coin  ');
    const filtered2 = filterFieldTrends(mockFieldTrends, 'coin');
    expect(filtered1).toEqual(filtered2);
  });

  it('should match display names', () => {
    const filtered = filterFieldTrends(mockFieldTrends, 'enemies');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].fieldName).toBe('enemiesKilled');
  });
});