# 17. Schema as a first-class graph entity

> Part of the Field Graph Architecture spec.
> [< Prev: 16. Testing philosophy — system not configuration](./16-testing-philosophy.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 18. Write path — forms, updates, user edits >](./18-write-path.md)

---

The user asked: "this schema, do, is that itself a relationship of a node? And what if its schema changes over time?"

This section promotes schemas to first-class graph citizens. Each tower-tracking storage schema becomes a Schema node. Edges express "field X was introduced in schema Y", "field Z was dropped in schema Y", "this rename happened as part of the transition to schema Y." Schema evolution becomes a schema-node addition plus a handful of edges, not a code change in a migration file.

### 17.1. Schema nodes

Each tower-tracking storage schema is a node. The node payload records the app-version window in which that schema was shipped, and any game-version trigger that forced the schema bump.

```typescript
// src/shared/domain/field-graph/nodes/schemas.ts
import { schemaNode } from '../builder';

export const SCHEMAS = [
  schemaNode('schema:v1', {
    appVersion: '0.10.x',
    description: 'Original flat-key storage. Internal fields have no underscore prefix.',
  }),
  schemaNode('schema:v2', {
    appVersion: '0.11.x',
    description: 'Internal fields adopt underscore-prefixed convention (_date, _time, _notes, ...). Game fields remain V2 flat keys.',
  }),
  schemaNode('schema:v3', {
    appVersion: '0.12.x',
    gameVersion: 'V28',
    description: 'Section-prefixed V3 canonical keys for all game fields (battleReport_, coins_, damage_, ...). Triggered by game V28 sectionized export.',
  }),
];
```

The Schema node is a real node. It has edges in and out like any other. It shows up in `graph.describe` output if you describe it directly:

```
$ npm run graph:describe schema:v3

# schema:v3

**Kind**: Schema
**App version**: 0.12.x
**Game version trigger**: V28

## Fields shipped at this schema
- battleReport_tier (SHIPPED_IN_SCHEMA)
- battleReport_coinsEarned (SHIPPED_IN_SCHEMA)
- ...

## Fields dropped at this schema
- coinsStolen (INTENTIONALLY_DROPPED_IN_SCHEMA, reason: "guardian feature removed in V28")
- ...

## Renames that happened at this schema
- coins_goldenTower <- 'coinsFromGoldenTower' (via RENAMED_FROM.atSchema)
- damage_blackHole <- 'blackHole' (via RENAMED_FROM.atSchema)
- ...
```

That `graph.describe` output *is* the changelog for that schema bump. It's generated from the graph, not hand-maintained. Every rename, every drop, every new field that came along with the schema is attributable to a single Schema node.

### 17.2. Schema edges

Three edge types connect fields to schemas. One already exists (`RENAMED_FROM`, which now carries `atSchema` in payload); two are new.

```typescript
export type Edge =
  | // ...existing...
  | { type: 'RENAMED_FROM'; from: NodeId /* Field */;
      payload: { legacyKey: string; atSchema: NodeId /* Schema */; reason?: string } }
  | { type: 'SHIPPED_IN_SCHEMA'; from: NodeId /* Field */; to: NodeId /* Schema */;
      payload?: { driver?: 'app-refactor' | 'game-version'; gameVersion?: string } }
  | { type: 'INTENTIONALLY_DROPPED_IN_SCHEMA'; from: NodeId /* Field */; to: NodeId /* Schema */;
      payload: { reason: string } }
  | { type: 'MIGRATED_TO_SCHEMA'; from: NodeId /* Field */; to: NodeId /* Schema */;
      payload?: { migrator?: string } };
```

- **`SHIPPED_IN_SCHEMA`** — the schema at which this field first became canonical. The driver payload distinguishes "app decided to add it" from "game forced it with a new export."
- **`INTENTIONALLY_DROPPED_IN_SCHEMA`** — the schema at which this field was retired. The reason payload explains why (feature removed, replaced by a different field, etc).
- **`MIGRATED_TO_SCHEMA`** — explicit marker that "this field's shape was transformed as part of the transition to this schema." This is a superset of RENAMED_FROM — a field's raw data may be rewritten, restructured, or split during schema migration; the edge expresses that transformation happened. The optional `migrator` payload points at a registered migration function (analogous to the `deriver` pattern in §11.3).

