import { describe, expect, it } from 'vitest';
import {
  categoryNode,
  edge,
  enumValueNode,
  FieldGraph,
  FieldGraphBuildError,
  fieldNode,
  renamedFromEdge,
  schemaNode,
  sectionNode,
  viewNode,
  type Edge,
  type Node,
} from './index';

// A 5-node / 5-edge toy graph that exercises the common happy-path queries:
//   Section 'section:coins'       (UI grouping)
//   Schema  'schema:v3'           (for RENAMED_FROM.atSchema)
//   View    'view:rd'             (target of APPEARS_IN_VIEW)
//   Field   'a'                   (source field, renamed from 'a_old')
//   Field   'total'               (aggregate field; 'a' is a source of it)
function buildHappyPathGraph(): FieldGraph {
  const nodes: Node[] = [
    sectionNode('section:coins'),
    schemaNode('schema:v3'),
    viewNode('view:rd'),
    fieldNode('a'),
    fieldNode('total'),
  ];
  const edges: Edge[] = [
    edge('a', 'BELONGS_TO_SECTION', 'section:coins'),
    edge('a', 'IS_SOURCE_OF', 'total'),
    edge('a', 'APPEARS_IN_VIEW', 'view:rd'),
    edge('total', 'APPEARS_IN_VIEW', 'view:rd'),
    renamedFromEdge('a', { legacyKey: 'a_old', atSchema: 'schema:v3' }),
  ];
  return new FieldGraph(nodes, edges);
}

describe('FieldGraph (happy path)', () => {
  const graph = buildHappyPathGraph();

  it('getField returns the Field node for its canonical id', () => {
    const field = graph.getField('a');
    expect(field?.kind).toBe('Field');
    expect(field?.id).toBe('a');
  });

  it('getField returns null for a non-Field node id', () => {
    expect(graph.getField('section:coins')).toBeNull();
  });

  it('getField returns null for an unknown id', () => {
    expect(graph.getField('never')).toBeNull();
  });

  it('resolveFieldByAnyKey: direct hit on canonical key', () => {
    expect(graph.resolveFieldByAnyKey('a')?.id).toBe('a');
  });

  it('resolveFieldByAnyKey: reverse-index hit on a legacy key', () => {
    expect(graph.resolveFieldByAnyKey('a_old')?.id).toBe('a');
  });

  it('resolveFieldByAnyKey: miss returns null', () => {
    expect(graph.resolveFieldByAnyKey('unknown')).toBeNull();
  });

  it('sourcesOf returns fields contributing to a total', () => {
    expect(graph.sourcesOf('total')).toEqual(['a']);
    expect(graph.sourcesOf('a')).toEqual([]);
  });

  it('fieldsInSection returns fields whose BELONGS_TO_SECTION points here', () => {
    expect(graph.fieldsInSection('section:coins')).toEqual(['a']);
  });

  it('sectionsOf returns all sections a field belongs to', () => {
    expect(graph.sectionsOf('a')).toEqual(['section:coins']);
    expect(graph.sectionsOf('total')).toEqual([]);
  });

  it('nodesOfKind enumerates nodes of a given kind', () => {
    const fieldIds = graph.nodesOfKind('Field').map((n) => n.id).sort();
    expect(fieldIds).toEqual(['a', 'total']);
  });

  it('edgesOfType enumerates all edges of a given type', () => {
    expect(graph.edgesOfType('IS_SOURCE_OF')).toHaveLength(1);
    expect(graph.edgesOfType('APPEARS_IN_VIEW')).toHaveLength(2);
  });

  it('edgesFrom filters by node id and optional type', () => {
    expect(graph.edgesFrom('a', 'BELONGS_TO_SECTION')).toHaveLength(1);
    expect(graph.edgesFrom('a').length).toBeGreaterThan(1);
  });

  it('edgesTo filters by node id and optional type', () => {
    expect(graph.edgesTo('total', 'IS_SOURCE_OF')).toHaveLength(1);
    expect(graph.edgesTo('view:rd', 'APPEARS_IN_VIEW')).toHaveLength(2);
  });
});

