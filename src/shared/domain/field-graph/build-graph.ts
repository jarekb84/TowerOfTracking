import type { Edge, Node } from './types';
import { FieldGraph } from './field-graph';

// Entry point for constructing the application's field graph. Catalogs of
// real nodes and edges are added in later epic commits (see
// `docs/field-graph/EPIC-migration.md`, commits 2+). For commit 1 this
// returns an empty graph — the engine is wired, the catalogs are not.

const NODES: readonly Node[] = [];
const EDGES: readonly Edge[] = [];

export function buildGraph(): FieldGraph {
  return new FieldGraph(NODES, EDGES);
}