**Example edge declarations:**

```typescript
// src/shared/domain/field-graph/edges/schema-membership.ts
export const SCHEMA_EDGES = [
  // Every V3 canonical game field shipped at schema:v3
  edge('battleReport_coinsEarned', 'SHIPPED_IN_SCHEMA', 'schema:v3',
       { driver: 'game-version', gameVersion: 'V28' }),
  edge('damage_blackHole',         'SHIPPED_IN_SCHEMA', 'schema:v3',
       { driver: 'game-version', gameVersion: 'V28' }),

  // Internal fields shipped at schema:v2 (app refactor, not game-driven)
  edge('_date',    'SHIPPED_IN_SCHEMA', 'schema:v2', { driver: 'app-refactor' }),
  edge('_time',    'SHIPPED_IN_SCHEMA', 'schema:v2', { driver: 'app-refactor' }),
  edge('_notes',   'SHIPPED_IN_SCHEMA', 'schema:v2', { driver: 'app-refactor' }),
  edge('_runType', 'SHIPPED_IN_SCHEMA', 'schema:v2', { driver: 'app-refactor' }),

  // V27 guardian fields dropped at schema:v3
  edge('coinsStolen',         'INTENTIONALLY_DROPPED_IN_SCHEMA', 'schema:v3',
       { reason: 'Guardian feature removed in game V28' }),
  edge('guardianCatches',     'INTENTIONALLY_DROPPED_IN_SCHEMA', 'schema:v3',
       { reason: 'Guardian feature removed in game V28' }),
  edge('guardianCoinsStolen', 'INTENTIONALLY_DROPPED_IN_SCHEMA', 'schema:v3',
       { reason: 'Guardian feature removed in game V28' }),
];
```

Note the dropped-field nodes (`coinsStolen`, `guardianCatches`) — these DO exist as Field nodes, but tagged `'dropped'`. They carry only two edges: `RENAMED_FROM` (if applicable, for legacy storage compatibility) and `INTENTIONALLY_DROPPED_IN_SCHEMA`. They don't have BELONGS_TO_SECTION, don't have HAS_COLOR, don't appear in any View. Invariants know to skip `'dropped'`-tagged fields when checking for section membership and view appearance.

This is different from the rename case (§14.1) — dropped fields keep their node because the parser still needs to recognize the key (to discard it silently rather than warn). Renamed legacy keys don't get their own nodes; their identity moved to the new canonical node.

### 17.3. Schema evolution scenario

Walk through what happens when the app bumps from schema 3 to schema 4. Suppose a hypothetical V29 Tower game ships, the export format changes again (more granular categories), and the tower-tracking app decides to adopt a new schema.

**Step 1: Add a new Schema node.**

```typescript
// src/shared/domain/field-graph/nodes/schemas.ts — append
schemaNode('schema:v4', {
  appVersion: '0.13.x',
  gameVersion: 'V29',
  description: 'V29 sectionized export with sub-category granularity. Triggered renames in damage section.',
}),
```

**Step 2: For each field that changed, add a new RENAMED_FROM edge referencing schema:v4.**

```typescript
// src/shared/domain/field-graph/edges/renamed-from.edges.ts — append
edge('damage_dealt_blackHole', 'RENAMED_FROM',
     { legacyKey: 'damage_blackHole', atSchema: 'schema:v4',
       reason: 'V29 category granularity' }),
```

This is the multi-hop rename from §14.3 in action. `damage_blackHole`, previously canonical at `schema:v3`, is now the legacy key for the new canonical `damage_dealt_blackHole`.

**Step 3: For fields that were dropped, add INTENTIONALLY_DROPPED_IN_SCHEMA edges.**

```typescript
edge('someV3Field', 'INTENTIONALLY_DROPPED_IN_SCHEMA', 'schema:v4',
     { reason: 'V29 game removed this concept' }),
```

