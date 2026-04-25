# Field Graph for AI — Quick Reference

**Purpose**: This document orients AI agents to the tower-tracking field graph
(see `docs/field-graph/field-registry-exploration/07-relationship-graph.md` for the full
design). If you are an AI agent about to add, rename, or edit a field, READ
THIS FIRST. It will save you from rewriting 15 files when you only need to
edit 1.

## The one-page summary

Fields, sections, schemas, and views are **nodes**. Every relationship between
them is a typed **edge**. Consumers (UI components, aggregators, validators,
CSV exporters) do NOT own field lists — they query the graph.

Read path:
  raw key (storage/clipboard) → graph.resolveFieldByAnyKey → canonical key
  canonical key → app state → graph.getField / graph.sourcesOf / graph.fieldsInSection → render

Write path:
  form input → canonical key → validateFieldUpdate → applyUpdate (with derivation cascade) → state

Invariants (tested in CI):
  - Every Field has at least one BELONGS_TO_SECTION edge
  - Every RENAMED_FROM legacyKey is unique
  - Every IS_SOURCE_OF target has HAS_DATA_TYPE number
  - RENAMED_FROM chains have no cycles
  - No file outside the parser boundary calls resolveFieldByAnyKey

## The four most common operations

### Operation 1: Adding a new field

When asked to add a new field (e.g., `coins_dragonBreath`):

1. Declare the node in `src/shared/domain/field-graph/catalog/fields.nodes.ts`
   as a named `*_NODE` export grouped under the right section comment-bar
   (`SECTION__FIELD_NODE` convention; double-underscore between section and
   field; internal fields keep their leading `_`):
   ```typescript
   export const COINS__DRAGON_BREATH_NODE = fieldNode('coins_dragonBreath');
   ```

2. Declare its required edges in the matching `catalog/*.edges.ts` files
   (one file per concern: `section-membership.edges.ts`,
   `data-types.edges.ts`, `sources.edges.ts`, …). Reference the node via
   `<NAME>_NODE.id` — never raw strings — so renames stay refactor-safe:
   ```typescript
   edge(COINS__DRAGON_BREATH_NODE.id, 'BELONGS_TO_SECTION', SECTION_COINS_NODE.id),
   edge(COINS__DRAGON_BREATH_NODE.id, 'HAS_DATA_TYPE', 'number'),
   edge(COINS__DRAGON_BREATH_NODE.id, 'HAS_DISPLAY_NAME', 'Dragon Breath'),
   edge(COINS__DRAGON_BREATH_NODE.id, 'HAS_COLOR', '#7dd3fc'),
   edge(COINS__DRAGON_BREATH_NODE.id, 'IS_SOURCE_OF', BATTLE_REPORT__COINS_EARNED_NODE.id),
   ```

3. If this is a field introduced by a game version or schema bump, add:
   ```typescript
   edge(COINS__DRAGON_BREATH_NODE.id, 'SHIPPED_IN_SCHEMA', SCHEMA_V4_NODE.id,
        { driver: 'game-version', gameVersion: 'V29' }),
   ```

4. Run `npm test` (specifically the field-graph + invariant tests). The
   builder fails loud on dangling edges and cardinality violations.

DO NOT touch `supportedFields.json`, `coin-sources.ts`, `section-config.ts`,
or any consumer file. Consumers query the graph; they pick up the new field
automatically.

### Operation 2: Renaming a field

When asked to rename an existing field (e.g., `coins_spotlight` to
`coins_spotlightBeam`):

1. Rename the named export and the underlying string id in
   `catalog/fields.nodes.ts`:
   ```typescript
   export const COINS__SPOTLIGHT_BEAM_NODE = fieldNode('coins_spotlightBeam'); // was COINS__SPOTLIGHT_NODE
   ```
   IDE rename on the `*_NODE` constant propagates through every consumer
   import; the string id only lives in this one file.

2. Add a RENAMED_FROM edge capturing the rename. (Today this is in
   `catalog/renames.edges.ts` once commit 10 lands; until then,
   `V2_TO_V3_FIELD_MAP` carries renames):
   ```typescript
   renamedFromEdge(COINS__SPOTLIGHT_BEAM_NODE.id,
        { legacyKey: 'coins_spotlight', atSchema: SCHEMA_V4_NODE.id,
          reason: 'V29 naming convention' }),
   ```

3. DO NOT add a node for `coins_spotlight`. The legacy key lives as a
   payload string on the RENAMED_FROM edge. Declaring a node for it is wrong
   and will fail the `every legacyKey is unique` invariant.

4. Run `npm test`.

