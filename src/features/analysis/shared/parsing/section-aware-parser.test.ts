import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseV28SectionedInput, looksLikeV28SectionedInput } from './section-aware-parser';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..');
const V28_SAMPLES_DIR = join(REPO_ROOT, 'sampleData', 'v28');

function readSample(name: string): string {
  return readFileSync(join(V28_SAMPLES_DIR, name), 'utf8');
}

describe('parseV28SectionedInput', () => {
  it('emits <sectionCamel>_<labelCamel> keys with tab-split values', () => {
    const input = [
      'Battle Report',
      '    Tier\t12',
      '    Wave\t7320',
      'Damage',
      '    Death Wave\t4.61s',
      '    Black Hole\t72.37N',
    ].join('\n');

    const result = parseV28SectionedInput(input);
    expect(result.battleReport_tier).toBe('12');
    expect(result.battleReport_wave).toBe('7320');
    expect(result.damage_deathWave).toBe('4.61s');
    expect(result.damage_blackHole).toBe('72.37N');
  });

  it('disambiguates same label across multiple sections', () => {
    const input = [
      'Damage',
      '    Black Hole\t100',
      'Coins',
      '    Black Hole\t200',
      'Enemies Hit By',
      '    Black Hole\t300',
    ].join('\n');

    const result = parseV28SectionedInput(input);
    expect(result.damage_blackHole).toBe('100');
    expect(result.coins_blackHole).toBe('200');
    expect(result.enemiesHitBy_blackHole).toBe('300');
  });

  it('ignores tab-lines that appear before the first section header', () => {
    const input = ['Stray Line\tvalue', 'Damage', '    Death Wave\t4.61s'].join('\n');
    const result = parseV28SectionedInput(input);
    expect(result).toEqual({ damage_deathWave: '4.61s' });
  });

  it('skips empty and whitespace-only lines', () => {
    const input = ['Damage', '', '   ', '    Death Wave\t4.61s', '\n\n'].join('\n');
    const result = parseV28SectionedInput(input);
    expect(result).toEqual({ damage_deathWave: '4.61s' });
  });

  it('strips special characters from labels (Coins / Wave -> coinsWave)', () => {
    const input = ['Coins', '    Coins / Wave\t100', 'Records', '    Highest Coins / Minute\t50'].join('\n');
    const result = parseV28SectionedInput(input);
    expect(result.coins_coinsWave).toBe('100');
    expect(result.records_highestCoinsMinute).toBe('50');
  });

  it('parses every V28 sample file without emitting any collision-prone bare labels', () => {
    const files = readdirSync(V28_SAMPLES_DIR).filter((f) => f.toLowerCase().endsWith('.txt'));
    expect(files.length).toBeGreaterThan(0);

    for (const fileName of files) {
      const raw = readSample(fileName);
      const result = parseV28SectionedInput(raw);
      const keys = Object.keys(result);

      expect(keys.length, `${fileName} should produce keys`).toBeGreaterThan(0);

      const malformed = keys.filter((k) => !/^[a-z][a-zA-Z0-9]*_[a-zA-Z0-9]+$/.test(k));
      expect(malformed, `${fileName} keys should all be <sectionCamel>_<labelCamel>`).toEqual([]);
    }
  });

  it('resolves the Farming sample Battle Report fields', () => {
    const result = parseV28SectionedInput(readSample('Farming_2026-04-11.txt'));
    expect(result.battleReport_tier).toBe('12');
    expect(result.battleReport_wave).toBe('7320');
    expect(result.battleReport_coinsEarned).toBe('228.27T');
    expect(result.battleReport_cellsEarned).toBe('177.92K');
  });
});

describe('looksLikeV28SectionedInput', () => {
  it('returns true for a section-header-then-tabline pattern', () => {
    expect(looksLikeV28SectionedInput('Damage\n    Death Wave\t100')).toBe(true);
  });

  it('returns false for a flat tab-delimited paste', () => {
    expect(looksLikeV28SectionedInput('Game Time\t1h\nReal Time\t2h')).toBe(false);
  });

  it('returns true for real V28 samples', () => {
    expect(looksLikeV28SectionedInput(readSample('Farming_2026-04-11.txt'))).toBe(true);
    expect(looksLikeV28SectionedInput(readSample('Tournament_2026-04-10.txt'))).toBe(true);
  });
});
