import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrateV2CsvToV3 } from './v2-to-v3-migrator';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const V2_FIXTURE = join(
  REPO_ROOT,
  'sampleData',
  'app',
  'v2_data_format',
  'tower_tracking_export_687_runs_2026-04-18_16-09-14.csv'
);

function csvHeader(csv: string): string[] {
  return csv.split('\n')[0].split('\t');
}
function csvRows(csv: string): string[][] {
  return csv.split('\n').slice(1).filter(Boolean).map((l) => l.split('\t'));
}

describe('migrateV2CsvToV3', () => {
  it('returns empty result for empty input', () => {
    const result = migrateV2CsvToV3('');
    expect(result).toEqual({
      kind: 'success',
      v3Csv: '',
      runCount: 0,
      unrecognizedFields: [],
      droppedFields: [],
    });
  });

  it('preserves internal fields verbatim (_Date, _Time, _Notes, _Run Type, _Rank)', () => {
    const input = ['_Date\t_Time\t_Notes\t_Run Type\t_Rank', '2026-04-11\t12:00:00\tfoo\tfarm\t1'].join('\n');
    const result = migrateV2CsvToV3(input);
    if (result.kind !== 'success') throw new Error('expected success');
    expect(csvHeader(result.v3Csv)).toEqual(['_Date', '_Time', '_Notes', '_Run Type', '_Rank']);
    expect(csvRows(result.v3Csv)).toEqual([['2026-04-11', '12:00:00', 'foo', 'farm', '1']]);
  });

  it('maps v2 game columns to v3_ prefixed v3 targets', () => {
    const input = ['Tier\tWave\tCoins Earned', '12\t7320\t228.27T'].join('\n');
    const result = migrateV2CsvToV3(input);
    if (result.kind !== 'success') throw new Error('expected success');
    expect(csvHeader(result.v3Csv)).toEqual([
      'v3_battleReport_tier',
      'v3_battleReport_wave',
      'v3_battleReport_coinsEarned',
    ]);
    expect(csvRows(result.v3Csv)).toEqual([['12', '7320', '228.27T']]);
  });

  it('collapses multiple v2 columns that map to the same v3 target (last non-empty wins)', () => {
    // coinsFromOrb and coinsFromOrbs both map to coins_orbs.
    const input = [
      'Coins From Orb\tCoins from Orbs',
      '100\t200', // both set — later wins
      '\t300',    // empty/filled — filled wins
      '400\t',    // filled/empty — first wins (since it's the last non-empty)
    ].join('\n');
    const result = migrateV2CsvToV3(input);
    if (result.kind !== 'success') throw new Error('expected success');
    expect(csvHeader(result.v3Csv)).toEqual(['v3_coins_orbs']);
    expect(csvRows(result.v3Csv)).toEqual([['200'], ['300'], ['400']]);
  });

  it('drops intentionally-dropped columns (guardian/berserk legacy)', () => {
    const input = ['Tier\tCoins Stolen\tGuardian catches\tWave', '12\t999\t5\t7320'].join('\n');
    const result = migrateV2CsvToV3(input);
    if (result.kind !== 'success') throw new Error('expected success');
    expect(result.droppedFields.sort()).toEqual(['Coins Stolen', 'Guardian catches']);
    const headers = csvHeader(result.v3Csv);
    expect(headers).not.toContain('v3_undefined');
    expect(headers).toContain('v3_battleReport_tier');
    expect(headers).toContain('v3_battleReport_wave');
    expect(headers).not.toContain('v3_coinsStolen');
  });

  it('routes unknown columns under v3_unrecognizedField_ prefix', () => {
    const input = ['Tier\tMy Custom Column', '12\thello'].join('\n');
    const result = migrateV2CsvToV3(input);
    if (result.kind !== 'success') throw new Error('expected success');
    expect(result.unrecognizedFields).toEqual(['My Custom Column']);
    expect(csvHeader(result.v3Csv)).toContain('v3_unrecognizedField_myCustomColumn');
  });

  it('orders output columns: internal -> v3_ game -> v3_unrecognizedField_', () => {
    const input = [
      'My Custom\tTier\t_Date\tWave\tYet Another',
      'x\t12\t2026-04-11\t7320\ty',
    ].join('\n');
    const result = migrateV2CsvToV3(input);
    if (result.kind !== 'success') throw new Error('expected success');
    const headers = csvHeader(result.v3Csv);
    const firstGameIdx = headers.findIndex(
      (h) => h.startsWith('v3_') && !h.startsWith('v3_unrecognizedField_')
    );
    const firstUnrecognizedIdx = headers.findIndex((h) =>
      h.startsWith('v3_unrecognizedField_')
    );
    const lastInternalIdx = headers
      .map((h, i) => (h.startsWith('_') && !h.startsWith('v3_') ? i : -1))
      .filter((i) => i >= 0)
      .pop();
    expect(lastInternalIdx).toBeLessThan(firstGameIdx);
    expect(firstGameIdx).toBeLessThan(firstUnrecognizedIdx);
  });

  it('skips blank rows and preserves non-blank row count', () => {
    const input = ['Tier', '12', '', '13', '\n', '14'].join('\n');
    const result = migrateV2CsvToV3(input);
    if (result.kind !== 'success') throw new Error('expected success');
    expect(result.runCount).toBe(3);
    expect(csvRows(result.v3Csv)).toEqual([['12'], ['13'], ['14']]);
  });

  it('processes the full 687-run V2 fixture end-to-end without errors', () => {
    const raw = readFileSync(V2_FIXTURE, 'utf8');
    const result = migrateV2CsvToV3(raw);
    if (result.kind !== 'success') {
      throw new Error(`expected success but got error at row ${result.rowIndex}: ${result.message}`);
    }
    expect(result.runCount).toBe(687);
    // Every output header is either internal (`_*`) or v3_-prefixed
    // (including `v3_unrecognizedField_*`).
    const headers = csvHeader(result.v3Csv);
    const bad = headers.filter(
      (h) => !h.startsWith('_') && !h.startsWith('v3_')
    );
    expect(bad, `Unexpected output headers: ${bad.join(', ')}`).toEqual([]);
    // Row counts line up.
    expect(csvRows(result.v3Csv)).toHaveLength(687);
    // Internal fields are preserved.
    expect(headers.slice(0, 5)).toEqual(['_Date', '_Time', '_Notes', '_Run Type', '_Rank']);
  });
});
