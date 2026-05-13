import { describe, expect, it } from 'vitest';
import { appGraph, dataTypeOf } from '../../../index';
import {
  _DATE_NODE,
  _NOTES_NODE,
  _RANK_NODE,
  _RUN_TYPE_NODE,
  _TIME_NODE,
  BATTLE_REPORT__BATTLE_DATE_NODE,
  BATTLE_REPORT__GAME_TIME_NODE,
  BATTLE_REPORT__KILLED_BY_NODE,
  BATTLE_REPORT__REAL_TIME_NODE,
  BATTLE_REPORT__TIER_NODE,
} from '../../fields.nodes';

// Production-catalog shape for IS_OF_TYPE. The cardinality `'at-least-one'`
// in `EDGE_META` makes a missing declaration a build-time error in the
// engine, so the per-Field check below is belt-and-braces — failing it
// here points at where the gap is.

describe('data-types catalog invariants', () => {
  it('every Field has exactly one IS_OF_TYPE edge', () => {
    const missing: string[] = [];
    for (const node of appGraph().nodesOfKind('Field')) {
      if (dataTypeOf(node) === undefined) missing.push(node.id);
    }
    expect(missing, `fields missing IS_OF_TYPE:\n${missing.join('\n')}`).toEqual([]);
  });

  it('internal-field data types match the spec', () => {
    expect(dataTypeOf(_DATE_NODE)).toBe('date');
    expect(dataTypeOf(_TIME_NODE)).toBe('string');
    expect(dataTypeOf(_NOTES_NODE)).toBe('string');
    expect(dataTypeOf(_RUN_TYPE_NODE)).toBe('string');
    expect(dataTypeOf(_RANK_NODE)).toBe('number');
  });

  // Spot-check the non-number game fields. Everything else falls through to
  // the modal `'number'` default in `data-types.edges.ts`.
  it('non-number game fields are explicitly typed', () => {
    expect(dataTypeOf(BATTLE_REPORT__BATTLE_DATE_NODE)).toBe('date');
    expect(dataTypeOf(BATTLE_REPORT__GAME_TIME_NODE)).toBe('duration');
    expect(dataTypeOf(BATTLE_REPORT__REAL_TIME_NODE)).toBe('duration');
    expect(dataTypeOf(BATTLE_REPORT__KILLED_BY_NODE)).toBe('string');
    expect(dataTypeOf(BATTLE_REPORT__TIER_NODE)).toBe('tier');
  });
});
