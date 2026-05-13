import { describe, expect, it } from 'vitest';
import { edge, fieldNode, FieldGraph } from '../../../index';
import { csvHeaderOf, internalFields, isInternalField } from './internal-fields.queries';

// Query behavior against a fixture graph. Production-catalog shape lives in
// `internal-fields.invariants.test.ts`.

function buildInternalFieldGraph(): FieldGraph {
  return new FieldGraph(
    [fieldNode('_date'), fieldNode('_time'), fieldNode('plainField')],
    [
      edge('_date', 'IS_INTERNAL_FIELD'),
      edge('_date', 'HAS_CSV_HEADER', '_Date'),
      edge('_time', 'IS_INTERNAL_FIELD'),
      edge('_time', 'HAS_CSV_HEADER', '_Time'),
    ],
  );
}

describe('internalFields', () => {
  it('returns ids in declaration order', () => {
    const graph = buildInternalFieldGraph();
    expect(internalFields(graph)).toEqual(['_date', '_time']);
  });
});

describe('isInternalField', () => {
  it('is true for marked fields and false otherwise', () => {
    const graph = buildInternalFieldGraph();
    expect(isInternalField(graph, '_date')).toBe(true);
    expect(isInternalField(graph, '_time')).toBe(true);
    expect(isInternalField(graph, 'plainField')).toBe(false);
    expect(isInternalField(graph, 'missing')).toBe(false);
  });
});

describe('csvHeaderOf', () => {
  it('returns the declared header or undefined', () => {
    const graph = buildInternalFieldGraph();
    expect(csvHeaderOf(graph, '_date')).toBe('_Date');
    expect(csvHeaderOf(graph, '_time')).toBe('_Time');
    expect(csvHeaderOf(graph, 'plainField')).toBeUndefined();
    expect(csvHeaderOf(graph, 'missing')).toBeUndefined();
  });
});
