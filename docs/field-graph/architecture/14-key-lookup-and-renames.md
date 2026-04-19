# 14. Key lookup and renames — the conceptual model

> Part of the Field Graph Architecture spec.
> [< Prev: 13. Commit / PR strategy recommendation (for THIS approach)](./13-commit-pr-strategy-recommendation.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 15. Multi-section membership — confirming cardinality >](./15-multi-section-membership.md)

---

The user kept asking the same question in different words: "if I rename `blackHole` to `damage_blackHole`, is that ONE node with a RENAMED_FROM edge carrying the old key, or TWO nodes (old + new) with a RENAMED_FROM edge between them?" This is load-bearing for the whole design. Pick wrong and the graph accumulates orphan nodes forever; pick right and renames become the cleanest part of the system.

Sections 1–13 assumed the answer without stating it. This section states it plainly, walks through the parser resolution, and shows what happens when a field gets renamed a second time.

Note: sections 1–13 above were retro-edited to rename "version" → "schema" wherever the word referred to the tower-tracking storage schema (as opposed to Tower game versions like V28 or app package versions like 0.12.x). The edge types `SHIPPED_IN_SCHEMA` and `INTENTIONALLY_DROPPED_IN_SCHEMA` and the node kind `Schema` are the result of that pass; sections 14–19 take that vocabulary as given.

### 14.1. The rule: one node, one RENAMED_FROM edge carrying the old key

**A field is an identity; renames are transformations.** A node is a noun. An edge is a verb. `damage_blackHole` is the field — the identity, the thing you store data for, the thing consumers query. `blackHole` isn't a separate field; it's a *previous name* for that same identity.

So the model is: **one node per field**, and the old key lives as payload on a `RENAMED_FROM` edge pointing *out of* the current node.

```typescript
// ONE node — the canonical field
const node: FieldNode = {
  id: 'damage_blackHole',
  kind: 'Field',
  payload: {
    displayName: 'Black Hole',
    color: '#6366f1',
    // ...other current attributes
  },
};

// ONE edge — the rename history, payload carries the legacy key string
const renameEdge: Edge = {
  kind: 'RENAMED_FROM',
  from: 'damage_blackHole',
  payload: {
    legacyKey: 'blackHole',          // the V2 bare name
    atSchema: 'schema:v3',           // which storage schema adopted the rename
    reason: 'V28 section disambiguation — blackHole appeared in Damage, Coins, and Enemies Hit sections',
  },
};
```

There's no `blackHole` node. There never was. The legacy key only exists as a *payload string* on an edge pointing out of `damage_blackHole`. That payload is searchable, reverse-indexable, and auditable — it's data, not a dangling node.

**Why this is right:**

1. **Orphan prevention.** If `blackHole` were a node, it would have no other edges. No section, no display name, no color, no view. It would show up in `graph.nodesOfType('Field')` and make `graph.fieldsInSection(s)` iteration lie by one (unless every consumer learns to filter). A node that exists only as a RENAMED_FROM target is a node that shouldn't exist.
2. **Single source of truth per identity.** The field `damage_blackHole` accumulates *all* of its attributes in one place: section, color, rename history, data type, derivation, everything. A reviewer reading `damage_blackHole`'s declaration sees the whole story. With two nodes, the reviewer would have to cross-reference.
3. **Invariant tests get simpler.** "Every field has exactly one BELONGS_TO_SECTION" becomes trivially true because legacy keys aren't fields. You don't need an "internal, skip this one" escape hatch for ghost nodes.
4. **Multi-hop renames stay tractable.** (See §14.3 — a field renamed twice has two RENAMED_FROM edges on one node, both payloads queryable.)

**Shape of the in-memory graph after the rename:**

```
Before V28:
  graph.nodes contains:   (no `blackHole` node)
  graph.edges contains:   (no rename edges involving blackHole)

After V28 (V2→V3 schema bump):
  graph.nodes contains:
    { id: 'damage_blackHole', kind: 'Field', payload: {...} }
  graph.edges contains:
    { kind: 'RENAMED_FROM', from: 'damage_blackHole',
      payload: { legacyKey: 'blackHole', atSchema: 'schema:v3', ... } }
    { kind: 'BELONGS_TO_SECTION', from: 'damage_blackHole', to: 'section:damage' }
    { kind: 'HAS_DATA_TYPE', from: 'damage_blackHole', to: 'number' }
    // ...and so on
```

One node. Several edges. The RENAMED_FROM edge doesn't point at another node — its `from` is the *current* field, and its `payload.legacyKey` carries the old key string.

