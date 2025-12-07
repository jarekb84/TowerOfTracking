/* eslint-disable max-lines */
/**
 * Tests for Period Grouping Logic
 */

import { describe, it, expect } from 'vitest';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import type { CategoryDefinition, SourceAnalysisFilters } from '../types';
import { SourceDuration } from '../types';
import {
  groupRunsByPeriod,
  getPeriodKey,
  formatPeriodLabel,
  calculatePeriodBreakdown,
  calculateSummary,
  filterRuns,
  limitToPeriods,
  calculateSourceAnalysis,
} from './period-grouping';

// Test fixtures
function createMockRun(
  id: string,
  timestamp: Date,
  fields: Record<string, number>,
  tier = 11,
  runType: 'farm' | 'tournament' = 'farm'
): ParsedGameRun {
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
    id,
    timestamp,
    fields: runFields,
    tier,
    wave: 1000,
    coinsEarned: 100000,
    cellsEarned: 50,
    realTime: 3600,
    runType
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
  ]
};

describe('getPeriodKey', () => {
  const testDate = new Date('2024-03-15T14:30:00');

  it('returns ISO string for per-run', () => {
    const key = getPeriodKey(testDate, SourceDuration.PER_RUN);
    expect(key).toBe(testDate.toISOString());
  });

  it('returns YYYY-MM-DD for daily', () => {
    const key = getPeriodKey(testDate, SourceDuration.DAILY);
    expect(key).toBe('2024-03-15');
  });

  it('returns YYYY-MM-DD (Sunday date) for weekly', () => {
    // March 15, 2024 is a Friday; Sunday of that week is March 10
    const key = getPeriodKey(testDate, SourceDuration.WEEKLY);
    expect(key).toBe('2024-03-10');
  });

  it('returns YYYY-MM for monthly', () => {
    const key = getPeriodKey(testDate, SourceDuration.MONTHLY);
    expect(key).toBe('2024-03');
  });

  it('returns YYYY for yearly', () => {
    const key = getPeriodKey(testDate, SourceDuration.YEARLY);
    expect(key).toBe('2024');
  });
});

describe('formatPeriodLabel', () => {
  it('formats per-run label with run number', () => {
    const label = formatPeriodLabel('2024-03-15', SourceDuration.PER_RUN, 0, 5);
    expect(label).toBe('Run #5');
  });

  it('formats daily label', () => {
    const label = formatPeriodLabel('2024-03-15', SourceDuration.DAILY);
    expect(label).toBe('Mar 15');
  });

  it('formats weekly label with Sunday date', () => {
    // Key is now YYYY-MM-DD format (the Sunday date)
    const label = formatPeriodLabel('2024-03-10', SourceDuration.WEEKLY);
    expect(label).toBe('Mar 10');
  });

  it('formats monthly label', () => {
    const label = formatPeriodLabel('2024-03', SourceDuration.MONTHLY);
    expect(label).toMatch(/Mar.*24/);
  });

  it('formats yearly label', () => {
    const label = formatPeriodLabel('2024', SourceDuration.YEARLY);
    expect(label).toBe('2024');
  });
});

describe('groupRunsByPeriod', () => {
  it('groups runs by day', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15T10:00:00'), { orbDamage: 100 }),
      createMockRun('2', new Date('2024-03-15T15:00:00'), { orbDamage: 200 }),
      createMockRun('3', new Date('2024-03-16T10:00:00'), { orbDamage: 300 }),
    ];

    const groups = groupRunsByPeriod(runs, SourceDuration.DAILY);

    expect(groups.size).toBe(2);
    expect(groups.get('2024-03-15')?.length).toBe(2);
    expect(groups.get('2024-03-16')?.length).toBe(1);
  });

  it('groups runs individually for per-run', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15T10:00:00'), { orbDamage: 100 }),
      createMockRun('2', new Date('2024-03-15T15:00:00'), { orbDamage: 200 }),
    ];

    const groups = groupRunsByPeriod(runs, SourceDuration.PER_RUN);

    expect(groups.size).toBe(2);
  });
});

