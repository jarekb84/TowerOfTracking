/* eslint-disable max-lines */
// Comprehensive test suite for data migration system requires extensive test cases
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDataVersion,
  setDataVersion,
  migrateDataIfNeeded,
  migrateRunsV1ToV2,
  migrateCsvOnImport,
  CURRENT_DATA_VERSION
} from './data-migrations';
import type { ParsedGameRun } from '../types/game-run.types';

describe('Data Migrations', () => {
  describe('Version Management', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    describe('getDataVersion', () => {
      it('should return CURRENT_DATA_VERSION in SSR context', () => {
        const originalWindow = global.window;
        // @ts-expect-error - intentionally removing window for SSR simulation
        delete global.window;

        const version = getDataVersion();
        expect(version).toBe(CURRENT_DATA_VERSION);

        global.window = originalWindow;
      });

      it('should return 1 when no version is stored (legacy data)', () => {
        const version = getDataVersion();
        expect(version).toBe(1);
      });

      it('should return stored version from localStorage', () => {
        localStorage.setItem('tower-tracking-data-version', '2');
        const version = getDataVersion();
        expect(version).toBe(2);
      });

      it('should parse version as integer', () => {
        localStorage.setItem('tower-tracking-data-version', '42');
        const version = getDataVersion();
        expect(version).toBe(42);
      });
    });

    describe('setDataVersion', () => {
      it('should do nothing in SSR context', () => {
        const originalWindow = global.window;
        // @ts-expect-error - intentionally removing window for SSR simulation
        delete global.window;

        setDataVersion(2);
        // No error should be thrown

        global.window = originalWindow;
      });

      it('should store version in localStorage', () => {
        setDataVersion(2);
        expect(localStorage.getItem('tower-tracking-data-version')).toBe('2');
      });

      it('should convert number to string', () => {
        setDataVersion(99);
        expect(localStorage.getItem('tower-tracking-data-version')).toBe('99');
      });
    });
  });

  describe('migrateV1ToV2 (CSV Migration)', () => {
    describe('Header Migration', () => {
      it('should add underscores to internal field headers', () => {
        const csvData = `Date\tTime\tNotes\tRun Type\tTier\tWave
2024-01-15\t14:30:00\tGood run\tfarm\t10\t5000`;

        const result = migrateCsvOnImport(csvData);
        const headers = result.split('\n')[0];

        expect(headers).toContain('_Date');
        expect(headers).toContain('_Time');
        expect(headers).toContain('_Notes');
        expect(headers).toContain('_Run Type');
        // Old format headers should be gone
        expect(headers).not.toMatch(/^Date\t/);
        expect(headers).not.toMatch(/\tDate\t/);
      });

      it('should preserve game field headers', () => {
        const csvData = `Date\tTime\tTier\tWave\tCoins Earned
2024-01-15\t14:30:00\t10\t5000\t1.5B`;

        const result = migrateCsvOnImport(csvData);
        const headers = result.split('\n')[0];

        expect(headers).toContain('Tier');
        expect(headers).toContain('Wave');
        expect(headers).toContain('Coins Earned');
      });

      it('should not migrate lowercase headers (handled by CSV parser)', () => {
        // Note: lowercase headers like "date", "time" are handled by the CSV parser's
        // camelCase conversion and legacy field migration, not by migrateCsvOnImport
        const csvData = `date\ttime\tnotes\tTier
2024-01-15\t14:30:00\tTest\t10`;

        const result = migrateCsvOnImport(csvData);

        // migrateCsvOnImport only handles title-case headers (Date, Time, etc.)
        // Lowercase headers are handled during parsing via isLegacyField()
        expect(result).toBe(csvData);
      });

      it('should migrate title-case legacy headers', () => {
        // Only title-case headers (Date, Time, Notes, Run Type) trigger migration
        const csvData = `Date\tTime\tNotes\tRun Type\tTier
2024-01-15\t14:30:00\tTest\tfarm\t10`;

        const result = migrateCsvOnImport(csvData);
        const headers = result.split('\n')[0];

        expect(headers).toContain('_Date');
        expect(headers).toContain('_Time');
        expect(headers).toContain('_Notes');
        expect(headers).toContain('_Run Type');
      });
    });

    describe('Column Ordering', () => {
      it('should place internal fields first', () => {
        const csvData = `Tier\tDate\tWave\tTime\tNotes\tCoins Earned
10\t2024-01-15\t5000\t14:30:00\tTest\t1.5B`;

        const result = migrateCsvOnImport(csvData);
        const headers = result.split('\n')[0].split('\t');

        // Internal fields should be first
        expect(headers[0]).toBe('_Date');
        expect(headers[1]).toBe('_Time');
        expect(headers[2]).toBe('_Notes');

        // Game fields should follow
        expect(headers).toContain('Tier');
        expect(headers).toContain('Wave');
        expect(headers).toContain('Coins Earned');
      });

      it('should maintain internal field order (_Date, _Time, _Notes, _Run Type)', () => {
        const csvData = `Notes\tRun Type\tTime\tDate\tTier
Test\tfarm\t14:30:00\t2024-01-15\t10`;

        const result = migrateCsvOnImport(csvData);
        const headers = result.split('\n')[0].split('\t');

        expect(headers[0]).toBe('_Date');
        expect(headers[1]).toBe('_Time');
        expect(headers[2]).toBe('_Notes');
        expect(headers[3]).toBe('_Run Type');
      });

      it('should not add internal fields if they do not exist', () => {
        const csvData = `Tier\tWave\tCoins Earned
10\t5000\t1.5B`;

        const result = migrateCsvOnImport(csvData);
        const headers = result.split('\n')[0];

        expect(headers).not.toContain('_Date');
        expect(headers).not.toContain('_Time');
        expect(headers).toBe('Tier\tWave\tCoins Earned');
      });
    });

    describe('Data Preservation', () => {
      it('should preserve all data values during migration', () => {
        const csvData = `Date\tTime\tNotes\tTier\tWave\tCoins Earned
2024-01-15\t14:30:00\tGood run\t10\t5000\t1.5B
2024-01-16\t15:45:30\tBad run\t11\t6000\t2.3B`;

        const result = migrateCsvOnImport(csvData);
        const lines = result.split('\n');

        // First data row
        const row1Values = lines[1].split('\t');
        expect(row1Values).toContain('2024-01-15');
        expect(row1Values).toContain('14:30:00');
        expect(row1Values).toContain('Good run');
        expect(row1Values).toContain('10');
        expect(row1Values).toContain('5000');
        expect(row1Values).toContain('1.5B');

        // Second data row
        const row2Values = lines[2].split('\t');
        expect(row2Values).toContain('2024-01-16');
        expect(row2Values).toContain('15:45:30');
        expect(row2Values).toContain('Bad run');
        expect(row2Values).toContain('11');
        expect(row2Values).toContain('6000');
        expect(row2Values).toContain('2.3B');
      });

      it('should handle empty values correctly', () => {
        const csvData = `Date\tTime\tNotes\tTier
2024-01-15\t14:30:00\t\t10
2024-01-16\t\tTest\t11`;

        const result = migrateCsvOnImport(csvData);
        const lines = result.split('\n');

        // First row has empty notes
        expect(lines[1]).toContain('\t\t');

        // Second row has empty time
        expect(lines[2]).toContain('\t\t');
      });

      it('should skip empty lines', () => {
        const csvData = `Date\tTime\tTier
2024-01-15\t14:30:00\t10

2024-01-16\t15:45:30\t11`;

        const result = migrateCsvOnImport(csvData);
        const lines = result.split('\n').filter(line => line.trim());

        // Should have header + 2 data rows (empty line removed)
        expect(lines.length).toBe(3);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty CSV', () => {
        const result = migrateCsvOnImport('');
        expect(result).toBe('');
      });

      it('should handle CSV with only headers', () => {
        const csvData = `Date\tTime\tTier`;

        const result = migrateCsvOnImport(csvData);
        const headers = result.split('\n')[0];

        expect(headers).toContain('_Date');
        expect(headers).toContain('_Time');
        expect(headers).toContain('Tier');
      });

      it('should handle CSV with whitespace', () => {
        const csvData = `  Date  \t  Time  \t  Tier
  2024-01-15  \t  14:30:00  \t  10  `;

        const result = migrateCsvOnImport(csvData);
        const headers = result.split('\n')[0];

        expect(headers).toContain('_Date');
        expect(headers).toContain('_Time');
      });

      it('should not migrate if already using new format', () => {
        const csvData = `_Date\t_Time\tTier
2024-01-15\t14:30:00\t10`;

        const result = migrateCsvOnImport(csvData);

        // Should return unchanged
        expect(result).toBe(csvData);
      });

      it('should detect and migrate comma-delimited CSV', () => {
        const csvData = `Date,Time,Notes,Tier
2024-01-15,14:30:00,Test,10`;

        const result = migrateCsvOnImport(csvData);
        const headers = result.split('\n')[0];

        expect(headers).toContain('_Date');
        expect(headers).toContain('_Time');
        expect(headers).toContain('_Notes');
        expect(headers).toContain('Tier');
      });
    });
  });

  describe('migrateRunsV1ToV2 (In-Memory Migration)', () => {
    it('should migrate legacy field names to internal field names', () => {
      const runs: ParsedGameRun[] = [{
        id: '1',
        timestamp: new Date('2024-01-15T14:30:00'),
        tier: 10,
        wave: 5000,
        coinsEarned: 1500000000000,
        cellsEarned: 45200,
        realTime: 27966,
        runType: 'farm',
        fields: {
          date: { value: '2024-01-15', rawValue: '2024-01-15', displayValue: '2024-01-15', fieldName: 'date', dataType: 'string' },
          time: { value: '14:30:00', rawValue: '14:30:00', displayValue: '14:30:00', fieldName: 'time', dataType: 'string' },
          notes: { value: 'Test', rawValue: 'Test', displayValue: 'Test', fieldName: 'notes', dataType: 'string' },
          runType: { value: 'farm', rawValue: 'farm', displayValue: 'farm', fieldName: 'runType', dataType: 'string' },
          tier: { value: 10, rawValue: '10', displayValue: '10', fieldName: 'tier', dataType: 'number' }
        }
      }];

      const migrated = migrateRunsV1ToV2(runs);

      expect(migrated[0].fields._date).toBeDefined();
      expect(migrated[0].fields._time).toBeDefined();
      expect(migrated[0].fields._notes).toBeDefined();
      expect(migrated[0].fields._runType).toBeDefined();

      // Old fields should not exist
      expect(migrated[0].fields.date).toBeUndefined();
      expect(migrated[0].fields.time).toBeUndefined();
      expect(migrated[0].fields.notes).toBeUndefined();
      expect(migrated[0].fields.runType).toBeUndefined();

      // Game fields should be preserved
      expect(migrated[0].fields.tier).toBeDefined();
    });

    it('should preserve non-legacy fields', () => {
      const runs: ParsedGameRun[] = [{
        id: '1',
        timestamp: new Date('2024-01-15T14:30:00'),
        tier: 10,
        wave: 5000,
        coinsEarned: 1500000000000,
        cellsEarned: 45200,
        realTime: 27966,
        runType: 'farm',
        fields: {
          tier: { value: 10, rawValue: '10', displayValue: '10', fieldName: 'tier', dataType: 'number' },
          wave: { value: 5000, rawValue: '5000', displayValue: '5,000', fieldName: 'wave', dataType: 'number' },
          coinsEarned: { value: 1500000000000, rawValue: '1.5T', displayValue: '1.50 T', fieldName: 'coinsEarned', dataType: 'number' }
        }
      }];

      const migrated = migrateRunsV1ToV2(runs);

      expect(migrated[0].fields.tier).toEqual(runs[0].fields.tier);
      expect(migrated[0].fields.wave).toEqual(runs[0].fields.wave);
      expect(migrated[0].fields.coinsEarned).toEqual(runs[0].fields.coinsEarned);
    });

    it('should handle empty runs array', () => {
      const migrated = migrateRunsV1ToV2([]);
      expect(migrated).toEqual([]);
    });

    it('should preserve run metadata', () => {
      const runs: ParsedGameRun[] = [{
        id: 'abc123',
        timestamp: new Date('2024-01-15T14:30:00'),
        tier: 10,
        wave: 5000,
        coinsEarned: 1500000000000,
        cellsEarned: 45200,
        realTime: 27966,
        runType: 'farm',
        fields: {
          date: { value: '2024-01-15', rawValue: '2024-01-15', displayValue: '2024-01-15', fieldName: 'date', dataType: 'string' }
        }
      }];

      const migrated = migrateRunsV1ToV2(runs);

      expect(migrated[0].id).toBe('abc123');
      expect(migrated[0].timestamp).toEqual(runs[0].timestamp);
      expect(migrated[0].tier).toBe(10);
      expect(migrated[0].wave).toBe(5000);
      expect(migrated[0].coinsEarned).toBe(1500000000000);
      expect(migrated[0].cellsEarned).toBe(45200);
      expect(migrated[0].realTime).toBe(27966);
      expect(migrated[0].runType).toBe('farm');
    });
  });

  describe('migrateDataIfNeeded (Main Migration Function)', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('should return false if already on current version', () => {
      localStorage.setItem('tower-tracking-data-version', '2');

      const result = migrateDataIfNeeded();

      expect(result.migrated).toBe(false);
      expect(result.fromVersion).toBe(2);
      expect(result.toVersion).toBe(CURRENT_DATA_VERSION);
    });

    it('should migrate from v1 to v2', () => {
      // Set up legacy data (v1)
      const legacyData = `Date\tTime\tTier\tWave
2024-01-15\t14:30:00\t10\t5000`;
      localStorage.setItem('tower-tracking-csv-data', legacyData);

      const result = migrateDataIfNeeded();

      expect(result.migrated).toBe(true);
      expect(result.fromVersion).toBe(1);
      expect(result.toVersion).toBe(2);

      // Check that data was migrated
      const migratedData = localStorage.getItem('tower-tracking-csv-data');
      expect(migratedData).toContain('_Date');
      expect(migratedData).toContain('_Time');

      // Check that version was updated
      expect(localStorage.getItem('tower-tracking-data-version')).toBe('2');
    });

    it('should handle missing data gracefully', () => {
      // No data in localStorage, but version is 1
      const result = migrateDataIfNeeded();

      expect(result.migrated).toBe(true);
      expect(result.fromVersion).toBe(1);
      expect(result.toVersion).toBe(2);

      // Version should still be updated
      expect(localStorage.getItem('tower-tracking-data-version')).toBe('2');
    });

    it('should handle SSR context', () => {
      const originalWindow = global.window;
      // @ts-expect-error - intentionally removing window for SSR simulation
      delete global.window;

      const result = migrateDataIfNeeded();

      expect(result.migrated).toBe(false);
      expect(result.fromVersion).toBe(CURRENT_DATA_VERSION);
      expect(result.toVersion).toBe(CURRENT_DATA_VERSION);

      global.window = originalWindow;
    });

    it('should log migration events', () => {
      const consoleGroupSpy = vi.spyOn(console, 'group');
      const consoleLogSpy = vi.spyOn(console, 'log');
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd');

      const legacyData = `Date\tTime\tTier
2024-01-15\t14:30:00\t10`;
      localStorage.setItem('tower-tracking-csv-data', legacyData);

      migrateDataIfNeeded();

      // Verify grouped console output
      expect(consoleGroupSpy).toHaveBeenCalledWith('[Data Migration] v1 → v2');
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting migration: Converting legacy field names to internal format');
      expect(consoleLogSpy).toHaveBeenCalledWith('Changes: date → _Date, time → _Time, notes → _Notes, runType → _Run Type');
      expect(consoleLogSpy).toHaveBeenCalledWith('Migrating 1 rows of data...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Successfully migrated 1 rows');
      expect(consoleLogSpy).toHaveBeenCalledWith('Migration complete - data version updated to v2');
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleGroupSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it('should handle malformed CSV data without crashing', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Set up malformed CSV that might cause errors
      const malformedData = `Date\tTime
      \t\t\t\t
      Invalid\tData\tWith\tTooMany\tColumns`;

      localStorage.setItem('tower-tracking-csv-data', malformedData);
      localStorage.removeItem('tower-tracking-data-version'); // Force v1

      // Should not throw - errors are caught
      expect(() => migrateDataIfNeeded()).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('migrateCsvOnImport (Bulk Import Migration)', () => {
    it('should migrate legacy CSV format', () => {
      const csvData = `Date\tTime\tNotes\tTier
2024-01-15\t14:30:00\tTest\t10`;

      const result = migrateCsvOnImport(csvData);

      expect(result).toContain('_Date');
      expect(result).toContain('_Time');
      expect(result).toContain('_Notes');
    });

    it('should not migrate if already using new format', () => {
      const csvData = `_Date\t_Time\tTier
2024-01-15\t14:30:00\t10`;

      const result = migrateCsvOnImport(csvData);

      expect(result).toBe(csvData);
    });

    it('should handle empty CSV', () => {
      const result = migrateCsvOnImport('');
      expect(result).toBe('');
    });

    it('should handle CSV without internal fields', () => {
      const csvData = `Tier\tWave\tCoins Earned
10\t5000\t1.5B`;

      const result = migrateCsvOnImport(csvData);

      // Should return unchanged (no legacy fields to migrate)
      expect(result).toBe(csvData);
    });
  });
});
