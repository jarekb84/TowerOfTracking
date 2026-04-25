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

1. Declare the node in `src/shared/domain/field-graph/nodes/fields.ts`:
   ```typescript
   fieldNode('coins_dragonBreath'),
   ```

2. Declare its required edges in the matching `edges/*.ts` files:
   ```typescript
   edge('coins_dragonBreath', 'BELONGS_TO_SECTION', 'section:coins'),
   edge('coins_dragonBreath', 'HAS_DATA_TYPE', 'number'),
   edge('coins_dragonBreath', 'HAS_DISPLAY_NAME', 'Dragon Breath'),
   edge('coins_dragonBreath', 'HAS_COLOR', '#7dd3fc'),
   edge('coins_dragonBreath', 'IS_SOURCE_OF', 'battleReport_coinsEarned'),
   ```

3. If this is a field introduced by a game version or schema bump, add:
   ```typescript
   edge('coins_dragonBreath', 'SHIPPED_IN_SCHEMA', 'schema:v4',
        { driver: 'game-version', gameVersion: 'V29' }),
   ```

4. Run `npm run graph:check`. Invariants catch anything missing.

DO NOT touch `supportedFields.json`, `coin-sources.ts`, `section-config.ts`,
or any consumer file. Consumers query the graph; they pick up the new field
automatically.

### Operation 2: Renaming a field

When asked to rename an existing field (e.g., `coins_spotlight` to
`coins_spotlightBeam`):

1. Rename the node id in the field declaration:
   ```typescript
   fieldNode('coins_spotlightBeam'),   // was 'coins_spotlight'
   ```

2. Rename the node id in every edge that mentions it (mechanical edit; all
   in the `field-graph/` tree).

3. Add a RENAMED_FROM edge capturing the rename:
   ```typescript
   edge('coins_spotlightBeam', 'RENAMED_FROM',
        { legacyKey: 'coins_spotlight', atSchema: 'schema:v4',
          reason: 'V29 naming convention' }),
   ```

4. DO NOT add a node for `coins_spotlight`. The legacy key lives as a
   payload string on the RENAMED_FROM edge. Declaring a node for it is wrong
   and will fail the `every legacyKey is unique` invariant.

5. Run `npm run graph:check`.

Consumer code that referenced `coins_spotlight` is either:
- Already in graph queries — picks up the new name automatically.
- Still hardcoded — fix it by replacing the hardcoded string with a graph
  query (`graph.sourcesOf` or similar).

### Operation 3: Querying the graph

When asked to find fields by relationship:

- "All fields in the Coins section": `graph.fieldsInSection('section:coins')`
- "All sources of the coins-earned total": `graph.sourcesOf('battleReport_coinsEarned')`
- "Every rename ever applied to a field": `graph.describe(fieldKey).renamedFrom`
- "Fields derived from battleDate": `graph.fieldsDerivedFrom('battleReport_battleDate')`
- "What accepts which enum values": `graph.acceptedValuesFor('_runType')`

If the query you need doesn't exist, check `src/shared/domain/field-graph/query.ts`
for similar patterns. Adding a new query method is a few lines of index walking
plus a unit test.

### Operation 4: Debugging a missing value

If a field's value is unexpectedly 0 / missing / mis-rendered:

1. Run `npm run graph:describe <fieldKey>` — shows every edge of that field.
   Look for: missing BELONGS_TO_SECTION, wrong HAS_DATA_TYPE, missing
   RENAMED_FROM if the value is in old storage format.

2. Run `npm run graph:explain <legacyKey> <canonicalKey>` — shows the rename
   chain if the issue is V2 storage not being remapped to V3 canonical.

3. Run `npm run graph:orphans` — surfaces fields with no views, missing edges,
   or `pending_classification` tags. Common cause of "field imported but not
   shown anywhere."

4. Check the invariant test output: `npm run test graph-invariants`. Each
   failure names the exact field and constraint violated.

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
  legacy keys leak into app state. Use `getField` everywhere else.

## CLAUDE.md-style checklist for field edits

When asked to add a new field, always:
1. Declare the node in `nodes/fields.ts`.
2. Declare its BELONGS_TO_SECTION edge.
3. Declare its HAS_DATA_TYPE edge.
4. Declare its HAS_DISPLAY_NAME edge (unless the default-derivation pattern
   covers it — capitalize(camelSplit(id.after('_')))).
5. Declare its HAS_COLOR edge (for summable numeric fields that appear in
   charts).
6. Declare its IS_SOURCE_OF edge(s) if it contributes to a total.
7. Run `npm run graph:check`.
8. Do NOT modify consumer files; they query the graph.

When asked to rename a field, always:
1. Rename the node id in `nodes/fields.ts` and every referring edge file.
2. Add ONE RENAMED_FROM edge with legacyKey = old id, atSchema = the schema
   that adopted the rename.
3. Do NOT add a node for the legacy key.
4. Run `npm run graph:check`.

When asked to add a new relationship type:
1. Add the case to the `Edge` discriminated union in `types.ts`.
2. Add its cardinality to `EDGE_CARDINALITY`.
3. Add 2-3 invariant tests in `graph-invariants.test.ts`:
   - Shape: what node kinds are valid endpoints?
   - Cardinality: one-per-source? many? at-least-one?
   - Semantics: any cross-edge constraint?
4. Add a query method to `FieldGraph` (with memoization where appropriate).
5. Add 2-3 unit tests for the query method against a seeded small graph.

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