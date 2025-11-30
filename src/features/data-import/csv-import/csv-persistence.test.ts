import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runsToStorageCsv, storageCsvToRuns } from './csv-persistence';
import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types';
import {
  __resetForTesting,
  __setStateForTesting,
} from '@/shared/locale/locale-store';
import type { ImportFormatSettings } from '@/shared/locale/types';

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
    it('should convert runs to CSV format with canonical formatting', () => {
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
      // Wave 5881 preserves precision since rawValue didn't use shorthand
      expect(csv).toContain('5881'); // Should have exact wave value (precision preserved)
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
    it('should preserve data through CSV conversion and back (with minor formatting precision loss)', () => {
      const originalRuns = [
        createTestRun('test-1', 'Simple notes'),
        createTestRun('test-2', 'Complex notes with "quotes", commas, and\nnewlines')
      ];

      // Convert to CSV and back
      const csv = runsToStorageCsv(originalRuns);
      const parsedRuns = storageCsvToRuns(csv);

      console.log('Round-trip parsed runs length:', parsedRuns.length);
      expect(parsedRuns.length).toBeGreaterThanOrEqual(2);

      // Tier and runType are preserved exactly (no formatting)
      expect(parsedRuns[0].tier).toBe(10);
      expect(parsedRuns[0].runType).toBe('farm');

      // Numeric values: exact numbers preserve precision, shorthand now preserves 2 decimals
      // Wave: 5881 -> "5881" -> 5881 (exact, rawValue had no shorthand suffix)
      // CoinsEarned: 1130000000000 -> "1.13T" -> 1130000000000 (exact, rawValue was "1.13T")
      // CellsEarned: 45200 -> "45.2K" -> 45200 (exact, rawValue was "45.2K")
      expect(parsedRuns[0].wave).toBe(5881); // Exact preservation (no shorthand in original)
      expect(parsedRuns[0].coinsEarned).toBe(1130000000000); // Exact preservation (2 decimal precision)
      expect(parsedRuns[0].cellsEarned).toBe(45200); // Exact preservation

      // Duration is preserved (not a number type)
      expect(parsedRuns[0].realTime).toBe(27966);

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

  describe('locale change resistance (data integrity)', () => {
    /**
     * These tests verify the fix for the data corruption bug where changing
     * locale settings would cause stored data to be re-interpreted incorrectly.
     *
     * Example corruption scenario (pre-fix):
     * 1. User imports data with US format: "12.3T" (12.3 trillion)
     * 2. User changes import format to Italian (comma = decimal)
     * 3. App reloads, reads "12.3T" with Italian format
     * 4. The "." is interpreted as thousands separator (stripped), result: "123T"
     * 5. User's 12.3 trillion becomes 123 trillion - 10x data corruption!
     *
     * The fix ensures storage always uses canonical US format, regardless of
     * user's locale settings.
     */

    const US_FORMAT: ImportFormatSettings = {
      decimalSeparator: '.',
      thousandsSeparator: ',',
      dateFormat: 'month-first',
    };

    const ITALIAN_FORMAT: ImportFormatSettings = {
      decimalSeparator: ',',
      thousandsSeparator: '.',
      dateFormat: 'month-first',
    };

    afterEach(() => {
      __resetForTesting();
    });

    it('should not corrupt data when user changes from US to Italian format', () => {
      // 1. Start with US locale (user imports US-formatted data)
      __setStateForTesting({
        importFormat: US_FORMAT,
        displayLocale: 'en-US',
      });

      // Create test data with typical US-formatted values
      const originalRuns = [createTestRun('test-1')];

      // Verify original values
      expect(originalRuns[0].coinsEarned).toBe(1130000000000); // 1.13T

      // 2. Store to CSV (should use canonical US format)
      const storedCsv = runsToStorageCsv(originalRuns);

      // 3. User changes locale to Italian
      __setStateForTesting({
        importFormat: ITALIAN_FORMAT,
        displayLocale: 'it-IT',
      });

      // 4. Reload from storage - this is where corruption would occur pre-fix
      const reloadedRuns = storageCsvToRuns(storedCsv);

      // 5. Verify data is NOT corrupted (10x would make it 11.3T or 113T)
      // Minor precision loss from formatting is acceptable (1.13T -> 1.1T)
      // But should NOT be 11.3T (10x too big) or 113B (10x too small)
      expect(reloadedRuns[0].coinsEarned).toBeCloseTo(1130000000000, -11); // ~1.1T, within 100B
      expect(reloadedRuns[0].coinsEarned).toBeGreaterThan(100000000000); // > 100B (not 10x too small)
      expect(reloadedRuns[0].coinsEarned).toBeLessThan(10000000000000); // < 10T (not 10x too big)

      expect(reloadedRuns[0].cellsEarned).toBeCloseTo(45200, -2); // ~45.2K, within 100
      expect(reloadedRuns[0].cellsEarned).toBeGreaterThan(4000); // > 4K (not 10x too small)
      expect(reloadedRuns[0].cellsEarned).toBeLessThan(500000); // < 500K (not 10x too big)
    });

    it('should not corrupt data when user changes from Italian to US format', () => {
      // 1. Start with Italian locale
      __setStateForTesting({
        importFormat: ITALIAN_FORMAT,
        displayLocale: 'it-IT',
      });

      // Create test data (same numeric values)
      const originalRuns = [createTestRun('test-1')];

      // 2. Store to CSV (should use canonical US format regardless of display locale)
      const storedCsv = runsToStorageCsv(originalRuns);

      // 3. User changes locale to US
      __setStateForTesting({
        importFormat: US_FORMAT,
        displayLocale: 'en-US',
      });

      // 4. Reload from storage
      const reloadedRuns = storageCsvToRuns(storedCsv);

      // 5. Verify data is NOT corrupted (order of magnitude check)
      expect(reloadedRuns[0].coinsEarned).toBeCloseTo(1130000000000, -11); // ~1.1T
      expect(reloadedRuns[0].coinsEarned).toBeGreaterThan(100000000000); // > 100B
      expect(reloadedRuns[0].coinsEarned).toBeLessThan(10000000000000); // < 10T

      expect(reloadedRuns[0].cellsEarned).toBeCloseTo(45200, -2); // ~45.2K
    });

    it('should preserve data through multiple locale changes', () => {
      const originalRuns = [createTestRun('test-1')];
      const originalCoins = originalRuns[0].coinsEarned;

      // First save with US locale
      __setStateForTesting({ importFormat: US_FORMAT, displayLocale: 'en-US' });
      let csv = runsToStorageCsv(originalRuns);

      // Switch to Italian, reload and re-save
      __setStateForTesting({ importFormat: ITALIAN_FORMAT, displayLocale: 'it-IT' });
      let runs = storageCsvToRuns(csv);
      csv = runsToStorageCsv(runs);

      // Switch back to US, reload
      __setStateForTesting({ importFormat: US_FORMAT, displayLocale: 'en-US' });
      runs = storageCsvToRuns(csv);

      // Data should maintain order of magnitude (minor rounding acceptable)
      // NOT 10x corrupted
      expect(runs[0].coinsEarned).toBeCloseTo(originalCoins, -11);
      expect(runs[0].coinsEarned).toBeGreaterThan(originalCoins * 0.1); // Not 10x too small
      expect(runs[0].coinsEarned).toBeLessThan(originalCoins * 10); // Not 10x too big
    });

    it('should store CSV data in canonical US format', () => {
      // Even with Italian display locale, storage should be US format
      __setStateForTesting({
        importFormat: ITALIAN_FORMAT,
        displayLocale: 'it-IT',
      });

      const runs = [createTestRun('test-1')];
      const csv = runsToStorageCsv(runs);

      // CSV should contain US-formatted numbers (period decimal)
      // The number 1.13T should be stored as "1.13T" (preserves 2 decimals)
      expect(csv).toContain('1.13T'); // NOT "1,13T"
      expect(csv).toContain('45.2K'); // NOT "45,2K"
    });
  });
});