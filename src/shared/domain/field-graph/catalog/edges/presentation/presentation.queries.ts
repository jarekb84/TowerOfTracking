import type { FieldGraph, FieldRef } from '../../../field-graph';

// HAS_DISPLAY_NAME and HAS_COLOR may originate at either Field or EnumValue
// nodes (per `EDGE_META`), so these queries are kept in their own
// purpose-named folder rather than under either source-kind concept.

export function displayNameOf(graph: FieldGraph, node: FieldRef): string | undefined {
  return graph.terminalOf(node, 'HAS_DISPLAY_NAME');
}

export function colorOf(graph: FieldGraph, node: FieldRef): string | undefined {
  return graph.terminalOf(node, 'HAS_COLOR');
}
