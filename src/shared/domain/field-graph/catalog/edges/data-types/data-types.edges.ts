import { edge } from '../../../builders';
import type { Edge, Node } from '../../../types';
import * as fieldNodes from '../../fields.nodes';
import type { DataType } from './data-types.constants';

// `IS_OF_TYPE` declarations for every catalog Field. The graph is the single
// source of truth — `field-utils.ts`'s `getFieldConfig` queries it instead
// of pattern-matching labels. See
// `docs/field-graph/EXPLORATION-data-type-edge-vs-property.md` for the
// edge-over-property reasoning and the `IS_OF_TYPE` rename rationale.
//
// Add a new Field? Either drop a literal-typed entry in `NON_NUMBER_TYPES`
// below (for date / duration / string) or rely on the `'number'` default
// for the modal case. The `data-types.invariants.test.ts` invariant
// asserts every declared Field has exactly one IS_OF_TYPE edge.

function isOfTypeEdge(node: Node, type: DataType): Edge {
  return edge(node.id, 'IS_OF_TYPE', type);
}

// Fields whose type isn't `'number'`. Listed explicitly so the catalog
// reads as "what's different" rather than "what's the same as 140 others."
// Every Field NOT in this map gets `'number'` via the loop below — the
// catalog still declares the edge, just under the modal value.
const NON_NUMBER_TYPES: ReadonlyMap<string, DataType> = new Map<string, DataType>([
  // Internal app-fields (per architecture/11-internal-app-fields.md §11.1)
  [fieldNodes._DATE_NODE.id, 'date'],
  [fieldNodes._TIME_NODE.id, 'string'],     // 'HH:mm' formatted text, not a Date
  [fieldNodes._NOTES_NODE.id, 'string'],    // CSV-escape-encoded; pre-encoded in csv-exporter preprocessor
  [fieldNodes._RUN_TYPE_NODE.id, 'string'], // Constrained via ACCEPTS_VALUE
  // _rank → 'number' (modal default)

  // Game fields with non-number types
  [fieldNodes.BATTLE_REPORT__BATTLE_DATE_NODE.id, 'date'],
  [fieldNodes.BATTLE_REPORT__GAME_TIME_NODE.id, 'duration'],
  [fieldNodes.BATTLE_REPORT__REAL_TIME_NODE.id, 'duration'],
  [fieldNodes.BATTLE_REPORT__KILLED_BY_NODE.id, 'string'], // Enemy name — pre-graph code mistyped this as 'number'; corrected here
  // Tier is a semantic kind, not a number — see `EXPLORATION-tier-handling.md`.
  // Carries a leading integer plus optional tournament-`+` suffix; consumers
  // read `.value` (the parsed leading int) and `.rawValue` ("10+" when
  // tournament).
  [fieldNodes.BATTLE_REPORT__TIER_NODE.id, 'tier'],
]);

const ALL_FIELD_NODES: readonly Node[] = Object.values(fieldNodes).filter(
  (v): v is Node =>
    typeof v === 'object' && v !== null && 'id' in v && 'kind' in v,
);

export const DATA_TYPE_EDGES: readonly Edge[] = ALL_FIELD_NODES.map((node) =>
  isOfTypeEdge(node, NON_NUMBER_TYPES.get(node.id) ?? 'number'),
);
