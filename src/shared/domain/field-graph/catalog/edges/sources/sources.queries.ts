import type { FieldGraph, FieldRef } from '../../../field-graph';

export function sourcesOf(graph: FieldGraph, totalField: FieldRef): readonly string[] {
  return graph.edgesTo(totalField, 'IS_SOURCE_OF').map((e) => e.from);
}
