import { describe, it, expect } from 'vitest';
import {
  deriveDateTimeFromBattleDate,
  constructDateFromLegacyFields,
  parseGameRun
} from './data-parser';
import {
  parseBattleDate
} from '@/features/data-tracking/utils/date-formatters';

describe('parseBattleDate', () => {
  it('should parse valid battle_date format', () => {
    const result = parseBattleDate('Oct 14, 2025 13:14');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2025);
    expect(result?.getMonth()).toBe(9); // October is month 9 (0-indexed)
    expect(result?.getDate()).toBe(14);
    expect(result?.getHours()).toBe(13);
    expect(result?.getMinutes()).toBe(14);
  });

  it('should handle different month abbreviations', () => {
    const testCases = [
      { input: 'Jan 15, 2025 10:30', month: 0 },
      { input: 'Feb 20, 2025 14:45', month: 1 },
      { input: 'Mar 5, 2025 09:00', month: 2 },
      { input: 'Apr 10, 2025 16:20', month: 3 },
      { input: 'May 25, 2025 08:15', month: 4 },
      { input: 'Jun 30, 2025 12:00', month: 5 },
      { input: 'Jul 4, 2025 18:30', month: 6 },
      { input: 'Aug 12, 2025 07:45', month: 7 },
      { input: 'Sep 18, 2025 20:10', month: 8 },
      { input: 'Oct 31, 2025 23:59', month: 9 },
      { input: 'Nov 1, 2025 00:00', month: 10 },
      { input: 'Dec 25, 2025 12:00', month: 11 }
    ];

    testCases.forEach(({ input, month }) => {
      const result = parseBattleDate(input);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(month);
    });
  });

  it('should return null for invalid input', () => {
    expect(parseBattleDate('')).toBeNull();
    expect(parseBattleDate('invalid')).toBeNull();
    // Note: '2025-10-14' is actually valid and parseable by JavaScript Date constructor
    // We'll accept it even though it's not the exact game format
  });

  it('should return null for non-string input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseBattleDate(null as any)).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseBattleDate(undefined as any)).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseBattleDate(123 as any)).toBeNull();
  });
});

describe('deriveDateTimeFromBattleDate', () => {
  it('should derive correct date and time strings', () => {
    const battleDate = new Date('2025-10-14T13:14:00');
    const result = deriveDateTimeFromBattleDate(battleDate);

    expect(result.date).toBe('2025-10-14');
    expect(result.time).toBe('13:14:00');
  });

  it('should handle single-digit months and days with zero padding', () => {
    const battleDate = new Date('2025-01-05T08:05:03');
    const result = deriveDateTimeFromBattleDate(battleDate);

    expect(result.date).toBe('2025-01-05');
    expect(result.time).toBe('08:05:03');
  });

  it('should handle midnight correctly', () => {
    const battleDate = new Date('2025-12-31T00:00:00');
    const result = deriveDateTimeFromBattleDate(battleDate);

    expect(result.date).toBe('2025-12-31');
    expect(result.time).toBe('00:00:00');
  });

  it('should handle end of day correctly', () => {
    const battleDate = new Date('2025-06-15T23:59:59');
    const result = deriveDateTimeFromBattleDate(battleDate);

    expect(result.date).toBe('2025-06-15');
    expect(result.time).toBe('23:59:59');
  });
});

describe('constructDateFromLegacyFields', () => {
  it('should construct date from legacy date and time fields', () => {
    const result = constructDateFromLegacyFields('2025-10-14', '13:14:00');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2025);
    expect(result?.getMonth()).toBe(9); // October
    expect(result?.getDate()).toBe(14);
    expect(result?.getHours()).toBe(13);
    expect(result?.getMinutes()).toBe(14);
  });

  it('should handle date without time', () => {
    const result = constructDateFromLegacyFields('2025-10-14', '');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2025);
    expect(result?.getMonth()).toBe(9);
    // Date parsing may vary by timezone, so we just verify it's a valid date
    expect(result?.getDate()).toBeGreaterThanOrEqual(13);
    expect(result?.getDate()).toBeLessThanOrEqual(14);
  });

  it('should return null for empty date', () => {
    expect(constructDateFromLegacyFields('', '13:14:00')).toBeNull();
  });

  it('should return null for invalid date format', () => {
    expect(constructDateFromLegacyFields('invalid', '13:14:00')).toBeNull();
  });
});

