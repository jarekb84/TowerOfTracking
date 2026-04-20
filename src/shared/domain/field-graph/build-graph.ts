import type { Edge, Node } from './types';
import { FieldGraph } from './field-graph';
import { CATALOG_NODES } from './catalog';

// Entry point for constructing the application's field graph. Commit 2 adds
// the top-level catalog (Schema / Section / Category / View nodes). Field
// nodes and edge declarations arrive in later epic commits (see
// `docs/field-graph/EPIC-migration.md`).

const NODES: readonly Node[] = CATALOG_NODES;
const EDGES: readonly Edge[] = [];

export function buildGraph(): FieldGraph {
  return new FieldGraph(NODES, EDGES);
}
