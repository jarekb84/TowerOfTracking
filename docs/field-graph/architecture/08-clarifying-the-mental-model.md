# 8. Clarifying the mental model

> Part of the Field Graph Architecture spec.
> [< Prev: 5. Migration plan](./05-migration-plan.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 9. Cross-cutting concerns >](./09-cross-cutting-concerns.md)

---

Section 2 described nodes and edges abstractly. This section grounds the abstraction in literal object shapes — the exact thing that sits in memory after the graph builds — so a reviewer can internalize the structure before evaluating the cross-cutting concerns in section 9.

### 8.1. In-memory JSON representation

A node is a tagged record with an id and a kind. Fields carry no other data; their "properties" are outgoing edges.

```typescript
const fieldNode: Node = {
  id: 'coins_goldenTower',
  kind: 'Field',
  tags: [],                          // optional capability tags like 'summary-field', 'not-in-total'
};

const sectionNode: Node = {
  id: 'section:coins',
  kind: 'Section',
};

const viewNode: Node = {
  id: 'view:run-details.coins-earned',
  kind: 'View',
};

const schemaNode: Node = {
  id: 'schema:v3',
  kind: 'Schema',
};
```

An edge is a tagged record with a type, a `from` node id, a `to` node id (or terminal string for display/color edges), and optional type-specific metadata.

```typescript
const structuralEdge: Edge = {
  type: 'IS_SOURCE_OF',
  from: 'coins_goldenTower',
  to: 'battleReport_coinsEarned',
};

const renameEdge: Edge = {
  type: 'RENAMED_FROM',
  from: 'coins_goldenTower',
  to: 'coinsFromGoldenTower',
  atSchema: 'schema:v3',            // edge-specific metadata: which storage schema adopted the rename
};

const displayEdge: Edge = {
  type: 'HAS_DISPLAY_NAME',
  from: 'coins_goldenTower',
  to: 'Golden Tower',                // terminal string, not a node id
};

const colorEdge: Edge = {
  type: 'HAS_COLOR',
  from: 'coins_goldenTower',
  to: '#fbbf24',
};
```

The graph is just two arrays — `Node[]` and `Edge[]` — indexed by the builder into fast lookup maps. Nothing else. A ~40-entry snapshot, using real field names, looks like this in memory after all declarations load:

