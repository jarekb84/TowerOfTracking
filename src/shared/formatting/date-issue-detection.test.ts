import { describe, it, expect } from 'vitest';
import { detectDateIssue, applyDateFix, tryDeriveFromInternalFields } from './date-issue-detection';
import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types';
import { INTERNAL_FIELD_NAMES } from '@/shared/domain/fields/internal-field-config';

// Helper to create a minimal test run
function createTestRun(overrides: Partial<ParsedGameRun> = {}): ParsedGameRun {
  return {
    id: 'test-run',
    timestamp: new Date('2025-12-06T10:00:00'),
    fields: {},
    tier: 8,
    wave: 1500,
    coinsEarned: 1000000,
    cellsEarned: 500,
    realTime: 3600,
    runType: 'farm',
    ...overrides,
  };
}

// Helper to create a GameRunField
function createField(rawValue: string, value: string | number | Date = rawValue): GameRunField {
  return {
    rawValue,
    value,
    displayValue: rawValue,
    originalKey: 'Test',
    dataType: 'string',
  };
}

describe('detectDateIssue', () => {
  describe('no issue cases', () => {
    it('should return no issue when battleDate exists and is valid', () => {
      const run = createTestRun({
        fields: {
          battleDate: {
            rawValue: 'Oct 14, 2025 13:14',
            value: new Date('2025-10-14T13:14:00'),
            displayValue: 'Oct 14, 2025 13:14',
            originalKey: 'Battle Date',
            dataType: 'date',
          },
        },
      });

      const result = detectDateIssue(run);

      expect(result.hasIssue).toBe(false);
      expect(result.issueType).toBeNull();
      expect(result.isFixable).toBe(false);
    });
  });

  describe('missing battleDate', () => {
    it('should detect missing battleDate with no fix available', () => {
      const run = createTestRun({ fields: {} });

      const result = detectDateIssue(run);

      expect(result.hasIssue).toBe(true);
      expect(result.issueType).toBe('missing');
      expect(result.isFixable).toBe(false);
      expect(result.fixSource).toBeNull();
    });

    it('should detect missing battleDate but fixable from internal fields', () => {
      const run = createTestRun({
        fields: {
          [INTERNAL_FIELD_NAMES.DATE]: createField('2025-01-15'),
          [INTERNAL_FIELD_NAMES.TIME]: createField('13:45:00'),
        },
      });

      const result = detectDateIssue(run);

      expect(result.hasIssue).toBe(true);
      expect(result.issueType).toBe('missing');
      expect(result.isFixable).toBe(true);
      expect(result.fixSource).toBe('internal-fields');
      expect(result.derivedDate).toBeInstanceOf(Date);
      expect(result.derivedDate?.getFullYear()).toBe(2025);
      expect(result.derivedDate?.getMonth()).toBe(0); // January
      expect(result.derivedDate?.getDate()).toBe(15);
    });

    it('should detect missing battleDate but fixable from user-selected date', () => {
      const run = createTestRun({ fields: {} });
      const userDate = new Date('2025-03-20T14:30:00');

      const result = detectDateIssue(run, userDate);

      expect(result.hasIssue).toBe(true);
      expect(result.issueType).toBe('missing');
      expect(result.isFixable).toBe(true);
      expect(result.fixSource).toBe('user-selected');
      expect(result.derivedDate).toEqual(userDate);
    });
  });

  describe('invalid battleDate', () => {
    it('should detect invalid battleDate with validation error', () => {
      const run = createTestRun({
        fields: {
          battleDate: createField('invalid-date'),
        },
        dateValidationError: {
          code: 'invalid-format',
          message: 'Date format not recognized',
          rawValue: 'invalid-date',
        },
      });

      const result = detectDateIssue(run);

      expect(result.hasIssue).toBe(true);
      expect(result.issueType).toBe('invalid');
      expect(result.validationError).toEqual({
        code: 'invalid-format',
        message: 'Date format not recognized',
        rawValue: 'invalid-date',
      });
    });

    it('should be fixable from internal fields even with invalid battleDate', () => {
      const run = createTestRun({
        fields: {
          battleDate: createField('invalid-date'),
          [INTERNAL_FIELD_NAMES.DATE]: createField('2025-02-10'),
          [INTERNAL_FIELD_NAMES.TIME]: createField('09:30:00'),
        },
        dateValidationError: {
          code: 'invalid-format',
          message: 'Date format not recognized',
          rawValue: 'invalid-date',
        },
      });

      const result = detectDateIssue(run);

      expect(result.hasIssue).toBe(true);
      expect(result.issueType).toBe('invalid');
      expect(result.isFixable).toBe(true);
      expect(result.fixSource).toBe('internal-fields');
      expect(result.derivedDate?.getFullYear()).toBe(2025);
    });
  });

  describe('fix source priority', () => {
    it('should prefer internal fields over user-selected date', () => {
      const run = createTestRun({
        fields: {
          [INTERNAL_FIELD_NAMES.DATE]: createField('2025-01-15'),
          [INTERNAL_FIELD_NAMES.TIME]: createField('13:45:00'),
        },
      });
      const userDate = new Date('2025-03-20T14:30:00');

      const result = detectDateIssue(run, userDate);

      expect(result.fixSource).toBe('internal-fields');
      expect(result.derivedDate?.getMonth()).toBe(0); // January from internal fields
    });

    it('should fall back to user-selected when internal fields incomplete', () => {
      const run = createTestRun({
        fields: {
          [INTERNAL_FIELD_NAMES.DATE]: createField('2025-01-15'),
          // Missing _time field
        },
      });
      const userDate = new Date('2025-03-20T14:30:00');

      const result = detectDateIssue(run, userDate);

      expect(result.fixSource).toBe('user-selected');
      expect(result.derivedDate?.getMonth()).toBe(2); // March from user selection
    });
  });
});

