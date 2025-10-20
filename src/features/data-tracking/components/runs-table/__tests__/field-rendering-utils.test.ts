import { describe, it, expect } from 'vitest';
import { buildContainerClassName, buildValueClassName } from '../field-rendering-utils';
import type { FieldDisplayConfig } from '../field-display-config';

describe('buildContainerClassName', () => {
  it('should build default container class for standard grid fields', () => {
    const config: FieldDisplayConfig = {};
    const result = buildContainerClassName(config);

    expect(result).toContain('flex');
    expect(result).toContain('justify-between');
    expect(result).toContain('items-center');
    expect(result).toContain('p-3');
    expect(result).toContain('bg-muted/15');
    expect(result).toContain('rounded-md');
    expect(result).toContain('border-border/20');
    expect(result).toContain('hover:bg-muted/25');
  });

  it('should build full-width container with distinct styling', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
    };
    const result = buildContainerClassName(config);

    // Full-width gets distinct styling
    expect(result).toContain('flex');
    expect(result).toContain('col-span-2');
    expect(result).toContain('p-4'); // More padding for prose
    expect(result).toContain('bg-muted/10'); // Lighter background
    expect(result).toContain('rounded-lg'); // Larger radius
    expect(result).toContain('border-border/30'); // Stronger border
    // Should NOT have interactive hover states
    expect(result).not.toContain('hover:bg-muted/25');
    expect(result).not.toContain('hover:shadow-sm');
  });

  it('should use custom container class name for full-width fields', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
      containerClassName: 'col-span-3 custom-class',
    };
    const result = buildContainerClassName(config);

    expect(result).toContain('col-span-3 custom-class');
    expect(result).not.toContain('col-span-2');
  });

  it('should align full-width content to start when leftAlignValue is true', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
      leftAlignValue: true,
    };
    const result = buildContainerClassName(config);

    expect(result).toContain('justify-start');
    expect(result).toContain('items-start');
    expect(result).not.toContain('justify-between');
  });

  it('should center full-width content when leftAlignValue is false', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
      leftAlignValue: false,
    };
    const result = buildContainerClassName(config);

    expect(result).toContain('justify-between');
    expect(result).toContain('items-center');
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
    expect(result).toContain('items-start');
  });
});

describe('buildValueClassName', () => {
  it('should build default value class for standard grid fields', () => {
    const config: FieldDisplayConfig = {};
    const result = buildValueClassName(config);

    expect(result).toContain('font-mono');
    expect(result).toContain('text-sm');
    expect(result).toContain('font-medium');
    expect(result).toContain('text-foreground');
    expect(result).toContain('shrink-0');
  });

  it('should build prose-friendly value class for full-width fields', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
    };
    const result = buildValueClassName(config);

    // Full-width uses readable typography, not monospace
    expect(result).not.toContain('font-mono');
    expect(result).not.toContain('font-medium');
    expect(result).toContain('text-sm');
    expect(result).toContain('text-left');
  });

  it('should use custom value classes for full-width fields', () => {
    const config: FieldDisplayConfig = {
      fullWidth: true,
      valueClassName: 'text-left whitespace-pre-wrap break-words leading-relaxed',
    };
    const result = buildValueClassName(config);

    expect(result).not.toContain('font-mono');
    expect(result).toContain('text-sm');
    expect(result).toContain('text-left');
    expect(result).toContain('whitespace-pre-wrap');
    expect(result).toContain('break-words');
    expect(result).toContain('leading-relaxed');
  });

  it('should use custom value classes for standard grid fields', () => {
    const config: FieldDisplayConfig = {
      valueClassName: 'text-left break-words max-w-full',
    };
    const result = buildValueClassName(config);

    expect(result).toContain('font-mono');
    expect(result).toContain('text-left');
    expect(result).toContain('break-words');
    expect(result).toContain('max-w-full');
    expect(result).not.toContain('shrink-0');
  });
});
