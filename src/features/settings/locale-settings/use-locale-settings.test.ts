import { describe, it, expect } from 'vitest';
import { buildDateFormatOptions } from './use-locale-settings';

describe('buildDateFormatOptions', () => {
  it('should return options for all date formats', () => {
    const options = buildDateFormatOptions();

    expect(options).toHaveLength(2);
    expect(options.map(o => o.value)).toContain('month-first');
    expect(options.map(o => o.value)).toContain('month-first-lowercase');
  });

  it('should include example text as labels', () => {
    const options = buildDateFormatOptions();

    const capitalizedOption = options.find(o => o.value === 'month-first');
    const lowercaseOption = options.find(o => o.value === 'month-first-lowercase');

    expect(capitalizedOption?.label).toContain('Nov 20, 2025');
    expect(lowercaseOption?.label).toContain('nov. 20, 2025');
  });

  it('should include descriptive tooltips', () => {
    const options = buildDateFormatOptions();

    const capitalizedOption = options.find(o => o.value === 'month-first');
    const lowercaseOption = options.find(o => o.value === 'month-first-lowercase');

    expect(capitalizedOption?.tooltip).toContain('Capitalized');
    expect(lowercaseOption?.tooltip).toContain('Lowercase');
  });
});
