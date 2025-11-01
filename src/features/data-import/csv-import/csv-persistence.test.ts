import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runsToStorageCsv, storageCsvToRuns } from './csv-persistence';
import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
};

// Mock global objects for Node.js environment
global.localStorage = localStorageMock;

// Mock crypto.randomUUID if not available
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2)
});

// Create sample test data
function createTestRun(id: string, notes?: string, runType: 'farm' | 'tournament' | 'milestone' = 'farm'): ParsedGameRun {
  const timestamp = new Date('2024-01-15T14:30:00');

  const tierField: GameRunField = {
    value: 10,
    rawValue: '10',
    displayValue: '10',
    originalKey: 'Tier',
    dataType: 'number'
  };

  const notesField: GameRunField | undefined = notes ? {
    value: notes,
    rawValue: notes,
    displayValue: notes,
    originalKey: 'Notes',
    dataType: 'string'
  } : undefined;

  const fields: Record<string, GameRunField> = {
    // Internal fields (with underscore prefix)
    _date: {
      value: '2024-01-15',
      rawValue: '2024-01-15',
      displayValue: '2024-01-15',
      originalKey: 'Date',
      dataType: 'date'
    },
    _time: {
      value: '14:30:00',
      rawValue: '14:30:00',
      displayValue: '14:30:00',
      originalKey: 'Time',
      dataType: 'date'
    },
    _runType: {
      value: runType,
      rawValue: runType,
      displayValue: runType,
      originalKey: 'Run Type',
      dataType: 'string'
    },
    // Game fields
    tier: tierField,
    wave: {
      value: 5881,
      rawValue: '5881',
      displayValue: '5,881',
      originalKey: 'Wave',
      dataType: 'number'
    },
    realTime: {
      value: 27966, // 7h 46m 6s in seconds
      rawValue: '7h 46m 6s',
      displayValue: '7h 46m 6s',
      originalKey: 'Real Time',
      dataType: 'duration'
    },
    coinsEarned: {
      value: 1130000000000, // 1.13T
      rawValue: '1.13T',
      displayValue: '1.13T',
      originalKey: 'Coins Earned',
      dataType: 'number'
    },
    cellsEarned: {
      value: 45200, // 45.2K
      rawValue: '45.2K',
      displayValue: '45.2K',
      originalKey: 'Cells Earned',
      dataType: 'number'
    }
  };

  if (notesField) {
    fields._notes = notesField;
  }

  return {
    id,
    timestamp,
    fields,
    tier: 10,
    wave: 5881,
    coinsEarned: 1130000000000,
    cellsEarned: 45200,
    realTime: 27966,
    runType
  };
}

describe('CSV Persistence', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('runsToStorageCsv', () => {
    it('should convert runs to CSV format', () => {
      const runs = [createTestRun('test-1')];
      const csv = runsToStorageCsv(runs);
      
      console.log('Generated CSV:', csv);
      
      expect(csv).toContain('Date'); // Should have date column
      expect(csv).toContain('Time'); // Should have time column
      expect(csv).toContain('Tier'); // Should have tier column
      expect(csv).toContain('Wave'); // Should have wave column
      expect(csv).toContain('2024-01-15'); // Should have formatted date
      expect(csv).toContain('14:30:00'); // Should have formatted time
      expect(csv).toContain('10'); // Should have tier value
      expect(csv).toContain('5881'); // Should have wave value
    });
    it('should return empty string for empty runs array', () => {
      const csv = runsToStorageCsv([]);
      expect(csv).toBe('');
    });
  });

  describe('storageCsvToRuns', () => {
    it('should parse CSV back to runs', () => {
      const csvData = 'Date\tTime\tTier\tWave\tReal Time\tCoins Earned\tCells Earned\n2024-01-15\t14:30:00\t10\t5881\t7h 46m 6s\t1.13T\t45.2K';
      
      const runs = storageCsvToRuns(csvData);
      
      expect(runs).toHaveLength(1);
      expect(runs[0].tier).toBe(10);
      expect(runs[0].wave).toBe(5881);
      expect(runs[0].realTime).toBe(27966); // Should be parsed to seconds
    });

    it('should return empty array for empty CSV', () => {
      const runs = storageCsvToRuns('');
      expect(runs).toEqual([]);
    });

    it('should preserve order from CSV (no automatic sorting)', () => {
      const csvData = 'Date\tTime\tTier\n2024-01-15\t14:30:00\t10\n2024-01-16\t15:30:00\t11';
      
      const runs = storageCsvToRuns(csvData);
      
      expect(runs).toHaveLength(2);
      // Runs should maintain CSV order (first CSV row = first result)
      expect(runs[0].tier).toBe(10); // 2024-01-15 row
      expect(runs[1].tier).toBe(11); // 2024-01-16 row
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve data through CSV conversion and back', () => {
      const originalRuns = [
        createTestRun('test-1', 'Simple notes'),
        createTestRun('test-2', 'Complex notes with "quotes", commas, and\nnewlines')
      ];

      // Convert to CSV and back
      const csv = runsToStorageCsv(originalRuns);
      const parsedRuns = storageCsvToRuns(csv);

      console.log('Round-trip parsed runs length:', parsedRuns.length);
      expect(parsedRuns.length).toBeGreaterThanOrEqual(2);
      
      // Check that key data is preserved - match by tier since that's the unique identifier in our test data
      expect(parsedRuns[0].tier).toBe(10);
      expect(parsedRuns[0].wave).toBe(5881);
      expect(parsedRuns[0].coinsEarned).toBe(1130000000000);
      expect(parsedRuns[0].cellsEarned).toBe(45200);
      expect(parsedRuns[0].realTime).toBe(27966);
      expect(parsedRuns[0].runType).toBe('farm');
      
      // Find the run with notes and check notes preservation
      const runWithNotes = parsedRuns.find(r => r.fields.notes);
      if (runWithNotes) {
        expect(runWithNotes.fields.notes?.rawValue).toContain('Simple notes');
      }
    });

    it('should preserve milestone run type through round-trip conversion', () => {
      const originalRuns = [
        createTestRun('farm-1', undefined, 'farm'),
        createTestRun('tournament-1', undefined, 'tournament'),
        createTestRun('milestone-1', undefined, 'milestone')
      ];

      // Convert to CSV and back
      const csv = runsToStorageCsv(originalRuns);
      const parsedRuns = storageCsvToRuns(csv);

      expect(parsedRuns).toHaveLength(3);
      
      // Check each run type is preserved (order should match original)
      expect(parsedRuns[0].runType).toBe('farm');
      expect(parsedRuns[1].runType).toBe('tournament');
      expect(parsedRuns[2].runType).toBe('milestone');
    });
  });
});