```json
[
  { "kind": "node", "id": "section:battleReport", "nodeKind": "Section" },
  { "kind": "node", "id": "section:coins", "nodeKind": "Section" },
  { "kind": "node", "id": "section:damage", "nodeKind": "Section" },
  { "kind": "node", "id": "category:economic", "nodeKind": "Category" },
  { "kind": "node", "id": "category:combat", "nodeKind": "Category" },
  { "kind": "node", "id": "schema:v2", "nodeKind": "Schema" },
  { "kind": "node", "id": "schema:v3", "nodeKind": "Schema" },
  { "kind": "node", "id": "view:run-details.battle-report", "nodeKind": "View" },
  { "kind": "node", "id": "view:run-details.coins-earned", "nodeKind": "View" },
  { "kind": "node", "id": "view:source-analysis.coins", "nodeKind": "View" },
  { "kind": "node", "id": "battleReport_tier", "nodeKind": "Field" },
  { "kind": "node", "id": "battleReport_wave", "nodeKind": "Field" },
  { "kind": "node", "id": "battleReport_realTime", "nodeKind": "Field" },
  { "kind": "node", "id": "battleReport_coinsEarned", "nodeKind": "Field" },
  { "kind": "node", "id": "battleReport_coinsPerHour", "nodeKind": "Field" },
  { "kind": "node", "id": "battleReport_cellsEarned", "nodeKind": "Field" },
  { "kind": "node", "id": "battleReport_battleDate", "nodeKind": "Field" },
  { "kind": "node", "id": "coins_goldenTower", "nodeKind": "Field" },
  { "kind": "node", "id": "coins_deathWave", "nodeKind": "Field" },
  { "kind": "node", "id": "coins_blackHole", "nodeKind": "Field" },
  { "kind": "node", "id": "damage_damageDealt", "nodeKind": "Field" },
  { "kind": "node", "id": "damage_deathWave", "nodeKind": "Field" },
  { "kind": "edge", "type": "BELONGS_TO_SECTION", "from": "battleReport_tier", "to": "section:battleReport" },
  { "kind": "edge", "type": "BELONGS_TO_SECTION", "from": "battleReport_coinsEarned", "to": "section:battleReport" },
  { "kind": "edge", "type": "BELONGS_TO_SECTION", "from": "coins_goldenTower", "to": "section:coins" },
  { "kind": "edge", "type": "BELONGS_TO_SECTION", "from": "coins_deathWave", "to": "section:coins" },
  { "kind": "edge", "type": "BELONGS_TO_SECTION", "from": "coins_blackHole", "to": "section:coins" },
  { "kind": "edge", "type": "BELONGS_TO_SECTION", "from": "damage_damageDealt", "to": "section:damage" },
  { "kind": "edge", "type": "BELONGS_TO_CATEGORY", "from": "section:coins", "to": "category:economic" },
  { "kind": "edge", "type": "BELONGS_TO_CATEGORY", "from": "section:damage", "to": "category:combat" },
  { "kind": "edge", "type": "IS_SOURCE_OF", "from": "coins_goldenTower", "to": "battleReport_coinsEarned" },
  { "kind": "edge", "type": "IS_SOURCE_OF", "from": "coins_deathWave", "to": "battleReport_coinsEarned" },
  { "kind": "edge", "type": "IS_SOURCE_OF", "from": "coins_blackHole", "to": "battleReport_coinsEarned" },
  { "kind": "edge", "type": "IS_DERIVED_FROM", "from": "battleReport_coinsPerHour", "to": "battleReport_coinsEarned" },
  { "kind": "edge", "type": "IS_DERIVED_FROM", "from": "battleReport_coinsPerHour", "to": "battleReport_realTime" },
  { "kind": "edge", "type": "RENAMED_FROM", "from": "coins_goldenTower", "to": "coinsFromGoldenTower", "atSchema": "schema:v3" },
  { "kind": "edge", "type": "RENAMED_FROM", "from": "coins_blackHole", "to": "coinsFromBlackHole", "atSchema": "schema:v3" },
  { "kind": "edge", "type": "RENAMED_FROM", "from": "coins_blackHole", "to": "coinsFromBlackhole", "atSchema": "schema:v3" },
  { "kind": "edge", "type": "HAS_DISPLAY_NAME", "from": "coins_goldenTower", "to": "Golden Tower" },
  { "kind": "edge", "type": "HAS_COLOR", "from": "coins_goldenTower", "to": "#fbbf24" },
  { "kind": "edge", "type": "APPEARS_IN_VIEW", "from": "coins_goldenTower", "to": "view:source-analysis.coins" },
  { "kind": "edge", "type": "APPEARS_IN_VIEW", "from": "battleReport_coinsEarned", "to": "view:run-details.battle-report" },
  { "kind": "edge", "type": "PARTICIPATES_IN_COMPOSITE_KEY", "from": "battleReport_tier", "to": "compositeKey:primary" },
  { "kind": "edge", "type": "PARTICIPATES_IN_COMPOSITE_KEY", "from": "battleReport_wave", "to": "compositeKey:primary" },
  { "kind": "edge", "type": "PARTICIPATES_IN_COMPOSITE_KEY", "from": "battleReport_battleDate", "to": "compositeKey:primary" },
  { "kind": "edge", "type": "SHARES_LABEL_WITH", "from": "coins_deathWave", "to": "damage_deathWave" }
]
```

(The `"kind": "node"` / `"kind": "edge"` wrapper is only for this mixed display — the runtime keeps them in separate arrays.)

### 8.2. Node kinds vs. edge kinds

Nodes are the *things*. Edges are the *relationships*. Five node kinds, thirteen edge kinds:

