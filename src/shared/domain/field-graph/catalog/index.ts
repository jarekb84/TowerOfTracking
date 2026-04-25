import type { Edge, Node } from '../types';
import * as categoryNodes from './categories.nodes';
import * as enumValueNodes from './enum-values.nodes';
import * as fieldNodes from './fields.nodes';
import * as schemaNodes from './schemas.nodes';
import * as sectionNodes from './sections.nodes';
import * as viewNodes from './views.nodes';
import { CATALOG_EDGES as EDGES_FROM_AGGREGATOR } from './edges';

// Filter a `*.nodes.ts` module's exports down to the actual `Node` values.
// Each per-kind module may legally export non-node helpers alongside the
// node handles (e.g. `runTypeEnumNodeId`, `RUN_TYPE_ENUM_NODES` lookup
// record) — those don't match `Node`'s shape and get dropped here.
function nodesOf(mod: Record<string, unknown>): Node[] {
  return Object.values(mod).filter(
    (v): v is Node =>
      typeof v === 'object' &&
      v !== null &&
      'id' in v &&
      'kind' in v &&
      typeof (v as { id: unknown }).id === 'string' &&
      typeof (v as { kind: unknown }).kind === 'string',
  );
}

// Aggregate of every declared catalog node (Schema / Section / Category /
// View / Field / EnumValue). Order of concatenation is arbitrary — graph
// invariants enforce uniqueness across the whole set.
export const CATALOG_NODES: readonly Node[] = [
  ...nodesOf(schemaNodes),
  ...nodesOf(sectionNodes),
  ...nodesOf(categoryNodes),
  ...nodesOf(viewNodes),
  ...nodesOf(fieldNodes),
  ...nodesOf(enumValueNodes),
];

// Aggregate of every declared catalog edge. Sourced from `edges/index.ts`,
// which rolls up the per-concept folders. See `edges/PATTERN.md`.
export const CATALOG_EDGES: readonly Edge[] = EDGES_FROM_AGGREGATOR;

// Re-export the per-kind module namespaces so the rest of the codebase has
// one canonical import path for node handles. `RUN_TYPE_ENUM_NODES` and
// `runTypeEnumNodeId` (helpers, not nodes) bleed through harmlessly.
export * from './fields.nodes';
export * from './sections.nodes';
export * from './categories.nodes';
export * from './views.nodes';
export * from './schemas.nodes';
export * from './enum-values.nodes';
export * from './edges';