describe('filterRuns', () => {
  const runs = [
    createMockRun('1', new Date(), { orbDamage: 100 }, 11, 'farm'),
    createMockRun('2', new Date(), { orbDamage: 200 }, 11, 'tournament'),
    createMockRun('3', new Date(), { orbDamage: 300 }, 12, 'farm'),
  ];

  const baseFilters: SourceAnalysisFilters = {
    category: 'damageDealt',
    runType: 'all',
    tier: 'all',
    duration: SourceDuration.PER_RUN,
    quantity: 10
  };

  it('returns all runs when filters are "all"', () => {
    const filtered = filterRuns(runs, baseFilters);
    expect(filtered.length).toBe(3);
  });

  it('filters by run type', () => {
    const filtered = filterRuns(runs, { ...baseFilters, runType: 'farm' });
    expect(filtered.length).toBe(2);
    expect(filtered.every(r => r.runType === 'farm')).toBe(true);
  });

  it('filters by tier', () => {
    const filtered = filterRuns(runs, { ...baseFilters, tier: 11 });
    expect(filtered.length).toBe(2);
    expect(filtered.every(r => r.tier === 11)).toBe(true);
  });

  it('combines run type and tier filters', () => {
    const filtered = filterRuns(runs, { ...baseFilters, runType: 'farm', tier: 11 });
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('1');
  });
});

describe('calculatePeriodBreakdown', () => {
  it('calculates source breakdown for period', () => {
    const runs = [
      createMockRun('1', new Date(), { orbDamage: 600, thornDamage: 400 }),
      createMockRun('2', new Date(), { orbDamage: 400, thornDamage: 600 }),
    ];

    const breakdown = calculatePeriodBreakdown({
      runs,
      category: mockCategory,
      periodKey: '2024-03-15',
      periodLabel: 'Mar 15',
    });

    expect(breakdown.periodLabel).toBe('Mar 15');
    expect(breakdown.total).toBe(2000);
    expect(breakdown.sources[0].value).toBe(1000); // orbDamage: 600 + 400
    expect(breakdown.sources[0].percentage).toBe(50);
    expect(breakdown.sources[1].value).toBe(1000); // thornDamage: 400 + 600
    expect(breakdown.sources[1].percentage).toBe(50);
  });
});

describe('calculateSummary', () => {
  it('calculates summary across all periods', () => {
    const periods = [
      {
        periodLabel: 'Period 1',
        periodKey: '1',
        total: 1000,
        runCount: 1,
        sources: [
          { fieldName: 'orbDamage', displayName: 'Orb', color: '#f97316', value: 700, percentage: 70 },
          { fieldName: 'thornDamage', displayName: 'Thorn', color: '#84cc16', value: 300, percentage: 30 },
        ]
      },
      {
        periodLabel: 'Period 2',
        periodKey: '2',
        total: 1000,
        runCount: 1,
        sources: [
          { fieldName: 'orbDamage', displayName: 'Orb', color: '#f97316', value: 500, percentage: 50 },
          { fieldName: 'thornDamage', displayName: 'Thorn', color: '#84cc16', value: 500, percentage: 50 },
        ]
      }
    ];

    const summary = calculateSummary(periods, mockCategory);

    expect(summary.totalValue).toBe(2000);
    expect(summary.periodCount).toBe(2);
    expect(summary.sources.length).toBe(2);
    expect(summary.sources[0].fieldName).toBe('orbDamage'); // Sorted by percentage
    expect(summary.sources[0].totalValue).toBe(1200);
    expect(summary.sources[0].percentage).toBe(60);
  });

  it('excludes zero-value sources from summary', () => {
    const periods = [
      {
        periodLabel: 'Period 1',
        periodKey: '1',
        total: 1000,
        runCount: 1,
        sources: [
          { fieldName: 'orbDamage', displayName: 'Orb', color: '#f97316', value: 1000, percentage: 100 },
          { fieldName: 'thornDamage', displayName: 'Thorn', color: '#84cc16', value: 0, percentage: 0 },
        ]
      }
    ];

    const summary = calculateSummary(periods, mockCategory);

    expect(summary.sources.length).toBe(1);
    expect(summary.sources[0].fieldName).toBe('orbDamage');
  });
});

