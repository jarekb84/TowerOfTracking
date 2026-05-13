import { describe, expect, it } from 'vitest';
import { appGraph, fieldsMeasuredAgainst } from '../../../index';
import supportedFieldsData from '../../../../../../../sampleData/supportedFields.json';
import { TOTAL_ENEMIES__TOTAL_ENEMIES_NODE } from '../../fields.nodes';

// Production-catalog shape for IS_MEASURED_AGAINST.
//
// Today, every field under the three supplementary-breakdown storage
// prefixes (`enemiesHitBy_`, `enemiesDestroyedBy_`, `killedWithEffectActive_`)
// is anchored to `totalEnemies_totalEnemies`. Plus the cross-section
// `totalEnemies_summonedEnemies` is anchored too (it renders in the
// killedWithEffectActive supplementary breakdown).

const supportedFields = supportedFieldsData as string[];

const SUPPLEMENTARY_PREFIXES = [
  'enemiesHitBy_',
  'enemiesDestroyedBy_',
  'killedWithEffectActive_',
] as const;

describe('measurements catalog invariants', () => {
  it('every supplementary-prefix field in supportedFields is IS_MEASURED_AGAINST totalEnemies_totalEnemies', () => {
    const measured = new Set(fieldsMeasuredAgainst(TOTAL_ENEMIES__TOTAL_ENEMIES_NODE));
    const missing = supportedFields
      .filter((id) => SUPPLEMENTARY_PREFIXES.some((prefix) => id.startsWith(prefix)))
      .filter((id) => !measured.has(id));
    expect(
      missing,
      `supplementary-breakdown fields missing IS_MEASURED_AGAINST totalEnemies_totalEnemies:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('totalEnemies_summonedEnemies is IS_MEASURED_AGAINST totalEnemies_totalEnemies', () => {
    expect(fieldsMeasuredAgainst(TOTAL_ENEMIES__TOTAL_ENEMIES_NODE)).toContain(
      'totalEnemies_summonedEnemies',
    );
  });

  it('every IS_MEASURED_AGAINST edge resolves to a declared Field on both ends', () => {
    for (const edge of appGraph().edgesOfType('IS_MEASURED_AGAINST')) {
      expect(appGraph().getField(edge.from), `IS_MEASURED_AGAINST source '${edge.from}' is not a Field`).not.toBeNull();
      expect(appGraph().getField(edge.to as string), `IS_MEASURED_AGAINST target '${edge.to}' is not a Field`).not.toBeNull();
    }
  });

  it('no field is both IS_SOURCE_OF and IS_MEASURED_AGAINST the same total', () => {
    const overlaps: string[] = [];
    for (const edge of appGraph().edgesOfType('IS_MEASURED_AGAINST')) {
      const sourceOfSame = appGraph()
        .edgesFrom(edge.from, 'IS_SOURCE_OF')
        .some((e) => e.to === edge.to);
      if (sourceOfSame) overlaps.push(`${edge.from} → ${edge.to}`);
    }
    expect(
      overlaps,
      `fields with both IS_SOURCE_OF and IS_MEASURED_AGAINST same total:\n${overlaps.join('\n')}`,
    ).toEqual([]);
  });
});