| Node kinds | | Edge kinds | |
|---|---|---|---|
| **Field** | A game data concept (`coins_goldenTower`). Id is the V3 canonical key. | `BELONGS_TO_SECTION` | Field is grouped under a UI section. |
| **Section** | A UI grouping (`section:coins`). | `BELONGS_TO_CATEGORY` | Section rolls up to a coarser category. |
| **Category** | A coarse bucket (`category:economic`). | `IS_SOURCE_OF` | Field contributes to a total (e.g. `coins_goldenTower → battleReport_coinsEarned`). |
| **View** | A UI surface that renders fields (`view:run-details.coins-earned`). | `IS_DERIVED_FROM` | Field is computed from other fields (e.g. `coinsPerHour` from `coinsEarned + realTime`). |
| **Schema** | A tower-tracking storage-schema revision for migration edges (`schema:v2`, `schema:v3`). Not to be confused with the Tower *game* version. | `RENAMED_FROM` | V3 canonical field was known as a legacy key in an older schema (carries `atSchema` metadata). |
| | | `APPEARS_IN_VIEW` | Field is rendered by a specific view. |
| | | `HAS_DISPLAY_NAME` | Field's human-facing label (edge target is a terminal string). |
| | | `HAS_COLOR` | Field's default chart color (edge target is a hex string). |
| | | `HAS_DATA_TYPE` | Field's runtime value type (`number`, `string`, `duration`, `date`). |
| | | `SHARES_LABEL_WITH` | Sibling fields representing the same game concept across taxonomies. |
| | | `PARTICIPATES_IN_COMPOSITE_KEY` | Field is part of a composite identifier (duplicate-detection, future partition keys). |
| | | `REPLACED_BY` | V2 concept superseded by a V3 concept with different shape. |
| | | `INTENTIONALLY_DROPPED_IN_SCHEMA` | Field exists in older data but has no analog after this schema. |
| | | `IS_CORRELATED_WITH` | Analytical hint; powers "related fields" UI but has no runtime behavior. |

The mental rule: **nouns are nodes, verbs are edges**. If you catch yourself adding a property to a node, ask whether it's really an edge to a terminal or to another node.

### 8.3. Are invalid relationships prevented?

Yes, at graph-build time. The builder performs three validations before freezing the graph:

