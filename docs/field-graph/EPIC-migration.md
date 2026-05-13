# Epic: Field Graph Migration

**Status:** In Progress · **Owner:** Jarek · **Branch:** `204-v28-migration-safety` · **Target release:** v0.12.0

---

## If you are an AI picking up this work — read this first

1. **Update this epic when you finish a commit.** Flip the checkbox to `[x]` and change **Status** from `TODO` to `DONE` in the same turn you report completion — the human is explicitly opting out of updating this manually. Don't try to record a commit hash: this edit is part of the commit you're about to make, so no SHA exists yet.
2. **Only work on the commit you were told to work on.** If a prior commit is `TODO`, assume it's genuinely not done and flag the dependency instead of reaching ahead.
3. **The authoritative spec lives in [`architecture/`](architecture/00-table-of-contents.md).** Do not re-derive the design from scratch. When the epic references a section (e.g. `architecture/14-key-lookup-and-renames.md`), read that section before implementing. The original monolithic write-up at [`field-registry-exploration/07-relationship-graph.md`](field-registry-exploration/07-relationship-graph.md) is kept as historical reference only.
4. **Standing context for every graph-related prompt:** [`field-graph-for-ai.md`](field-graph-for-ai.md). Read it cold before touching anything in `src/features/field-graph/` or related directories.
5. **The vertical-slice cutover principle.** A phase-2 commit is *not* "declare the edges and call it done." It is **declare the edges + cut over EVERY existing consumer + delete the legacy mechanism**. After the commit lands there should be ZERO production code paths still using the pre-graph approach for that concept. If a call site exists that addresses the concept by string constant, hand-authored map, switch statement, or any other pre-graph mechanism, that call site is part of the commit's scope. Examples from prior commits:
   - Commit 4 (`_runType` enum cutover) had to update `run-type-detection.ts`, `run-type-selector-options.ts`, filter components, AND remove `RUN_TYPE_FIELD_ID` constants — not just declare the `ACCEPTS_VALUE` edges.
   - Commit 5 (`IS_INTERNAL_FIELD` + `HAS_CSV_HEADER`) had to update csv-exporter, csv-parser, data-parser, data-migrations, date-issue-detection, AND delete the `INTERNAL_FIELD_NAMES` parallel const that 7 callers reached for — not just declare the edges.
   - Same will apply to commits 6, 7, 8, 9, 10, 11, 12, 13, 14: the goal of each is to leave the codebase with one mechanism (the graph), not two systems running side-by-side.

   **If a cutover is too big to fit in a single commit:** stop, and append a `commit Nb` follow-up entry to phase 2.5 (the cleanup interludes section) describing the deferred call sites. The exception MUST be explicit and tracked. Silent partial cutovers are the failure mode.
6. **Out-of-scope:** any change not described in the current commit's "Scope" line *and* not part of the cutover required by rule 5. If you notice something else worth fixing, append it to [`Notes-and-findings.md`](./Notes-and-findings.md) (date + commit number + note) and leave it for a later commit.
7. **The epic is evolving.** This document is updated as we learn from each slice. If a commit's scope turns out to be wrong (cutover footprint larger than expected, dependency on a not-yet-shipped concept, an emerging architectural smell), **update the epic in the same PR**: expand the commit's scope, add a new follow-up commit, or append a Notes-and-findings entry that the next commit's prompt should react to. The author is the decider; you are the spotter. Surface the smell explicitly in your report-back; don't silently ship around it.
8. **Tests must stay green.** Each commit lands with `npm run integration-precheck` passing. Migration-gate / E2E manual verification is deferred to the final commit per the epic's staging plan — that is the ONE exception.
9. **Every escape hatch goes in the ledger.** If you need to silence a lint rule, skip a test, loosen Husky, or add an ESLint config override to keep `integration-precheck` green during an intermediate state, append a row to [`Migration-era-suppressions.md`](./Migration-era-suppressions.md) in the same PR. Commit 16 drains that ledger; nothing on this epic ships with an undocumented workaround.
10. **Conventions locked by commits 1–4 (apply to every phase-2/3 commit).** These are defaults, not options. The locked design is in [`EXPLORATION-node-identity-abc-deep-dive.md`](./EXPLORATION-node-identity-abc-deep-dive.md); read it before deviating.
   - **Named `*_NODE` exports** for every node declaration (`BATTLE_REPORT__TIER_NODE`, `_RUN_TYPE_NODE`, `SECTION_COINS_NODE`, `VIEW_CHARTS__TIER_STATS_NODE`, `ENUM_RUN_TYPE__FARM_NODE`). Edge declaration files use `<NAME>_NODE.id` rather than raw string literals — refactor-safe at scale.
   - **Wildcard catalog aggregation.** New per-kind node files get added via `import * as` in `catalog/index.ts`'s `nodesOf` filter. New edge files get added via named imports concatenated into `CATALOG_EDGES`.
   - **`FieldRef = string | Node` polymorphic input.** Every new query method accepts both forms; return types stay `readonly string[]` (node ids). `getField` and `resolveFieldByAnyKey` are the explicit string-only carve-out at the parser/import boundary.
   - **TS-as-source-of-truth for closed enums.** When a field's accepted values exist as a TS `as const` tuple (today: `RUN_TYPE_VALUES`), the graph catalog *derives* its enum-value nodes and ACCEPTS_VALUE edges from the tuple. `enum-sync.invariant.test.ts` enforces. The same template applies to `_dissonanceSubCategory` in commit 15.
   - **Engine-method-per-consumer-pattern.** Every consumer-facing usage gets a named method on `FieldGraph` (`acceptedValuesFor`, `isAcceptedValue`, `matchAcceptedValue`, `enumValueMeta`, `csvHeaderOf`, `dataTypeOf`, …). Raw `edgesFrom`/`edgesTo`/`nodesOfKind` are reserved for invariant tests and engine internals.
   - **`appGraph()` singleton + `setAppGraphForTesting`.** Already exposed by `@/shared/domain/field-graph`. Consumers call `appGraph()`; tests inject a custom `FieldGraph` via the override and restore in `afterEach`.

---

## Context

The V2→V3 storage migration and V28 parser work shipped in a prior commit on this branch. That commit also introduced transitional hand-authored configs (`coin-sources.ts`, `damage-sources.ts`, `section-config.ts`) that made the UI render against V3 keys but did not yet unify the scattered field metadata.