describe('limitToPeriods', () => {
  it('limits to most recent N periods', () => {
    const groups = new Map([
      ['2024-03-15', [createMockRun('1', new Date('2024-03-15'), {})]],
      ['2024-03-14', [createMockRun('2', new Date('2024-03-14'), {})]],
      ['2024-03-13', [createMockRun('3', new Date('2024-03-13'), {})]],
    ]);

    const limited = limitToPeriods(groups, 2, SourceDuration.DAILY);

    expect(limited.size).toBe(2);
    expect(Array.from(limited.keys())).toEqual(['2024-03-14', '2024-03-15']); // Oldest first
  });
});

describe('calculateSourceAnalysis', () => {
  it('produces complete analysis data', () => {
    const runs = [
      createMockRun('1', new Date('2024-03-15'), { orbDamage: 600, thornDamage: 400 }),
      createMockRun('2', new Date('2024-03-16'), { orbDamage: 700, thornDamage: 300 }),
    ];

    const filters: SourceAnalysisFilters = {
      category: 'damageDealt',
      runType: 'all',
      tier: 'all',
      duration: SourceDuration.DAILY,
      quantity: 10
    };

    const analysis = calculateSourceAnalysis(runs, mockCategory, filters);

    expect(analysis.category).toBe(mockCategory);
    expect(analysis.filters).toBe(filters);
    expect(analysis.periods.length).toBe(2);
    expect(analysis.summary.totalValue).toBe(2000);
  });

  it('handles empty runs gracefully', () => {
    const filters: SourceAnalysisFilters = {
      category: 'damageDealt',
      runType: 'all',
      tier: 'all',
      duration: SourceDuration.DAILY,
      quantity: 10
    };

    const analysis = calculateSourceAnalysis([], mockCategory, filters);

    expect(analysis.periods.length).toBe(0);
    expect(analysis.summary.totalValue).toBe(0);
    expect(analysis.summary.periodCount).toBe(0);
  });
});

// ===========================================================================
// Discrepancy Detection Tests
// ===========================================================================

describe('discrepancy detection in period breakdown', () => {
  it('adds Unknown entry when sources sum to less than totalField by more than 1%', () => {
    // Sources: 800, Total: 1000 → 20% unknown
    const runs = [
      createMockRun('1', new Date(), {
        damageDealt: 1000,  // totalField
        orbDamage: 500,
        thornDamage: 300,
        // Missing 200 (20% unknown)
      }),
    ];

    const breakdown = calculatePeriodBreakdown({
      runs,
      category: mockCategory,
      periodKey: '2024-03-15',
      periodLabel: 'Mar 15',
    });

    expect(breakdown.total).toBe(1000); // Uses totalField
    expect(breakdown.sources.length).toBe(3); // 2 regular + 1 unknown

    const unknownSource = breakdown.sources.find(s => s.isDiscrepancy);
    expect(unknownSource).toBeDefined();
    expect(unknownSource!.discrepancyType).toBe('unknown');
    expect(unknownSource!.displayName).toBe('Unknown');
    expect(unknownSource!.value).toBe(200);
    expect(unknownSource!.percentage).toBe(20);
    expect(unknownSource!.color).toBe('#6b7280'); // gray-600
  });

  it('adds Overage entry when sources sum to more than totalField by more than 1%', () => {
    // Sources: 1200, Total: 1000 → 20% overage
    const runs = [
      createMockRun('1', new Date(), {
        damageDealt: 1000,  // totalField
        orbDamage: 700,
        thornDamage: 500,
        // Sum = 1200, 200 overage
      }),
    ];

    const breakdown = calculatePeriodBreakdown({
      runs,
      category: mockCategory,
      periodKey: '2024-03-15',
      periodLabel: 'Mar 15',
    });

    expect(breakdown.total).toBe(1000);
    expect(breakdown.sources.length).toBe(3); // 2 regular + 1 overage

    const overageSource = breakdown.sources.find(s => s.isDiscrepancy);
    expect(overageSource).toBeDefined();
    expect(overageSource!.discrepancyType).toBe('overage');
    expect(overageSource!.displayName).toBe('Overage');
    expect(overageSource!.value).toBe(200);
    expect(overageSource!.percentage).toBe(20);
    expect(overageSource!.color).toBe('#fbbf24'); // amber-400
  });

  it('does not add discrepancy when within threshold (1%)', () => {
    // Sources: 995, Total: 1000 → 0.5% unknown (below 1%)
    const runs = [
      createMockRun('1', new Date(), {
        damageDealt: 1000,
        orbDamage: 600,
        thornDamage: 395,
      }),
    ];

    const breakdown = calculatePeriodBreakdown({
      runs,
      category: mockCategory,
      periodKey: '2024-03-15',
      periodLabel: 'Mar 15',
    });

    expect(breakdown.sources.length).toBe(2); // No discrepancy
    expect(breakdown.sources.every(s => !s.isDiscrepancy)).toBe(true);
  });

  it('aggregates discrepancies across multiple runs in a period', () => {
    // Run 1: sources=800, total=1000 → 200 unknown
    // Run 2: sources=900, total=1000 → 100 unknown
    // Aggregated: sources=1700, total=2000 → 300 unknown (15%)
    const runs = [
      createMockRun('1', new Date(), {
        damageDealt: 1000,
        orbDamage: 500,
        thornDamage: 300,
      }),
      createMockRun('2', new Date(), {
        damageDealt: 1000,
        orbDamage: 600,
        thornDamage: 300,
      }),
    ];

    const breakdown = calculatePeriodBreakdown({
      runs,
      category: mockCategory,
      periodKey: '2024-03-15',
      periodLabel: 'Mar 15',
    });

    expect(breakdown.total).toBe(2000);
    const unknownSource = breakdown.sources.find(s => s.isDiscrepancy);
    expect(unknownSource).toBeDefined();
    expect(unknownSource!.value).toBe(300); // 1700 from sources, 2000 total
    expect(unknownSource!.percentage).toBe(15);
  });
});

