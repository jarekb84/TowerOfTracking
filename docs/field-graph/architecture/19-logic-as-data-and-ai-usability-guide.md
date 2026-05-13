# 19. "Logic as data" — mental model and AI-usability guide

> Part of the Field Graph Architecture spec.
> [< Prev: 18. Write path — forms, updates, user edits](./18-write-path.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | —

---

The user's phrasing was: "you're essentially not writing logic via code, you're writing logic as like graph definitions or I'm not saying like database definition, but like you're writing logic as data." They asked for help grokking the paradigm, and for explicit instructions that future AI prompts can use.

This section is that guide. It also contains a full draft of `docs/field-graph-for-ai.md` embedded as a code block, ready to be lifted into a real file when implementation starts.

### 19.1. The paradigm shift in two paragraphs

**Imperative (status quo).** Feature code declares what fields it needs. The Coins Earned panel imports `COIN_FIELDS` from a specific file, maps over the array, and renders each. The source-analysis chart imports the same array (or a different one), applies its own color mapping, and renders. Each feature *owns the membership question* — it decides which fields it cares about, and it keeps that list in sync with other features by hand. When `coins_dragonBreath` is added, every feature that rendered coin sources needs to be edited to include the new field. Field membership is a *procedure* scattered across feature files.

**Declarative (graph).** Fields declare their own identity and relationships. `coins_dragonBreath` declares `IS_SOURCE_OF battleReport_coinsEarned`. The Coins Earned panel queries *for* that relationship: "give me every field that IS_SOURCE_OF the coins-earned total." The source-analysis chart asks the same question. Neither feature owns the list; both features query the relationship. When `coins_dragonBreath` is added, no feature changes — both panels' queries now return the extra field. Field membership is a *declaration* on the field itself.

**The locus of authorship flips.** In the imperative world, feature files answer "what fields do I render?" In the declarative world, field declarations answer "what features do I belong to?" The field takes ownership of its own fate, and features become thin projections over graph queries.

This is the mental model. Everything else — the query API, the invariant tests, the CLI, the migration safety — is machinery that makes the declarative model tractable.

### 19.2. Common tasks translated — old way vs new way

**Task: Add a new field.**

- Old way (~7 files touched):
  - `supportedFields.json` — add the key.
  - `coin-sources.ts` (or wherever the field belongs) — add entry with displayName and color.
  - `section-config.ts` — confirm the section lists it.
  - `v2-to-v3-field-map.ts` — add rename entry if applicable.
  - The source-analysis color mapper — may need an entry.
  - Run-details display component — confirm it picks up the new field.
  - A unit test somewhere.
- New way (1 file touched, field-graph/nodes and edges):
  - Declare the node: `fieldNode('coins_dragonBreath')`.
  - Declare its edges: `BELONGS_TO_SECTION`, `IS_SOURCE_OF`, `HAS_DISPLAY_NAME`, `HAS_COLOR`, `HAS_DATA_TYPE`.
  - No test; invariants cover it.

**Task: Rename a field.**

- Old way (~15 call sites):
  - Update the supported-fields list.
  - Update `v2-to-v3-field-map.ts` (reverse mapping).
  - Find every hardcoded string reference; update each.
  - Update tests that hardcode the old name.
- New way (1 edge declaration):
  - Rename the node id in the field declaration.
  - Add one `RENAMED_FROM` edge with `{ legacyKey: 'oldName', atSchema: 'schema:vN' }`.
  - Everywhere that queries the graph now returns the new canonical id; the reverse-index resolves the old id at parser boundary (§14.2).

**Task: Add a new chart / view.**

- Old way (~5 files touched):
  - Create the chart component.
  - Hand-list the fields it renders in a config array.
  - Plumb the field config through props.
  - Add color mappings per field.
  - Update the navigation tab.
- New way (1 view node + opt-in edges, OR zero edges if the view is query-driven):
  - Declare `viewNode('view:velocity-chart')`.
  - Either declare `APPEARS_IN_VIEW` edges (explicit opt-in) OR let the chart component query by property (`graph.query({ dataType: 'number', isSummable: true })`) for emergent membership (§9.4).
  - Display name, color come from field edges (already declared).

**Task: Validate a form input.**

- Old way: hand-written if/else chain in the form's validation function.
- New way: call `validateFieldUpdate(fieldKey, newValue, formState)`. Graph edges (`ACCEPTS_VALUE`, `IS_REQUIRED_IN`, `HAS_DATA_TYPE`, `CONDITIONAL_ON`) drive the validation. Zero form-specific code per field.

**Task: Add a new run-type (e.g., dissonance).**

- Old way: ~25-35 files (§12.5).
- New way: ~7 files of data declarations (§12.1). Zero switch statements.

**Task: Rename the tower-tracking storage schema (v3 → v4).**

- Old way: hand-maintain a V3_TO_V4 map, update `V3_COLUMN_PREFIX_VERSION`, write a migrator, touch every consumer that assumed v3 shape.
- New way: declare a new `schema:v4` node, add RENAMED_FROM edges with `atSchema: 'schema:v4'` for each rename, update the one `V3_COLUMN_PREFIX_VERSION` constant (invariant test asserts lockstep). Migration gate reads the diff from the graph (§17.3).

### 19.3. Writing `docs/field-graph-for-ai.md` — companion for future AI agents

The user asked specifically for a companion markdown file that future AI prompts can reference. Below is a full draft, embedded as a code block. It is intended to be authored to `docs/field-graph-for-ai.md` when implementation begins.

```markdown
# Field Graph for AI — Quick Reference

**Purpose**: This document orients AI agents to the tower-tracking field graph
(see `docs/field-registry-exploration/07-relationship-graph.md` for the full
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

## When NOT to use the graph

- Math. Aggregations still compute sums/means/groupings the same way; the
  graph tells you WHICH fields to aggregate, not HOW.
- One-off feature flags or experiments. A single boolean in context is fine;
  don't manufacture graph edges for throwaway toggles.
- Runtime-only state (filter selections, sort order, UI toggles). The graph
  is the catalog; transient UI state is component state.
```

The file above is authored to ~80-120 lines, includes the paradigm explanation, four most common operations, critical invariants, a mechanical checklist, and a "when not to use the graph" disclaimer. Future AI agents reading this before making field changes should default to the declarative path and avoid the imperative fan-out.

### 19.4. Debugging the graph approach

Three real bug scenarios, re-examined from the "logic as data" perspective (contrast with §9.3, which walked the same scenarios from the query-output perspective).

**Bug 1: `coins_goldenTower` shows 0 on run-details for a specific run.**

*Imperative-world debug path.* Open 7 files (§9.3), walk the pipeline, build a mental model.

*Logic-as-data debug path.* The question is no longer "which file owns this field's rendering?" because no single file does. The question is "which edge is wrong — or which edge is missing?" Three invariant tests catch the most common causes (missing BELONGS_TO_SECTION, missing HAS_DATA_TYPE, missing IS_SOURCE_OF). If the invariants pass, the data is probably fine and the value really is 0. `graph.describe` prints the runtime sanity block (how many runs have a non-zero value) in one call.

The mental shift: the pipeline doesn't have to be walked anymore. The graph has already walked it; the CLI tool narrates the walk.

**Bug 2: a V2 user opens v0.12 and `damage_blackHole` is blank for every historical run.**

*Imperative-world debug path.* Check `v2-to-v3-field-map.ts` — is `blackHole` mapped? Check the parser — is it invoking the remapper? Check the consumer — is it reading `damage_blackHole` (new canonical) or still `blackHole` (legacy)?

*Logic-as-data debug path.* The question is: does `graph.resolveFieldByAnyKey('blackHole')` return the `damage_blackHole` node? If yes, the RENAMED_FROM edge exists and the reverse-index works. If no, the edge is missing — add it. `npm run graph:explain blackHole damage_blackHole` prints the path if one exists; an empty result is the bug. One command, unambiguous answer.

**Bug 3: a new V28 field `coins_dragonBreath` (hypothetical) is silently missing from the source-analysis breakdown.**

*Imperative-world debug path.* Open `coin-sources.ts` — is the field listed? Open `supportedFields.json` — is it there? Open the V28 parser — is the field being stored?

*Logic-as-data debug path.* `npm run graph:describe coins_dragonBreath`. If the node doesn't exist at all, it was never declared in the graph — `npm run graph:orphans` will show "newly detected fields pending classification" and name it. Declare the node and its IS_SOURCE_OF edge; source-analysis picks it up on next render without a consumer change.

The mental rule: **debugging in the logic-as-data world is debugging the graph shape**, not debugging the pipeline. The graph's structure is declarative, searchable, and visualizable; bugs reveal themselves as shape violations (missing edges) rather than logic gaps (missing switch cases).

### 19.5. Why this is tractable for AI

Three claims:

**1. Declarative data is easier for AI to reason about than scattered imperative logic.**

An AI agent asked "where is `coins_goldenTower` used?" in the imperative world has to grep the codebase, find seven files, read each, build a mental model. In the declarative world, it runs `npm run graph:describe coins_goldenTower` and reads one structured output. The former is probabilistic — the agent might miss a file. The latter is deterministic — the graph is the ground truth and the CLI prints it fully.

**2. Missing edges fail loud; missing switch cases fail silent.**

A missing RENAMED_FROM edge is caught by the `every field has provenance` invariant (§10 test 10). A missing `case` in a switch statement falls through silently and the feature is subtly broken at runtime. For an AI making changes, the failure mode matters: loud failures are learnable (the AI sees the error, understands the miss, fixes it); silent failures are invisible (the AI thinks it succeeded, the user discovers the bug weeks later).

**3. The graph is queryable from the CLI, which AI agents can invoke.**

An AI agent working on a feature can run `graph:describe`, `graph:viz`, `graph:explain`, and `graph:orphans` as self-verification steps before committing. The agent doesn't have to trust its understanding of the codebase — it verifies the shape by asking the graph directly. This is a different class of reliability than grepping and inferring.

**Concrete scenario: an AI agent asked to add `coins_dragonBreath` (V29 hypothetical).**

Imperative-world agent work:
1. Grep for `COIN_FIELDS` or similar. Find `coin-sources.ts`.
2. Grep for `battleReport_coinsEarned` — confirm the new field should contribute.
3. Look at existing entries in `coin-sources.ts` for shape, copy-paste.
4. Search `supportedFields.json` — add the entry.
5. Search `section-config.ts` — verify coins section already covers it (implicit).
6. Add a unit test.
7. Forget the V2 rename handling because that's in a different file the agent didn't find.
8. Ship a subtle bug.

Declarative-world agent work:
1. Open `docs/field-graph-for-ai.md`. Read Operation 1.
2. Add a node in `nodes/fields.ts`.
3. Add five edges in the matching edge files, each one line.
4. Run `npm run graph:check`. Invariants pass. Done.

Six steps to one paragraph of declarations. No rename handling needed because V29 is a new field, not a rename. If the agent *does* need to add a rename, the docs cover it explicitly (Operation 2). The process is bounded and verifiable at every step.

**The meta-claim:** this architecture rewards both humans AND AI. The same properties that make humans confident making changes (structural invariants, discoverable relationships, declarative data) make AI confident too. The cost of the graph is paid in setup; the benefit accrues every subsequent change, regardless of who (or what) is making it.

---

> [< Prev: 18. Write path — forms, updates, user edits](./18-write-path.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | —
