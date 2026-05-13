import type { FieldGraph, FieldRef } from '../../../field-graph';

// Fields that sum into the given total (IS_SOURCE_OF edges pointing AT it).
// Genuine sum-to-total breakdowns: the values literally add up.
export function sourcesOf(graph: FieldGraph, totalField: FieldRef): readonly string[] {
  return graph.edgesTo(totalField, 'IS_SOURCE_OF').map((e) => e.from);
}
