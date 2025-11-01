import { describe, it, expect, vi } from 'vitest';
import { extractCardHeaderData, extractProgressData, calculateEconomyData, extractRunCardData } from './run-card-utils';
import type { ParsedGameRun } from '../../data-tracking/types/game-run.types';

// Mock utility functions
vi.mock('@/features/analysis/shared/parsing/data-parser', () => ({
  formatNumber: (value: number) => value.toLocaleString(),
  formatDuration: (value: number) => {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const secs = value % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ') || '0s';
  },
  calculatePerHour: (amount: number, timeInSeconds: number) =>
    timeInSeconds > 0 ? Math.round((amount / timeInSeconds) * 3600) : 0,
}));

vi.mock('@/features/analysis/shared/parsing/field-utils', () => ({
  getFieldValue: <T>(run: ParsedGameRun, fieldName: string): T | undefined => {
    const field = run.fields?.[fieldName];
    return field ? field.value as T : undefined;
  },
}));

const createMockRun = (overrides: Partial<ParsedGameRun> = {}): ParsedGameRun => ({
  id: 'test-id',
  timestamp: new Date('2024-01-15T14:30:00Z'),
  tier: 5,
  wave: 1250,
  coinsEarned: 150000,
  cellsEarned: 2500,
  realTime: 7200, // 2 hours
  runType: 'farm',
  fields: {
    _notes: {
      value: overrides.fields?._notes?.value || 'Test notes',
      rawValue: 'Test notes',
      displayValue: 'Test notes',
      originalKey: '_notes',
      dataType: 'string'
    },
    killedBy: {
      value: overrides.fields?.killedBy?.value || 'Fire Orc',
      rawValue: 'Fire Orc',
      displayValue: 'Fire Orc',
      originalKey: 'killedBy',
      dataType: 'string'
    }
  },
  ...overrides,
} as ParsedGameRun);

describe('extractCardHeaderData', () => {
  it('should format complete header data', () => {
    const run = createMockRun();
    const result = extractCardHeaderData(run);
    
    expect(result.shortDuration).toBe('2h');
    expect(result.dateStr).toBe(run.timestamp.toLocaleDateString());
    expect(result.timeStr).toBe(run.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    expect(result.hasNotes).toBe(true);
  });

  it('should handle missing real time', () => {
    const run = createMockRun({ realTime: undefined });
    const result = extractCardHeaderData(run);
    
    expect(result.shortDuration).toBe('-');
  });

  it('should handle empty notes', () => {
    const run = createMockRun({ fields: {} });
    const result = extractCardHeaderData(run);
    
    expect(result.hasNotes).toBe(false);
  });

  it('should handle whitespace-only notes', () => {
    const run = createMockRun({ fields: { _notes: {
      value: '   ',
      rawValue: '   ',
      displayValue: '   ',
      originalKey: '_notes',
      dataType: 'string'
    }}});
    const result = extractCardHeaderData(run);

    expect(result.hasNotes).toBe(false);
  });
});

describe('extractProgressData', () => {
  it('should format complete progress data', () => {
    const run = createMockRun();
    const result = extractProgressData(run);
    
    expect(result.tier).toBe(5);
    expect(result.wave).toBe('1,250');
    expect(result.killedBy).toBe('Fire Orc');
  });

  it('should handle missing tier and wave', () => {
    const run = createMockRun({ tier: undefined, wave: undefined });
    const result = extractProgressData(run);
    
    expect(result.tier).toBe('?');
    expect(result.wave).toBe('?');
  });

  it('should handle missing killedBy', () => {
    const run = createMockRun({ fields: {} });
    const result = extractProgressData(run);
    
    expect(result.killedBy).toBeUndefined();
  });
});

describe('calculateEconomyData', () => {
  it('should calculate economy data with per-hour rates', () => {
    const run = createMockRun();
    const result = calculateEconomyData(run);
    
    expect(result.coins).toBe('150,000');
    expect(result.coinsPerHour).toBe('75,000'); // 150k / 2 hours
    expect(result.cells).toBe('2,500');
    expect(result.cellsPerHour).toBe('1,250'); // 2.5k / 2 hours
  });

  it('should handle missing earnings', () => {
    const run = createMockRun({ coinsEarned: undefined, cellsEarned: undefined });
    const result = calculateEconomyData(run);
    
    expect(result.coins).toBe('-');
    expect(result.cells).toBe('-');
    expect(result.coinsPerHour).toBe('-'); // 0 per hour
    expect(result.cellsPerHour).toBe('-'); // 0 per hour
  });

  it('should handle zero earnings', () => {
    const run = createMockRun({ coinsEarned: 0, cellsEarned: 0 });
    const result = calculateEconomyData(run);
    
    expect(result.coins).toBe('-');
    expect(result.cells).toBe('-');
    expect(result.coinsPerHour).toBe('-');
    expect(result.cellsPerHour).toBe('-');
  });

  it('should handle missing real time', () => {
    const run = createMockRun({ realTime: undefined });
    const result = calculateEconomyData(run);
    
    expect(result.coinsPerHour).toBe('-');
    expect(result.cellsPerHour).toBe('-');
  });
});

describe('extractRunCardData', () => {
  it('should combine all data extraction functions', () => {
    const run = createMockRun();
    const result = extractRunCardData(run);
    
    expect(result.header).toEqual({
      shortDuration: '2h',
      dateStr: run.timestamp.toLocaleDateString(),
      timeStr: run.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasNotes: true,
    });
    
    expect(result.progress).toEqual({
      tier: 5,
      wave: '1,250',
      killedBy: 'Fire Orc',
    });
    
    expect(result.economy).toEqual({
      coins: '150,000',
      coinsPerHour: '75,000',
      cells: '2,500',
      cellsPerHour: '1,250',
    });
  });
});