**A note on edge shape.** Earlier sections (3g, 8.1) show `RENAMED_FROM` edges with `to: 'coinsFromGoldenTower'` — pointing at the legacy key as if it were a node id. That was shorthand for the reviewer. The runtime shape is: `from: 'coins_goldenTower'`, `payload: { legacyKey: 'coinsFromGoldenTower', atSchema: 'schema:v3' }`. The legacy key is a string in the payload, not a node reference. The builder's validation (§8.3) checks that `legacyKey` is *not* already a declared node — because if it is, you have two fields that both claim to own that key, which is a conflict.

This is the one place where the "every edge has a `from` and `to` node" pattern bends. The legacy key is a string terminal, like `HAS_DISPLAY_NAME to 'Golden Tower'` is a string terminal. The edge's *node* endpoint is the current field; the *value* endpoint is the legacy key payload.

### 14.2. Parser resolution walkthrough

When the parser reads a raw key from storage or a V28 clipboard paste, it needs to figure out which canonical field node that key maps to. Three scenarios:

**Scenario A — the raw key is already canonical.** The user has V3 storage, re-opens the app. Parser reads `damage_blackHole`. Direct hit on the node table.

**Scenario B — the raw key is a known legacy.** The user has V2 storage from v0.11, opens v0.12 for the first time. Parser reads `blackHole`. No direct hit. Fall back to the legacy-key reverse index, which was built at graph-load time from every RENAMED_FROM edge's payload. Index returns `damage_blackHole`. Parser uses the canonical key from here on.

**Scenario C — the raw key is unknown.** The user imports a V29 export with a new field `dealtDamage_blackHole` (hypothetical). No direct hit, no legacy-index hit. This is a miss, and the caller decides what to do — create a `pending_classification` stub (see §9.2), warn and drop, or reject the whole import. The graph doesn't have an opinion; its job is to report "I don't know this key."

The resolution function:

```typescript
// src/shared/domain/field-graph/query.ts

/**
 * Resolve a raw key (from storage, clipboard, or CSV) to its canonical
 * Field node. The raw key may be:
 *   - the canonical key itself (direct hit)
 *   - a legacy key from any schema's RENAMED_FROM edge (reverse-index hit)
 *   - unknown (miss; caller decides)
 *
 * This is the ONE place in the codebase that accepts raw/legacy keys.
 * Everywhere else works with canonical keys.
 */
resolveFieldByAnyKey(rawKey: string): FieldNode | null {
  // 1. Direct hit on canonical key
  const direct = this.getField(rawKey);
  if (direct) return direct;

  // 2. Reverse-index lookup on RENAMED_FROM edges
  //    (built once at graph construction, O(1) per lookup)
  const canonicalId = this.legacyKeyIndex.get(rawKey);
  if (canonicalId) return this.getField(canonicalId);

  // 3. Miss — caller decides (create pending_classification node, warn, drop, reject)
  return null;
}
```

The reverse-index construction happens once, at graph build time:

```typescript
// src/shared/domain/field-graph/builder.ts — inside indexing phase
for (const edge of edges) {
  if (edge.kind === 'RENAMED_FROM') {
    const { legacyKey } = edge.payload;
    if (this.legacyKeyIndex.has(legacyKey)) {
      const existing = this.legacyKeyIndex.get(legacyKey);
      throw new FieldGraphBuildError(
        `Legacy key '${legacyKey}' claimed by both '${existing}' and '${edge.from}'. ` +
        `Two fields cannot both have the same V2 name.`,
      );
    }
    this.legacyKeyIndex.set(legacyKey, edge.from);
  }
}
```

This build-time check prevents the most pernicious bug: two fields claiming the same legacy key. If two V3 canonical fields both say "I was called `blackHole` in V2," the parser can't know which one to route V2-storage `blackHole` values to. Building fails loud with the exact conflict named.

**Walkthrough of `graph.describe('damage_blackHole')` output, with the legacy-key reverse lookup visible:**

