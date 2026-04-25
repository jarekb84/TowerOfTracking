import { edge } from '../builders';
import type { Edge, Node } from '../types';
import {
  _DATE_NODE,
  _NOTES_NODE,
  _RANK_NODE,
  _RUN_TYPE_NODE,
  _TIME_NODE,
} from './fields.nodes';

// Internal app-fields — `_date`, `_time`, `_notes`, `_runType`, `_rank` —
// declare themselves with two edges each:
//   1. IS_INTERNAL_FIELD (marker) — identifies the node as app-metadata
//      rather than game-export data. Drives `graph.internalFields()` for the
//      CSV exporter's column ordering.
//   2. HAS_CSV_HEADER (terminal) — overrides the default CSV header
//      derivation. Internal fields use the `_Date` / `_Run Type` form, not a
//      `v3_`-prefixed canonical key. Most game fields will not declare this
//      edge — see architecture/11-internal-app-fields.md §11.1 gotcha 1.
//
// Declaration order is load-bearing: `internalFields()` returns ids in the
// order their IS_INTERNAL_FIELD edges appear here. Reordering the list below
// reorders CSV columns.

function internalFieldEdges(node: Node, csvHeader: string): readonly Edge[] {
  return [
    edge(node.id, 'IS_INTERNAL_FIELD'),
    edge(node.id, 'HAS_CSV_HEADER', csvHeader),
  ];
}

export const INTERNAL_FIELD_EDGES: readonly Edge[] = [
  ...internalFieldEdges(_DATE_NODE, '_Date'),
  ...internalFieldEdges(_TIME_NODE, '_Time'),
  ...internalFieldEdges(_NOTES_NODE, '_Notes'),
  ...internalFieldEdges(_RUN_TYPE_NODE, '_Run Type'),
  ...internalFieldEdges(_RANK_NODE, '_Rank'),
];