**Step 4: For fields that were newly introduced, add SHIPPED_IN_SCHEMA edges.**

```typescript
fieldNode('damage_dealt_newCategoryField'),
edge('damage_dealt_newCategoryField', 'SHIPPED_IN_SCHEMA', 'schema:v4',
     { driver: 'game-version', gameVersion: 'V29' }),
// + HAS_DATA_TYPE, BELONGS_TO_SECTION, HAS_COLOR, etc
```

**Step 5: The migration gate reads the schema history from the graph.**

Today's migration gate (`docs/PRD-v28-migration-safety.md`) reads `V2_TO_V3_FIELD_MAP` as a hardcoded dictionary. In the graph-driven world, the gate asks the graph:

```typescript
// The gate's "what changes in this migration" query
const migrations = graph.migrationsBetween('schema:v3', 'schema:v4');
// migrations = {
//   renames:       [{ from: 'damage_blackHole', to: 'damage_dealt_blackHole', reason: '...' }, ...],
//   drops:         [{ field: 'someV3Field', reason: '...' }, ...],
//   newArrivals:   [{ field: 'damage_dealt_newCategoryField', driver: 'game-version' }, ...],
// };
```

The gate's UI displays this as a human-readable changelog. The migration runtime walks `migrations.renames` to rewrite storage keys. The storage bump in `storage-keys.ts` updates `V3_DATA_VERSION` (the existing constant) from `3` to `4`, matching the graph's `graph.currentSchema()` return value.

No hand-maintained migration map. No scattered conditionals in the parser. Every schema-to-schema transition is a *data diff* between two Schema nodes, computable on demand.

### 17.4. graph.currentSchema and graph.schemaHistory

Four queries expose schema history. Each is O(1) or O(schema-count) — schema count is small (single-digit) so there's no cost concern.

```typescript
// Which schema is currently canonical. Wires up to V3_DATA_VERSION.
graph.currentSchema(): NodeId;
// → 'schema:v3'

// All schemas in chronological order. First element is the oldest.
graph.schemaHistory(): readonly NodeId[];
// → ['schema:v1', 'schema:v2', 'schema:v3']

// Every field that has SHIPPED_IN_SCHEMA for this schema (first appearance as canonical).
graph.fieldsInSchema(schemaId: NodeId): readonly NodeId[];
// → ['battleReport_tier', 'battleReport_coinsEarned', ..., 'damage_blackHole', ...]

// Every rename, drop, and new-arrival between two schemas. Used by the migration gate.
graph.migrationsBetween(from: NodeId, to: NodeId): {
  renames:     Array<{ from: string; to: string; reason?: string }>;
  drops:       Array<{ field: string; reason: string }>;
  newArrivals: Array<{ field: string; driver?: string; gameVersion?: string }>;
};
```

The last query is the load-bearing one. It powers the migration gate's "what's about to change" UI, the CI's "graph diff" comment, and the `npm run graph:diff` CLI.

**Consuming from the existing `V3_DATA_VERSION` constant:**

Today's `storage-keys.ts` has `V3_COLUMN_PREFIX_VERSION = 3`. That constant and the graph's `graph.currentSchema()` must stay in lockstep. An invariant test makes that enforceable:

```typescript
it('V3_COLUMN_PREFIX_VERSION matches graph.currentSchema()', () => {
  const currentSchemaId = graph.currentSchema();
  const schemaMajor = Number(currentSchemaId.replace('schema:v', ''));
  expect(schemaMajor).toBe(V3_COLUMN_PREFIX_VERSION);
});
```

When the schema bumps to v4, the test fires until someone updates both the graph's schema node and `V3_COLUMN_PREFIX_VERSION` in lockstep. Two files, one invariant, no drift.

**The upshot.** Schema is a first-class graph entity. Schema evolution is a data diff. The migration gate, the CI pipeline, and the runtime parser all read the same substrate. Adding a new schema is a node-plus-edges declaration, not a code refactor. This is the payoff for treating schema as data.

---

> [< Prev: 16. Testing philosophy — system not configuration](./16-testing-philosophy.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 18. Write path — forms, updates, user edits >](./18-write-path.md)
