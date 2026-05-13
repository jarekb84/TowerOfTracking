import { describe, expect, it } from 'vitest';
import { edge, fieldNode, FieldGraph } from '../../../index';
import { dataTypeOf } from './data-types.queries';

// Query behavior against a fixture graph. Production-catalog shape lives in
// `data-types.invariants.test.ts`.

function buildDataTypeGraph(): FieldGraph {
  return new FieldGraph(
    [fieldNode('a'), fieldNode('b'), fieldNode('c'), fieldNode('untyped')],
    [
      edge('a', 'IS_OF_TYPE', 'date'),
      edge('b', 'IS_OF_TYPE', 'number'),
      edge('c', 'IS_OF_TYPE', 'string'),
    ],
  );
}

describe('dataTypeOf', () => {
  it('returns the declared data type for a typed field', () => {
    const graph = buildDataTypeGraph();
    expect(dataTypeOf(graph, 'a')).toBe('date');
    expect(dataTypeOf(graph, 'b')).toBe('number');
    expect(dataTypeOf(graph, 'c')).toBe('string');
  });

  it('returns undefined when no IS_OF_TYPE edge is declared', () => {
    const graph = buildDataTypeGraph();
    expect(dataTypeOf(graph, 'untyped')).toBeUndefined();
    expect(dataTypeOf(graph, 'missing')).toBeUndefined();
  });

  // Defensive — the engine validates terminal types are strings but doesn't
  // restrict the value space. dataTypeOf rejects values outside DATA_TYPES.
  it('returns undefined when the declared terminal is not a known DataType', () => {
    const graph = new FieldGraph(
      [fieldNode('weird')],
      [edge('weird', 'IS_OF_TYPE', 'not-a-real-type')],
    );
    expect(dataTypeOf(graph, 'weird')).toBeUndefined();
  });
});