describe('discrepancy in summary calculation', () => {
  it('aggregates unknown values across periods', () => {
    const periods = [
      {
        periodLabel: 'Period 1',
        periodKey: '1',
        total: 1000,
        runCount: 1,
        sources: [
          { fieldName: 'orbDamage', displayName: 'Orb', color: '#f97316', value: 600, percentage: 60 },
          { fieldName: 'thornDamage', displayName: 'Thorn', color: '#84cc16', value: 200, percentage: 20 },
          { fieldName: '_unknown', displayName: 'Unknown', color: '#6b7280', value: 200, percentage: 20, isDiscrepancy: true, discrepancyType: 'unknown' as const },
        ]
      },
      {
        periodLabel: 'Period 2',
        periodKey: '2',
        total: 1000,
        runCount: 1,
        sources: [
          { fieldName: 'orbDamage', displayName: 'Orb', color: '#f97316', value: 700, percentage: 70 },
          { fieldName: 'thornDamage', displayName: 'Thorn', color: '#84cc16', value: 200, percentage: 20 },
          { fieldName: '_unknown', displayName: 'Unknown', color: '#6b7280', value: 100, percentage: 10, isDiscrepancy: true, discrepancyType: 'unknown' as const },
        ]
      }
    ];

    const summary = calculateSummary(periods, mockCategory);

    // Total: 2000, Unknown: 300 (15%)
    const unknownSummary = summary.sources.find(s => s.isDiscrepancy && s.discrepancyType === 'unknown');
    expect(unknownSummary).toBeDefined();
    expect(unknownSummary!.totalValue).toBe(300);
    expect(unknownSummary!.percentage).toBe(15);
  });

  it('excludes discrepancy from regular source totals', () => {
    const periods = [
      {
        periodLabel: 'Period 1',
        periodKey: '1',
        total: 1000,
        runCount: 1,
        sources: [
          { fieldName: 'orbDamage', displayName: 'Orb', color: '#f97316', value: 800, percentage: 80 },
          { fieldName: '_unknown', displayName: 'Unknown', color: '#6b7280', value: 200, percentage: 20, isDiscrepancy: true, discrepancyType: 'unknown' as const },
        ]
      }
    ];

    const summary = calculateSummary(periods, mockCategory);

    // orbDamage should have 800, not 1000 (unknown excluded from regular totals)
    const orbSummary = summary.sources.find(s => s.fieldName === 'orbDamage');
    expect(orbSummary!.totalValue).toBe(800);
  });
});