Consumer code that referenced the old name is either:
- Already in graph queries — picks up the new name automatically.
- Importing the `*_NODE` constant — IDE rename followed it.
- Still hardcoded as a raw string somewhere unusual — fix it by replacing
  the hardcoded string with a node import (`COINS__SPOTLIGHT_BEAM_NODE`).

### Operation 3: Querying the graph

Consumers call `appGraph()` from `@/shared/domain/field-graph` to get the
shared singleton. Methods accept either a `string` id or a `Node` handle
(see "Polymorphic input" under "Critical invariants" below). Pass node
handles when you have an import; pass strings at the parser/import boundary
or when chaining results from another graph call.

- "All fields in the Coins section": `graph.fieldsInSection(SECTION_COINS_NODE)`
- "All sources of the coins-earned total": `graph.sourcesOf(BATTLE_REPORT__COINS_EARNED_NODE)`
- "Fields derived from battleDate": `graph.fieldsDerivedFrom(BATTLE_REPORT__BATTLE_DATE_NODE)` *(commit 9)*
- "What accepts which enum values": `graph.acceptedValuesFor(_RUN_TYPE_NODE)`
- "Full metadata for one accepted value": `graph.enumValueMeta(_RUN_TYPE_NODE, 'farm')`
  → `{ id, wireValue, displayName?, color? }` in one call

Query methods live on `FieldGraph` in `src/shared/domain/field-graph/field-graph.ts`.
Adding a new query method is a few lines of index walking plus a unit test
in `field-graph.test.ts` against a hand-built toy graph. Follow the
"engine-method-per-consumer-pattern" rule: every consumer-facing usage
gets a named method — don't expose raw `edgesFrom`/`edgesTo` to consumers.

### Operation 4: Debugging a missing value

If a field's value is unexpectedly 0 / missing / mis-rendered:

1. Open the relevant `catalog/*.edges.ts` files and grep for the field id.
   Look for: missing BELONGS_TO_SECTION, wrong HAS_DATA_TYPE, missing
   RENAMED_FROM if the value is in old storage format.

2. Check `catalog/renames.edges.ts` (commit 10) for the rename chain if the
   issue is V2 storage not being remapped to V3 canonical.

3. Run `npm test src/shared/domain/field-graph` — the catalog and invariant
   tests name the exact field and constraint violated on failure.

4. *Future (post-epic):* a CLI surface (`graph:describe`, `graph:explain`,
   `graph:orphans`) is planned to make these inspections one-line, but
   isn't built yet — for now use grep + the test output.

## Critical invariants (never violate)

- **Never create two nodes with the same id.** Node ids are unique across kinds.
- **Never create two RENAMED_FROM edges with the same legacyKey.** Two fields
  cannot both claim the same V2 name; the parser can't route values.
- **Never declare an edge pointing at a node that doesn't exist.** The builder
  fails loud; this is usually a typo.
- **Never add a node without at least one BELONGS_TO_SECTION edge.** Orphan
  fields are silent bugs. (Exception: nodes tagged `'dropped'` or
  `'pending_classification'` can skip this.)
- **Never call `resolveFieldByAnyKey` outside the parser / import boundary.**
  That function accepts legacy keys; calling it from UI or aggregators lets
  legacy keys leak into app state. Use `getField` (or pass a `*_NODE` handle
  through any other query method) everywhere else.

### Polymorphic input — `string | Node`

Every query method on `FieldGraph` (except `getField` and `resolveFieldByAnyKey`)
accepts either a string node id or a `Node` handle. Use whichever you have:

```ts
graph.sourcesOf(BATTLE_REPORT__COINS_EARNED_NODE)   // typical: import the node
graph.sourcesOf(rawId)                              // chained from another query
```

Permissive on unknown ids — `sourcesOf('not_a_real_field')` returns `[]`.
Build-time invariants catch declarations that *reference* missing nodes
(dangling edges); consumer queries against undeclared ids silently miss,
which is the right surface for orphan discovery (V29 fields not yet in
the catalog).

## CLAUDE.md-style checklist for field edits

When asked to add a new field, always:
1. Declare the named `*_NODE` export in `catalog/fields.nodes.ts`, in the
   right section block, following `SECTION__FIELD_NODE` convention.
2. Declare its BELONGS_TO_SECTION edge in `catalog/section-membership.edges.ts`.
3. Declare its HAS_DATA_TYPE edge in `catalog/data-types.edges.ts`.
4. Declare its HAS_DISPLAY_NAME edge (unless the default-derivation pattern
   covers it — capitalize(camelSplit(id.after('_')))).
5. Declare its HAS_COLOR edge (for summable numeric fields that appear in
   charts).