describe('FieldGraph (symmetric edges)', () => {
  it('SHARES_LABEL_WITH is indexed in both directions', () => {
    const graph = new FieldGraph(
      [
        viewNode('view:rd'),
        fieldNode('coins_a'),
        fieldNode('damage_a'),
      ],
      [
        edge('coins_a', 'APPEARS_IN_VIEW', 'view:rd'),
        edge('damage_a', 'APPEARS_IN_VIEW', 'view:rd'),
        edge('coins_a', 'SHARES_LABEL_WITH', 'damage_a'),
      ],
    );
    const outFromCoins = graph.edgesFrom('coins_a', 'SHARES_LABEL_WITH');
    const outFromDamage = graph.edgesFrom('damage_a', 'SHARES_LABEL_WITH');
    expect(outFromCoins.map((e) => e.to)).toEqual(['damage_a']);
    expect(outFromDamage.map((e) => e.to)).toEqual(['coins_a']);
  });
});

describe('FieldGraph invariants', () => {
  it('rejects duplicate node ids', () => {
    expect(() => new FieldGraph([fieldNode('x'), fieldNode('x')], [])).toThrow(
      /duplicate node id 'x'/,
    );
  });

  it('rejects edges with an unknown source (dangling `from`)', () => {
    expect(() => new FieldGraph(
      [sectionNode('section:coins')],
      [edge('ghost', 'BELONGS_TO_SECTION', 'section:coins')],
    )).toThrow(/dangling edge reference.*BELONGS_TO_SECTION.*'ghost'/);
  });

  it('rejects edges with an unknown node-id target (dangling `to`)', () => {
    expect(() => new FieldGraph(
      [fieldNode('a')],
      [edge('a', 'BELONGS_TO_SECTION', 'section:missing')],
    )).toThrow(/dangling edge reference.*to 'section:missing'/);
  });

  it('rejects edges whose source is the wrong node kind', () => {
    expect(() => new FieldGraph(
      [sectionNode('section:coins'), sectionNode('section:misuse')],
      [edge('section:coins', 'BELONGS_TO_SECTION', 'section:misuse')],
    )).toThrow(/BELONGS_TO_SECTION.*must be a Field node/);
  });

  it('rejects edges whose target is the wrong node kind', () => {
    expect(() => new FieldGraph(
      [fieldNode('a'), fieldNode('not-a-section')],
      [edge('a', 'BELONGS_TO_SECTION', 'not-a-section')],
    )).toThrow(/BELONGS_TO_SECTION.*must be a Section node/);
  });

  it("rejects terminal-target edges missing their 'to' terminal", () => {
    expect(() => new FieldGraph(
      [fieldNode('a')],
      [edge('a', 'HAS_DISPLAY_NAME')],
    )).toThrow(/HAS_DISPLAY_NAME.*missing 'to' target/);
  });

  it("rejects marker edges that set 'to' when they shouldn't", () => {
    expect(() => new FieldGraph(
      [fieldNode('a')],
      [edge('a', 'IS_INTERNAL_FIELD', 'something')],
    )).toThrow(/IS_INTERNAL_FIELD.*no target but 'to' was set/);
  });

  it("cardinality 'one' is violated when a source has more than one edge of that type", () => {
    expect(() => new FieldGraph(
      [sectionNode('section:coins'), categoryNode('category:economic'), categoryNode('category:other')],
      [
        edge('section:coins', 'BELONGS_TO_CATEGORY', 'category:economic'),
        edge('section:coins', 'BELONGS_TO_CATEGORY', 'category:other'),
      ],
    )).toThrow(/BELONGS_TO_CATEGORY cardinality 'one' violated.*section:coins.*2 edges/);
  });

  it.skip("cardinality 'at-least-one' is violated when a Field has no APPEARS_IN_VIEW", () => {
    // Suspended during the field-graph migration. APPEARS_IN_VIEW's cardinality
    // is temporarily relaxed to 'many' until commit 12 wires the edges; see
    // `docs/field-graph/EPIC-migration.md` Migration-era suppressions. Commit 12
    // either restores 'at-least-one' (re-enabling this test) or permanently
    // downgrades the rule if fields can legitimately have no view.
    expect(() => new FieldGraph(
      [fieldNode('lonely'), sectionNode('section:s')],
      [edge('lonely', 'BELONGS_TO_SECTION', 'section:s')],
    )).toThrow(/APPEARS_IN_VIEW cardinality 'at-least-one' violated.*'lonely'/);
  });

  it('RENAMED_FROM requires a payload with legacyKey and atSchema', () => {
    expect(() => new FieldGraph(
      [fieldNode('a')],
      [{ type: 'RENAMED_FROM', from: 'a' } as Edge],
    )).toThrow(/RENAMED_FROM.*payload must include legacyKey and atSchema/);
  });

  it("RENAMED_FROM fails when atSchema doesn't resolve to a Schema node", () => {
    expect(() => new FieldGraph(
      [fieldNode('a')],
      [renamedFromEdge('a', { legacyKey: 'a_old', atSchema: 'schema:v99' })],
    )).toThrow(/RENAMED_FROM.*atSchema 'schema:v99' is not a declared Schema node/);
  });

  it('RENAMED_FROM legacy key cannot be claimed by two different fields', () => {
    expect(() => new FieldGraph(
      [fieldNode('a'), fieldNode('b'), schemaNode('schema:v3'), viewNode('v')],
      [
        edge('a', 'APPEARS_IN_VIEW', 'v'),
        edge('b', 'APPEARS_IN_VIEW', 'v'),
        renamedFromEdge('a', { legacyKey: 'shared_old', atSchema: 'schema:v3' }),
        renamedFromEdge('b', { legacyKey: 'shared_old', atSchema: 'schema:v3' }),
      ],
    )).toThrow(/legacy key 'shared_old' is claimed by both 'a' and 'b'/);
  });

  it('RENAMED_FROM legacy key cannot collide with a declared node id', () => {
    expect(() => new FieldGraph(
      [fieldNode('a'), fieldNode('a_old'), schemaNode('schema:v3'), viewNode('v')],
      [
        edge('a', 'APPEARS_IN_VIEW', 'v'),
        edge('a_old', 'APPEARS_IN_VIEW', 'v'),
        renamedFromEdge('a', { legacyKey: 'a_old', atSchema: 'schema:v3' }),
      ],
    )).toThrow(/legacy key 'a_old' collides with a declared node/);
  });

  it('accepts enum-value targets for ACCEPTS_VALUE edges', () => {
    const graph = new FieldGraph(
      [
        fieldNode('_runType'),
        viewNode('view:rd'),
        enumValueNode('enum:farm'),
        enumValueNode('enum:tournament'),
      ],
      [
        edge('_runType', 'APPEARS_IN_VIEW', 'view:rd'),
        edge('_runType', 'ACCEPTS_VALUE', 'enum:farm'),
        edge('_runType', 'ACCEPTS_VALUE', 'enum:tournament'),
      ],
    );
    expect(graph.edgesFrom('_runType', 'ACCEPTS_VALUE')).toHaveLength(2);
  });

  it('accepts EnumValue sources for HAS_DISPLAY_NAME / HAS_COLOR / HAS_STRING_VALUE', () => {
    const graph = new FieldGraph(
      [fieldNode('_runType'), enumValueNode('enum:farm')],
      [
        edge('_runType', 'ACCEPTS_VALUE', 'enum:farm'),
        edge('enum:farm', 'HAS_DISPLAY_NAME', 'Farm'),
        edge('enum:farm', 'HAS_COLOR', '#10b981'),
        edge('enum:farm', 'HAS_STRING_VALUE', 'farm'),
      ],
    );
    expect(graph.displayNameOf('enum:farm')).toBe('Farm');
    expect(graph.colorOf('enum:farm')).toBe('#10b981');
  });

  it('rejects HAS_STRING_VALUE from a non-EnumValue source', () => {
    expect(() => new FieldGraph(
      [fieldNode('_runType')],
      [edge('_runType', 'HAS_STRING_VALUE', 'farm')],
    )).toThrow(/HAS_STRING_VALUE.*must be a EnumValue node.*got Field/);
  });

  it('build errors carry the FieldGraphBuildError name for catch filters', () => {
    try {
      new FieldGraph([fieldNode('x'), fieldNode('x')], []);
      expect.fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(FieldGraphBuildError);
    }
  });
});

