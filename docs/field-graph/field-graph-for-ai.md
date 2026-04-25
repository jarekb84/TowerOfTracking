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

Import named query functions from `@/shared/domain/field-graph` and call
them directly. Each takes a `FieldRef` (string id or `*_NODE` handle).

```ts
import {
  fieldsInSection, sourcesOf, acceptedValuesFor, enumValueMeta,
  csvHeaderOf, isInternalField,
} from '@/shared/domain/field-graph';
import {
  SECTION_COINS_NODE, BATTLE_REPORT__COINS_EARNED_NODE, _RUN_TYPE_NODE, _DATE_NODE,
} from '@/shared/domain/field-graph/catalog/fields.nodes';

fieldsInSection(SECTION_COINS_NODE);                // ['coins_blackHole', ...]
sourcesOf(BATTLE_REPORT__COINS_EARNED_NODE);        // every IS_SOURCE_OF source
acceptedValuesFor(_RUN_TYPE_NODE);                  // ['farm', 'tournament', 'milestone']
enumValueMeta(_RUN_TYPE_NODE, 'farm');              // { id, wireValue, displayName?, color? }
csvHeaderOf(_DATE_NODE);                            // '_Date'
isInternalField(_DATE_NODE);                        // true
```

#### Cold-start query index

Every available query function. Imported from `@/shared/domain/field-graph`.
All take a `FieldRef` (string or Node) unless noted.

| Query | Returns | Use when |
|---|---|---|
| `getField(id)` | `Node \| null` | Resolve a canonical id at the parser boundary. **String only.** |
| `resolveFieldByAnyKey(rawKey)` | `Node \| null` | Resolve a raw key (canonical OR legacy) at the parser/import boundary. **String only.** |
| `fieldsInSection(section)` | `readonly string[]` | "What fields belong to this UI section?" |
| `sectionsOf(field)` | `readonly string[]` | "Which sections does this field belong to?" (multi-section allowed) |
| `sourcesOf(totalField)` | `readonly string[]` | "What fields sum into this total?" (e.g. coin / damage breakdowns) |
| `enumValuesOf(field)` | `readonly string[]` | "What enum-value node ids does this field reference?" (lower-level than `acceptedValuesFor`) |
| `acceptedValuesFor(field)` | `readonly string[]` | "What enum wire values does this field accept?" |
| `isAcceptedValue(field, raw)` | `boolean` | "Is `raw` one of this field's accepted wire values?" Exact match. |
| `matchAcceptedValue(field, raw)` | `string \| null` | Canonicalize-or-reject — returns the wire value on match, else null. |
| `enumValueMeta(field, wireValue)` | `EnumValueMeta \| null` | Full metadata for a declared accepted value: `{ id, wireValue, displayName?, color? }` |
| `internalFields()` | `readonly string[]` | All internal app-fields in canonical order (`_date`, `_time`, `_notes`, `_runType`, `_rank`). **No args.** |
| `isInternalField(field)` | `boolean` | "Is this an app-managed metadata field?" |
| `csvHeaderOf(field)` | `string \| undefined` | Custom CSV header (e.g. `_Date` for `_date`); undefined when no override. |
| `displayNameOf(node)` | `string \| undefined` | Human-readable display name; works for both Field and EnumValue sources. |
| `colorOf(node)` | `string \| undefined` | Hex color; works for both Field and EnumValue sources. |

To **add a new query**, **add a new edge type**, or **add a new concept
folder** under `catalog/edges/`, follow
[`src/shared/domain/field-graph/catalog/edges/PATTERN.md`](../../src/shared/domain/field-graph/catalog/edges/PATTERN.md).
That file is the single source of truth for the per-concept-directory
pattern; this guide stays focused on usage.

### Operation 4: Debugging a missing value

If a field's value is unexpectedly 0 / missing / mis-rendered:

1. Grep `catalog/edges/**/*.edges.ts` for the field id. Look for:
   missing BELONGS_TO_SECTION, wrong HAS_DATA_TYPE, missing
   RENAMED_FROM if the value is in old storage format.

2. Check `catalog/edges/renames/renames.edges.ts` (commit 10) for the
   rename chain if the issue is V2 storage not being remapped to V3
   canonical.

3. Run `npm test src/shared/domain/field-graph` — the catalog
   `*.invariants.test.ts` files name the exact field and constraint
   violated on failure. Behavior failures point at the related
   `*.queries.test.ts`.