This epic delivers the **relationship-graph field registry** specified in [`architecture/`](architecture/00-table-of-contents.md) (approach 07 in [`EXPLORATION-architecture.md`](EXPLORATION-architecture.md)'s 8-approach comparison). Every commit either introduces graph engine infrastructure (phase 1, dead code) or replaces a specific piece of imperative logic with graph queries (phase 2, vertical slice). By the last commit the transitional configs are deleted and the app is data-driven — fields declare their own identity and relationships; feature code queries by relationship.

**Why this is a separate epic from v28-migration-safety**: the migration safety work was about getting users safely from V2 → V3 storage. This epic is about restructuring how fields are declared and consumed across the codebase — a paradigm shift from imperative to declarative field metadata, enabled by the V3 migration but broader in scope. The old [`EPIC-v28-support-and-data-resilience.md`](EPIC-v28-support-and-data-resilience.md) is retained as historical record of the original, narrower plan.

## Authoritative sources (read in this order for cold start)

1. [`field-graph-for-ai.md`](field-graph-for-ai.md) — 1-page contributor guide. The "CLAUDE.md for graph work."
2. [`architecture/00-table-of-contents.md`](architecture/00-table-of-contents.md) — entry point to the full spec, split into per-section files. Don't read cover-to-cover; jump to the sections this epic references.
3. [`EXPLORATION-architecture.md`](EXPLORATION-architecture.md) — the 8-approach comparison index. Reference only; the decision is locked on approach 07 (graph).
4. [`field-registry-exploration/`](field-registry-exploration/) — the 8 approach deep-dives. Reference only; includes the original monolithic graph spec at `07-relationship-graph.md` kept as a historical snapshot.

## Prior work already shipped on this branch

- ✅ V2→V3 storage migration gate + pre-migration backup + transactional migrator
- ✅ V28 section-aware parser + `v3_` column prefix on storage
- ✅ `V2_TO_V3_FIELD_MAP` hand-authored (will become `RENAMED_FROM` edges in commit 10)
- ✅ `INTENTIONALLY_DROPPED_V2_FIELDS` (will become `INTENTIONALLY_DROPPED_IN_SCHEMA` edges in commit 11)
- ✅ Transitional UI rewrites (`coin-sources.ts`, `damage-sources.ts`, `section-config.ts`) to V3 keys — will be deleted in commits 6–7
- ✅ Bug fixes: `battleReport_killedBy` type detection, `detectDateIssue` V3 key support, `V3_COLUMN_PREFIX` centralization
- ✅ Invariant tests: v28-sample-parse, ui-coverage, v2-v3-schema-inverse-check

## Migration-era suppressions (drained by commit 16)

The full ledger lives in [`Migration-era-suppressions.md`](./Migration-era-suppressions.md). Add new entries there in the same PR that introduces the workaround. Commit 16 audits the file and must leave it empty (or with explicit follow-up-issue links).

## Staging plan

- **Phase 1 (commits 1–3)** introduces the graph engine and catalogs. All code is dead — nothing in `src/features/` or `src/shared/domain/` outside of the new graph directory queries it yet. Tests exist only against a toy fixture graph.
- **Phase 2 (commits 4–14)** is the vertical-slice sequence. Each commit declares one edge type, wires the graph into the consumers that need it, and deletes the imperative code it replaces. App behavior stays equivalent through the phase; only the mechanism changes. **Commits 4 and 5 surfaced two architectural concerns**: (a) `FieldGraph`'s API surface was heading toward a god object, and (b) cutovers risked landing as variable-swaps without eliminating the conditional logic the graph is supposed to subsume (csv-exporter ladder was the canonical example). **Commit 5b (API ergonomics + `Node.tags` removal)** addressed (a). **Commit 5c was originally proposed as a `HAS_CSV_EXTRACTOR` registry** to address (b), but was superseded — the underlying axis was data type, not extractors. Folded into commit 8 (`IS_OF_TYPE` + parser type-detector rewrite + catalog `PATTERN.md`); see [`EXPLORATION-data-type-edge-vs-property.md`](./EXPLORATION-data-type-edge-vs-property.md) for the rationale.
- **Phase 3 (commit 15)** delivers the dissonance run-type extension — the first *new feature* built natively on the graph. Serves as the real-world validation.

The app cannot be fully exercised end-to-end until commit 15. Unit and integration tests gate each commit; manual migration-flow testing happens after commit 15.

## Commit checklist

Legend: `[ ]` TODO · `[~]` IN PROGRESS · `[x]` DONE

### Phase 1 — Foundation (dead code)

- [x] **Commit 1 — Graph engine core**
  - **Scope:** `FieldGraph` class, `Node` / `Edge` discriminated unions, `Schema` / `Section` / `Category` / `View` / `Field` / `EnumValue` node kinds, the full edge-kind taxonomy, query API (`getField`, `resolveFieldByAnyKey`, `sourcesOf`, `fieldsInSection`, etc.), load-time invariants (dangling edge detection, cardinality check), `buildGraph()` entry point.
  - **Spec references:** [`architecture/01-abstract-and-motivation.md`](architecture/01-abstract-and-motivation.md) and [`02-how-it-works.md`](architecture/02-how-it-works.md) (mental model), [`08-clarifying-the-mental-model.md`](architecture/08-clarifying-the-mental-model.md) §8.1–8.2 (node/edge shapes), [`14-key-lookup-and-renames.md`](architecture/14-key-lookup-and-renames.md) (resolveFieldByAnyKey), [`15-multi-section-membership.md`](architecture/15-multi-section-membership.md) (cardinality), [`17-schema-as-a-first-class-graph-entity.md`](architecture/17-schema-as-a-first-class-graph-entity.md) (schema as first-class node).
  - **Files:** new `src/shared/domain/field-graph/` directory.
  - **DoD:** `npm run test` green; new unit tests against a hand-built toy graph (< 10 nodes / edges) cover happy path + each invariant's failure mode.
  - **Dependencies:** none.
  - **Out of scope:** any real field/edge declarations. No consumers wired yet.
  - **Status:** `DONE`

- [x] **Commit 2 — Top-level catalog nodes**
  - **Scope:** Declare all Schema nodes (`schema:v1`, `schema:v2`, `schema:v3`), Section nodes (`section:battleReport`, `section:coins`, `section:damage`, ...), Category nodes (`category:combat`, `category:economic`, `category:modules`, ...), View nodes (`view:run-details:battle-report`, `view:charts:tier-stats`, ...). Still dead code.
  - **Spec references:** [`architecture/17-schema-as-a-first-class-graph-entity.md`](architecture/17-schema-as-a-first-class-graph-entity.md) (schema taxonomy), existing `section-config.ts` and chart / analysis pages for section + view inventory.
  - **Files:** `src/shared/domain/field-graph/catalog/*.nodes.ts` (split by node kind for readability).
  - **DoD:** `npm run test` green; catalog is loaded by `buildGraph()`; invariant test asserts that every declared node has a unique id.
  - **Dependencies:** commit 1.
  - **Status:** `DONE`

- [x] **Commit 3 — Field nodes**
  - **Scope:** Declare a `FieldNode` for every V3 canonical field from `sampleData/supportedFields.json` (≈147 fields) plus the 5 internal fields (`_date`, `_time`, `_notes`, `_runType`, `_rank`). No edges yet other than the minimum `kind: 'field'`; edge attribution starts in phase 2.
  - **Spec references:** [`architecture/08-clarifying-the-mental-model.md`](architecture/08-clarifying-the-mental-model.md) (node shapes), [`11-internal-app-fields.md`](architecture/11-internal-app-fields.md) (internal fields).
  - **Files:** `src/shared/domain/field-graph/catalog/fields.nodes.ts` (one big data file is fine for this commit).
  - **DoD:** Invariant test asserts `fieldNodes.length === supportedFields.length`; every field id matches a supportedFields entry.
  - **Dependencies:** commits 1, 2.
  - **Status:** `DONE`

### Phase 2 — Vertical slices (each deletes imperative code)

- [x] **Commit 4 — `ACCEPTS_VALUE` edges + `_runType` cutover**
  - **Scope:** Declare `ACCEPTS_VALUE` edges for `_runType` (`farm`, `tournament`, `milestone`). Rewrite `run-type-detection.ts` and `run-type-selector-options.ts` to query the graph. Replace hardcoded `RunTypeValue` literals in filter components with `graph.enumValuesOf('_runType')`.
  - **Spec references:** [`architecture/11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.2 (enum expressiveness), [`12-extending-with-a-new-run-type-and-sub-category.md`](architecture/12-extending-with-a-new-run-type-and-sub-category.md) (dissonance uses this same pattern), [`18-write-path.md`](architecture/18-write-path.md) §18.2 (validation via graph).
  - **Files touched:** ~8–12 existing. Deletions: hardcoded enum duplications.
  - **DoD:** Run-type filter still works identically; test that adding a fake run-type value to the graph makes it show up in the filter without code changes.
  - **Dependencies:** commits 1–3.
  - **Bundled:** the node-identity refactor from [`EXPLORATION-node-identity-abc-deep-dive.md`](./EXPLORATION-node-identity-abc-deep-dive.md) (named `*_NODE` exports, wildcard catalog aggregation, `FieldRef = string | Node` polymorphic API, enriched `enumValueMeta`) folded in. These conventions now apply to every subsequent vertical slice.
  - **Status:** `DONE`

- [x] **Commit 5 — `IS_INTERNAL_FIELD` + `HAS_CSV_HEADER` edges**
  - **Scope:** Declare `IS_INTERNAL_FIELD` edges for `_date`, `_time`, `_notes`, `_runType`, `_rank`. `HAS_CSV_HEADER` edges for their human-friendly headers (`_Date`, `_Time`, etc.). Rewrite `csv-exporter.ts` header logic and `internal-field-config.ts` to query the graph.
  - **Spec references:** [`architecture/11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.1 (internal field representation), §11.4 (gotchas).
  - **Files touched:** ~5 existing. Deletes `INTERNAL_FIELD_MAPPINGS` / `INTERNAL_FIELD_ORDER` hand-authored arrays. New: `catalog/internal-fields.edges.ts`.
  - **Conventions (per preamble §8):** use `_DATE_NODE`, `_TIME_NODE`, `_NOTES_NODE`, `_RUN_TYPE_NODE`, `_RANK_NODE` (already declared); do not re-declare. Add engine helper `csvHeaderOf(fieldRef): string | undefined` per the engine-method-per-consumer-pattern rule.
  - **DoD:** CSV round-trip tests still pass; header ordering identical (preserved via edge declaration order or an explicit ordering tag).
  - **Dependencies:** commit 4 (shares the `_runType` enum pattern).
  - **Status:** `DONE`

### Phase 2 interlude — architectural revisits (BLOCK commits 6+)

Two interludes surfaced from commits 4 + 5. Both must land before commits 6+ start so we don't keep accumulating debt the chosen directions would later have to clean up.

- [x] **Commit 5b — Field-graph API ergonomics + `Node.tags` removal + per-concept directory restructure**
  - **Why (API surface):** Commits 4 + 5 added `acceptedValuesFor`, `isAcceptedValue`, `matchAcceptedValue`, `enumValueMeta`, `enumValuesOf`, `csvHeaderOf`, `internalFields`, `isInternalField` plus the polymorphic-input handling. Each subsequent edge type wants to add 2–4 more accessor methods. Continuing this trajectory yields ≥25 methods on `FieldGraph` by commit 15. The "engine-method-per-consumer-pattern" rule from commit 4 was the right call for that commit, but at this scale the engine class becomes a god object and the file's load-bearing — every edge touches it.
  - **Why (`Node.tags`):** Commit 5 declared `IS_INTERNAL_FIELD` edges for the same five fields that already carried `tags: ['internal']`. The redundancy was tracked in [`EXPLORATION-tag-vs-edge.md`](./EXPLORATION-tag-vs-edge.md), and the decision is: **flat-out remove the `tags` concept.** Edges are structurally queryable; tags are unstructured node-local strings. At our scale, every fact a consumer queries should be an edge.
  - **Decision:** Per [`EXPLORATION-engine-api-shape.md`](./EXPLORATION-engine-api-shape.md), Option A (per-edge query modules) + Style 2 (singleton-bound consumer ergonomics) + per-concept directory layout (`catalog/edges/<concept>/`). The full refactor lands inside this commit (no separate 5d follow-up). See the doc's "Human decision" section for reasoning and deviations from the recommendation.
  - **Scope (API ergonomics — implementation):**
    1. Refactor [`field-graph.ts`](../../src/shared/domain/field-graph/field-graph.ts) to expose only the engine primitives: parser-boundary lookups (`getField`, `resolveFieldByAnyKey`), indexed primitives (`edgesFrom`, `edgesTo`, `edgesOfType`, `nodesOfKind`, `terminalOf`, `toId`). Delete every domain-specific query method (`sourcesOf`, `fieldsInSection`, `sectionsOf`, `enumValuesOf`, `acceptedValuesFor`, `isAcceptedValue`, `matchAcceptedValue`, `enumValueMeta`, `displayNameOf`, `colorOf`, `internalFields`, `isInternalField`, `csvHeaderOf`).
    2. Create `catalog/edges/<concept>/` per-concept directories holding declarations + queries + tests:
       - `catalog/edges/internal-fields/` (move `internal-fields.edges.ts` here; add queries + tests)
       - `catalog/edges/enum-values/` (move `enum-values.edges.ts` here; add queries + tests)
       - `catalog/edges/sections/` (queries + tests; edges land in commit 6)
       - `catalog/edges/sources/` (queries + tests; edges land in commit 7)
       - `catalog/edges/presentation/` (queries + tests for HAS_DISPLAY_NAME / HAS_COLOR cross-source-kind)
       - `catalog/edges/index.ts` (aggregates `*_EDGES` arrays; consumed by `catalog/index.ts`)
    3. Add Style 2 singleton-bound wrappers to [`src/shared/domain/field-graph/index.ts`](../../src/shared/domain/field-graph/index.ts) — one bound thunk per query function. Consumers import `csvHeaderOf` etc. directly from the barrel; no need to call `appGraph()` first.
    4. Migrate the 3 production consumers ([`csv-exporter.ts`](../../src/features/data-export/csv-export/csv-exporter.ts), [`run-type-display.ts`](../../src/shared/domain/run-types/run-type-display.ts), [`run-type-filter.ts`](../../src/features/analysis/shared/filtering/run-type-filter.ts)) to Style 2 — replace `appGraph().X(...)` with `X(...)` from the barrel.
    5. Migrate the 2 catalog-touching tests ([`fields.nodes.test.ts`](../../src/shared/domain/field-graph/catalog/fields.nodes.test.ts), [`enum-sync.invariant.test.ts`](../../src/shared/domain/field-graph/enum-sync.invariant.test.ts)) to Style 2 imports.
    6. Move query behavior tests from `field-graph.test.ts` into per-concept `*.queries.test.ts` files (Style 1: explicit `(graph, ...)` form against fixture graphs).
    7. Add a cold-start query index to [`field-graph-for-ai.md`](./field-graph-for-ai.md) — table of every query function with `Use when` description. New "Adding a query" convention block. New "Adding a new field" / "renaming a field" / "adding a new relationship type" sections updated for the per-concept directory layout.
  - **Scope (`Node.tags` removal — implementation):**
    1. Delete `tags?: readonly string[]` from `Node` in [`types.ts`](../../src/shared/domain/field-graph/types.ts).
    2. Delete the `tags` parameter from `NodeOptions` in [`builders.ts`](../../src/shared/domain/field-graph/builders.ts).
    3. Delete `tags: ['internal']` from the five internal-field declarations in [`fields.nodes.ts`](../../src/shared/domain/field-graph/catalog/fields.nodes.ts).
    4. Rewrite the two `tags?.includes('internal')` assertions in [`fields.nodes.test.ts`](../../src/shared/domain/field-graph/catalog/fields.nodes.test.ts) to query `isInternalField(node)`.
    5. Add a guideline to [`field-graph-for-ai.md`](./field-graph-for-ai.md): "Never introduce `Node.tags`. Facts about a node are edges."
    6. Future-proofing: planned `'tournament-only'` tag is dropped — the `_RANK_NODE CONDITIONAL_ON ENUM_RUN_TYPE__TOURNAMENT_NODE` edge in commit 13 covers it. Planned `'user-text'` and `'nullable-empty-string'` tags from spec §11.4 are absorbed by edges in commits 8 / 14.
  - **Cutover requirement (per preamble §5):** ZERO domain-specific query methods survive on `FieldGraph` after this commit. ZERO consumer call sites use `appGraph().X(...)` for query access (parser-boundary `getField` / `resolveFieldByAnyKey` and engine-primitive `nodesOfKind` / `edgesOfType` direct access remain valid for tests + invariant code). ZERO `Node.tags` references remain anywhere in `src/`. ZERO files at the old `catalog/` root for moved edge concepts (`internal-fields.edges.ts`, `internal-fields.test.ts`, `enum-values.edges.ts`, `enum-values.test.ts`).
  - **DoD:** API ADR landed in `docs/field-graph/EXPLORATION-engine-api-shape.md` with Human decision section filled in. Engine class is < 250 lines (down from ~400). All previously-on-the-engine queries reachable via the Style 2 barrel. `Node.tags` deleted from types + builders + declarations. Cold-start query index in `field-graph-for-ai.md`. `npm run integration-precheck` green.
  - **Dependencies:** commits 4, 5.
  - **Status:** `DONE`
  - **Note:** Commit 5d (originally proposed as a separate follow-up to implement the API decision) is no longer needed — its scope was absorbed into 5b per the human decision recorded in the ADR. Commits 6+ are still paused until 5b and 5c land.

- [x] **Commit 5c — SUPERSEDED → folded into commit 8**
  - Originally proposed a `HAS_CSV_EXTRACTOR` + `CSV_EXTRACTORS` registry to eliminate the per-internal-field `if/else` ladder in [`csv-exporter.ts`](../../src/features/data-export/csv-export/csv-exporter.ts). The first implementation pass shipped that shape; on review the user surfaced the deeper architectural question (*"this isn't really an extractor concern — the underlying axis is data type, and the graph should drive that for every field, not just internal ones"*).
  - The redesign — every Field declares an `IS_OF_TYPE` edge (renamed from the in-flight `HAS_DATA_TYPE`); the parser becomes graph-driven; the csv-exporter dispatches via `field.dataType` (now sourced from the graph) — was captured in [`EXPLORATION-data-type-edge-vs-property.md`](./EXPLORATION-data-type-edge-vs-property.md) and folded into commit 8 below. Commit 5c's "ladder elimination" outcome is preserved; the mechanism is data-type-driven dispatch instead of a per-extractor registry.
  - **Status:** `DONE` (folded into commit 8). The `HAS_CSV_EXTRACTOR` edge type and `CSV_EXTRACTORS` registry were never shipped; their purpose is fulfilled by `IS_OF_TYPE` + the rewritten `field-utils.ts`.

- [x] **Commit 6 — `BELONGS_TO_SECTION` + `BELONGS_TO_CATEGORY` edges + run-details restructure**
  - **Scope (revised on 2026-05-12 per user direction):** Declare section membership for every game field (storage-prefix-aligned: `battleReport`, `coins`, `damage`, …). Declare BELONGS_TO_CATEGORY for each section's category (folded into this commit since the UI restructure depends on it). Restructure the four UI categories: rename `category:battleReport` → `category:general` (now contains battleReport, counts, utility), drop `category:modules` (modules/shards fields live under `section:currencies` which renders under `category:economic`). Rewrite [`section-config.ts`](../../src/features/game-runs/card-view/run-details/section-config.ts) to keep only breakdown configs (transitional until commit 7's IS_SOURCE_OF). Rewrite [`use-run-details-data.ts`](../../src/features/game-runs/card-view/run-details/use-run-details-data.ts) and section components to derive sections from the graph. UI ships a behavior change: sections now mirror game-export storage prefixes instead of cross-cutting UI groupings (ESSENTIAL/MISC split is gone; DAMAGE_TAKEN's healthRegen + bonusHP mix is gone; OTHER_EARNINGS's cross-section bag is gone). User accepted these regressions; commit 7 (HAS_DISPLAY_NAME / HAS_COLOR / IS_SOURCE_OF) restores curated names + colors.
  - **`RENDERS_AS_IN_SECTION` is deferred** — no production consumer needs per-section display overrides today; the spec §15.2 example (battleReport_cellsEarned as 'Cells' in currencies vs 'Cells Earned' in battleReport) doesn't appear in the current code path. The edge type stays declared in `types.ts` for future use.
  - **Spec references:** [`architecture/15-multi-section-membership.md`](architecture/15-multi-section-membership.md) (multi-section cardinality), [`11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.4 (render override deferred).
  - **Files touched:** [`categories.nodes.ts`](../../src/shared/domain/field-graph/catalog/categories.nodes.ts) (renamed BATTLE_REPORT→GENERAL; removed MODULES), [`sections.belongs-to-section.edges.ts`](../../src/shared/domain/field-graph/catalog/edges/sections/sections.belongs-to-section.edges.ts) (new — 142 BELONGS_TO_SECTION edges), [`sections.edges.ts`](../../src/shared/domain/field-graph/catalog/edges/sections/sections.edges.ts) (16 BELONGS_TO_CATEGORY edges + rollup), [`sections.queries.ts`](../../src/shared/domain/field-graph/catalog/edges/sections/sections.queries.ts) (`sectionsInCategory`, `categoryOfSection`, `categoriesInDisplayOrder`), [`sections.invariants.test.ts`](../../src/shared/domain/field-graph/catalog/edges/sections/sections.invariants.test.ts) (new), [`section-config.ts`](../../src/features/game-runs/card-view/run-details/section-config.ts) (slim — breakdown-only, awaiting commit 7), [`derive-display-name.ts`](../../src/features/game-runs/card-view/run-details/derive-display-name.ts) (new transitional helper — deleted by commit 7), [`use-run-details-data.ts`](../../src/features/game-runs/card-view/run-details/use-run-details-data.ts) (graph-driven), [`types.ts`](../../src/features/game-runs/card-view/run-details/types.ts) (new RunDetailsData shape: `{ categories[], uncategorized }`), [`category-section.tsx`](../../src/features/game-runs/card-view/run-details/sections/category-section.tsx) (new generic renderer), [`run-details.tsx`](../../src/features/game-runs/card-view/run-details.tsx) (loop over categories). Deleted: `battle-report-section.tsx`, `combat-section.tsx`, `economic-section.tsx`, `modules-section.tsx`.
  - **Cutover requirement (per preamble §5):** hand-authored UI sub-grouping configs (`BATTLE_REPORT_ESSENTIAL`, `BATTLE_REPORT_MISCELLANEOUS`, `DAMAGE_TAKEN_CONFIG`, `DAMAGE_BLOCKED_CONFIG`, `COMBAT_MISC_CONFIG`, `RECORDS_CONFIG`, `OTHER_EARNINGS_CONFIG`, `UPGRADE_SHARDS_CONFIG`, `REROLL_SHARDS_CONFIG`, `MODULES_CONFIG`) all deleted; `CATEGORIZED_FIELDS` / `SKIP_FIELDS` / `collectFieldNames` removed. The four per-category section components (BattleReport / Combat / Economic / Modules) collapse into one generic `CategorySection`. Breakdown configs (DAMAGE_DEALT, COINS_EARNED, ENEMIES_DESTROYED, ENEMIES_HIT_BY, ENEMIES_DESTROYED_BY, ENEMIES_AFFECTED_BY) survive in `section-config.ts` as `SECTION_BREAKDOWNS` keyed by section id — they're owned by commit 7's IS_SOURCE_OF cutover.
  - **Conventions (per preamble §10):** edge declarations reference field nodes via `f.<NAME>_NODE.id` (namespace import — same pattern as `renames.edges.ts` for max-lines compliance). `fieldsInSection(sectionRef)` and `sectionsOf(fieldRef)` already polymorphic from commit 4. New queries `sectionsInCategory`, `categoryOfSection`, `categoriesInDisplayOrder` are singleton-bound in the barrel.
  - **DoD:** Run-details card renders all 16 game-export sections in declaration order within their categories. Generic `CategorySection` renders both plain field lists and breakdowns. `npm run integration-precheck` green (lint, type-check, 3194 unit tests, 11 E2E tests).
  - **Dependencies:** commits 1–3, **5b** (API ergonomics + tags removal), **8** (IS_OF_TYPE + parser type-detector rewrite — supersedes the 5c extractor proposal).
  - **Status:** `DONE`

- [ ] **Commit 7 — `IS_SOURCE_OF` edges + breakdown-sources deletion**
  - **Scope:** Declare `IS_SOURCE_OF` edges from each coin / damage source to its total (`coins_goldenTower IS_SOURCE_OF battleReport_coinsEarned`, etc.). Delete `coin-sources.ts`, `damage-sources.ts`, `breakdown-sources/index.ts`. Breakdown components now call `graph.sourcesOf(totalField)`.
  - **Spec references:** [`architecture/09-cross-cutting-concerns.md`](architecture/09-cross-cutting-concerns.md) §9.1 (aggregation impact), [`03b-renaming-a-field-v28-to-v29.md`](architecture/03b-renaming-a-field-v28-to-v29.md) (source example).
  - **Files touched:** `coin-sources.ts` (delete), `damage-sources.ts` (delete), `breakdown-sources/index.ts` (delete or reduce to re-exports), `source-analysis/*` consumers. New: `catalog/sources.edges.ts`.
  - **Cutover requirement (per preamble §5):** every consumer that imported `COIN_SOURCES`, `DAMAGE_SOURCES`, or any breakdown-sources export migrates to `graph.sourcesOf(...)`. The hand-authored color palette in those files becomes `HAS_COLOR` edges on the field nodes — no parallel color map survives. After the commit, `coin-sources.ts` / `damage-sources.ts` / `breakdown-sources/index.ts` either don't exist or are empty re-export shims with a deprecation notice scheduled for commit 16.
  - **Conventions (per preamble §10):** color migration emits `HAS_COLOR` edges on field nodes (commit 4 already broadened `HAS_COLOR.sourceKind` to accept Field as well as EnumValue). `sourcesOf(fieldRef)` already polymorphic.
  - **DoD:** Source-analysis charts render identically. The hand-enumerated color palette migrates to the field-node payloads. No production code path still references the deleted source files.
  - **Dependencies:** commit 6.
  - **Status:** `TODO`

- [x] **Commit 8 — `IS_OF_TYPE` edges + parser type-detector rewrite + catalog `PATTERN.md`**
  - **Scope:** Declare the data type (`'number' | 'duration' | 'date' | 'string'`) for every Field via `IS_OF_TYPE` edges (renamed from `HAS_DATA_TYPE` per [`EXPLORATION-data-type-edge-vs-property.md`](./EXPLORATION-data-type-edge-vs-property.md) §2.5 — the `HAS_*` shape implied "may or may not have"; `IS_OF_TYPE` matches the universal-by-invariant semantic). Rewrite `getFieldConfig` in `field-utils.ts` to query the graph instead of pattern-matching labels; delete `EXACT_FIELD_CONFIGS` and `PATTERN_FIELD_CONFIGS`. Update `createInternalField` to source dataType from the graph too. Land the catalog-level [`catalog/PATTERN.md`](../../src/shared/domain/field-graph/catalog/PATTERN.md) codifying the four-question litmus (edge vs node property) and the `Node.payload` carve-out, plus a cross-link from [`field-graph-for-ai.md`](./field-graph-for-ai.md). Folded in commit 5c's csv-exporter ladder elimination — the conditional logic the per-field-id switch carried disappears because every consumer now dispatches by data-type via `formatFieldValue` reading the graph-set `field.dataType`.
  - **Spec references:** [`architecture/11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.1, [`09-cross-cutting-concerns.md`](architecture/09-cross-cutting-concerns.md) §9.5 (runtime type-mismatch), [`EXPLORATION-data-type-edge-vs-property.md`](./EXPLORATION-data-type-edge-vs-property.md) (rename rationale + litmus).
  - **Files touched:** [`field-utils.ts`](../../src/features/analysis/shared/parsing/field-utils.ts) (deleted EXACT_FIELD_CONFIGS / PATTERN_FIELD_CONFIGS; getFieldConfig + createInternalField graph-driven), [`csv-exporter.ts`](../../src/features/data-export/csv-export/csv-exporter.ts) (per-field switch ladders eliminated, transitional preprocessor populates `_date` / `_time` / `_runType` from cached run props + pre-encodes `_notes`), [`game-run.types.ts`](../../src/shared/types/game-run.types.ts) (`GameRunField.dataType` lifted to import `DataType` from data-types.constants), [`types.ts`](../../src/shared/domain/field-graph/types.ts) (rename `HAS_DATA_TYPE` → `IS_OF_TYPE`). New: [`catalog/edges/data-types/`](../../src/shared/domain/field-graph/catalog/edges/data-types/) (constants, edges for ~150 fields, queries, queries.test, invariants.test), [`catalog/PATTERN.md`](../../src/shared/domain/field-graph/catalog/PATTERN.md).
  - **Cutover requirement (per preamble §5):** ZERO label-pattern-matching call sites remain for data-type detection — graph is the only source. The pre-graph `EXACT_FIELD_CONFIGS` / `PATTERN_FIELD_CONFIGS` tables were deleted from `field-utils.ts`; a small `legacyTypeFallback` helper survives transitionally for V2 display labels (`'Killed By'` → string, `'Real Time'` → duration, etc.) that don't yet have a `RENAMED_FROM` edge — commit 10 absorbs this fallback entirely. ZERO per-internal-field `if (fieldName === _X_NODE.id)` branches survive in csv-exporter — both ladders are gone. The transitional `withPopulatedAppFields` preprocessor in csv-exporter is the one remaining per-field-id concern (handles cached-property fallbacks `_date ← run.timestamp`, `_runType ← run.runType` and pre-encodes `_notes`); commit 9's derivation cascade absorbs it.
  - **Conventions (per preamble §10):** `DATA_TYPES = ['number', 'duration', 'date', 'string'] as const` lifted to [`catalog/edges/data-types/data-types.constants.ts`](../../src/shared/domain/field-graph/catalog/edges/data-types/data-types.constants.ts) with `DataType` union and `isDataType` typeguard; re-exported from the top barrel. Engine helper `dataTypeOf(fieldRef): DataType | undefined` lives in the per-concept queries module per 5b's pattern (no engine class additions). The catalog's data-types edges file uses a `NON_NUMBER_TYPES` map for the explicit 7 non-`'number'` fields and a flatMap default of `'number'` for the modal case (~140 fields) — readable as "what's different" rather than "what's the same as 140 others."
  - **Cardinality decision:** `EDGE_META.IS_OF_TYPE.cardinality` stayed `'one'` (max-one) rather than flipping to `'at-least-one'`. Production-catalog universality is enforced by an explicit invariant test against `appGraph()` in [`data-types.invariants.test.ts`](../../src/shared/domain/field-graph/catalog/edges/data-types/data-types.invariants.test.ts). The `'at-least-one'` flip would have required every fixture-graph test in the suite to declare IS_OF_TYPE for its Field nodes — a real ergonomics tax for tests that aren't about data types. The invariant-test approach gives the same production guarantee. Decision called out in `types.ts:101` with a comment.
  - **DoD:** Bulk-import E2E passes (the previously-failing `_runType=0` regression is fixed); every Field in the production catalog passes the invariant test; `field-utils.ts`'s pattern-matching is gone (only the small V2-legacy fallback remains, marked for commit 10 deletion). `npm run integration-precheck` green. Catalog-level `PATTERN.md` lands and `field-graph-for-ai.md` cross-links to it.
  - **Dependencies:** commits 1–3, 5b.
  - **Status:** `DONE`

- [ ] **Commit 9 — `IS_DERIVED_FROM` edges + derivation cascade + tier data type**
  - **Scope:** Express `_date` and `_time` deriving from `battleReport_battleDate` as `IS_DERIVED_FROM` edges. Implement `applyDerivations(fields, graph)` that walks the edges in topological order. Parser calls it; form updates call it; single derivation code path. **Two tier-related concerns also land in this commit (separate concerns, same commit):**
    1. **Tier data type (decision T2 from [`EXPLORATION-tier-handling.md`](./EXPLORATION-tier-handling.md), accepted 2026-04-25):** add `'tier'` to `DATA_TYPES`, declare `IS_OF_TYPE battleReport_tier 'tier'` (changes from `'number'`), add tier case to `field-utils.ts`'s parser switch (extracts leading int, handles `+` suffix). Delete the duplicated regex from [`data-parser.ts:extractKeyStatsFromFields`](../../src/features/analysis/shared/parsing/data-parser.ts) and [`run-type-detection.ts:extractNumericStats`](../../src/shared/domain/run-types/run-type-detection.ts) — both files carry transitional comments pointing at this commit. Flag the tier-`+` handling as sunset-eligible in the implementation (V28 exports never produce `+`; only V2 clipboard / V2 storage do; eventually deletable).
    2. **`_runType` from tier deriver** (separate from the data-type concern, per user direction): declare `_runType IS_DERIVED_FROM battleReport_tier { deriver: 'runTypeFromTier' }` per spec §11.4 gotcha 4. Replaces the `/\+/.test(tierStr)` branch in `detectRunTypeFromFields`.
  - **Spec references:** [`architecture/11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.3 (derivation edges) + §11.4 gotcha 4 (run-type detection two-tier fallback), [`18-write-path.md`](architecture/18-write-path.md) §18.4 (update cascade).
  - **Files touched:** [`data-parser.ts`](../../src/features/analysis/shared/parsing/data-parser.ts), [`csv-parser.ts`](../../src/features/data-import/csv-import/csv-parser.ts), `field-update-logic.ts`, [`run-type-detection.ts`](../../src/shared/domain/run-types/run-type-detection.ts) (tier-`+` extraction collapses to graph call). New: `catalog/edges/derivations/derivations.edges.ts`, `field-graph/derivers.ts` (DERIVERS registry per spec §11.3), `field-graph/apply-derivations.ts`.
  - **Cutover requirement (per preamble §5):** the inline `deriveDateTimeFromBattleDate(battleDate)` calls in `data-parser.ts` and `csv-parser.ts` (currently three call sites — one per parser, one in form updates) are replaced by a single `applyDerivations(fields)` call. Same for any other ad-hoc derivation logic in form update or import paths. After the commit, no parser hardcodes the `_date` / `_time` derivation by name. **Also delete the duplicated tier-`+` regex in [`data-parser.ts`](../../src/features/analysis/shared/parsing/data-parser.ts) and [`run-type-detection.ts`](../../src/shared/domain/run-types/run-type-detection.ts)** — both files carry transitional comments referencing this commit; both should resolve to the same graph call (deriver-driven or data-type-driven, depending on the chosen shape). **Also delete `withPopulatedAppFields` + `stringField` + the related per-field block in [`csv-exporter.ts`](../../src/features/data-export/csv-export/csv-exporter.ts)** — that transitional preprocessor (added in commit 8 to handle cached-property fallbacks `_date ← run.timestamp`, `_time ← run.timestamp`, `_runType ← run.runType` and to pre-encode `_notes` for tab-delimited CSV) only exists because the parser / cascade doesn't yet ensure those fields are populated by export time. Commit 9's cascade closes that gap structurally; the preprocessor disappears. The `_notes` encoding sub-concern moves to a separate edge or `'user-text'` data-type variant — flag as a follow-up if it doesn't fit naturally into commit 9's scope.
  - **Conventions (per preamble §10):** engine helpers — `fieldsDerivedFrom(fieldRef): readonly string[]` (forward direction, edges *from* fieldRef), `derivationsOf(fieldRef): readonly Edge[]` (the inputs feeding fieldRef), and a private `topologicallyOrderDerivations()` for the cascade walker.
  - **DoD:** Existing battle-date derivation tests pass; add a test that editing `battleReport_battleDate` in the form cascades to `_date` / `_time`. No hardcoded field-name derivation calls remain.
  - **Dependencies:** commits 1–3, 5b, 8.
  - **Status:** `TODO`

- [x] **Commit 10 — `RENAMED_FROM` edges + `resolveFieldByAnyKey` cutover**
  - **Scope:** Turn `V2_TO_V3_FIELD_MAP` into `RENAMED_FROM` edges on each renamed field node. **Also fold in the legacy internal-field migrations** (`date` → `_date`, `runType` → `_runType`, `placement` → `_rank`, etc. — the contents of `LEGACY_FIELD_MIGRATIONS` in `internal-field-config.ts`) as `RENAMED_FROM` edges with `atSchema: SCHEMA_V2_NODE.id`. The migration adapter and bulk-import path call `graph.resolveFieldByAnyKey(rawKey)` instead of either hand-authored map. **Also delete `legacyTypeFallback` from `field-utils.ts`** (per commit 8's deferral note) — once V2 display labels resolve through RENAMED_FROM, `dataTypeOf` finds the canonical's IS_OF_TYPE and the substring fallback is unreachable.
  - **Spec references:** [`architecture/14-key-lookup-and-renames.md`](architecture/14-key-lookup-and-renames.md) (full resolution model), [`17-schema-as-a-first-class-graph-entity.md`](architecture/17-schema-as-a-first-class-graph-entity.md) §17.3 (schema evolution), [`architecture/11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.4 gotcha 6 (internal-field renames are V1→V2 storage-schema, not game-version-driven — same edge type, different `atSchema`).
  - **Files touched:** `v2-to-v3-field-map.ts` (deleted), `v2-to-v3-field-map.generated.ts` (deleted), `internal-field-config.ts` (deleted), `internal-field-config.test.ts` (deleted), `remap-v2-field-keys.ts` (graph-driven), `csv-parser.ts` (legacy branch removed), `csv-field-mapping.ts` (legacy branch replaced with `resolveFieldByAnyKey`), `data-parser.ts` (legacy migration loop deleted; tier extraction made unconditional regex), `data-migrations.ts` (LEGACY_FIELD_MIGRATIONS deleted; `migrateRunsV1ToV2` graph-driven), `v2-to-v3-migrator.ts` (uses `resolveFieldByAnyKey`), `v2-v3-schema-inverse-check.test.ts` (rewritten against the graph), `field-utils.ts` (`legacyTypeFallback` deleted; `getFieldConfig` graph-only; `deriveCanonicalKey` strips `v3_` prefix), `run-type-detection.ts` (tier extraction made unconditional regex), `knip.json` (drop the deleted .generated entry). New: `catalog/edges/renames/renames.edges.ts` (153 RENAMED_FROM edges), `renames.queries.ts`, `renames.queries.test.ts`, `renames.invariants.test.ts`.
  - **Cutover requirement (per preamble §5):** **`internal-field-config.ts` is deleted in this commit, not just shrunk.** Both `LEGACY_FIELD_MIGRATIONS` definitions (the one in `internal-field-config.ts` and the duplicate in `data-migrations.ts`), `isLegacyField`, `getMigratedFieldName`, `V2_TO_V3_FIELD_MAP`, and `legacyTypeFallback` all collapse into a single `graph.resolveFieldByAnyKey()` lookup at the parser/import boundary. Every consumer of those helpers (`csv-parser.ts`, `csv-field-mapping.ts`, `data-parser.ts`, `data-migrations.ts`, `v2-to-v3-migrator.ts`, `field-utils.ts`) gets cut over. After the commit there is exactly one rename mechanism: the graph.
  - **Conventions (per preamble §10):** `resolveFieldByAnyKey` is the explicit string-only carve-out — it accepts raw legacy / V3 keys at the parser/import boundary and stays `string`-typed (no polymorphic `FieldRef`). All other consumers go through canonical-key APIs.
  - **DoD:** The 687-row V2 fixture still migrates end-to-end; new invariant tests for RENAMED_FROM (every V2 game field resolves OR is intentionally-dropped; legacy keys don't collide with intentionally-dropped; every payload references a real Schema node; specific V1 / V2 sample resolutions); `internal-field-config.ts` does not exist; no call site references `LEGACY_FIELD_MIGRATIONS`, `isLegacyField`, `getMigratedFieldName`, `V2_TO_V3_FIELD_MAP`, or `legacyTypeFallback`. `npm run integration-precheck` green.
  - **Dependencies:** commits 1–3, 5b.
  - **Follow-up (resolved):** the persistence of `deriveCanonicalKey` and duplicated parser-boundary normalization is a real smell. Captured in [`EXPLORATION-parser-boundary-resolution.md`](./EXPLORATION-parser-boundary-resolution.md) + [`EXPLORATION-option-d-deep-dive.md`](./EXPLORATION-option-d-deep-dive.md). Decision (2026-05-03): centralize via the locked D-α shape in commit 11b. Commit 10 ships as-is.
  - **Status:** `DONE`

- [ ] **Commit 11 — Schema lifecycle edges (`SHIPPED_IN_SCHEMA`, `INTENTIONALLY_DROPPED_IN_SCHEMA`, `MIGRATED_TO_SCHEMA`)**
  - **Scope:** Declare schema lifecycle per field. `INTENTIONALLY_DROPPED_V2_FIELDS` becomes `INTENTIONALLY_DROPPED_IN_SCHEMA` edges. Every V3-canonical field gets `SHIPPED_IN_SCHEMA` to `schema:v3` (unless explicitly inherited from v2). The migration gate reads lifecycle from the graph.
  - **Spec references:** [`architecture/17-schema-as-a-first-class-graph-entity.md`](architecture/17-schema-as-a-first-class-graph-entity.md) (schema taxonomy), [`09-cross-cutting-concerns.md`](architecture/09-cross-cutting-concerns.md) §9.2 (lifecycle diagram).
  - **Files touched:** `intentionally-dropped.ts` (deleted; data moves to edges), `commit-v3-migration.ts` (consumes graph for version resolution). New: `catalog/schema-lifecycle.edges.ts`.
  - **Cutover requirement (per preamble §5):** every consumer of `INTENTIONALLY_DROPPED_V2_FIELDS`, `V3_COLUMN_PREFIX_VERSION`, and any other hand-authored schema-version-aware constant moves to the graph helpers. Migration gate, version-detection logic, and any lifecycle-aware code path uses `graph.currentSchema()`, `graph.fieldsDroppedIn(schemaRef)`, etc.
  - **Conventions (per preamble §10):** add engine helpers `currentSchema()`, `schemaOf(fieldRef): SchemaNode | undefined`, `fieldsShippedIn(schemaRef)`, `fieldsDroppedIn(schemaRef)`. `SCHEMA_V1_NODE` / `SCHEMA_V2_NODE` / `SCHEMA_V3_NODE` named exports already exist.
  - **DoD:** Lockstep invariant test: `V3_COLUMN_PREFIX_VERSION === graph.currentSchema().version`. `intentionally-dropped.ts` is deleted; nothing imports it.
  - **Dependencies:** commits 1–3, 5b, 10.
  - **Status:** `TODO`

- [ ] **Commit 11b — Parser-boundary resolver centralization** *(shape LOCKED per [`EXPLORATION-option-d-deep-dive.md`](./EXPLORATION-option-d-deep-dive.md): D-α resolver, no categories, explicit form-as-edge, build-time collision errors, app-schema axis only)*
  - **Scope:** Eliminate the duplicated string-shape normalization across [`field-utils.ts:deriveCanonicalKey`](../../src/features/analysis/shared/parsing/field-utils.ts), [`csv-parser.ts:buildColumnToFieldMap`](../../src/features/data-import/csv-import/csv-parser.ts), [`csv-field-mapping.ts`](../../src/features/data-import/csv-import/csv-field-mapping.ts), and [`v2-to-v3-migrator.ts:classifyV2Header`](../../src/shared/domain/migrations/v2-to-v3-migrator.ts). Parser-boundary callers reduce to a single resolver call regardless of input shape.
  - **Implementation shape (locked):**
    - **Resolver:** edge-type-aware (D-α). Hard-code lookups for canonical id → RENAMED_FROM legacy keys → HAS_CSV_HEADER reverse → V3-storage-prefixed forms. NO categories, NO procedural transforms (`toCamelCase`, prefix-strip, etc.).
    - **Catalog:** declare every recognized form as an explicit edge. For each game field: a `RENAMED_FROM` for each historical name (camelCase, space-form display label, V3 storage prefix). No auto-derivation from canonical id — explicit declaration wins for searchability. Likely uses existing `RENAMED_FROM` for all forms (casing-change = rename); add `HAS_V3_STORAGE_KEY` only if collision avoidance forces a separate edge type.
    - **Schema lineage:** continue using `RENAMED_FROM.atSchema` referencing the app-schema. NO new `gameVersion` payload on edges.
    - **Collision policy:** build-time error if any string is registered as a lookup key for two different fields.
    - **Naming:** rename `resolveFieldByAnyKey` to a cleaner alternative (e.g. `resolveField`). The "by any key" name leaks implementation detail. Internal lookups use edge-type names (`renamedFromIdx`, `csvHeaderIdx`, etc.), not invented terms like "legacy ID" or "canonical ID."
  - **Spec references:** [`EXPLORATION-parser-boundary-resolution.md`](./EXPLORATION-parser-boundary-resolution.md) (direction), [`EXPLORATION-option-d-deep-dive.md`](./EXPLORATION-option-d-deep-dive.md) (locked shape), [`architecture/14-key-lookup-and-renames.md`](architecture/14-key-lookup-and-renames.md).
  - **Files touched:** [`field-utils.ts`](../../src/features/analysis/shared/parsing/field-utils.ts) (delete `deriveCanonicalKey`), [`csv-parser.ts`](../../src/features/data-import/csv-import/csv-parser.ts) (collapse `buildColumnToFieldMap` to graph call), [`csv-field-mapping.ts`](../../src/features/data-import/csv-import/csv-field-mapping.ts) (same), [`v2-to-v3-migrator.ts`](../../src/shared/domain/migrations/v2-to-v3-migrator.ts) (same), [`remap-v2-field-keys.ts`](../../src/shared/domain/migrations/remap-v2-field-keys.ts) (no longer needed if all callers use the centralized resolver), [`field-graph.ts`](../../src/shared/domain/field-graph/field-graph.ts) (resolver rename + additional index construction). Catalog growth: [`catalog/edges/renames/renames.edges.ts`](../../src/shared/domain/field-graph/catalog/edges/renames/renames.edges.ts) gains explicit display-label-with-spaces entries + V3-storage-prefix entries per field.
  - **Cutover requirement (per preamble §5):** every parser-boundary caller's `if (header.startsWith(...)) ... else if (header.startsWith('_')) ... else toCamelCase(...)` ladder collapses to one line. ZERO procedural normalization survives outside the engine. The engine's resolver is itself procedural-transform-free.
  - **DoD:** `deriveCanonicalKey` deleted. Each of the four files' normalization ladders collapses to a single resolver call. New invariant: every CSV header in `sampleData/` resolves to a non-null Node. Build-time invariant: no string collides across reverse indexes. `npm run integration-precheck` green.
  - **Dependencies:** commits 1–3, 5b, 10. (Soft: commit 11 if schema-prefix declaration needs `currentSchema()`.)
  - **Status:** `TODO — shape locked; ready to implement`

- [ ] **Commit 12 — `APPEARS_IN_VIEW` + `APPEARS_IN_FILTER` edges**
  - **Scope:** Declare which fields appear in which views (tier-stats, tier-trends, source-analysis, field-analytics, coverage, etc.) and filters. View components query `graph.fieldsInView(viewId)` instead of hardcoded arrays.
  - **Spec references:** [`architecture/09-cross-cutting-concerns.md`](architecture/09-cross-cutting-concerns.md) §9.4 (new-view walkthrough), [`12-extending-with-a-new-run-type-and-sub-category.md`](architecture/12-extending-with-a-new-run-type-and-sub-category.md) (filter auto-discovery for dissonance).
  - **Files touched:** each chart / analysis page component; filter bar components. New: `catalog/views.edges.ts` and `catalog/filter-views.edges.ts`.
  - **Cutover requirement (per preamble §5):** every hardcoded field-list in a view component (tier-stats columns, tier-trends fields, source-analysis defaults, field-analytics options, coverage report, etc.) and every filter-bar field-list moves to a graph query. Audit each chart / analysis page for `const FIELDS_FOR_VIEW = [...]` patterns and migrate them.
  - **Conventions (per preamble §10):** add engine helpers `fieldsInView(viewRef)`, `fieldsInFilter(viewRef)`, `viewsOf(fieldRef)`, `filtersOf(fieldRef)` — all polymorphic. `VIEW_RUN_DETAILS__BATTLE_REPORT_NODE` / `VIEW_CHARTS__TIER_STATS_NODE` etc. named exports already exist from commit 4.
  - **DoD:** Adding a `APPEARS_IN_VIEW` edge to a new field auto-includes it in the relevant view (tested with a fixture field). No view component still hardcodes a field list.
  - **Cardinality decision required:** Commit 3 temporarily downgraded `APPEARS_IN_VIEW` from `'at-least-one'` to `'many'`. Before closing this commit, decide whether to restore `'at-least-one'` (every field must render somewhere) or keep it `'many'` (some fields — compound-only sources, non-UI internal metadata — legitimately have no view). If restoring, un-skip the paired test in `field-graph.test.ts`; if keeping, delete that test and update the ledger row accordingly.
  - **Dependencies:** commits 5b, 6 (section membership established first).
  - **Status:** `TODO`

- [ ] **Commit 13 — `CONDITIONAL_ON` edges**
  - **Scope:** Declare conditional visibility — `_rank CONDITIONAL_ON enum:runType.tournament`. Form components query `graph.conditionallyVisibleFields(run)`. Replaces the scattered `if (runType !== 'tournament') setRank('')` pattern at `use-data-input-form.ts:180` and similar sites. (The `_dissonanceSubCategory CONDITIONAL_ON enum:runType.dissonance` edge ships in commit 15 alongside the field that depends on it.)
  - **Spec references:** [`architecture/18-write-path.md`](architecture/18-write-path.md) §18.3 (conditional visibility).
  - **Files touched:** `use-data-input-form.ts`, `rank-field-logic.ts`. New: `catalog/conditional.edges.ts`.
  - **Cutover requirement (per preamble §5):** every hand-rolled `if (runType !== 'tournament') clear(...)` clause moves to a generic `applyConditionalClearing(formState, graph)` helper driven by `CONDITIONAL_ON` edges. Form-state reducer and any field-update path that conditionally clears get cut over. No remaining hardcoded `runType === 'tournament'` checks for visibility/clearing.
  - **Conventions (per preamble §10):** edge target is `ENUM_RUN_TYPE__TOURNAMENT_NODE.id` (named export from commit 4); source is `_RANK_NODE.id`. Add engine helpers `conditionalOn(fieldRef): readonly Edge[]` and `conditionallyVisibleFields(formState)` per the spec §18.3 / §12.4 semantics.
  - **DoD:** Rank field hides/clears automatically when run type changes away from tournament. No `runType === 'tournament'` checks for clearing remain in form code.
  - **Dependencies:** commits 4, 5b, 12.
  - **Status:** `TODO`

- [ ] **Commit 14 — `IS_REQUIRED_IN` + `PARTICIPATES_IN_COMPOSITE_KEY` edges**
  - **Scope:** `battleReport_battleDate IS_REQUIRED_IN import:manual-entry`. `battleReport_tier`, `battleReport_wave`, `battleReport_battleDate PARTICIPATES_IN_COMPOSITE_KEY`. Validation and duplicate-detection code query the graph.
  - **Spec references:** [`architecture/09-cross-cutting-concerns.md`](architecture/09-cross-cutting-concerns.md) §9.6 (specific-field references), [`18-write-path.md`](architecture/18-write-path.md) §18.2 (validation).
  - **Files touched:** `use-data-input-form.ts`, `duplicate-detection.ts`, `date-issue-detection.ts`. New: `catalog/required-fields.edges.ts`, `catalog/composite-key.edges.ts`.
  - **Cutover requirement (per preamble §5):** the `generateCompositeKey` function in `duplicate-detection.ts` and the required-field-validation in `use-data-input-form.ts` both move to graph queries. Hardcoded composite-key field lists (today: `['battleReport_tier', 'battleReport_wave', 'battleReport_battleDate']`) get replaced by `graph.compositeKeyFieldsFor('primary')`. Hardcoded required-field checks get replaced by `graph.requiredFieldsIn(VIEW_X_NODE)`.
  - **Conventions (per preamble §10):** add engine helpers `isRequiredIn(fieldRef, viewRef): boolean`, `requiredFieldsIn(viewRef): readonly string[]`, `participatesInCompositeKey(fieldRef, scope?): boolean`, `compositeKeyFieldsFor(scope): readonly string[]`. Edges reference `BATTLE_REPORT__BATTLE_DATE_NODE` etc.
  - **DoD:** Existing required-validation tests pass; composite key stays backward-compatible with V2 data via `RENAMED_FROM` transitive lookup. No hardcoded composite-key or required-field lists remain.
  - **Dependencies:** commits 5b, 9, 10.
  - **Status:** `TODO`

### Phase 3 — First new feature on the graph

- [ ] **Commit 15 — Dissonance run-type + subcategory**
  - **Scope (revised post-commit-4 to follow locked patterns):**
    1. Append `'dissonance'` to `RUN_TYPE_VALUES` in `src/shared/domain/run-types/types.ts`. The graph catalog auto-derives the new EnumValue node + ACCEPTS_VALUE edge per commit 4's TS-as-source-of-truth pattern.
    2. Add per-value display name + color for `'dissonance'` to `RUN_TYPE_PRESENTATION` in `catalog/enum-values.edges.ts`.
    3. Declare the new field node `_DISSONANCE_SUB_CATEGORY_NODE` in `catalog/fields.nodes.ts`.
    4. Add `DISSONANCE_SUB_CATEGORY_VALUES = ['attack', 'defense', 'ultimate-weapons', 'utility'] as const` (probably in a new `dissonance/types.ts` or appended to an internal-fields types module). Mirror the `RUN_TYPE_*` shape.
    5. New file `catalog/dissonance-sub-category.edges.ts` with `flatMap` derivation analogous to `enum-values.edges.ts`. Per-value presentation map for display name + color.
    6. Add `_DISSONANCE_SUB_CATEGORY_NODE CONDITIONAL_ON ENUM_RUN_TYPE__DISSONANCE_NODE` to `catalog/conditional.edges.ts` (the edge that originally lived in commit 13's scope, moved here because it depends on the new field).
    7. Extend `enum-sync.invariant.test.ts` to enforce `_dissonanceSubCategory ACCEPTS_VALUE` matches `DISSONANCE_SUB_CATEGORY_VALUES`.
    8. Parser filename detection branch — `Dissonance_(Attack|Defense|UltimateWeapons|Utility)_*.txt` → populates `_dissonanceSubCategory`. Implemented as a deriver registered in `DERIVERS` (commit 9 infrastructure).
    9. APPEARS_IN_FILTER edges for the new field across analytics views (commit 12 infrastructure). Filter auto-appears via the graph; no filter component code changes.
  - **Spec references:** [`architecture/12-extending-with-a-new-run-type-and-sub-category.md`](architecture/12-extending-with-a-new-run-type-and-sub-category.md) (full worked example — note this section was written before commit 4's TS-as-source-of-truth pattern, so its raw `enumValueNode(...)` declarations are illustrative; follow the derivation pattern instead), [`18-write-path.md`](architecture/18-write-path.md) (form integration).
  - **Files touched:** one new field-node declaration, one new `as const` tuple, two new presentation-record entries, one new edges file (`dissonance-sub-category.edges.ts`), one CONDITIONAL_ON edge, parser filename-detection deriver. No filter / form code touched — auto-discovered via graph.
  - **DoD:** Import a dissonance sample; subcategory detected; filter shows on analytics pages; run-details renders the subcategory. **After declaring the edges, run the parser against each `Dissonance_*.txt` sample in `sampleData/v28/` and report the resulting `ParsedGameRun.fields._dissonanceSubCategory` values.**
  - **Dependencies:** commits 4, 9 (DERIVERS registry), 12, 13.
  - **Status:** `TODO`

### Phase 3.5 — Cleanup (revert all migration-era escape hatches)

- [ ] **Commit 16 — Remove temporary suppressions and re-enable deferred tests**
  - **Scope:** This epic accumulates short-lived workarounds across earlier commits — `eslint-disable` comments, ESLint config overrides, `test.skip` markers, deferred fixtures, and any Husky / pre-commit allowances added to keep `integration-precheck` green during intermediate states. This commit deletes them all and confirms the underlying fixes have actually landed in commits 1–15. Nothing new is *added* here; it is a closing audit + revert pass.
  - **Pre-work checklist** (run before opening the PR):
    1. `git log <epic-base>..HEAD --pretty=format:'%h %s' | grep -iE 'skip|disable|override|temporary|defer'` — surface anything tagged as temporary in commit messages.
    2. `rg -n 'eslint-disable|@ts-expect-error|@ts-ignore' src/` — diff against the same query at the epic base; anything new is a candidate.
    3. `rg -n 'test\.skip|test\.fixme|describe\.skip|xit\(|xdescribe\(' e2e/ src/` — every match added during the epic must come back to life.
    4. Diff `eslint.config.ts` against the epic base; any new `files:` override block tagged "field-graph", "migration", or "scripts/migration-data-prep" must be re-evaluated.
    5. Check `package.json` (Husky / lint-staged sections) for any rule that was loosened mid-epic.
    6. Read [`Migration-era-suppressions.md`](./Migration-era-suppressions.md) — its active entries should match the diff from steps 1–5. If they disagree, the file has drifted and needs reconciling first.
  - **Files touched:** purely deletions / reverts. No new product code.
  - **DoD:**
    - `npm run integration-precheck` green with **zero** skipped tests added by this epic.
    - [`Migration-era-suppressions.md`](./Migration-era-suppressions.md) has zero un-checked active entries (or contains only items explicitly deferred to a follow-up issue, with link).
    - Grep queries from steps 2–3 return the same set of pre-existing matches that existed at the epic base — no net new suppressions.
  - **Dependencies:** commits 1–15. This is the last code commit before manual verification.
  - **Out of scope:** any product fix. If a skipped test still fails after the relevant earlier commit shipped, file a follow-up issue and document it under "Migration-era suppressions" rather than patching here.
  - **Litmus retrospective (per [`EXPLORATION-data-type-edge-vs-property.md`](./EXPLORATION-data-type-edge-vs-property.md) §5):** audit the four-question litmus from `catalog/PATTERN.md` against every edge type added across commits 9–14. If any commit added a `Node.payload` entry or a non-edge fact about a node, document it and decide whether to (a) keep as-is (legitimate carve-out), (b) lift to an edge before this commit lands, or (c) flag the litmus as needing refinement. Goal: `Node.payload` should still be empty (or contain only deliberately-non-queried debug metadata).
  - **TypeScript-vs-graph trade-off audit (revisit trigger from the same ADR §5):** evaluate whether the graph metadata system has demonstrably reduced bugs / made changes easier — or added ceremony without proportional payoff. Specific signals: did adding a new field in commits 6–15 take fewer file edits than under the pre-graph approach? Did a bug surface that the graph caught structurally but TypeScript missed (or vice versa)? Did contributor onboarding take longer because of the new mental model? Capture the verdict in a closing entry to `Notes-and-findings.md`.
  - **Status:** `TODO`

### Phase 3.6 — Tooling commits (agent infrastructure)

Two agent-creation commits surfaced from epic-running discipline. Both are tooling, not feature work; they live alongside the migration without blocking feature commits. Independent of each other; either can land first.

- [ ] **Commit 17 — Field-graph enforcer agent**
  - **Scope:** Create `.claude/agents/field-graph-enforcer.md` per the design in [`EXPLORATION-architecture-enforcer-agent.md`](./EXPLORATION-architecture-enforcer-agent.md). Agent runs late in every commit's review chain and audits the diff against the field-graph rule set codified across `field-graph-for-ai.md`, `prompt-skeleton.md`, `catalog/edges/PATTERN.md`, and `catalog/PATTERN.md`. Surfaces trajectory smells the per-commit pattern-drift / architecture / code-org agents miss (cumulative API growth, dead-code drained, two-way breadcrumb compliance, exploration-doc Human decision presence).
  - **Spec references:** [`EXPLORATION-architecture-enforcer-agent.md`](./EXPLORATION-architecture-enforcer-agent.md).
  - **Files touched:** new `.claude/agents/field-graph-enforcer.md`. Update CLAUDE.md / `prompt-skeleton.md` orchestration list to invoke it as Step 8.5 after Local Storage Safety. Optionally consolidate field-graph rules into a single `field-graph-rules.md` for the agent to read.
  - **Dependencies:** none (can land any time).
  - **Out of scope:** retiring or generalizing the agent post-epic — that's a commit-16 successor concern.
  - **Status:** `TODO — exploration-doc decision required first`

- [ ] **Commit 18 — Exploration-doc generator agent**
  - **Scope:** Create `.claude/agents/exploration-doc-generator.md`. The agent takes a topic / question and produces a fresh `EXPLORATION-*.md` following the pattern established by existing exploration docs in this repo: front-matter (date / branch / status / cross-links), 30-second-read recommendation summary, Human decision placeholder section (with the standard sub-fields the migration epic uses), problem statement, options with steel-manning + pros/cons, comparison matrix, per-commit impact, open questions. Codifies the structural discipline this epic has been applying ad-hoc.
  - **Why a dedicated agent:** running this manually for each exploration burns context window on structural-template-recall instead of substantive exploration. The agent removes the ceremony.
  - **Files touched:** new `.claude/agents/exploration-doc-generator.md`. Optionally a templates folder in `docs/templates/` if the agent reads from a template file.
  - **Optional scope-extension:** the same agent (or a sibling) could also help generate `PATTERN.md` files for new code-organization patterns — the catalog-PATTERN.md and edges-PATTERN.md establish a reusable shape.
  - **Dependencies:** none (can land any time).
  - **Status:** `TODO`

### Phase 4 — Manual verification (not a code commit)

- [ ] **Full-flow manual verification**
  - Reset Chrome localStorage to a snapshot of prod V2 data.
  - Refresh → gate fires → download backup → run migration → verify success.
  - Check every analytics page: Coverage, Tier Stats, Tier Trends, Source Analysis, Field Analytics, Deaths Analytics, Cell Analytics, Coin Analytics, Activity Heatmap.
  - Import V28 samples (farming, tournament, each dissonance sub-type) via single-entry and bulk-import.
  - Verify section-config renders every field correctly.
  - Bulk export → re-import → round-trip equivalence.
  - **Only after this passes**: bump package version, draft release notes, push to main.

## Notes & Findings

Moved to [`Notes-and-findings.md`](./Notes-and-findings.md). Append cross-commit learnings, scope adjustments, and deferred work there (date + commit number + note).
