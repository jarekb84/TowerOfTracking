import { edge } from '../../../builders';
import type { Edge, Node } from '../../../types';
import {
  _DATE_NODE,
  _NOTES_NODE,
  _RANK_NODE,
  _RUN_TYPE_NODE,
  _TIME_NODE,
} from '../../fields.nodes';

// Two edges per internal field: IS_INTERNAL_FIELD (marker) plus
// HAS_CSV_HEADER (override of the default `v3_`-prefixed header).
//
// Declaration order is load-bearing — `internalFields()` returns ids in this
// order, and the CSV exporter uses that for column ordering. Reordering this
// list reorders the on-disk format.

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