describe('FieldGraph enum-value consumer API', () => {
  function buildRunTypeLikeGraph(): FieldGraph {
    return new FieldGraph(
      [
        fieldNode('_runType'),
        fieldNode('plainField'),
        enumValueNode('enum:farm'),
        enumValueNode('enum:tournament'),
      ],
      [
        edge('_runType', 'ACCEPTS_VALUE', 'enum:farm'),
        edge('_runType', 'ACCEPTS_VALUE', 'enum:tournament'),
        edge('enum:farm', 'HAS_STRING_VALUE', 'farm'),
        edge('enum:farm', 'HAS_DISPLAY_NAME', 'Farm'),
        edge('enum:tournament', 'HAS_STRING_VALUE', 'tournament'),
        // intentionally no HAS_DISPLAY_NAME on enum:tournament — meta should
        // omit the optional field rather than return a blank string
      ],
    );
  }

  it('acceptedValuesFor returns every declared wire value', () => {
    const graph = buildRunTypeLikeGraph();
    expect([...graph.acceptedValuesFor('_runType')].sort()).toEqual(['farm', 'tournament']);
  });

  it('acceptedValuesFor returns [] for a non-enum field', () => {
    const graph = buildRunTypeLikeGraph();
    expect(graph.acceptedValuesFor('plainField')).toEqual([]);
  });

  it('acceptedValuesFor returns [] for a missing fieldId', () => {
    const graph = buildRunTypeLikeGraph();
    expect(graph.acceptedValuesFor('nope')).toEqual([]);
  });

  it('isAcceptedValue returns true only for an exact declared wire value', () => {
    const graph = buildRunTypeLikeGraph();
    expect(graph.isAcceptedValue('_runType', 'farm')).toBe(true);
    expect(graph.isAcceptedValue('_runType', 'tournament')).toBe(true);
    expect(graph.isAcceptedValue('_runType', 'milestone')).toBe(false);
  });

  it('isAcceptedValue is case-sensitive (exact match only)', () => {
    const graph = buildRunTypeLikeGraph();
    expect(graph.isAcceptedValue('_runType', 'FARM')).toBe(false);
    expect(graph.isAcceptedValue('_runType', 'Farm')).toBe(false);
  });

  it('isAcceptedValue returns false for empty string and non-enum / missing fieldId', () => {
    const graph = buildRunTypeLikeGraph();
    expect(graph.isAcceptedValue('_runType', '')).toBe(false);
    expect(graph.isAcceptedValue('plainField', 'farm')).toBe(false);
    expect(graph.isAcceptedValue('nope', 'farm')).toBe(false);
  });

  it('matchAcceptedValue returns the wire value on match, else null', () => {
    const graph = buildRunTypeLikeGraph();
    expect(graph.matchAcceptedValue('_runType', 'farm')).toBe('farm');
    expect(graph.matchAcceptedValue('_runType', 'FARM')).toBeNull();
    expect(graph.matchAcceptedValue('_runType', 'nope')).toBeNull();
    expect(graph.matchAcceptedValue('_runType', '')).toBeNull();
    expect(graph.matchAcceptedValue('plainField', 'farm')).toBeNull();
    expect(graph.matchAcceptedValue('nope', 'farm')).toBeNull();
  });

  it('enumValueMeta returns id, wireValue, and displayName when declared', () => {
    const graph = buildRunTypeLikeGraph();
    expect(graph.enumValueMeta('_runType', 'farm')).toEqual({
      id: 'enum:farm',
      wireValue: 'farm',
      displayName: 'Farm',
    });
  });

  it('enumValueMeta omits displayName when the enum value has no HAS_DISPLAY_NAME', () => {
    const graph = buildRunTypeLikeGraph();
    const meta = graph.enumValueMeta('_runType', 'tournament');
    expect(meta).toEqual({ id: 'enum:tournament', wireValue: 'tournament' });
    expect(meta && 'displayName' in meta).toBe(false);
  });

  it('enumValueMeta returns null for unknown wire value / non-enum / missing fieldId', () => {
    const graph = buildRunTypeLikeGraph();
    expect(graph.enumValueMeta('_runType', 'milestone')).toBeNull();
    expect(graph.enumValueMeta('_runType', '')).toBeNull();
    expect(graph.enumValueMeta('plainField', 'farm')).toBeNull();
    expect(graph.enumValueMeta('nope', 'farm')).toBeNull();
  });
});