```
$ npm run graph:describe damage_blackHole

# damage_blackHole

**Kind**: Field
**Tags**: (none)
**Data type**: number (via HAS_DATA_TYPE)

## Display
- Display name: "Black Hole"
- Color: #6366f1

## Classification
- Section: section:damage
- Category: category:combat (via section:damage)

## Relationships
### Outgoing
- IS_SOURCE_OF         -> damage_damageDealt
- APPEARS_IN_VIEW      -> view:run-details.damage
- APPEARS_IN_VIEW      -> view:source-analysis.damage
- SHARES_LABEL_WITH    -> coins_blackHole
- SHARES_LABEL_WITH    -> enemiesHitBy_blackHole
- SHARES_LABEL_WITH    -> killedWithEffectActive_blackHole

### Rename history (from RENAMED_FROM payloads)
- legacyKey='blackHole'       atSchema=schema:v3  reason="V28 section disambiguation"
- legacyKey='black_hole'      atSchema=schema:v3  reason="underscore variant seen in 3% of V2 storage"

### Reverse-index contribution
- Parser resolving raw key 'blackHole'  -> damage_blackHole
- Parser resolving raw key 'black_hole' -> damage_blackHole
```

The rename-history block is derived from RENAMED_FROM edge payloads, not a separate data source. The reverse-index block tells the reviewer which raw strings this node will catch at the parser boundary.

**Concrete resolution for each scenario:**

```typescript
// Scenario A — canonical key, direct hit
graph.resolveFieldByAnyKey('damage_blackHole');
// → { id: 'damage_blackHole', kind: 'Field', payload: {...} }

// Scenario B — legacy key, reverse-index hit
graph.resolveFieldByAnyKey('blackHole');
// → { id: 'damage_blackHole', kind: 'Field', payload: {...} }   // SAME object

graph.resolveFieldByAnyKey('black_hole');                        // underscore variant
// → { id: 'damage_blackHole', kind: 'Field', payload: {...} }   // SAME object

// Scenario C — unknown key, miss
graph.resolveFieldByAnyKey('dealtDamage_blackHole');              // hypothetical V29 name
// → null  (caller creates a stub tagged 'pending_classification')
```

Notice: scenarios A and B return *the same object* — there's no separate "legacy node" to branch on. Consumer code works with one identity regardless of how the raw key arrived.

### 14.3. Do we ever remove old RENAMED_FROM edges?

**No. RENAMED_FROM edges are permanent. They are the audit trail.**

Two reasons:

1. **Old storage persists.** Some users open the app weeks or months after an upgrade. Their localStorage still has the V2 `blackHole` key. The parser needs the RENAMED_FROM edge to remap that key on first load. Delete the edge and the data silently drops.
2. **Rename history is a feature.** `npm run graph:rename-history damage_blackHole` prints the full chain. A reviewer debugging an old run can see that the value labeled `blackHole` in the backup file is the same identity as today's `damage_blackHole`. That audit value is exactly the user's stated pain — "where did this field come from?"

**Multi-hop renames: same principle, more edges on the same node.**

Suppose V29 arrives and the game renames the damage category *again* — `damage_blackHole` → `damage_dealt_blackHole`. The graph handles this by adding a new RENAMED_FROM edge to the *current* canonical node (`damage_dealt_blackHole`), with payload pointing at the now-legacy `damage_blackHole`:

```typescript
// After V29 rename, the node id moves to damage_dealt_blackHole
const node: FieldNode = {
  id: 'damage_dealt_blackHole',  // new canonical
  kind: 'Field',
  payload: {...},
};

// Two RENAMED_FROM edges now accumulated on this node:
const renameEdge1: Edge = {
  kind: 'RENAMED_FROM',
  from: 'damage_dealt_blackHole',
  payload: { legacyKey: 'blackHole',        atSchema: 'schema:v3', reason: 'V28 disambiguation' },
};

const renameEdge2: Edge = {
  kind: 'RENAMED_FROM',
  from: 'damage_dealt_blackHole',
  payload: { legacyKey: 'damage_blackHole', atSchema: 'schema:v4', reason: 'V29 category granularity' },
};
```

At parser-boundary time:

```typescript
graph.resolveFieldByAnyKey('blackHole');          // V2 bare       → damage_dealt_blackHole
graph.resolveFieldByAnyKey('damage_blackHole');   // V3 canonical  → damage_dealt_blackHole
graph.resolveFieldByAnyKey('damage_dealt_blackHole'); // V4 canonical → damage_dealt_blackHole (direct hit)
```

All three raw keys resolve to the same identity. The graph has exactly one `damage_dealt_blackHole` node with two RENAMED_FROM edges. `graph.describe('damage_dealt_blackHole')`'s "Rename history" block now shows two entries, in schema order.

The invariant "the legacy-key reverse index has one entry per RENAMED_FROM edge" still holds — each edge contributes one legacy-key string. Two edges → two entries. Three-hop rename → three entries. The reverse index grows with schema history, not with schema depth; the depth is just a sort key on the history.

