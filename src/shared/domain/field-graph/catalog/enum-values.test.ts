import { describe, expect, it } from 'vitest';
import { RUN_TYPE_VALUES } from '../../run-types/types';
import { buildGraph } from '../build-graph';
import { _RUN_TYPE_NODE } from './fields.nodes';

// Invariants for the first ACCEPTS_VALUE edges (commit 4). Guards against
// drift between `RUN_TYPE_VALUES` (the TS source of truth) and the graph
// declarations. Adding a new run type in the TS const should flow through to
// the graph via the catalog's derivation; this test catches the case where
// someone adds a value to one side but not the other.

describe('field-graph enum values — _runType (commit 4)', () => {
  const graph = buildGraph();

  it('_runType accepts every wire value declared in RUN_TYPE_VALUES', () => {
    expect(new Set(graph.acceptedValuesFor(_RUN_TYPE_NODE))).toEqual(new Set(RUN_TYPE_VALUES));
  });

  it('every _runType enum value carries display name and color metadata', () => {
    const missingMetadata = graph.enumValuesOf(_RUN_TYPE_NODE).filter((enumId) => {
      return !graph.displayNameOf(enumId) || !graph.colorOf(enumId);
    });
    expect(missingMetadata).toEqual([]);
  });

  it('enumValueMeta resolves every accepted wire value with its display name and color', () => {
    for (const wireValue of RUN_TYPE_VALUES) {
      const meta = graph.enumValueMeta(_RUN_TYPE_NODE, wireValue);
      expect(meta, `no enum-value metadata for wire value '${wireValue}'`).toBeTruthy();
      expect(meta?.wireValue).toBe(wireValue);
      expect(meta?.displayName).toBeTruthy();
      expect(meta?.color).toBeTruthy();
    }
  });

  it('matchAcceptedValue accepts every declared wire value and rejects unknowns', () => {
    for (const wireValue of RUN_TYPE_VALUES) {
      expect(graph.matchAcceptedValue(_RUN_TYPE_NODE, wireValue)).toBe(wireValue);
    }
    expect(graph.matchAcceptedValue(_RUN_TYPE_NODE, 'dissonance')).toBeNull();
    expect(graph.matchAcceptedValue(_RUN_TYPE_NODE, '')).toBeNull();
  });
});
