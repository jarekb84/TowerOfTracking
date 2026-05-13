import { describe, expect, it } from 'vitest';
import { FieldGraph } from '../../../field-graph';
import { edge, fieldNode } from '../../../builders';
import {
  derivationsOf,
  derivedFields,
  deriverNameOf,
  fieldsDerivedFrom,
} from './derivations.queries';

// Query behavior against a fixture graph. Production-catalog shape lives in
// `derivations.invariants.test.ts`.

function buildDerivationGraph(): FieldGraph {
  return new FieldGraph(
    [
      fieldNode('_derivedA'),
      fieldNode('_derivedB'),
      fieldNode('inputX'),
      fieldNode('plainField'),
    ],
    [
      edge('_derivedA', 'IS_DERIVED_FROM', 'inputX', { deriver: 'deriver:fromX' }),
      edge('_derivedB', 'IS_DERIVED_FROM', 'inputX', { deriver: 'deriver:bFromX' }),
    ],
  );
}

describe('derivationsOf', () => {
  it('returns outbound IS_DERIVED_FROM edges with their deriver payloads', () => {
    const graph = buildDerivationGraph();
    const edges = derivationsOf(graph, '_derivedA');
    expect(edges).toHaveLength(1);
    expect(edges[0].to).toBe('inputX');
    expect(deriverNameOf(edges[0])).toBe('deriver:fromX');
  });

  it('returns an empty array for non-derived fields', () => {
    const graph = buildDerivationGraph();
    expect(derivationsOf(graph, 'plainField')).toHaveLength(0);
  });
});

describe('fieldsDerivedFrom', () => {
  it('returns every field whose derivation references the input', () => {
    const graph = buildDerivationGraph();
    expect([...fieldsDerivedFrom(graph, 'inputX')].sort()).toEqual(['_derivedA', '_derivedB']);
  });

  it('returns an empty array when no field derives from the input', () => {
    const graph = buildDerivationGraph();
    expect(fieldsDerivedFrom(graph, 'plainField')).toEqual([]);
  });
});

describe('derivedFields', () => {
  it('returns the de-duped set of derived field ids', () => {
    const graph = buildDerivationGraph();
    expect([...derivedFields(graph)].sort()).toEqual(['_derivedA', '_derivedB']);
  });
});

describe('deriverNameOf', () => {
  it('returns undefined when the edge has no deriver payload', () => {
    const e = edge('_x', 'IS_DERIVED_FROM', 'y');
    expect(deriverNameOf(e)).toBeUndefined();
  });
});