1. Every `from` id must match a declared node of the expected kind for that edge type.
2. Every `to` id (when it's a node id, not a terminal string) must match a declared node of the expected kind.
3. Every referenced `atSchema` id must match a declared `Schema` node.

Attempting to declare an edge referencing `coins_dragonBreath` without first declaring the node fails loudly:

```typescript
// edges/display.ts — WRONG, coins_dragonBreath node was never declared
edge('coins_dragonBreath', 'HAS_DISPLAY_NAME', 'Dragon Breath');
```

```
FieldGraphBuildError: dangling edge reference
  edge: HAS_DISPLAY_NAME from 'coins_dragonBreath' to 'Dragon Breath'
  reason: 'coins_dragonBreath' is not a declared Field node
  fix: declare fieldNode('coins_dragonBreath') in nodes/fields.ts before adding display edges
```

The unit test that enforces this sits in `__tests__/graph-invariants.test.ts`:

```typescript
it('rejects edges that reference undeclared nodes', () => {
  expect(() =>
    new FieldGraph(
      [sectionNode('section:coins')],
      [edge('coins_dragonBreath', 'HAS_DISPLAY_NAME', 'Dragon Breath')],
    ),
  ).toThrow(/dangling edge reference.*coins_dragonBreath/);
});

it('rejects BELONGS_TO_SECTION edges whose target is not a Section node', () => {
  expect(() =>
    new FieldGraph(
      [fieldNode('coins_goldenTower'), fieldNode('section:coins')], // wrong kind
      [edge('coins_goldenTower', 'BELONGS_TO_SECTION', 'section:coins')],
    ),
  ).toThrow(/BELONGS_TO_SECTION.*target must be a Section node/);
});

it('rejects RENAMED_FROM edges whose `atSchema` references a missing Schema node', () => {
  expect(() =>
    new FieldGraph(
      [fieldNode('coins_goldenTower'), fieldNode('coinsFromGoldenTower')],
      [edge('coins_goldenTower', 'RENAMED_FROM', 'coinsFromGoldenTower', { atSchema: 'schema:v99' })],
    ),
  ).toThrow(/RENAMED_FROM.*atSchema.*schema:v99/);
});
```

These run at module-load time in CI and at `graph.build()` time at app startup. A typo in a field name becomes a build-time error, not a silent empty chart.

### 8.4. Two files declaring the same relationship

Two legitimate shapes and one bug shape:

**Bug shape — over-declaration of a single-membership relationship.**
`BELONGS_TO_SECTION` is defined as *single-valued* (a field belongs to exactly one section). If two files both declare `coins_goldenTower → section:X` and `coins_goldenTower → section:Y`, that is a contradiction. The invariant test catches it:

```typescript
it('every Field has at most one BELONGS_TO_SECTION edge', () => {
  for (const field of graph.nodesOfType('Field')) {
    const sections = graph.edgesFrom(field.id, 'BELONGS_TO_SECTION');
    expect(
      sections,
      `${field.id} has ${sections.length} BELONGS_TO_SECTION edges: ${sections.map((e) => e.to).join(', ')}`,
    ).toHaveLength(1);
  }
});
```

CI fails with a message that names the conflicting file pair, because the builder tracks edge provenance (`__source: 'edges/belongs-to-section.ts:42'`).

**Legitimate shape — redundant declaration of an idempotent edge.**
If two files both declare `coins_goldenTower IS_SOURCE_OF battleReport_coinsEarned`, that is merely duplication — the relationship is the same. The builder de-dupes edges by `(type, from, to, since)` tuple before indexing, so the query result is unchanged. A soft warning logs duplicates at build time so the author can clean up, but it does not fail CI:

```
FieldGraph: duplicate edge detected (safe, de-duped)
  IS_SOURCE_OF coins_goldenTower -> battleReport_coinsEarned
  declared in: edges/is-source-of.ts:15, edges/coins-legacy.ts:8
```

**Legitimate shape — genuinely multi-valued edges.**
Some edge kinds are *intentionally* multi-valued. A field can appear in many views (`APPEARS_IN_VIEW`). A field can be derived from multiple inputs (`IS_DERIVED_FROM`). A field can have multiple rename predecessors (`coins_blackHole` was called both `coinsFromBlackHole` and `coinsFromBlackhole` in V2 data). For these edge types, the invariant is `.toHaveLength(atLeastOne)` or no cardinality check at all. Each edge type declares its cardinality in a small table:

```typescript
export const EDGE_CARDINALITY: Record<EdgeType, 'one' | 'many' | 'at-least-one'> = {
  BELONGS_TO_SECTION: 'one',
  BELONGS_TO_CATEGORY: 'one',
  HAS_DISPLAY_NAME: 'one',
  HAS_COLOR: 'one',
  HAS_DATA_TYPE: 'one',
  IS_SOURCE_OF: 'many',
  IS_DERIVED_FROM: 'many',
  APPEARS_IN_VIEW: 'at-least-one', // per the "every field is used in at least one view" invariant
  RENAMED_FROM: 'many',
  SHARES_LABEL_WITH: 'many',
  PARTICIPATES_IN_COMPOSITE_KEY: 'many',
  REPLACED_BY: 'many',
  INTENTIONALLY_DROPPED_IN_SCHEMA: 'one',
  IS_CORRELATED_WITH: 'many',
};
```

The invariant test walks this table and applies the right assertion per edge type. Over-declaration of single-valued edges becomes the one-line test at the top of this subsection.

---

> [< Prev: 5. Migration plan](./05-migration-plan.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 9. Cross-cutting concerns >](./09-cross-cutting-concerns.md)
