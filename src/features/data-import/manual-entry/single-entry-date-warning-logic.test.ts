import { describe, it, expect } from 'vitest';
import { computeDateWarningDisplayData } from './single-entry-date-warning-logic';
import type { DateIssueInfo } from '@/shared/formatting/date-issue-detection';

describe('computeDateWarningDisplayData', () => {
  it('should return showWarning false when no issue', () => {
    const info: DateIssueInfo = {
      hasIssue: false,
      issueType: null,
      validationError: null,
      isFixable: false,
      fixSource: null,
      derivedDate: null,
    };

    const result = computeDateWarningDisplayData(info);

    expect(result.showWarning).toBe(false);
  });

  it('should return correct title for missing battleDate', () => {
    const info: DateIssueInfo = {
      hasIssue: true,
      issueType: 'missing',
      validationError: null,
      isFixable: false,
      fixSource: null,
      derivedDate: null,
    };

    const result = computeDateWarningDisplayData(info);

    expect(result.showWarning).toBe(true);
    expect(result.title).toBe('Missing Battle Date');
    expect(result.isMissing).toBe(true);
  });

  it('should return correct title for invalid battleDate', () => {
    const info: DateIssueInfo = {
      hasIssue: true,
      issueType: 'invalid',
      validationError: {
        code: 'invalid-format',
        message: 'Invalid format',
        rawValue: 'bad-date',
      },
      isFixable: false,
      fixSource: null,
      derivedDate: null,
    };

    const result = computeDateWarningDisplayData(info);

    expect(result.showWarning).toBe(true);
    expect(result.title).toBe('Invalid Battle Date');
    expect(result.isMissing).toBe(false);
  });

  it('should format derived date when fixable', () => {
    const testDate = new Date('2025-01-15T13:45:00');
    const info: DateIssueInfo = {
      hasIssue: true,
      issueType: 'missing',
      validationError: null,
      isFixable: true,
      fixSource: 'internal-fields',
      derivedDate: testDate,
    };

    const result = computeDateWarningDisplayData(info);

    expect(result.formattedFixDate).not.toBeNull();
    expect(result.formattedFixDate!.length).toBeGreaterThan(0);
    expect(result.isInternalFieldsFix).toBe(true);
  });

  it('should return null formattedFixDate when not fixable', () => {
    const info: DateIssueInfo = {
      hasIssue: true,
      issueType: 'missing',
      validationError: null,
      isFixable: false,
      fixSource: null,
      derivedDate: null,
    };

    const result = computeDateWarningDisplayData(info);

    expect(result.formattedFixDate).toBeNull();
  });

  it('should format rawValueDisplay correctly with value', () => {
    const info: DateIssueInfo = {
      hasIssue: true,
      issueType: 'invalid',
      validationError: {
        code: 'invalid-format',
        message: 'Invalid',
        rawValue: 'bad-date',
      },
      isFixable: false,
      fixSource: null,
      derivedDate: null,
    };

    const result = computeDateWarningDisplayData(info);

    expect(result.rawValueDisplay).toBe('"bad-date"');
  });

  it('should format rawValueDisplay as (empty) when no raw value', () => {
    const info: DateIssueInfo = {
      hasIssue: true,
      issueType: 'invalid',
      validationError: {
        code: 'invalid-format',
        message: 'Invalid',
        rawValue: '',
      },
      isFixable: false,
      fixSource: null,
      derivedDate: null,
    };

    const result = computeDateWarningDisplayData(info);

    expect(result.rawValueDisplay).toBe('(empty)');
  });

  it('should identify user-selected fix source', () => {
    const info: DateIssueInfo = {
      hasIssue: true,
      issueType: 'missing',
      validationError: null,
      isFixable: true,
      fixSource: 'user-selected',
      derivedDate: new Date('2025-01-15T13:45:00'),
    };

    const result = computeDateWarningDisplayData(info);

    expect(result.isInternalFieldsFix).toBe(false);
  });
});