describe('applyDateFix', () => {
  it('should create battleDate field with correct format', () => {
    const run = createTestRun({ fields: {} });
    const fixDate = new Date('2025-01-15T13:45:00');

    const fixedRun = applyDateFix(run, fixDate);

    expect(fixedRun.fields.battleDate).toBeDefined();
    expect(fixedRun.fields.battleDate.value).toEqual(fixDate);
    expect(fixedRun.fields.battleDate.originalKey).toBe('Battle Date');
    expect(fixedRun.fields.battleDate.dataType).toBe('date');
    // rawValue should be in canonical format
    expect(fixedRun.fields.battleDate.rawValue).toContain('Jan');
  });

  it('should update timestamp to derived date', () => {
    const originalTimestamp = new Date('2025-12-06T10:00:00');
    const fixDate = new Date('2025-01-15T13:45:00');
    const run = createTestRun({ timestamp: originalTimestamp });

    const fixedRun = applyDateFix(run, fixDate);

    expect(fixedRun.timestamp).toEqual(fixDate);
    expect(fixedRun.timestamp).not.toEqual(originalTimestamp);
  });

  it('should clear dateValidationError', () => {
    const run = createTestRun({
      dateValidationError: {
        code: 'invalid-format',
        message: 'Date format not recognized',
        rawValue: 'invalid-date',
      },
    });
    const fixDate = new Date('2025-01-15T13:45:00');

    const fixedRun = applyDateFix(run, fixDate);

    expect(fixedRun.dateValidationError).toBeUndefined();
  });

  it('should preserve other fields', () => {
    const run = createTestRun({
      fields: {
        tier: createField('8', 8),
        wave: createField('1500', 1500),
      },
    });
    const fixDate = new Date('2025-01-15T13:45:00');

    const fixedRun = applyDateFix(run, fixDate);

    expect(fixedRun.fields.tier).toEqual(run.fields.tier);
    expect(fixedRun.fields.wave).toEqual(run.fields.wave);
    expect(fixedRun.fields.battleDate).toBeDefined();
  });

  it('should preserve run metadata', () => {
    const run = createTestRun({
      id: 'unique-id',
      tier: 10,
      wave: 2000,
      runType: 'tournament',
    });
    const fixDate = new Date('2025-01-15T13:45:00');

    const fixedRun = applyDateFix(run, fixDate);

    expect(fixedRun.id).toBe('unique-id');
    expect(fixedRun.tier).toBe(10);
    expect(fixedRun.wave).toBe(2000);
    expect(fixedRun.runType).toBe('tournament');
  });
});

describe('tryDeriveFromInternalFields', () => {
  it('should return success when both _date and _time fields are present and valid', () => {
    const fields: Record<string, GameRunField> = {
      [INTERNAL_FIELD_NAMES.DATE]: createField('2025-01-15'),
      [INTERNAL_FIELD_NAMES.TIME]: createField('13:45:00'),
    };

    const result = tryDeriveFromInternalFields(fields);

    expect(result.success).toBe(true);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date?.getFullYear()).toBe(2025);
    expect(result.date?.getMonth()).toBe(0); // January
    expect(result.date?.getDate()).toBe(15);
    expect(result.date?.getHours()).toBe(13);
    expect(result.date?.getMinutes()).toBe(45);
    expect(result.dateValue).toBe('2025-01-15');
    expect(result.timeValue).toBe('13:45:00');
  });

  it('should return failure when _date field is missing', () => {
    const fields: Record<string, GameRunField> = {
      [INTERNAL_FIELD_NAMES.TIME]: createField('13:45:00'),
    };

    const result = tryDeriveFromInternalFields(fields);

    expect(result.success).toBe(false);
    expect(result.date).toBeNull();
    expect(result.dateValue).toBeUndefined();
    expect(result.timeValue).toBe('13:45:00');
  });

  it('should return failure when _time field is missing', () => {
    const fields: Record<string, GameRunField> = {
      [INTERNAL_FIELD_NAMES.DATE]: createField('2025-01-15'),
    };

    const result = tryDeriveFromInternalFields(fields);

    expect(result.success).toBe(false);
    expect(result.date).toBeNull();
    expect(result.dateValue).toBe('2025-01-15');
    expect(result.timeValue).toBeUndefined();
  });

  it('should return failure when both fields are missing', () => {
    const fields: Record<string, GameRunField> = {};

    const result = tryDeriveFromInternalFields(fields);

    expect(result.success).toBe(false);
    expect(result.date).toBeNull();
    expect(result.dateValue).toBeUndefined();
    expect(result.timeValue).toBeUndefined();
  });

  it('should return failure when date format is invalid', () => {
    const fields: Record<string, GameRunField> = {
      [INTERNAL_FIELD_NAMES.DATE]: createField('invalid-date'),
      [INTERNAL_FIELD_NAMES.TIME]: createField('13:45:00'),
    };

    const result = tryDeriveFromInternalFields(fields);

    expect(result.success).toBe(false);
    expect(result.date).toBeNull();
    expect(result.dateValue).toBe('invalid-date');
    expect(result.timeValue).toBe('13:45:00');
  });
});
