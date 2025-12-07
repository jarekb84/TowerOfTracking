/**
 * Battle Date Field Creation Tests
 *
 * Tests for formatCanonicalBattleDate and createBattleDateField functions.
 * Split from date-formatters.test.ts to keep files under 300 lines.
 */

import { describe, it, expect } from 'vitest';
import {
  formatCanonicalBattleDate,
  createBattleDateField,
  parseBattleDate,
} from './date-formatters';

describe('formatCanonicalBattleDate', () => {
  it('should format date in canonical storage format with English months', () => {
    // Test all 12 months + edge cases in one test for efficiency
    const testCases = [
      { date: new Date('2025-01-05T08:05:00'), expected: 'Jan 5, 2025 08:05' },
      { date: new Date('2025-02-20T14:45:00'), expected: 'Feb 20, 2025 14:45' },
      { date: new Date('2025-03-05T09:00:00'), expected: 'Mar 5, 2025 09:00' },
      { date: new Date('2025-04-10T12:00:00'), expected: 'Apr 10, 2025 12:00' },
      { date: new Date('2025-05-25T18:30:00'), expected: 'May 25, 2025 18:30' },
      { date: new Date('2025-06-01T06:15:00'), expected: 'Jun 1, 2025 06:15' },
      { date: new Date('2025-07-04T00:00:00'), expected: 'Jul 4, 2025 00:00' }, // midnight
      { date: new Date('2025-08-15T23:59:00'), expected: 'Aug 15, 2025 23:59' }, // end of day
      { date: new Date('2025-09-22T11:11:00'), expected: 'Sep 22, 2025 11:11' },
      { date: new Date('2025-10-14T13:14:00'), expected: 'Oct 14, 2025 13:14' },
      { date: new Date('2025-11-11T11:00:00'), expected: 'Nov 11, 2025 11:00' },
      { date: new Date('2025-12-25T12:00:00'), expected: 'Dec 25, 2025 12:00' },
    ];
    testCases.forEach(({ date, expected }) => {
      expect(formatCanonicalBattleDate(date)).toBe(expected);
    });
  });

  it('should round-trip with parseBattleDate for all edge cases', () => {
    const edgeCases = [
      new Date('2025-01-01T00:00:00'), // New Year midnight
      new Date('2025-10-14T13:14:00'), // Standard case
      new Date('2025-12-31T23:59:00'), // End of year
      new Date('2024-02-29T12:00:00'), // Leap year day
    ];
    edgeCases.forEach(originalDate => {
      const formatted = formatCanonicalBattleDate(originalDate);
      const parsed = parseBattleDate(formatted);
      expect(parsed).not.toBeNull();
      expect(parsed?.getTime()).toBe(originalDate.getTime());
    });
  });
});

describe('createBattleDateField', () => {
  it('should create a complete GameRunField with correct structure', () => {
    const date = new Date('2025-01-15T13:45:00');
    const field = createBattleDateField(date);

    expect(field.value).toEqual(date);
    expect(field.originalKey).toBe('Battle Date');
    expect(field.dataType).toBe('date');
  });

  it('should use canonical format for rawValue', () => {
    const date = new Date('2025-01-15T13:45:00');
    const field = createBattleDateField(date);

    // rawValue should be in canonical English format
    expect(field.rawValue).toBe('Jan 15, 2025 13:45');
  });

  it('should have locale-aware displayValue', () => {
    const date = new Date('2025-01-15T13:45:00');
    const field = createBattleDateField(date);

    // displayValue should be a string (locale-dependent, so we just check it exists)
    expect(typeof field.displayValue).toBe('string');
    expect(field.displayValue.length).toBeGreaterThan(0);
  });

  it('should produce rawValue that round-trips through parseBattleDate', () => {
    const originalDate = new Date('2025-06-20T18:30:00');
    const field = createBattleDateField(originalDate);

    const parsed = parseBattleDate(field.rawValue);
    expect(parsed).not.toBeNull();
    expect(parsed?.getTime()).toBe(originalDate.getTime());
  });
});
