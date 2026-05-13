import { describe, expect, it } from 'vitest';
import { edge, fieldNode, FieldGraph } from '../../../index';
import {
  fieldsMeasuredAgainst,
  measurementTargetsOf,
} from './measurements.queries';

// Query behavior against fixture graphs.

function buildGraph(): FieldGraph {
  return new FieldGraph(
    [fieldNode('orbs'), fieldNode('thorns'), fieldNode('lonely'), fieldNode('total')],
    [
      edge('orbs', 'IS_MEASURED_AGAINST', 'total'),
      edge('thorns', 'IS_MEASURED_AGAINST', 'total'),
    ],
  );
}

describe('fieldsMeasuredAgainst', () => {
  it('returns fields anchored to a total via IS_MEASURED_AGAINST', () => {
    expect(fieldsMeasuredAgainst(buildGraph(), 'total')).toEqual(['orbs', 'thorns']);
  });

  it('returns [] for a field that nothing is measured against', () => {
    expect(fieldsMeasuredAgainst(buildGraph(), 'lonely')).toEqual([]);
  });

  it('does not conflate IS_SOURCE_OF and IS_MEASURED_AGAINST', () => {
    const graph = new FieldGraph(
      [fieldNode('src'), fieldNode('measured'), fieldNode('total')],
      [
        edge('src', 'IS_SOURCE_OF', 'total'),
        edge('measured', 'IS_MEASURED_AGAINST', 'total'),
      ],
    );
    expect(fieldsMeasuredAgainst(graph, 'total')).toEqual(['measured']);
  });
});

describe('measurementTargetsOf', () => {
  it('returns the target a field is measured against', () => {
    expect(measurementTargetsOf(buildGraph(), 'orbs')).toEqual(['total']);
  });

  it('returns [] for a field with no IS_MEASURED_AGAINST edge', () => {
    expect(measurementTargetsOf(buildGraph(), 'lonely')).toEqual([]);
  });
});
