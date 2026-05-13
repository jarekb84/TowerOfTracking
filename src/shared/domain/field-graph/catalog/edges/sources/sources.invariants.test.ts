import { describe, expect, it } from 'vitest';
import { appGraph, sourcesOf } from '../../../index';
import supportedFieldsData from '../../../../../../../sampleData/supportedFields.json';
import {
  BATTLE_REPORT__COINS_EARNED_NODE,
  COINS__COINS_EARNED_NODE,
  DAMAGE__DAMAGE_DEALT_NODE,
  TOTAL_ENEMIES__TOTAL_ENEMIES_NODE,
} from '../../fields.nodes';

// Production-catalog shape for IS_SOURCE_OF: genuine sum-to-total
// breakdowns (coins, damage, totalEnemies destroyed). Sources literally add
// up to the total. Supplementary breakdowns use IS_MEASURED_AGAINST and
// have their own invariant tests in `../measurements/`.

const supportedFields = supportedFieldsData as string[];

const COIN_SOURCE_EXPLICIT_EXCLUDES: ReadonlySet<string> = new Set([
  COINS__COINS_EARNED_NODE.id,
]);

const DAMAGE_SOURCE_EXPLICIT_EXCLUDES: ReadonlySet<string> = new Set([
  DAMAGE__DAMAGE_DEALT_NODE.id,
]);

const TOTAL_ENEMIES_SOURCE_EXPLICIT_EXCLUDES: ReadonlySet<string> = new Set([
  TOTAL_ENEMIES__TOTAL_ENEMIES_NODE.id,
  // `totalEnemies_summonedEnemies` is IS_MEASURED_AGAINST the total
  // (rendered in the killedWithEffectActive supplementary breakdown), not
  // an IS_SOURCE_OF — covered in the measurements invariants.
  'totalEnemies_summonedEnemies',
]);

describe('sources catalog invariants', () => {
  it('every coins_* field in supportedFields is a source of battleReport_coinsEarned or an explicit exclude', () => {
    const coinSources = new Set(sourcesOf(BATTLE_REPORT__COINS_EARNED_NODE));
    const missing = supportedFields
      .filter((id) => id.startsWith('coins_'))
      .filter((id) => !coinSources.has(id) && !COIN_SOURCE_EXPLICIT_EXCLUDES.has(id));
    expect(missing, `coins_* fields missing IS_SOURCE_OF battleReport_coinsEarned:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every damage_* field in supportedFields is a source of damage_damageDealt or an explicit exclude', () => {
    const damageSources = new Set(sourcesOf(DAMAGE__DAMAGE_DEALT_NODE));
    const missing = supportedFields
      .filter((id) => id.startsWith('damage_'))
      .filter((id) => !damageSources.has(id) && !DAMAGE_SOURCE_EXPLICIT_EXCLUDES.has(id));
    expect(missing, `damage_* fields missing IS_SOURCE_OF damage_damageDealt:\n${missing.join('\n')}`).toEqual([]);
  });

  it('every totalEnemies_* field in supportedFields is a source of totalEnemies_totalEnemies or an explicit exclude', () => {
    const enemySources = new Set(sourcesOf(TOTAL_ENEMIES__TOTAL_ENEMIES_NODE));
    const missing = supportedFields
      .filter((id) => id.startsWith('totalEnemies_'))
      .filter((id) => !enemySources.has(id) && !TOTAL_ENEMIES_SOURCE_EXPLICIT_EXCLUDES.has(id));
    expect(missing, `totalEnemies_* fields missing IS_SOURCE_OF totalEnemies_totalEnemies:\n${missing.join('\n')}`).toEqual([]);
  });

  it('healthRegenerated_lifesteal is a source of damage_damageDealt', () => {
    expect(sourcesOf(DAMAGE__DAMAGE_DEALT_NODE)).toContain('healthRegenerated_lifesteal');
  });

  it('every IS_SOURCE_OF edge resolves to a declared Field on both ends', () => {
    for (const edge of appGraph().edgesOfType('IS_SOURCE_OF')) {
      expect(appGraph().getField(edge.from), `IS_SOURCE_OF source '${edge.from}' is not a Field`).not.toBeNull();
      expect(appGraph().getField(edge.to as string), `IS_SOURCE_OF target '${edge.to}' is not a Field`).not.toBeNull();
    }
  });
});
