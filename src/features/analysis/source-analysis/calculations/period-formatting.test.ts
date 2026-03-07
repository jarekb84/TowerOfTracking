/**
 * Tests for Period Formatting Logic
 */

import { describe, it, expect } from 'vitest';
import { Duration } from '../types';
import {
  getPeriodKey,
  formatPeriodLabel,
} from './period-formatting';

describe('getPeriodKey', () => {
  const testDate = new Date('2024-03-15T14:30:00');

  it('returns YYYY-MM-DDTHH for hourly', () => {
    const key = getPeriodKey(testDate, Duration.HOURLY);
    expect(key).toBe('2024-03-15T14');
  });

  it('returns ISO string for per-run', () => {
    const key = getPeriodKey(testDate, Duration.PER_RUN);
    expect(key).toBe(testDate.toISOString());
  });

  it('returns YYYY-MM-DD for daily', () => {
    const key = getPeriodKey(testDate, Duration.DAILY);
    expect(key).toBe('2024-03-15');
  });

  it('returns YYYY-MM-DD (Sunday date) for weekly', () => {
    // March 15, 2024 is a Friday; Sunday of that week is March 10
    const key = getPeriodKey(testDate, Duration.WEEKLY);
    expect(key).toBe('2024-03-10');
  });

  it('returns YYYY-MM for monthly', () => {
    const key = getPeriodKey(testDate, Duration.MONTHLY);
    expect(key).toBe('2024-03');
  });

  it('returns YYYY for yearly', () => {
    const key = getPeriodKey(testDate, Duration.YEARLY);
    expect(key).toBe('2024');
  });

  it('handles date boundary cases', () => {
    // First day of month
    const jan1 = new Date('2024-01-01T00:00:00');
    expect(getPeriodKey(jan1, Duration.MONTHLY)).toBe('2024-01');

    // Last day of year
    const dec31 = new Date('2024-12-31T23:59:59');
    expect(getPeriodKey(dec31, Duration.YEARLY)).toBe('2024');
  });

  it('handles single-digit months and days with padding', () => {
    const feb5 = new Date('2024-02-05T10:00:00');
    expect(getPeriodKey(feb5, Duration.DAILY)).toBe('2024-02-05');
    expect(getPeriodKey(feb5, Duration.MONTHLY)).toBe('2024-02');
  });
});

describe('formatPeriodLabel', () => {
  it('formats per-run label with run number', () => {
    const label = formatPeriodLabel('2024-03-15', Duration.PER_RUN, 0, 5);
    expect(label).toBe('Run #5');
  });

  it('formats per-run label with correct numbering for multiple runs', () => {
    // index 0 with totalRuns 10 should be Run #10
    expect(formatPeriodLabel('2024-03-15', Duration.PER_RUN, 0, 10)).toBe('Run #10');
    // index 4 with totalRuns 10 should be Run #6
    expect(formatPeriodLabel('2024-03-15', Duration.PER_RUN, 4, 10)).toBe('Run #6');
    // index 9 with totalRuns 10 should be Run #1
    expect(formatPeriodLabel('2024-03-15', Duration.PER_RUN, 9, 10)).toBe('Run #1');
  });

  it('formats per-run label without index uses date', () => {
    const isoDate = new Date('2024-03-15T14:30:00').toISOString();
    const label = formatPeriodLabel(isoDate, Duration.PER_RUN);
    // Should use locale date string when no index provided
    expect(label).toBeTruthy();
  });

  it('formats daily label', () => {
    const label = formatPeriodLabel('2024-03-15', Duration.DAILY);
    expect(label).toBe('Mar 15');
  });

  it('formats weekly label with Sunday date', () => {
    // Key is now YYYY-MM-DD format (the Sunday date)
    const label = formatPeriodLabel('2024-03-10', Duration.WEEKLY);
    expect(label).toBe('Mar 10');
  });

  it('formats weekly label for first week of year', () => {
    // Sunday, January 7, 2024
    const label = formatPeriodLabel('2024-01-07', Duration.WEEKLY);
    expect(label).toBe('Jan 7');
  });

  it('formats weekly label for November', () => {
    // Sunday, November 17, 2024
    const label = formatPeriodLabel('2024-11-17', Duration.WEEKLY);
    expect(label).toBe('Nov 17');
  });

  it('formats monthly label', () => {
    const label = formatPeriodLabel('2024-03', Duration.MONTHLY);
    expect(label).toMatch(/Mar.*24/);
  });

  it('formats yearly label', () => {
    const label = formatPeriodLabel('2024', Duration.YEARLY);
    expect(label).toBe('2024');
  });

  it('formats hourly label', () => {
    const label = formatPeriodLabel('2024-03-15T14', Duration.HOURLY);
    expect(label).toBe('Mar 15 2 PM');
  });

  it('formats hourly label for midnight', () => {
    const label = formatPeriodLabel('2024-03-15T00', Duration.HOURLY);
    expect(label).toBe('Mar 15 12 AM');
  });

  it('formats hourly label for noon', () => {
    const label = formatPeriodLabel('2024-03-15T12', Duration.HOURLY);
    expect(label).toBe('Mar 15 12 PM');
  });

  it('handles edge cases for daily formatting', () => {
    // Single digit day
    expect(formatPeriodLabel('2024-01-05', Duration.DAILY)).toBe('Jan 5');
    // December
    expect(formatPeriodLabel('2024-12-25', Duration.DAILY)).toBe('Dec 25');
  });
});
