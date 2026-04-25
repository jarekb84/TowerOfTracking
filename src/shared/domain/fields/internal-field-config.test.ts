import { describe, it, expect } from 'vitest';
import {
  LEGACY_FIELD_MIGRATIONS,
  isLegacyField,
  getMigratedFieldName
} from './internal-field-config';

describe('LEGACY_FIELD_MIGRATIONS', () => {
  it('should map legacy field names to canonical internal-field ids', () => {
    expect(LEGACY_FIELD_MIGRATIONS['date']).toBe('_date');
    expect(LEGACY_FIELD_MIGRATIONS['time']).toBe('_time');
    expect(LEGACY_FIELD_MIGRATIONS['notes']).toBe('_notes');
    expect(LEGACY_FIELD_MIGRATIONS['runType']).toBe('_runType');
    expect(LEGACY_FIELD_MIGRATIONS['run_type']).toBe('_runType');
    expect(LEGACY_FIELD_MIGRATIONS['rank']).toBe('_rank');
    expect(LEGACY_FIELD_MIGRATIONS['placement']).toBe('_rank');
  });

  it('should handle both camelCase and snake_case variants', () => {
    expect(LEGACY_FIELD_MIGRATIONS['runType']).toBe(LEGACY_FIELD_MIGRATIONS['run_type']);
  });

  it('should map both rank and placement to _rank', () => {
    expect(LEGACY_FIELD_MIGRATIONS['rank']).toBe(LEGACY_FIELD_MIGRATIONS['placement']);
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
