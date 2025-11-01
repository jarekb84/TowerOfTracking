import { describe, it, expect } from 'vitest';
import { createInternalField } from '../parsing/field-utils';

describe('createInternalField', () => {
  it('should create internal field with correct structure', () => {
    const field = createInternalField('Notes', 'Test note');

    expect(field).toEqual({
      value: 'Test note',
      rawValue: 'Test note',
      displayValue: 'Test note',
      originalKey: 'Notes',
      dataType: 'string'
    });
  });

  it('should handle empty string values', () => {
    const field = createInternalField('Run Type', '');

    expect(field).toEqual({
      value: '',
      rawValue: '',
      displayValue: '',
      originalKey: 'Run Type',
      dataType: 'string'
    });
  });

  it('should preserve multi-line content', () => {
    const multilineNote = 'Line 1\nLine 2\nLine 3';
    const field = createInternalField('Notes', multilineNote);

    expect(field.value).toBe(multilineNote);
    expect(field.rawValue).toBe(multilineNote);
    expect(field.displayValue).toBe(multilineNote);
  });

  it('should preserve special characters', () => {
    const specialNote = 'Test with "quotes", tabs\t, and pipes |';
    const field = createInternalField('Notes', specialNote);

    expect(field.value).toBe(specialNote);
    expect(field.rawValue).toBe(specialNote);
    expect(field.displayValue).toBe(specialNote);
  });

  it('should create field for run type values', () => {
    const farmField = createInternalField('Run Type', 'farm');
    const tournamentField = createInternalField('Run Type', 'tournament');
    const milestoneField = createInternalField('Run Type', 'milestone');

    expect(farmField.value).toBe('farm');
    expect(tournamentField.value).toBe('tournament');
    expect(milestoneField.value).toBe('milestone');
  });

  it('should always use string data type', () => {
    // Even if value looks like a number
    const field1 = createInternalField('Test', '12345');
    expect(field1.dataType).toBe('string');
    expect(field1.value).toBe('12345');

    // Even if value looks like a date
    const field2 = createInternalField('Test', '2024-01-15');
    expect(field2.dataType).toBe('string');
    expect(field2.value).toBe('2024-01-15');
  });

  it('should use provided original key as-is', () => {
    const field1 = createInternalField('Notes', 'test');
    expect(field1.originalKey).toBe('Notes');

    const field2 = createInternalField('Run Type', 'farm');
    expect(field2.originalKey).toBe('Run Type');

    const field3 = createInternalField('Custom Field', 'value');
    expect(field3.originalKey).toBe('Custom Field');
  });
});