**No edge type is ever deleted. No node is ever demoted.** The audit trail is append-only.

An important corollary: if you're cleaning up the graph and notice a RENAMED_FROM edge referring to a legacy key that hasn't been seen in production storage for a year — **still don't delete it**. The cost of keeping it is one row in a table; the cost of deleting it is a silent data-loss bug in some user's edge-case localStorage.

### 14.4. Two kinds of lookup — explicit, not magical

The graph exposes two lookup functions. They serve different purposes and callers must pick the right one.

```typescript
// Canonical-only: fast path, no fallback. Use when you KNOW the key is canonical.
graph.getField(fieldKey: string): FieldNode | null;

// Parser-boundary: direct + reverse-index fallback. Use when raw keys might be legacy.
graph.resolveFieldByAnyKey(rawKey: string): FieldNode | null;
```

**When to use each:**

| Caller | Function | Why |
|---|---|---|
| UI component rendering `run.fields.damage_blackHole` | `getField` | Field keys in `ParsedGameRun` are canonical after parsing. No legacy keys in app state. |
| Aggregator iterating `graph.sourcesOf(totalField)` | `getField` | Query results are canonical node ids. |
| Parser seeing `blackHole` in V2 localStorage | `resolveFieldByAnyKey` | Raw storage keys may be legacy. |
| CSV importer reading a backup file | `resolveFieldByAnyKey` | Backup CSVs carry whatever keys the app wrote at backup time. |
| Dev tool `graph:describe <key>` | `resolveFieldByAnyKey` | Users at a CLI may type either form. |

The invariant: **app state uses canonical keys only**. The parser-boundary is the exact place where raw/legacy keys are accepted. Everywhere downstream — context state, aggregations, rendering — uses canonical. This makes `getField` the hot-path function and `resolveFieldByAnyKey` a boundary-only concern.

**The "internal code paths use `getField`, not `resolveFieldByAnyKey`" invariant.**

If a UI component or aggregator reaches for `resolveFieldByAnyKey`, that's a code smell — it means raw/legacy keys are leaking past the parser. One test enforces this:

```typescript
// src/shared/domain/field-graph/__tests__/resolution-boundary.test.ts
import { describe, it, expect } from 'vitest';
import fg from 'fast-glob';
import fs from 'fs';

describe('Parser boundary is the only caller of resolveFieldByAnyKey', () => {
  it('no file outside the import/parser boundary calls resolveFieldByAnyKey', async () => {
    const allowedPaths = [
      'src/features/analysis/shared/parsing/',
      'src/features/data-import/',
      'src/shared/domain/migrations/',
      'scripts/',                              // CLI tools can
      'src/shared/domain/field-graph/',        // graph internals can
    ];

    const hits = await fg(['src/**/*.{ts,tsx}'], { absolute: false });
    const violations: string[] = [];
    for (const file of hits) {
      const contents = fs.readFileSync(file, 'utf-8');
      if (!contents.includes('resolveFieldByAnyKey')) continue;
      const allowed = allowedPaths.some((p) => file.startsWith(p));
      if (!allowed) violations.push(file);
    }

    expect(violations, `resolveFieldByAnyKey leaked past the parser boundary:\n${violations.join('\n')}`).toEqual([]);
  });
});
```

This is a file-level AST check (grep-backed is enough for the first version). It fails in CI if any UI or aggregation file starts calling `resolveFieldByAnyKey`, because that function should never run outside the import/parser boundary. The fast path — `getField` — is the correct call everywhere else.

Paired with an invariant test "every `ParsedGameRun.fields` key is a declared canonical key" (run against sample runs from `sampleData/`), you get a two-sided guarantee: the parser turns raw→canonical at the boundary, and no code downstream accepts legacy keys by accident.

**The reason for two functions, explicit rather than one magic function:**

A single `graph.lookup(key)` that always falls back to the reverse-index would be convenient. It's also a footgun — it lets a UI component accept legacy keys, which means legacy keys can sneak into app state, which means the "every key in ParsedGameRun is canonical" invariant silently breaks. Two separate functions force the caller to declare intent at the call site. `getField` calls are cheap; `resolveFieldByAnyKey` calls are a signal that you're at a boundary. Code review catches misuse at a glance.

---

> [< Prev: 13. Commit / PR strategy recommendation (for THIS approach)](./13-commit-pr-strategy-recommendation.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 15. Multi-section membership — confirming cardinality >](./15-multi-section-membership.md)
