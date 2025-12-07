import { describe, it, expect } from 'vitest';
import { formatIsoDate, formatIsoTime, formatIsoDateTimeMinute, formatDurationForKey, parseBattleDate, constructDate, formatFilenameDateTime, parseTimestampFromFields } from './date-formatters';

describe('formatIsoDate', () => {
  it('should format date as yyyy-MM-dd', () => {
    const date = new Date('2025-10-14T13:14:05');
    expect(formatIsoDate(date)).toBe('2025-10-14');
  });

  it('should zero-pad single digit months', () => {
    const date = new Date('2025-01-15T10:30:00');
    expect(formatIsoDate(date)).toBe('2025-01-15');
  });

  it('should zero-pad single digit days', () => {
    const date = new Date('2025-10-05T10:30:00');
    expect(formatIsoDate(date)).toBe('2025-10-05');
  });

  it('should handle year boundaries', () => {
    const date = new Date('2024-12-31T23:59:59');
    expect(formatIsoDate(date)).toBe('2024-12-31');
  });
});

describe('formatIsoTime', () => {
  it('should format time as HH:mm:ss', () => {
    const date = new Date('2025-10-14T13:14:05');
    expect(formatIsoTime(date)).toBe('13:14:05');
  });

  it('should zero-pad single digit hours', () => {
    const date = new Date('2025-10-14T08:30:45');
    expect(formatIsoTime(date)).toBe('08:30:45');
  });

  it('should zero-pad single digit minutes', () => {
    const date = new Date('2025-10-14T13:05:30');
    expect(formatIsoTime(date)).toBe('13:05:30');
  });

  it('should zero-pad single digit seconds', () => {
    const date = new Date('2025-10-14T13:14:03');
    expect(formatIsoTime(date)).toBe('13:14:03');
  });

  it('should handle midnight', () => {
    const date = new Date('2025-10-14T00:00:00');
    expect(formatIsoTime(date)).toBe('00:00:00');
  });

  it('should handle end of day', () => {
    const date = new Date('2025-10-14T23:59:59');
    expect(formatIsoTime(date)).toBe('23:59:59');
  });
});

describe('formatIsoDateTimeMinute', () => {
  it('should format datetime as yyyy-MM-ddTHH:mm', () => {
    const date = new Date('2025-10-14T13:14:05');
    expect(formatIsoDateTimeMinute(date)).toBe('2025-10-14T13:14');
  });

  it('should exclude seconds', () => {
    const date = new Date('2025-10-14T13:14:59');
    expect(formatIsoDateTimeMinute(date)).toBe('2025-10-14T13:14');
  });

  it('should zero-pad all components', () => {
    const date = new Date('2025-01-05T08:05:00');
    expect(formatIsoDateTimeMinute(date)).toBe('2025-01-05T08:05');
  });

  it('should handle midnight', () => {
    const date = new Date('2025-10-14T00:00:00');
    expect(formatIsoDateTimeMinute(date)).toBe('2025-10-14T00:00');
  });
});

describe('formatDurationForKey', () => {
  it('should format duration with all units', () => {
    const seconds = 7 * 3600 + 45 * 60 + 33; // 7h 45m 33s
    expect(formatDurationForKey(seconds)).toBe('7h 45m 33s');
  });

  it('should include zero values for consistency', () => {
    const seconds = 3600; // 1 hour exactly
    expect(formatDurationForKey(seconds)).toBe('1h 0m 0s');
  });

  it('should handle zero duration', () => {
    expect(formatDurationForKey(0)).toBe('0h 0m 0s');
  });

  it('should handle large durations', () => {
    const seconds = 100 * 3600 + 30 * 60 + 45; // 100h 30m 45s
    expect(formatDurationForKey(seconds)).toBe('100h 30m 45s');
  });

  it('should handle seconds only', () => {
    expect(formatDurationForKey(45)).toBe('0h 0m 45s');
  });

  it('should handle minutes and seconds', () => {
    const seconds = 15 * 60 + 30; // 15m 30s
    expect(formatDurationForKey(seconds)).toBe('0h 15m 30s');
  });
});

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

  it('should handle all month abbreviations', () => {
    const testCases = [
      { input: 'Jan 15, 2025 10:30', month: 0 },
      { input: 'Feb 20, 2025 14:45', month: 1 },
      { input: 'Mar 5, 2025 09:00', month: 2 },
      { input: 'Dec 25, 2025 12:00', month: 11 }
    ];

    testCases.forEach(({ input, month }) => {
      const result = parseBattleDate(input);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(month);
    });
  });

  it('should return null for empty string', () => {
    expect(parseBattleDate('')).toBeNull();
  });

  it('should return null for invalid format', () => {
    expect(parseBattleDate('invalid')).toBeNull();
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

describe('constructDate', () => {
  it('should construct date from date and time strings', () => {
    const result = constructDate('2025-10-14', '13:14:00');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2025);
    expect(result?.getMonth()).toBe(9); // October
    expect(result?.getDate()).toBe(14);
    expect(result?.getHours()).toBe(13);
    expect(result?.getMinutes()).toBe(14);
  });

  it('should handle date without time', () => {
    const result = constructDate('2025-10-14', '');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2025);
    expect(result?.getMonth()).toBe(9);
  });

  it('should handle date without time parameter', () => {
    const result = constructDate('2025-10-14');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2025);
  });

  it('should return null for empty date', () => {
    expect(constructDate('', '13:14:00')).toBeNull();
  });

  it('should return null for invalid date', () => {
    expect(constructDate('invalid', '13:14:00')).toBeNull();
  });

  it('should handle various date formats', () => {
    const formats = [
      '2025-10-14',
      '2025/10/14',
      'Oct 14, 2025'
    ];

    formats.forEach(format => {
      const result = constructDate(format);
      expect(result).toBeInstanceOf(Date);
    });
  });
});

