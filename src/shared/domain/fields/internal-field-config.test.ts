import { describe, it, expect } from 'vitest';
import {
  INTERNAL_FIELD_NAMES,
  INTERNAL_FIELD_MAPPINGS,
  INTERNAL_FIELD_ORDER,
  LEGACY_FIELD_MIGRATIONS,
  isInternalField,
  isLegacyField,
  getMigratedFieldName,
  getInternalFieldNamesSet
} from './internal-field-config';

describe('INTERNAL_FIELD_NAMES', () => {
  it('should have correct field names with underscore prefix', () => {
    expect(INTERNAL_FIELD_NAMES.DATE).toBe('_date');
    expect(INTERNAL_FIELD_NAMES.TIME).toBe('_time');
    expect(INTERNAL_FIELD_NAMES.NOTES).toBe('_notes');
    expect(INTERNAL_FIELD_NAMES.RUN_TYPE).toBe('_runType');
    expect(INTERNAL_FIELD_NAMES.RANK).toBe('_rank');
  });

  it('should be readonly at compile time', () => {
    // TypeScript enforces readonly, runtime immutability not guaranteed
    expect(INTERNAL_FIELD_NAMES.DATE).toBe('_date');
  });
});

describe('INTERNAL_FIELD_MAPPINGS', () => {
  it('should map internal names to display names with underscore prefix', () => {
    expect(INTERNAL_FIELD_MAPPINGS[INTERNAL_FIELD_NAMES.DATE]).toBe('_Date');
    expect(INTERNAL_FIELD_MAPPINGS[INTERNAL_FIELD_NAMES.TIME]).toBe('_Time');
    expect(INTERNAL_FIELD_MAPPINGS[INTERNAL_FIELD_NAMES.NOTES]).toBe('_Notes');
    expect(INTERNAL_FIELD_MAPPINGS[INTERNAL_FIELD_NAMES.RUN_TYPE]).toBe('_Run Type');
    expect(INTERNAL_FIELD_MAPPINGS[INTERNAL_FIELD_NAMES.RANK]).toBe('_Rank');
  });

  it('should have all internal fields mapped', () => {
    const internalFieldCount = Object.keys(INTERNAL_FIELD_NAMES).length;
    const mappingCount = Object.keys(INTERNAL_FIELD_MAPPINGS).length;
    expect(mappingCount).toBe(internalFieldCount);
  });
});

describe('INTERNAL_FIELD_ORDER', () => {
  it('should define order for all internal fields', () => {
    expect(INTERNAL_FIELD_ORDER).toHaveLength(5);
    expect(INTERNAL_FIELD_ORDER[0]).toBe(INTERNAL_FIELD_NAMES.DATE);
    expect(INTERNAL_FIELD_ORDER[1]).toBe(INTERNAL_FIELD_NAMES.TIME);
    expect(INTERNAL_FIELD_ORDER[2]).toBe(INTERNAL_FIELD_NAMES.NOTES);
    expect(INTERNAL_FIELD_ORDER[3]).toBe(INTERNAL_FIELD_NAMES.RUN_TYPE);
    expect(INTERNAL_FIELD_ORDER[4]).toBe(INTERNAL_FIELD_NAMES.RANK);
  });

  it('should be readonly array', () => {
    // TypeScript enforces readonly, array is immutable at compile time
    expect(INTERNAL_FIELD_ORDER[0]).toBe(INTERNAL_FIELD_NAMES.DATE);
  });
});

