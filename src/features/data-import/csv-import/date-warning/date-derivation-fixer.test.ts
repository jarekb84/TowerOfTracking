import { describe, it, expect } from 'vitest';
import {
  categorizeWarnings,
  applyDateDerivationFixes,
  countWarningsByFixability,
} from './date-derivation-fixer';
import type { DateValidationWarning } from '../types';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

// Helper to create a minimal warning for testing
function createWarning(
  rowNumber: number,
  isFixable: boolean,
  derivedDate?: Date
): DateValidationWarning {
  return {
    rowNumber,
    rawValue: isFixable ? '' : 'invalid-date',
    error: { code: 'empty', message: 'No date provided', rawValue: '' },
    context: { tier: 8, wave: 1500 },
    fallbackUsed: 'import-time',
    isFixable,
    dateFieldValue: isFixable ? '2025-01-15' : undefined,
    timeFieldValue: isFixable ? '13:45:00' : undefined,
    derivedBattleDate: derivedDate,
  };
}

// Helper to create a minimal run for testing
function createRun(id: string, timestamp: Date): ParsedGameRun {
  return {
    id,
    timestamp,
    fields: {},
    tier: 8,
    wave: 1500,
    coinsEarned: 0,
    cellsEarned: 0,
    realTime: 3600,
    runType: 'farm',
  };
}

describe('categorizeWarnings', () => {
  it('returns empty arrays when no warnings provided', () => {
    const result = categorizeWarnings([]);

    expect(result.fixable).toHaveLength(0);
    expect(result.unfixable).toHaveLength(0);
  });

  it('categorizes all fixable warnings correctly', () => {
    const warnings = [
      createWarning(1, true, new Date('2025-01-15T13:45:00')),
      createWarning(2, true, new Date('2025-01-16T14:30:00')),
    ];

    const result = categorizeWarnings(warnings);

    expect(result.fixable).toHaveLength(2);
    expect(result.unfixable).toHaveLength(0);
  });

  it('categorizes all unfixable warnings correctly', () => {
    const warnings = [
      createWarning(1, false),
      createWarning(2, false),
    ];

    const result = categorizeWarnings(warnings);

    expect(result.fixable).toHaveLength(0);
    expect(result.unfixable).toHaveLength(2);
  });

  it('splits mixed warnings correctly', () => {
    const warnings = [
      createWarning(1, true, new Date('2025-01-15T13:45:00')),
      createWarning(2, false),
      createWarning(3, true, new Date('2025-01-17T09:00:00')),
      createWarning(4, false),
      createWarning(5, false),
    ];

    const result = categorizeWarnings(warnings);

    expect(result.fixable).toHaveLength(2);
    expect(result.unfixable).toHaveLength(3);
    expect(result.fixable[0].rowNumber).toBe(1);
    expect(result.fixable[1].rowNumber).toBe(3);
  });

  it('treats isFixable=true but no derivedBattleDate as unfixable', () => {
    const warning: DateValidationWarning = {
      rowNumber: 1,
      rawValue: '',
      error: { code: 'empty', message: 'No date provided', rawValue: '' },
      context: {},
      fallbackUsed: 'import-time',
      isFixable: true,
      dateFieldValue: '2025-01-15',
      timeFieldValue: '13:45:00',
      derivedBattleDate: undefined, // Date construction failed
    };

    const result = categorizeWarnings([warning]);

    expect(result.fixable).toHaveLength(0);
    expect(result.unfixable).toHaveLength(1);
  });
});

