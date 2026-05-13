import type { FieldGraph, FieldRef } from '../../../field-graph';
import type { Edge } from '../../../types';
import type { DeriverName } from './derivations.derivers';

// Outbound IS_DERIVED_FROM edges from `field`. Each carries a `{ deriver }`
// payload naming the function in `DERIVERS` that produces this field's value.
// Returned in declaration order so callers iterating multiple inputs can
// rely on deterministic ordering.
export function derivationsOf(graph: FieldGraph, field: FieldRef): readonly Edge[] {
  return graph.edgesFrom(field, 'IS_DERIVED_FROM');
}

// Inverse direction: every field that derives FROM the input field. Used by
// the edit-time cascade in `apply-derivations.ts` to walk downstream
// dependencies when an input changes.
export function fieldsDerivedFrom(graph: FieldGraph, field: FieldRef): readonly string[] {
  return graph.edgesTo(field, 'IS_DERIVED_FROM').map((e) => e.from);
}

// Every field with at least one IS_DERIVED_FROM edge. Used by the parse-time
// cascade to find the universe of derivable fields without scanning all Field
// nodes.
export function derivedFields(graph: FieldGraph): readonly string[] {
  const ids = new Set<string>();
  for (const e of graph.edgesOfType('IS_DERIVED_FROM')) ids.add(e.from);
  return Array.from(ids);
}

export function deriverNameOf(edge: Edge): DeriverName | undefined {
  const name = edge.payload?.deriver;
  return typeof name === 'string' ? (name as DeriverName) : undefined;
}
