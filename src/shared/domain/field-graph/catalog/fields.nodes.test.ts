import { describe, expect, it } from 'vitest';
import supportedFields from '../../../../../sampleData/supportedFields.json';
import { buildGraph } from '../build-graph';
import * as fieldNodes from './fields.nodes';
import type { Node } from '../types';

// Field-node catalog invariants (commit 3, updated commit 4 for named-export
// node identity). The supportedFields.json file is the authoritative V3
// schema snapshot — every canonical game field plus the five internal
// app-fields. The field graph must declare exactly that set.
//
// A node missing here would cause later commits (BELONGS_TO_SECTION,
// HAS_DATA_TYPE, …) to fail with dangling-edge errors; a node present here
// but absent from the schema would pollute queries with ghost fields.
//
// Drift protection: a `fieldNode(...)` call that forgets `export const`
// disappears from `Object.values(fieldNodes)` and trips the bijection test
// below.

const FIELD_NODES: readonly Node[] = Object.values(fieldNodes).filter(
  (v): v is Node =>
    typeof v === 'object' &&
    v !== null &&
    'id' in v &&
    'kind' in v,
);

describe('field-graph field nodes (commit 3)', () => {
  it('declares one Field node per supportedFields.json entry', () => {
    expect(FIELD_NODES.length).toBe(supportedFields.length);
  });

  it('every declared field id appears in supportedFields.json', () => {
    const supportedSet = new Set(supportedFields);
    const orphans = FIELD_NODES.map((n) => n.id).filter((id) => !supportedSet.has(id));
    expect(
      orphans,
      `field nodes not in supportedFields.json:\n${orphans.map((id) => `  ${id}`).join('\n')}`,
    ).toEqual([]);
  });

  it('every supportedFields.json entry has a declared field node', () => {
    const declaredSet = new Set(FIELD_NODES.map((n) => n.id));
    const missing = supportedFields.filter((id) => !declaredSet.has(id));
    expect(
      missing,
      `supportedFields.json entries without a field node:\n${missing.map((id) => `  ${id}`).join('\n')}`,
    ).toEqual([]);
  });

  it('every declared field node has kind Field', () => {
    const wrongKind = FIELD_NODES.filter((n) => n.kind !== 'Field');
    expect(wrongKind.map((n) => `${n.id} (kind=${n.kind})`)).toEqual([]);
  });

  it('internal fields (underscore-prefixed) carry the "internal" tag', () => {
    const misTagged = FIELD_NODES.filter((n) => n.id.startsWith('_'))
      .filter((n) => !n.tags?.includes('internal'))
      .map((n) => n.id);
    expect(misTagged).toEqual([]);
  });

  it('non-internal fields do not carry the "internal" tag', () => {
    const misTagged = FIELD_NODES.filter((n) => !n.id.startsWith('_'))
      .filter((n) => n.tags?.includes('internal'))
      .map((n) => n.id);
    expect(misTagged).toEqual([]);
  });

  it('buildGraph() exposes every field node via nodesOfKind("Field")', () => {
    const graph = buildGraph();
    expect(graph.nodesOfKind('Field').length).toBe(FIELD_NODES.length);
  });
});
