import type { FieldGraph, FieldRef } from '../../../field-graph';

// Returned in declaration order from `internal-fields.edges.ts` — the CSV
// exporter relies on this to set column ordering.
export function internalFields(graph: FieldGraph): readonly string[] {
  return graph.edgesOfType('IS_INTERNAL_FIELD').map((e) => e.from);
}

export function isInternalField(graph: FieldGraph, field: FieldRef): boolean {
  return graph.edgesFrom(field, 'IS_INTERNAL_FIELD').length > 0;
}

// Override only — most fields don't declare HAS_CSV_HEADER. Callers should
// fall back to the default (`v3_<canonical>` prefix) when this returns
// undefined.
export function csvHeaderOf(graph: FieldGraph, field: FieldRef): string | undefined {
  return graph.terminalOf(field, 'HAS_CSV_HEADER');
}
