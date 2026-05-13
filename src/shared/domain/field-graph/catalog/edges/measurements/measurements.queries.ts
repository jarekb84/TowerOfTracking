import type { FieldGraph, FieldRef } from '../../../field-graph';

// Fields anchored to the given total via IS_MEASURED_AGAINST. Supplementary
// breakdowns: each source is a categorical view that shares the total as a
// reference yardstick but doesn't strictly sum to it (sources may overlap
// on the underlying domain).
export function fieldsMeasuredAgainst(graph: FieldGraph, totalField: FieldRef): readonly string[] {
  return graph.edgesTo(totalField, 'IS_MEASURED_AGAINST').map((e) => e.from);
}

// The target a field is measured against (outbound IS_MEASURED_AGAINST).
// Returns multiple entries only if a field is anchored to more than one
// total — uncommon today, allowed by `cardinality: 'many'`.
export function measurementTargetsOf(graph: FieldGraph, field: FieldRef): readonly string[] {
  return graph.edgesFrom(field, 'IS_MEASURED_AGAINST').map((e) => e.to as string);
}