6. Declare its IS_SOURCE_OF edge(s) if it contributes to a total, in
   `catalog/sources.edges.ts`.
7. Run `npm test src/shared/domain/field-graph` — invariants catch any
   dangling edges or missing required relations.
8. Do NOT modify consumer files; they query the graph.

When asked to rename a field, always:
1. Rename the `*_NODE` export name and the underlying string id in
   `catalog/fields.nodes.ts`. IDE rename on the const propagates through
   every consumer that imports it.
2. Add ONE RENAMED_FROM edge in `catalog/renames.edges.ts` with
   legacyKey = old id, atSchema = the schema that adopted the rename.
3. Do NOT add a node for the legacy key.
4. Run `npm test src/shared/domain/field-graph`.

When asked to add a new relationship type:
1. Add the case to the `EdgeType` union in `types.ts`.
2. Add its row to `EDGE_META` (sourceKind, targetKind, cardinality,
   optional `symmetric`).
3. Add 2-3 invariant tests in `field-graph.test.ts`:
   - Shape: what node kinds are valid endpoints?
   - Cardinality: one-per-source? many? at-least-one?
   - Semantics: any cross-edge constraint?
4. Add a query method to `FieldGraph` (with memoization where appropriate).
   Take `FieldRef` (`string | Node`) for any node-id parameter.
5. Add 2-3 unit tests for the query method against a seeded small graph.

When asked to add a new closed-enum value to an existing enum field:
1. Append the value to the authoritative `as const` tuple in
   `src/shared/domain/<domain>/types.ts` (e.g. `RUN_TYPE_VALUES`).
2. Add the per-value display name + color to the matching presentation
   record in `catalog/<enum>.edges.ts`.
3. The graph catalog auto-derives the EnumValue node + ACCEPTS_VALUE +
   metadata edges. The `enum-sync.invariant.test.ts` test catches drift.
4. Run `npm test`. Selectors, filters, validators, and CSV export all
   pick up the new value automatically.

## Writing consumers

Rules that surfaced during the first vertical slice (commit 4). Follow these
when adding code that reads from the graph.

### Don't duplicate TypeScript enums into the graph

When a field's value set is already expressed as a TS `as const` tuple plus
a union type (e.g. `RUN_TYPE_VALUES` + `RunTypeValue` in
`src/shared/domain/run-types/types.ts`), keep TS authoritative and have the
graph catalog READ from the same const:

```ts
// graph catalog file
import { RUN_TYPE_VALUES } from '@/shared/domain/run-types/types';
export const ENUM_VALUE_NODES = RUN_TYPE_VALUES.map((v) => enumValueNode(...));
export const ENUM_VALUE_EDGES = RUN_TYPE_VALUES.flatMap((v) => [
  edge('_runType', 'ACCEPTS_VALUE', idFor(v)),
  // ...per-value metadata edges
]);
```

Adding a new value is one edit in the TS const; both systems pick it up. An
invariant test (`enum-sync.invariant.test.ts`) enforces the sync.

### Graph calls are for dynamic discovery, not static dispatch

A 3-case switch over a closed enum doesn't need a graph call. Examples of
code that stays TS-only:

```ts
// mapping a URL param to a closed enum: TS predicate, not a graph call
return isRunTypeValue(urlType) ? urlType : RunType.FARM;
```

Graph queries earn their keep when the consumer needs to:
- Iterate over values without hardcoding them (filter dropdowns that must
  auto-pick-up new values at runtime).
- Consume attached metadata (display name, color, CSV header, data type)
  that lives on graph nodes — even a closed enum benefits when the metadata
  is per-value and already declared in the graph.

If your consumer is a 3-line switch and has no metadata to look up, leave it
as a switch.

### Don't copy architecture prose into consumer code

One-liner comments that describe what the consumer does stay. Comments that
explain how the graph works, link to architecture docs, or teach the reader
about node/edge semantics get deleted — that knowledge lives in this file and
in the graph engine's source, not in every call site.

Bad (repeats architecture):
```ts
// Queries the field graph so adding a new `_runType` enum value makes the
// corresponding URL work without touching this file. See
// `docs/field-graph/architecture/11-internal-app-fields.md` §11.2.
```

Good (describes consumer semantics):
```ts
// URL params get canonicalized to RunTypeValue; unknown inputs default to FARM.
```

## When NOT to use the graph

- Math. Aggregations still compute sums/means/groupings the same way; the
  graph tells you WHICH fields to aggregate, not HOW.
- One-off feature flags or experiments. A single boolean in context is fine;
  don't manufacture graph edges for throwaway toggles.
- Runtime-only state (filter selections, sort order, UI toggles). The graph
  is the catalog; transient UI state is component state.