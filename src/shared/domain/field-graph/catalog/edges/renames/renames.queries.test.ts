import { describe, expect, it } from 'vitest';
import {
  edge,
  FieldGraph,
  fieldNode,
  renamedFromEdge,
  schemaNode,
  viewNode,
  type Edge,
  type Node,
} from '../../../index';
import { legacyKeysOf, renamesOf } from './renames.queries';

function buildGraph(): FieldGraph {
  const nodes: Node[] = [
    fieldNode('battleReport_tier'),
    fieldNode('battleReport_realTime'),
    fieldNode('damage_blackHole'),
    fieldNode('isolated'),
    schemaNode('schema:v2'),
    schemaNode('schema:v3'),
    viewNode('v'),
  ];
  const edges: Edge[] = [
    edge('battleReport_tier',     'APPEARS_IN_VIEW', 'v'),
    edge('battleReport_realTime', 'APPEARS_IN_VIEW', 'v'),
    edge('damage_blackHole',      'APPEARS_IN_VIEW', 'v'),
    edge('isolated',              'APPEARS_IN_VIEW', 'v'),
    renamedFromEdge('battleReport_tier',
      { legacyKey: 'tier', atSchema: 'schema:v3', reason: 'V28 sectionizing' }),
    renamedFromEdge('battleReport_realTime',
      { legacyKey: 'realTime', atSchema: 'schema:v3' }),
    renamedFromEdge('damage_blackHole',
      { legacyKey: 'blackHole', atSchema: 'schema:v3' }),
    renamedFromEdge('damage_blackHole',
      { legacyKey: 'blackHoleDamage', atSchema: 'schema:v3' }),
  ];
  return new FieldGraph(nodes, edges);
}

describe('renames.queries', () => {
  const graph = buildGraph();

  describe('renamesOf', () => {
    it('returns all rename payloads for a field in declaration order', () => {
      const records = renamesOf(graph, 'damage_blackHole');
      expect(records.map((r) => r.legacyKey)).toEqual(['blackHole', 'blackHoleDamage']);
      expect(records[0].atSchema).toBe('schema:v3');
    });

    it('preserves the reason when present', () => {
      const records = renamesOf(graph, 'battleReport_tier');
      expect(records[0].reason).toBe('V28 sectionizing');
    });

    it('omits reason when not declared', () => {
      const records = renamesOf(graph, 'battleReport_realTime');
      expect(records[0]).not.toHaveProperty('reason');
    });

    it('returns an empty array when a field has no rename history', () => {
      expect(renamesOf(graph, 'isolated')).toEqual([]);
    });

    it('returns an empty array for an unknown id (no throw)', () => {
      expect(renamesOf(graph, 'never')).toEqual([]);
    });
  });

  describe('legacyKeysOf', () => {
    it('returns just the legacy-key strings', () => {
      expect(legacyKeysOf(graph, 'damage_blackHole')).toEqual(['blackHole', 'blackHoleDamage']);
    });

    it('returns an empty array for a field with no rename edges', () => {
      expect(legacyKeysOf(graph, 'isolated')).toEqual([]);
    });
  });

  describe('engine resolveFieldByAnyKey (driven by RENAMED_FROM payloads)', () => {
    it('resolves a legacy key to the canonical Field node', () => {
      expect(graph.resolveFieldByAnyKey('tier')?.id).toBe('battleReport_tier');
      expect(graph.resolveFieldByAnyKey('blackHole')?.id).toBe('damage_blackHole');
    });

    it('resolves a canonical key to itself', () => {
      expect(graph.resolveFieldByAnyKey('battleReport_tier')?.id).toBe('battleReport_tier');
    });

    it('returns null for an unknown key', () => {
      expect(graph.resolveFieldByAnyKey('never')).toBeNull();
    });

    it('handles multi-legacy fields — every declared legacyKey resolves to the same canonical', () => {
      expect(graph.resolveFieldByAnyKey('blackHole')?.id).toBe('damage_blackHole');
      expect(graph.resolveFieldByAnyKey('blackHoleDamage')?.id).toBe('damage_blackHole');
    });
  });
});
