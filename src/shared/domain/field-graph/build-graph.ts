import type { Edge, Node } from './types';
import { FieldGraph } from './field-graph';
import { CATALOG_EDGES, CATALOG_NODES } from './catalog';

// Entry point for constructing the application's field graph. Commit 2 added
// the top-level catalog (Schema / Section / Category / View nodes), commit 3
// added Field nodes, commit 4 introduces the first edges (ACCEPTS_VALUE for
// `_runType`). Subsequent phase-2 commits layer in more edges; see
// `docs/field-graph/EPIC-migration.md`.

const NODES: readonly Node[] = CATALOG_NODES;
const EDGES: readonly Edge[] = CATALOG_EDGES;

export function buildGraph(): FieldGraph {
  return new FieldGraph(NODES, EDGES);
}
