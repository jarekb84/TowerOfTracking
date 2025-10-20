import { describe, it, expect } from 'vitest';
import { buildContainerClassName, buildValueClassName } from '../field-rendering-utils';
import type { FieldDisplayConfig } from '../field-display-config';

describe('buildContainerClassName', () => {
  it('should build default container class when no config provided', () => {
    const config: FieldDisplayConfig = {};
    const result = buildContainerClassName(config);

    expect(result).toContain('flex justify-between');
    expect(result).toContain('items-center');
    expect(result).toContain('p-3');
    expect(result).toContain('bg-muted/15');
    expect(result).toContain('rounded-md');
    expect(result).toContain('border border-border/20');
    expect(result).toContain('hover:bg-muted/25');
  });

  it('should add col-span-2 for full width fields', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
    };
    const result = buildContainerClassName(config);

    expect(result).toContain('col-span-2');
  });

  it('should use custom container class name when provided', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
      containerClassName: 'col-span-3 custom-class',
    };
    const result = buildContainerClassName(config);

    expect(result).toContain('col-span-3 custom-class');
    expect(result).not.toContain('col-span-2');
  });

  it('should use justify-start for left-aligned values', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
      leftAlignValue: true,
    };
    const result = buildContainerClassName(config);

    expect(result).toContain('justify-start');
    expect(result).not.toContain('justify-between');
  });

  it('should use justify-between for full width without left alignment', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
      leftAlignValue: false,
    };
    const result = buildContainerClassName(config);

    expect(result).toContain('justify-between');
    expect(result).not.toContain('justify-start');
  });

  it('should handle full width field with all custom options', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
      leftAlignValue: true,
      containerClassName: 'col-span-full my-custom-class',
    };
    const result = buildContainerClassName(config);

    expect(result).toContain('col-span-full my-custom-class');
    expect(result).toContain('justify-start');
    expect(result).toContain('flex');
    expect(result).toContain('items-center');
  });
});

describe('buildValueClassName', () => {
  it('should build default value class when no config provided', () => {
    const config: FieldDisplayConfig = {};
    const result = buildValueClassName(config);

    expect(result).toContain('font-mono');
    expect(result).toContain('text-sm');
    expect(result).toContain('font-medium');
    expect(result).toContain('text-foreground');
    expect(result).toContain('shrink-0');
  });

  it('should append custom value class name when provided', () => {
    const config: FieldDisplayConfig = {
      valueClassName: 'text-left whitespace-pre-wrap',
    };
    const result = buildValueClassName(config);

    expect(result).toContain('font-mono');
    expect(result).toContain('text-sm');
    expect(result).toContain('font-medium');
    expect(result).toContain('text-foreground');
    expect(result).toContain('text-left');
    expect(result).toContain('whitespace-pre-wrap');
    expect(result).not.toContain('shrink-0');
  });

  it('should handle multiple custom classes', () => {
    const config: FieldDisplayConfig = {
      valueClassName: 'text-left break-words max-w-full overflow-hidden',
    };
    const result = buildValueClassName(config);

    expect(result).toContain('text-left');
    expect(result).toContain('break-words');
    expect(result).toContain('max-w-full');
    expect(result).toContain('overflow-hidden');
  });
});