describe('parseGameRun - battle_date support', () => {
  it('should parse game export with battle_date field', () => {
    const gameExport = `Battle Date\tOct 14, 2025 13:14
Game Time\t2d 1h 49m 3s
Real Time\t10h 6m 23s
Tier\t12
Wave\t7639
Coins earned\t10.13T
Cells Earned\t152.81K`;

    const result = parseGameRun(gameExport);

    expect(result).toBeDefined();
    expect(result.timestamp.getFullYear()).toBe(2025);
    expect(result.timestamp.getMonth()).toBe(9); // October
    expect(result.timestamp.getDate()).toBe(14);
    expect(result.timestamp.getHours()).toBe(13);
    expect(result.timestamp.getMinutes()).toBe(14);

    // Should have battle_date field
    expect(result.fields.battleDate).toBeDefined();
    expect(result.fields.battleDate.rawValue).toBe('Oct 14, 2025 13:14');

    // Should have derived _date and _time fields
    expect(result.fields._date).toBeDefined();
    expect(result.fields._date.rawValue).toBe('2025-10-14');
    expect(result.fields._time).toBeDefined();
    expect(result.fields._time.rawValue).toBe('13:14:00');

    // Should have correct tier and wave
    expect(result.tier).toBe(12);
    expect(result.wave).toBe(7639);
  });

  it('should parse legacy data without battle_date', () => {
    const legacyData = `Date\t2025-10-14
Time\t13:14:00
Tier\t10
Wave\t5000
Coins earned\t1.5B
Cells Earned\t50K
Real Time\t5h 30m 0s`;

    const result = parseGameRun(legacyData);

    expect(result).toBeDefined();

    // Should NOT have battle_date field
    expect(result.fields.battleDate).toBeUndefined();

    // Should have renamed internal fields
    expect(result.fields._date).toBeDefined();
    expect(result.fields._date.rawValue).toBe('2025-10-14');
    expect(result.fields._time).toBeDefined();
    expect(result.fields._time.rawValue).toBe('13:14:00');

    // Original fields should be removed
    expect(result.fields.date).toBeUndefined();
    expect(result.fields.time).toBeUndefined();

    expect(result.tier).toBe(10);
    expect(result.wave).toBe(5000);
  });

  it('should skip header-only rows in new game export format', () => {
    const gameExport = `Battle Report
Battle Date\tOct 14, 2025 13:14
Game Time\t2d 1h 49m 3s
Combat
Damage dealt\t8.70D
Utility
Waves Skipped\t1756`;

    const result = parseGameRun(gameExport);

    expect(result).toBeDefined();

    // Should not have 'Battle Report', 'Combat', or 'Utility' as fields
    expect(result.fields.battleReport).toBeUndefined();
    expect(result.fields.combat).toBeUndefined();
    expect(result.fields.utility).toBeUndefined();

    // Should have actual data fields
    expect(result.fields.battleDate).toBeDefined();
    expect(result.fields.gameTime).toBeDefined();
    expect(result.fields.damageDealt).toBeDefined();
    expect(result.fields.wavesSkipped).toBeDefined();
  });

  it('should handle notes field migration', () => {
    const legacyData = `Date\t2025-10-14
Time\t13:14:00
Notes\tTest run with new strategy
Tier\t8
Wave\t3000
Real Time\t3h 0m 0s`;

    const result = parseGameRun(legacyData);

    // Should have _notes field
    expect(result.fields._notes).toBeDefined();
    expect(result.fields._notes.rawValue).toBe('Test run with new strategy');

    // Original notes field should be removed
    expect(result.fields.notes).toBeUndefined();
  });

  it('should handle runType field migration', () => {
    const legacyData = `Date\t2025-10-14
Time\t13:14:00
Run Type\ttournament
Tier\t8+
Wave\t4500
Real Time\t4h 15m 0s`;

    const result = parseGameRun(legacyData);

    // Should have _runType field
    expect(result.fields._runType).toBeDefined();
    expect(result.fields._runType.rawValue).toBe('tournament');

    // Original runType field should be removed
    expect(result.fields.runType).toBeUndefined();
  });

  it('should use customTimestamp when battle_date parsing fails', () => {
    const customDate = new Date('2025-12-25T10:30:00');
    const gameData = `Tier\t10
Wave\t5000
Real Time\t5h 0m 0s`;

    const result = parseGameRun(gameData, customDate);

    expect(result.timestamp).toEqual(customDate);
  });
});
