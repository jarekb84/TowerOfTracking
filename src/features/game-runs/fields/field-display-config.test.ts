import { describe, it, expect } from 'vitest';
import {
  getFieldDisplayConfig,
  FIELD_DISPLAY_CONFIG,
} from './field-display-config';

describe('FIELD_DISPLAY_CONFIG', () => {
  it('should have configuration for _notes field', () => {
    expect(FIELD_DISPLAY_CONFIG._notes).toBeDefined();
  });

  it('should configure _notes with hideLabel=true', () => {
    expect(FIELD_DISPLAY_CONFIG._notes.hideLabel).toBe(true);
  });

  it('should configure _notes with fullWidth=true', () => {
    expect(FIELD_DISPLAY_CONFIG._notes.fullWidth).toBe(true);
  });

  it('should configure _notes with leftAlignValue=true', () => {
    expect(FIELD_DISPLAY_CONFIG._notes.leftAlignValue).toBe(true);
  });

  it('should configure _notes with col-span-2 container class', () => {
    expect(FIELD_DISPLAY_CONFIG._notes.containerClassName).toBe('col-span-2');
  });

  it('should configure _notes with appropriate value classes', () => {
    expect(FIELD_DISPLAY_CONFIG._notes.valueClassName).toContain('text-left');
    expect(FIELD_DISPLAY_CONFIG._notes.valueClassName).toContain('whitespace-pre-wrap');
    expect(FIELD_DISPLAY_CONFIG._notes.valueClassName).toContain('break-words');
  });
});

describe('getFieldDisplayConfig', () => {
  it('should return configuration for _notes field', () => {
    const config = getFieldDisplayConfig('_notes');

    expect(config.hideLabel).toBe(true);
    expect(config.fullWidth).toBe(true);
    expect(config.leftAlignValue).toBe(true);
  });

  it('should return empty config for unknown field', () => {
    const config = getFieldDisplayConfig('unknownField');

    expect(config).toEqual({});
  });

  it('should return empty config for standard field like killedBy', () => {
    const config = getFieldDisplayConfig('killedBy');

    expect(config).toEqual({});
  });

  it('should return empty config for numeric fields', () => {
    const config = getFieldDisplayConfig('coinsEarned');

    expect(config).toEqual({});
  });
});