4. *Future (post-epic):* a CLI surface (`graph:describe`, `graph:explain`,
   `graph:orphans`) is planned to make these inspections one-line, but
   isn't built yet — for now use grep + the test output. Available
   queries are listed in the cold-start index in Operation 3 above; if
   a question requires a query not in that index, add it per "Adding a
   new query" before consuming.

## Critical invariants (never violate)

- **Never create two nodes with the same id.** Node ids are unique across kinds.
- **Never create two RENAMED_FROM edges with the same legacyKey.** Two fields
  cannot both claim the same V2 name; the parser can't route values.
- **Never declare an edge pointing at a node that doesn't exist.** The builder
  fails loud; this is usually a typo.
- **Never add a node without at least one BELONGS_TO_SECTION edge.** Orphan
  fields are silent bugs. (Exception: orphan-classification carve-outs are
  declared structurally — e.g. as a marker edge — not via free-form node
  metadata.)
- **Never call `resolveFieldByAnyKey` outside the parser / import boundary.**
  That function accepts legacy keys; calling it from UI or aggregators lets
  legacy keys leak into app state. Use `getField` (or pass a `*_NODE` handle
  through any other query method) everywhere else.
- **Never introduce `Node.tags`. Facts about a node are edges.** The `tags`
  axis was retired in commit 5b (see [`EXPLORATION-tag-vs-edge.md`](./EXPLORATION-tag-vs-edge.md)).
  Every facet of a field — "is internal," "is tournament-only," "is user
  text," "uses an empty-string null sentinel" — is encoded as a marker edge
  (binary, no payload), a terminal-string edge (carries a value), or a
  between-nodes edge (relates one thing to another). Tags are unenforced,
  untyped, and cannot evolve. If a tag feels right, the question is "which
  edge type expresses this?", not "which tag string?" Node-local debug
  metadata that no consumer queries belongs in `Node.payload`, not a tag.

### Polymorphic input — `string | Node`

Every query function (except `getField` and `resolveFieldByAnyKey`,
which are parser-boundary string-only lookups) accepts either a string
node id or a `Node` handle. Use whichever you have:

```ts
sourcesOf(BATTLE_REPORT__COINS_EARNED_NODE)   // typical: import the node
sourcesOf(rawId)                              // chained from another query
```

Permissive on unknown ids — `sourcesOf('not_a_real_field')` returns `[]`.
Build-time invariants catch declarations that *reference* missing nodes
(dangling edges); consumer queries against undeclared ids silently miss,
which is the right surface for orphan discovery (V29 fields not yet in
the catalog).

## CLAUDE.md-style checklist for field edits

**Adding a new field, renaming a field, or adding a new edge type:**
follow [`src/shared/domain/field-graph/catalog/edges/PATTERN.md`](../../src/shared/domain/field-graph/catalog/edges/PATTERN.md).
The "How to" sections there cover concept folders, file naming, and the
extension checklists. This guide intentionally doesn't duplicate that
content — keep both files in sync by editing PATTERN.md and pointing here.

**Adding a new closed-enum value to an existing enum field:**
1. Append the value to the authoritative `as const` tuple in
   `src/shared/domain/<domain>/types.ts` (e.g. `RUN_TYPE_VALUES`).
2. Add the per-value display name + color to the matching presentation
   record in `catalog/edges/enum-values/enum-values.edges.ts`.
3. The graph catalog auto-derives the EnumValue node + ACCEPTS_VALUE +
   metadata edges. The `enum-sync.invariant.test.ts` test catches drift.
4. Run `npm test`. Selectors, filters, validators, and CSV export pick up
   the new value automatically.

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

## Exploration docs (when you're spinning up a side investigation)

If a commit raises an architectural question worth a deep-dive, capture it as
`docs/field-graph/EXPLORATION-<topic>.md`. Every exploration doc carries a
`## Human decision` section near the top — the model writes the recommendation;
the human fills in the decision, reasoning (preserved as a direct quote where
possible), deviations from the recommendation, scope, status, and revisit
triggers. Lightweight ADR pattern, no separate tracker. See
[`prompt-skeleton.md`](./prompt-skeleton.md) §"Exploration-doc convention" for
the full template, and existing docs (e.g.
[`EXPLORATION-tag-vs-edge.md`](./EXPLORATION-tag-vs-edge.md),
[`EXPLORATION-node-identity-abc-deep-dive.md`](./EXPLORATION-node-identity-abc-deep-dive.md))
for the format.