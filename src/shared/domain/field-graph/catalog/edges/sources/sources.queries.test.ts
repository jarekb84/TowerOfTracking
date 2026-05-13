import { describe, expect, it } from 'vitest';
import { edge, fieldNode, FieldGraph } from '../../../index';
import { sourcesOf } from './sources.queries';

// Query behavior against a fixture graph.

function buildSourcesGraph(): FieldGraph {
  return new FieldGraph(
    [fieldNode('a'), fieldNode('b'), fieldNode('total'), fieldNode('lonely')],
    [
      edge('a', 'IS_SOURCE_OF', 'total'),
      edge('b', 'IS_SOURCE_OF', 'total'),
    ],
  );
}

describe('sourcesOf', () => {
  it('returns fields contributing to a total', () => {
    expect(sourcesOf(buildSourcesGraph(), 'total')).toEqual(['a', 'b']);
  });

  it('returns [] for a field that is not a total', () => {
    const graph = buildSourcesGraph();
    expect(sourcesOf(graph, 'a')).toEqual([]);
    expect(sourcesOf(graph, 'lonely')).toEqual([]);
  });

  it('returns [] for an unknown field id', () => {
    expect(sourcesOf(buildSourcesGraph(), 'never')).toEqual([]);
  });
});