describe('formatFilenameDateTime', () => {
  it('should format datetime for filenames', () => {
    const date = new Date('2025-10-14T13:14:05');
    expect(formatFilenameDateTime(date)).toBe('2025-10-14_13-14-05');
  });

  it('should use hyphens instead of colons', () => {
    const date = new Date('2025-10-14T13:14:05');
    const result = formatFilenameDateTime(date);
    expect(result).not.toContain(':');
    expect(result).toContain('-');
  });

  it('should zero-pad all components', () => {
    const date = new Date('2025-01-05T08:05:03');
    expect(formatFilenameDateTime(date)).toBe('2025-01-05_08-05-03');
  });

  it('should handle midnight', () => {
    const date = new Date('2025-10-14T00:00:00');
    expect(formatFilenameDateTime(date)).toBe('2025-10-14_00-00-00');
  });
});

describe('parseTimestampFromFields', () => {
  it('should parse from battle_date field (priority 1)', () => {
    const fields = {
      battleDate: { rawValue: 'Oct 14, 2025 13:14', value: new Date('2025-10-14T13:14:00') },
      _date: { rawValue: '2025-01-01', value: '2025-01-01' }, // Should be ignored
      _time: { rawValue: '10:00:00', value: '10:00:00' }  // Should be ignored
    };

    const result = parseTimestampFromFields(fields);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(9); // October
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(14);
  });

  it('should parse from _date/_time fields when no battle_date (priority 2)', () => {
    const fields = {
      _date: { rawValue: '2025-10-14', value: '2025-10-14' },
      _time: { rawValue: '13:14:00', value: '13:14:00' }
    };

    const result = parseTimestampFromFields(fields);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(9);
    expect(result.getHours()).toBe(13);
    expect(result.getMinutes()).toBe(14);
  });

  it('should parse from legacy date/time fields (priority 2)', () => {
    const fields = {
      date: { rawValue: '2025-10-14', value: '2025-10-14' },
      time: { rawValue: '13:14:00', value: '13:14:00' }
    };

    const result = parseTimestampFromFields(fields);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(9);
  });

  it('should handle date without time', () => {
    const fields = {
      _date: { rawValue: '2025-10-14', value: '2025-10-14' }
    };

    const result = parseTimestampFromFields(fields);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(9);
  });

  it('should use fallback date when no valid fields', () => {
    const fallback = new Date('2025-12-25T10:30:00');
    const fields = {};

    const result = parseTimestampFromFields(fields, fallback);
    expect(result).toEqual(fallback);
  });

  it('should use current time when no fields and no fallback', () => {
    const beforeParse = new Date();
    const result = parseTimestampFromFields({});
    const afterParse = new Date();

    expect(result.getTime()).toBeGreaterThanOrEqual(beforeParse.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(afterParse.getTime());
  });

  it('should use fallback when battle_date parsing fails', () => {
    const fallback = new Date('2025-12-25T10:30:00');
    const fields = {
      battleDate: { rawValue: 'invalid date', value: null }
    };

    const result = parseTimestampFromFields(fields, fallback);
    expect(result).toEqual(fallback);
  });
});