describe('applyDateDerivationFixes', () => {
  it('returns unchanged runs when no warnings provided', () => {
    const originalTimestamp = new Date('2025-12-06T10:00:00');
    const runs = [createRun('run-1', originalTimestamp)];

    const result = applyDateDerivationFixes(runs, []);

    expect(result.fixedRuns).toHaveLength(1);
    expect(result.fixedRuns[0].timestamp).toEqual(originalTimestamp);
    expect(result.fixedCount).toBe(0);
    expect(result.unfixableCount).toBe(0);
  });

  it('applies fix to matching row', () => {
    const originalTimestamp = new Date('2025-12-06T10:00:00');
    const derivedTimestamp = new Date('2025-01-15T13:45:00');
    const runs = [createRun('run-1', originalTimestamp)];
    const warnings = [createWarning(1, true, derivedTimestamp)];

    const result = applyDateDerivationFixes(runs, warnings);

    expect(result.fixedRuns[0].timestamp).toEqual(derivedTimestamp);
    expect(result.fixedCount).toBe(1);
    expect(result.unfixableCount).toBe(0);
  });

  it('does not modify unfixable rows', () => {
    const originalTimestamp = new Date('2025-12-06T10:00:00');
    const runs = [createRun('run-1', originalTimestamp)];
    const warnings = [createWarning(1, false)];

    const result = applyDateDerivationFixes(runs, warnings);

    expect(result.fixedRuns[0].timestamp).toEqual(originalTimestamp);
    expect(result.fixedCount).toBe(0);
    expect(result.unfixableCount).toBe(1);
  });

  it('handles mixed fixable and unfixable rows', () => {
    const originalTimestamps = [
      new Date('2025-12-06T10:00:00'),
      new Date('2025-12-06T11:00:00'),
      new Date('2025-12-06T12:00:00'),
    ];
    const derivedTimestamp1 = new Date('2025-01-15T13:45:00');
    const derivedTimestamp3 = new Date('2025-01-17T09:00:00');

    const runs = originalTimestamps.map((ts, i) => createRun(`run-${i + 1}`, ts));
    const warnings = [
      createWarning(1, true, derivedTimestamp1),
      createWarning(2, false),
      createWarning(3, true, derivedTimestamp3),
    ];

    const result = applyDateDerivationFixes(runs, warnings);

    expect(result.fixedRuns[0].timestamp).toEqual(derivedTimestamp1);
    expect(result.fixedRuns[1].timestamp).toEqual(originalTimestamps[1]); // Unchanged
    expect(result.fixedRuns[2].timestamp).toEqual(derivedTimestamp3);
    expect(result.fixedCount).toBe(2);
    expect(result.unfixableCount).toBe(1);
  });

  it('preserves other run properties when fixing', () => {
    const originalTimestamp = new Date('2025-12-06T10:00:00');
    const derivedTimestamp = new Date('2025-01-15T13:45:00');
    const run: ParsedGameRun = {
      id: 'test-run',
      timestamp: originalTimestamp,
      fields: {
        tier: {
          rawValue: '8',
          value: 8,
          displayValue: '8',
          originalKey: 'Tier',
          dataType: 'number',
        },
      },
      tier: 8,
      wave: 1500,
      coinsEarned: 0,
      cellsEarned: 0,
      realTime: 3600,
      runType: 'farm',
    };
    const warnings = [createWarning(1, true, derivedTimestamp)];

    const result = applyDateDerivationFixes([run], warnings);

    expect(result.fixedRuns[0].id).toBe('test-run');
    expect(result.fixedRuns[0].tier).toBe(8);
    expect(result.fixedRuns[0].wave).toBe(1500);
    // Tier field should be preserved
    expect(result.fixedRuns[0].fields.tier).toEqual({
      rawValue: '8',
      value: 8,
      displayValue: '8',
      originalKey: 'Tier',
      dataType: 'number',
    });
    expect(result.fixedRuns[0].timestamp).toEqual(derivedTimestamp);
  });

  it('adds battleDate field to run.fields when fixing', () => {
    const originalTimestamp = new Date('2025-12-06T10:00:00');
    const derivedTimestamp = new Date('2025-01-15T13:45:00');
    const runs = [createRun('run-1', originalTimestamp)];
    const warnings = [createWarning(1, true, derivedTimestamp)];

    const result = applyDateDerivationFixes(runs, warnings);

    const battleDateField = result.fixedRuns[0].fields.battleDate;
    expect(battleDateField).toBeDefined();
    expect(battleDateField.value).toEqual(derivedTimestamp);
    expect(battleDateField.originalKey).toBe('Battle Date');
    expect(battleDateField.dataType).toBe('date');
    // rawValue and displayValue should be formatted date strings
    expect(typeof battleDateField.rawValue).toBe('string');
    expect(battleDateField.rawValue.length).toBeGreaterThan(0);
    expect(battleDateField.displayValue).toBe(battleDateField.rawValue);
  });

  it('clears dateValidationError when fixing', () => {
    const originalTimestamp = new Date('2025-12-06T10:00:00');
    const derivedTimestamp = new Date('2025-01-15T13:45:00');
    const run: ParsedGameRun = {
      ...createRun('run-1', originalTimestamp),
      dateValidationError: {
        code: 'empty',
        message: 'No date provided',
        rawValue: '',
      },
    };
    const warnings = [createWarning(1, true, derivedTimestamp)];

    const result = applyDateDerivationFixes([run], warnings);

    expect(result.fixedRuns[0].dateValidationError).toBeUndefined();
  });

  it('handles rows without corresponding warnings', () => {
    const originalTimestamps = [
      new Date('2025-12-06T10:00:00'),
      new Date('2025-12-06T11:00:00'),
      new Date('2025-12-06T12:00:00'),
    ];
    const derivedTimestamp = new Date('2025-01-15T13:45:00');

    const runs = originalTimestamps.map((ts, i) => createRun(`run-${i + 1}`, ts));
    // Only row 2 has a warning
    const warnings = [createWarning(2, true, derivedTimestamp)];

    const result = applyDateDerivationFixes(runs, warnings);

    expect(result.fixedRuns[0].timestamp).toEqual(originalTimestamps[0]); // No warning
    expect(result.fixedRuns[1].timestamp).toEqual(derivedTimestamp); // Fixed
    expect(result.fixedRuns[2].timestamp).toEqual(originalTimestamps[2]); // No warning
    expect(result.fixedCount).toBe(1);
    expect(result.unfixableCount).toBe(0);
  });
});

describe('countWarningsByFixability', () => {
  it('returns zeros for empty array', () => {
    const result = countWarningsByFixability([]);

    expect(result.fixableCount).toBe(0);
    expect(result.unfixableCount).toBe(0);
  });

  it('counts all fixable warnings', () => {
    const warnings = [
      createWarning(1, true, new Date('2025-01-15T13:45:00')),
      createWarning(2, true, new Date('2025-01-16T14:30:00')),
    ];

    const result = countWarningsByFixability(warnings);

    expect(result.fixableCount).toBe(2);
    expect(result.unfixableCount).toBe(0);
  });

  it('counts all unfixable warnings', () => {
    const warnings = [
      createWarning(1, false),
      createWarning(2, false),
      createWarning(3, false),
    ];

    const result = countWarningsByFixability(warnings);

    expect(result.fixableCount).toBe(0);
    expect(result.unfixableCount).toBe(3);
  });

  it('counts mixed warnings correctly', () => {
    const warnings = [
      createWarning(1, true, new Date('2025-01-15T13:45:00')),
      createWarning(2, false),
      createWarning(3, true, new Date('2025-01-17T09:00:00')),
      createWarning(4, false),
    ];

    const result = countWarningsByFixability(warnings);

    expect(result.fixableCount).toBe(2);
    expect(result.unfixableCount).toBe(2);
  });
});
