import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAllKnownFields } from './field-discovery';

describe('getAllKnownFields', () => {
  const DATA_KEY = 'tower-tracking-csv-data';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return only supported fields when no storage data', () => {
    const supportedFields = ['field1', 'field2', 'field3'];

    const result = getAllKnownFields(supportedFields);

    expect(result.size).toBe(3);
    expect(result.has('field1')).toBe(true);
    expect(result.has('field2')).toBe(true);
    expect(result.has('field3')).toBe(true);
  });

  it('should combine supported fields and storage fields', () => {
    const csvData = `_Date\t_Time\ttier\tcustomField
2025-01-15\t14:30:00\t10\t100`;
    localStorage.setItem(DATA_KEY, csvData);

    const supportedFields = ['tier', 'wave'];
    const result = getAllKnownFields(supportedFields);

    expect(result.has('tier')).toBe(true);
    expect(result.has('wave')).toBe(true);
    expect(result.has('_Date')).toBe(true);
    expect(result.has('_Time')).toBe(true);
    expect(result.has('customField')).toBe(true);
  });

  it('should deduplicate fields present in both sources', () => {
    const csvData = `tier\twave\tnewField
10\t1000\t100`;
    localStorage.setItem(DATA_KEY, csvData);

    const supportedFields = ['tier', 'wave'];
    const result = getAllKnownFields(supportedFields);

    // Should not have duplicates
    const tierCount = Array.from(result).filter(f => f === 'tier').length;
    expect(tierCount).toBe(1);
    expect(result.has('tier')).toBe(true);
    expect(result.has('wave')).toBe(true);
    expect(result.has('newField')).toBe(true);
  });
});
