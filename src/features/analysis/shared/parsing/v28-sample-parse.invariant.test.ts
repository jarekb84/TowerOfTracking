import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseGameRun } from './data-parser';

/**
 * Invariant tests against the committed V28 sample exports.
 *
 * Each of these would have caught a bug we shipped during the V28
 * migration rollout:
 *
 * - "Killed By" landed as number/0 because the section-aware parser
 *   passed the composite key `battleReport_killedBy` to the field-type
 *   detector instead of the display label "Killed By". This test
 *   asserts that every sample V28 file produces a STRING field for
 *   `battleReport_killedBy`, not a number.
 *
 * - Individual fields (`coins_goldenTower`, `coins_waveSkip`, ...) went
 *   silently missing after import. This test asserts that the Coins
 *   section of each V28 sample produces exactly the expected set of
 *   `coins_<label>` keys in the parsed ParsedGameRun.fields map.
 *
 * - battleReport_battleDate / battleReport_realTime / battleReport_gameTime
 *   must land as `date` or `duration` dataType respectively, otherwise
 *   downstream timestamp extraction silently falls back to the current
 *   time.
 */

const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..');
const V28_SAMPLES_DIR = join(REPO_ROOT, 'sampleData', 'v28');

function readSample(name: string): string {
  return readFileSync(join(V28_SAMPLES_DIR, name), 'utf8');
}

function listV28Samples(): string[] {
  return readdirSync(V28_SAMPLES_DIR)
    .filter((f) => f.toLowerCase().endsWith('.txt'))
    .sort();
}

describe('V28 sample parse invariants', () => {
  it('every sample file emits the expected type for headline Battle Report fields', () => {
    const samples = listV28Samples();
    expect(samples.length).toBeGreaterThan(0);

    for (const fileName of samples) {
      const run = parseGameRun(readSample(fileName));

      // Killed By must be a string (not number/0). This was the regression.
      const killedBy = run.fields.battleReport_killedBy;
      expect(killedBy, `${fileName}: missing battleReport_killedBy`).toBeDefined();
      expect(killedBy!.dataType, `${fileName}: battleReport_killedBy dataType`).toBe('string');

      // Battle Date -> date
      const battleDate = run.fields.battleReport_battleDate;
      expect(battleDate, `${fileName}: missing battleReport_battleDate`).toBeDefined();
      expect(battleDate!.dataType, `${fileName}: battleReport_battleDate dataType`).toBe('date');

      // Real Time / Game Time -> duration (parsed into seconds)
      const realTime = run.fields.battleReport_realTime;
      expect(realTime, `${fileName}: missing battleReport_realTime`).toBeDefined();
      expect(realTime!.dataType, `${fileName}: battleReport_realTime dataType`).toBe('duration');

      const gameTime = run.fields.battleReport_gameTime;
      expect(gameTime, `${fileName}: missing battleReport_gameTime`).toBeDefined();
      expect(gameTime!.dataType, `${fileName}: battleReport_gameTime dataType`).toBe('duration');
    }
  });

  it('the Farming sample emits every expected Coins section field', () => {
    const run = parseGameRun(readSample('Farming_2026-04-11.txt'));
    // Every label that appears under "Coins" in Farming_2026-04-11.txt
    // must land as `coins_<labelCamel>` with a non-empty raw value.
    const expected: Record<string, string> = {
      coins_coinsEarned: '228.27T',
      coins_coinBonusUpgrade: '166.74T',
      coins_coinsFromCoinBonuses: '227.61T',
      coins_criticalCoin: '10.26T',
      coins_goldenTower: '163.61T',
      coins_goldenCombo: '0',
      coins_deathWave: '91.75T',
      coins_spotlight: '82.23T',
      coins_blackHole: '155.26T',
      coins_orbs: '0',
      coins_goldenBot: '60.57T',
      coins_waveSkip: '56.80T',
      coins_coinsWave: '8.03B',
      coins_coinsFetched: '549.91B',
      coins_bountyCoins: '0',
    };

    for (const [key, rawValue] of Object.entries(expected)) {
      const field = run.fields[key];
      expect(field, `missing ${key} in parsed Farming sample`).toBeDefined();
      expect(field!.rawValue, `wrong rawValue for ${key}`).toBe(rawValue);
    }
  });

  it('the Farming sample emits a numeric Scatter count under totalEnemies', () => {
    // Regression safety: labels that happen to match special string
    // patterns ("Scatters" contains no "time"/"date") must still be
    // typed as number.
    const run = parseGameRun(readSample('Farming_2026-04-11.txt'));
    const scatters = run.fields.totalEnemies_scatters;
    expect(scatters).toBeDefined();
    expect(scatters!.dataType).toBe('number');
    expect(scatters!.value).toBeGreaterThan(0);
  });
});
