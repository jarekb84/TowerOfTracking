import type { FieldGraph, FieldRef } from '../../../field-graph';

// The breakdown denominator for a section: the field whose value anchors
// the percentage bars. Undefined when the section doesn't render as a
// breakdown (renders as plain field list instead).
export function breakdownTotalOf(graph: FieldGraph, section: FieldRef): string | undefined {
  return graph.terminalOf(section, 'HAS_BREAKDOWN_TOTAL');
}

// Optional per-hour rate field shown alongside the breakdown total.
// Undefined unless the section's breakdown has a rate companion.
export function breakdownRateOf(graph: FieldGraph, section: FieldRef): string | undefined {
  return graph.terminalOf(section, 'HAS_BREAKDOWN_RATE');
}
