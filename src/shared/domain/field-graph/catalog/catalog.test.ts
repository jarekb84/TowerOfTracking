import { describe, expect, it } from 'vitest';
import { buildGraph } from '../build-graph';
import { CATALOG_NODES } from './index';

// Catalog-level invariants. The FieldGraph constructor already throws on
// duplicate node ids, so "loads successfully" implicitly asserts that every
// declared top-level node has a unique id. These tests make the claim
// explicit so a regression surfaces as a targeted failure rather than a
// generic build error.

describe('field-graph catalog (commit 2)', () => {
  it('buildGraph() loads the catalog without throwing', () => {
    expect(() => buildGraph()).not.toThrow();
  });

  it('every declared catalog node has a unique id', () => {
    const ids = CATALOG_NODES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('graph exposes the declared nodes via nodesOfKind', () => {
    const graph = buildGraph();
    expect(graph.nodesOfKind('Schema').length).toBeGreaterThan(0);
    expect(graph.nodesOfKind('Section').length).toBeGreaterThan(0);
    expect(graph.nodesOfKind('Category').length).toBeGreaterThan(0);
    expect(graph.nodesOfKind('View').length).toBeGreaterThan(0);
  });
});
