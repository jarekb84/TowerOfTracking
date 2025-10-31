import { describe, it, expect } from 'vitest';
import { parseGameRun } from '@/features/analysis/shared/data-parser';
import { generateCompositeKey } from '../utils/duplicate-detection';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Battle Date Integration Tests', () => {
  it('should parse sample game export with battle_date field', () => {
    // Read the sample game export file
    const sampleDataPath = join(__dirname, '../../../../sampleData/gameExport_2025-10-18.txt');
    const gameExportData = readFileSync(sampleDataPath, 'utf-8');

    const result = parseGameRun(gameExportData);

    // Verify parsed correctly
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();

    // Verify battle_date field exists and was parsed
    expect(result.fields.battleDate).toBeDefined();
    expect(result.fields.battleDate.rawValue).toBe('Oct 14, 2025 13:14');
    expect(result.fields.battleDate.value).toBeInstanceOf(Date);

    // Verify derived _date and _time fields
    expect(result.fields._date).toBeDefined();
    expect(result.fields._date.rawValue).toBe('2025-10-14');
    expect(result.fields._time).toBeDefined();
    expect(result.fields._time.rawValue).toBe('13:14:00');

    // Verify timestamp was set from battle_date
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp.getFullYear()).toBe(2025);
    expect(result.timestamp.getMonth()).toBe(9); // October
    expect(result.timestamp.getDate()).toBe(14);
    expect(result.timestamp.getHours()).toBe(13);
    expect(result.timestamp.getMinutes()).toBe(14);

    // Verify key game stats were extracted
    expect(result.tier).toBe(12);
    expect(result.wave).toBe(7639);
    expect(result.coinsEarned).toBeGreaterThan(0);
    expect(result.cellsEarned).toBeGreaterThan(0);
    expect(result.realTime).toBeGreaterThan(0);

    // Verify other game fields
    expect(result.fields.gameTime).toBeDefined();
    expect(result.fields.realTime).toBeDefined();
    expect(result.fields.killedBy).toBeDefined();
    expect(result.fields.killedBy.rawValue).toBe('Scatter');

    // Verify header rows were skipped
    expect(result.fields.battleReport).toBeUndefined();
    expect(result.fields.combat).toBeUndefined();
    expect(result.fields.utility).toBeUndefined();
    expect(result.fields.enemiesDestroyed).toBeUndefined();
    expect(result.fields.bots).toBeUndefined();
  });

  it('should generate composite key using battle_date', () => {
    const sampleDataPath = join(__dirname, '../../../../sampleData/gameExport_2025-10-18.txt');
    const gameExportData = readFileSync(sampleDataPath, 'utf-8');

    const result = parseGameRun(gameExportData);
    const compositeKey = generateCompositeKey(result);

    // Should use battle_date format: "yyyy-MM-ddTHH:mm|tier|wave"
    expect(compositeKey).toContain('2025-10-14T13:14');
    expect(compositeKey).toContain('12'); // tier
    expect(compositeKey).toContain('7639'); // wave
    expect(compositeKey).toBe('2025-10-14T13:14|12|7639');
  });

  it('should handle legacy data without battle_date', () => {
    const legacyData = `Date\t2025-10-14
Time\t13:14:00
Tier\t10
Wave\t5000
Coins earned\t1.5B
Cells Earned\t50K
Real Time\t5h 30m 0s
Killed By\tFast`;

    const result = parseGameRun(legacyData);

    // Should NOT have battle_date
    expect(result.fields.battleDate).toBeUndefined();

    // Should have internal fields with underscore prefix
    expect(result.fields._date).toBeDefined();
    expect(result.fields._date.rawValue).toBe('2025-10-14');
    expect(result.fields._time).toBeDefined();
    expect(result.fields._time.rawValue).toBe('13:14:00');

    // Original fields should be migrated
    expect(result.fields.date).toBeUndefined();
    expect(result.fields.time).toBeUndefined();

    // Composite key should use legacy format
    const compositeKey = generateCompositeKey(result);
    expect(compositeKey).toContain('10'); // tier
    expect(compositeKey).toContain('5000'); // wave
    expect(compositeKey).toContain('5h 30m 0s'); // realTime
    expect(compositeKey).toBe('10|5000|5h 30m 0s');
  });

  it('should handle new game export with internal fields from persistence', () => {
    // Simulates data that was imported with battle_date, saved to CSV, and re-imported
    const persistedData = `Date\t2025-10-14
Time\t13:14:00
Battle Date\tOct 14, 2025 13:14
Game Time\t2d 1h 49m 3s
Real Time\t10h 6m 23s
Tier\t12
Wave\t7639`;

    const result = parseGameRun(persistedData);

    // Should have battle_date field (takes precedence)
    expect(result.fields.battleDate).toBeDefined();

    // Should derive _date and _time from battle_date
    expect(result.fields._date).toBeDefined();
    expect(result.fields._date.rawValue).toBe('2025-10-14');
    expect(result.fields._time).toBeDefined();
    expect(result.fields._time.rawValue).toBe('13:14:00');

    // Timestamp should be from battle_date
    expect(result.timestamp.getHours()).toBe(13);
    expect(result.timestamp.getMinutes()).toBe(14);
  });
});