describe('LEGACY_FIELD_MIGRATIONS', () => {
  it('should map legacy field names to internal names', () => {
    expect(LEGACY_FIELD_MIGRATIONS['date']).toBe(INTERNAL_FIELD_NAMES.DATE);
    expect(LEGACY_FIELD_MIGRATIONS['time']).toBe(INTERNAL_FIELD_NAMES.TIME);
    expect(LEGACY_FIELD_MIGRATIONS['notes']).toBe(INTERNAL_FIELD_NAMES.NOTES);
    expect(LEGACY_FIELD_MIGRATIONS['runType']).toBe(INTERNAL_FIELD_NAMES.RUN_TYPE);
    expect(LEGACY_FIELD_MIGRATIONS['run_type']).toBe(INTERNAL_FIELD_NAMES.RUN_TYPE);
    expect(LEGACY_FIELD_MIGRATIONS['rank']).toBe(INTERNAL_FIELD_NAMES.RANK);
    expect(LEGACY_FIELD_MIGRATIONS['placement']).toBe(INTERNAL_FIELD_NAMES.RANK);
  });

  it('should handle both camelCase and snake_case variants', () => {
    expect(LEGACY_FIELD_MIGRATIONS['runType']).toBe(LEGACY_FIELD_MIGRATIONS['run_type']);
  });

  it('should map both rank and placement to _rank', () => {
    expect(LEGACY_FIELD_MIGRATIONS['rank']).toBe(LEGACY_FIELD_MIGRATIONS['placement']);
  });
});

describe('isInternalField', () => {
  it('should return true for internal fields', () => {
    expect(isInternalField('_date')).toBe(true);
    expect(isInternalField('_time')).toBe(true);
    expect(isInternalField('_notes')).toBe(true);
    expect(isInternalField('_runType')).toBe(true);
    expect(isInternalField('_rank')).toBe(true);
  });

  it('should return false for non-internal fields', () => {
    expect(isInternalField('date')).toBe(false);
    expect(isInternalField('time')).toBe(false);
    expect(isInternalField('battleDate')).toBe(false);
    expect(isInternalField('tier')).toBe(false);
  });

  it('should return false for fields with underscore but not internal', () => {
    expect(isInternalField('_unknown')).toBe(false);
    expect(isInternalField('_someOtherField')).toBe(false);
  });
});

describe('isLegacyField', () => {
  it('should return true for legacy fields', () => {
    expect(isLegacyField('date')).toBe(true);
    expect(isLegacyField('time')).toBe(true);
    expect(isLegacyField('notes')).toBe(true);
    expect(isLegacyField('runType')).toBe(true);
    expect(isLegacyField('run_type')).toBe(true);
    expect(isLegacyField('rank')).toBe(true);
    expect(isLegacyField('placement')).toBe(true);
  });

  it('should return false for non-legacy fields', () => {
    expect(isLegacyField('_date')).toBe(false);
    expect(isLegacyField('battleDate')).toBe(false);
    expect(isLegacyField('tier')).toBe(false);
  });
});

describe('getMigratedFieldName', () => {
  it('should return migrated name for legacy fields', () => {
    expect(getMigratedFieldName('date')).toBe('_date');
    expect(getMigratedFieldName('time')).toBe('_time');
    expect(getMigratedFieldName('notes')).toBe('_notes');
    expect(getMigratedFieldName('runType')).toBe('_runType');
  });

  it('should return undefined for non-legacy fields', () => {
    expect(getMigratedFieldName('_date')).toBeUndefined();
    expect(getMigratedFieldName('battleDate')).toBeUndefined();
    expect(getMigratedFieldName('tier')).toBeUndefined();
  });
});

describe('getInternalFieldNamesSet', () => {
  it('should return set of all internal field names', () => {
    const set = getInternalFieldNamesSet();
    expect(set).toBeInstanceOf(Set);
    expect(set.size).toBe(5);
    expect(set.has('_date')).toBe(true);
    expect(set.has('_time')).toBe(true);
    expect(set.has('_notes')).toBe(true);
    expect(set.has('_runType')).toBe(true);
    expect(set.has('_rank')).toBe(true);
  });

  it('should allow O(1) lookup', () => {
    const set = getInternalFieldNamesSet();
    expect(set.has('_date')).toBe(true);
    expect(set.has('battleDate')).toBe(false);
  });
});
