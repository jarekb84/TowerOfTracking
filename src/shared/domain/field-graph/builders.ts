import type { Edge, EdgeType, Node, NodeKind, RenamedFromPayload } from './types';

// Node constructors — one per node kind. Using separate helpers (rather than
// a generic `node(kind, id)`) makes declarations read naturally and surfaces
// typos at the call site: `fieldNode('section:coins')` doesn't type-check
// as a Field once consumers narrow on `kind`.

interface NodeOptions {
  readonly tags?: readonly string[];
  readonly payload?: Readonly<Record<string, unknown>>;
}

function node(kind: NodeKind, id: string, opts?: NodeOptions): Node {
  return { id, kind, ...opts };
}

export function fieldNode(id: string, opts?: NodeOptions): Node {
  return node('Field', id, opts);
}

export function sectionNode(id: string, opts?: NodeOptions): Node {
  return node('Section', id, opts);
}

export function categoryNode(id: string, opts?: NodeOptions): Node {
  return node('Category', id, opts);
}

export function viewNode(id: string, opts?: NodeOptions): Node {
  return node('View', id, opts);
}

export function schemaNode(id: string, opts?: NodeOptions): Node {
  return node('Schema', id, opts);
}

export function enumValueNode(id: string, opts?: NodeOptions): Node {
  return node('EnumValue', id, opts);
}

// Edge constructor. Shape varies by type:
//  - Standard edges: (from, type, to, payload?)
//  - Terminal edges: (from, type, terminalString, payload?)
//  - Marker edges (IS_INTERNAL_FIELD): (from, type)
//  - Payload-only (RENAMED_FROM): (from, type, payload)
// All shapes unify under `Edge` — validation of payload and target kind
// happens at graph-build time (see `FieldGraph`'s constructor).
export function edge(
  from: string,
  type: EdgeType,
  to?: string,
  payload?: Readonly<Record<string, unknown>>,
): Edge {
  return payload ? { type, from, to, payload } : { type, from, to };
}

// Ergonomic specialization for RENAMED_FROM: the payload is the primary
// argument since there's no `to` node id.
export function renamedFromEdge(from: string, payload: RenamedFromPayload): Edge {
  return { type: 'RENAMED_FROM', from, payload: { ...payload } };
}
