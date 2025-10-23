import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseGenericCsv } from './csv-parser';

describe('CSV Parser - Bulk Export Integration', () => {
  const DATA_KEY = 'tower-tracking-csv-data';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should correctly handle bulk export data without false warnings', () => {
    // This is the exact header line from bulk export
    const bulkExportHeaders = '_Date\t_Time\t_Notes\t_Run Type\tBattle Date\tArmor Shards\tBasic\tBlack Hole Damage';
    const dataRow = '2025-01-15\t14:30:00\tTest\tfarm\tOct 14, 2025 13:14\t21\t419803\t1.44D';
    const csvData = `${bulkExportHeaders}\n${dataRow}`;

    // Simulate existing data in localStorage (first import)
    localStorage.setItem(DATA_KEY, csvData);

    // Now re-import the same data (should have no warnings)
    const result = parseGenericCsv(csvData);

    expect(result.success.length).toBe(1);
    expect(result.failed).toBe(0);

    // Check field mapping report
    const report = result.fieldMappingReport;

    // Internal fields should be recognized (not flagged as new or similar)
    const internalFields = ['_Date', '_Time', '_Notes', '_Run Type'];
    for (const field of internalFields) {
      const mapping = report.mappedFields.find(m => m.csvHeader === field);
      expect(mapping).toBeDefined();
      // Should be exact match, not new or similar
      expect(mapping?.status).toBe('exact-match');
    }

    // Battle Date should be recognized
    const battleDateMapping = report.mappedFields.find(m => m.csvHeader === 'Battle Date');
    expect(battleDateMapping).toBeDefined();
    expect(battleDateMapping?.status).toBe('exact-match');

    // Should have NO new fields (all fields exist in storage)
    expect(report.newFields).toEqual([]);

    // Should have NO similar field warnings
    expect(report.similarFields).toEqual([]);
  });

  it('should show display names not camelCase in mapped field column', () => {
    const csvData = '_Date\t_Time\tArmor Shards\tBattle Date\n2025-01-15\t14:30:00\t21\tOct 14, 2025';

    const result = parseGenericCsv(csvData);

    // The "Mapped Field" column should show display names
    const mappedFields = result.fieldMappingReport.mappedFields;

    // Check that we're showing display names, not camelCase
    const dateField = mappedFields.find(m => m.csvHeader === '_Date');
    expect(dateField?.camelCase).toBe('_Date'); // Should be display name, not "_date"

    const armorField = mappedFields.find(m => m.csvHeader === 'Armor Shards');
    expect(armorField?.camelCase).toBe('Armor Shards'); // Should be "Armor Shards", not "armorShards"
  });

  it('should detect actually new fields correctly', () => {
    // Set up existing data with proper headers (display names)
    const existingData = '_Date\t_Time\ttier\twave\n2025-01-15\t14:30:00\t10\t1000';
    localStorage.setItem(DATA_KEY, existingData);

    // Import data with a truly new field
    const newData = '_Date\t_Time\ttier\twave\tcustomNewField\n2025-01-16\t15:00:00\t11\t1100\t999';

    const result = parseGenericCsv(newData);

    const report = result.fieldMappingReport;

    // Debug: log what we got
    console.log('New fields:', report.newFields);
    console.log('All fields status:', report.mappedFields.map(f => ({ header: f.csvHeader, status: f.status })));

    // Existing fields should be exact matches
    expect(report.mappedFields.find(m => m.csvHeader === '_Date')?.status).toBe('exact-match');
    expect(report.mappedFields.find(m => m.csvHeader === 'tier')?.status).toBe('exact-match');

    // New field should be flagged as new
    expect(report.newFields).toContain('customNewField');
    expect(report.mappedFields.find(m => m.csvHeader === 'customNewField')?.status).toBe('new-field');
  });

  it('should detect similar fields with reasonable threshold', () => {
    // Set up existing data
    const existingData = '_Date\t_Time\tCoins Earned\n2025-01-15\t14:30:00\t50000';
    localStorage.setItem(DATA_KEY, existingData);

    // Import data with similar field name (typo: missing 's' - "Coin Earned" instead of "Coins Earned")
    const newData = '_Date\t_Time\tCoin Earned\n2025-01-16\t15:00:00\t60000';

    const result = parseGenericCsv(newData);

    const report = result.fieldMappingReport;

    // Should detect similarity (score: 0.909 > 0.85 threshold)
    const similarField = report.similarFields.find(s => s.importedField === 'Coin Earned');
    expect(similarField).toBeDefined();
    expect(similarField?.existingField).toBe('Coins Earned');
    expect(similarField?.similarityType).toBe('levenshtein');
  });

  it('should NOT falsely match completely different fields', () => {
    // Set up existing data
    const existingData = '_Date\t_Time\tCoins Earned\n2025-01-15\t14:30:00\t50000';
    localStorage.setItem(DATA_KEY, existingData);

    // Import data with completely different field
    const newData = '_Date\t_Time\tBlack Hole Damage\n2025-01-16\t15:00:00\t1.44D';

    const result = parseGenericCsv(newData);

    const report = result.fieldMappingReport;

    // "Black Hole Damage" should NOT be similar to "Coins Earned"
    // (This was the bug shown in the screenshot)
    const blackHoleField = report.similarFields.find(s => s.importedField === 'Black Hole Damage');
    expect(blackHoleField).toBeUndefined();

    // It should be a new field or exact match
    const blackHoleMapping = report.mappedFields.find(m => m.csvHeader === 'Black Hole Damage');
    expect(blackHoleMapping?.status).not.toBe('similar-field');
  });

  it('should detect field with removed spaces as similar', () => {
    // Set up existing data with "Waves Skipped"
    const existingData = '_Date\t_Time\tWaves Skipped\n2025-01-15\t14:30:00\t1000';
    localStorage.setItem(DATA_KEY, existingData);

    // Import data with same field but no spaces: "wavesskipped"
    const newData = '_Date\t_Time\twavesskipped\n2025-01-16\t15:00:00\t1100';

    const result = parseGenericCsv(newData);

    const report = result.fieldMappingReport;

    // Debug
    console.log('Similar fields:', report.similarFields);
    console.log('wavesskipped status:', report.mappedFields.find(m => m.csvHeader === 'wavesskipped'));

    // Should detect similarity (normalized: wavesskipped = wavesskipped)
    const similarField = report.similarFields.find(s => s.importedField === 'wavesskipped');
    expect(similarField).toBeDefined();
    expect(similarField?.existingField).toBe('Waves Skipped');
    expect(similarField?.similarityType).toBe('case-variation');
  });
});
