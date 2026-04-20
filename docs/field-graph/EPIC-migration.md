# Epic: Field Graph Migration

**Status:** In Progress · **Owner:** Jarek · **Branch:** `204-v28-migration-safety` · **Target release:** v0.12.0

---

## If you are an AI picking up this work — read this first

1. **Never mark a commit "done" yourself.** Status changes are the human's call after local verification. If you finish implementing a commit, tell the human what you finished and let them update the status.
2. **Only work on the commit you were told to work on.** If a prior commit is `TODO`, assume it's genuinely not done and flag the dependency instead of reaching ahead.
3. **The authoritative spec lives in [`architecture/`](architecture/00-table-of-contents.md).** Do not re-derive the design from scratch. When the epic references a section (e.g. `architecture/14-key-lookup-and-renames.md`), read that section before implementing. The original monolithic write-up at [`field-registry-exploration/07-relationship-graph.md`](field-registry-exploration/07-relationship-graph.md) is kept as historical reference only.
4. **Standing context for every graph-related prompt:** [`field-graph-for-ai.md`](field-graph-for-ai.md). Read it cold before touching anything in `src/features/field-graph/` or related directories.
5. **Out-of-scope:** any change not described in the current commit's "Scope" line. If you notice something else worth fixing, write it in "Notes & Findings" at the end of this doc and leave it for a later commit.
6. **Tests must stay green.** Each commit lands with `npm run integration-precheck` passing. Migration-gate / E2E manual verification is deferred to the final commit per the epic's staging plan — that is the ONE exception.
7. **Every escape hatch goes in the ledger.** If you need to silence a lint rule, skip a test, loosen Husky, or add an ESLint config override to keep `integration-precheck` green during an intermediate state, append a row to "Migration-era suppressions" in the same PR. Commit 16 drains that ledger; nothing on this epic ships with an undocumented workaround.

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

Whenever a commit on this epic introduces a temporary escape hatch — `eslint-disable`, ESLint config override, `test.skip`, deferred fixture, loosened Husky rule, etc. — add a row here in the same PR. **Commit 16 ("Cleanup") deletes everything in this list and verifies the section is empty.** If a row cannot be removed by then, convert it into a follow-up issue link before merging.

Format: `- [ ] [commit N] <file:line> — <kind> — <one-line reason> — unblocked by: <commit M> / <follow-up issue>`

- [ ] [pre-epic] [`eslint.config.ts`](../../eslint.config.ts) `scripts/**/*.{js,mjs,cjs,ts}` override — Node globals + relaxed `max-statements` / `max-lines-per-function` for one-shot data-prep `main()` functions — unblocked by: keep (these are legitimate Node scripts) **or** decide to delete the scripts post-migration.
- [ ] [pre-epic] [`eslint.config.ts`](../../eslint.config.ts) `src/shared/domain/field-graph/**` override — disables `@typescript-eslint/no-unused-vars` so phase-1 dead exports don't trip lint — unblocked by: commit 4+ (consumers start importing the engine).
- [ ] [pre-epic] [`knip.json`](../../knip.json) `ignore: src/shared/domain/field-graph/**` — knip's pre-commit `--fix-type files,exports,types` was auto-deleting phase-1 engine exports (`buildGraph`, `EDGE_META`, `EdgeTargetKind`, etc.) before consumers in commits 4+ could import them — unblocked by: commit 4+ (real consumers anchor every export and knip can resume managing this directory).
- [ ] [pre-epic] [`knip.json`](../../knip.json) `ignore: src/shared/domain/migrations/v2-to-v3-field-map.generated.ts` — generated scaffold output (see [`scripts/migration-data-prep/scaffold-v2-to-v3-map.mjs`](../../scripts/migration-data-prep/scaffold-v2-to-v3-map.mjs)) consumed only by the hand-edited `v2-to-v3-field-map.ts` for diffing, so knip flags it as unused — unblocked by: commit 10 (RENAMED_FROM edges absorb the map; both files can be deleted).
- [ ] [pre-epic] [`src/shared/formatting/date-issue-detection.ts:115`](../../src/shared/formatting/date-issue-detection.ts) `// eslint-disable-next-line complexity` — V2/V3 dual-key tolerance bumps complexity to 11 — unblocked by: commit 10 (RENAMED_FROM edges collapse the dual-key check back to a single graph lookup).
- [ ] [pre-epic] [`e2e/features/analytics/tier-stats.spec.ts`](../../e2e/features/analytics/tier-stats.spec.ts) `test.skip` — persisted column config invalidated by V2→V3 rename — unblocked by: commit 6 (BELONGS_TO_SECTION).
- [ ] [pre-epic] [`e2e/features/analytics/tier-trends.spec.ts`](../../e2e/features/analytics/tier-trends.spec.ts) `test.skip` — field-search resolution still references V2 labels — unblocked by: commit 12 (APPEARS_IN_VIEW).
- [ ] [pre-epic] [`e2e/features/analytics/coverage-report.spec.ts`](../../e2e/features/analytics/coverage-report.spec.ts) `test.skip` — tooltip references V2 field labels — unblocked by: commit 6 (BELONGS_TO_SECTION).
- [ ] [pre-epic] [`e2e/features/analytics/field-analytics.spec.ts`](../../e2e/features/analytics/field-analytics.spec.ts) `test.skip` — default-field selection doesn't traverse V2→V3 rename — unblocked by: commit 10 (RENAMED_FROM).
- [ ] [pre-epic] [`e2e/features/data-import/bulk-export.spec.ts`](../../e2e/features/data-import/bulk-export.spec.ts) `test.skip` — fixture `expected-bulk-export.csv` still uses V2-era display labels; current export emits `v3_`-prefixed canonical keys — unblocked by: commit 5 (HAS_CSV_HEADER) **and** fixture regeneration.

## Staging plan

- **Phase 1 (commits 1–3)** introduces the graph engine and catalogs. All code is dead — nothing in `src/features/` or `src/shared/domain/` outside of the new graph directory queries it yet. Tests exist only against a toy fixture graph.
- **Phase 2 (commits 4–14)** is the vertical-slice sequence. Each commit declares one edge type, wires the graph into the consumers that need it, and deletes the imperative code it replaces. App behavior stays equivalent through the phase; only the mechanism changes.
- **Phase 3 (commit 15)** delivers the dissonance run-type extension — the first *new feature* built natively on the graph. Serves as the real-world validation.

The app cannot be fully exercised end-to-end until commit 15. Unit and integration tests gate each commit; manual migration-flow testing happens after commit 15.

## Commit checklist

Legend: `[ ]` TODO · `[~]` IN PROGRESS · `[x]` DONE

### Phase 1 — Foundation (dead code)

- [ ] **Commit 1 — Graph engine core**
  - **Scope:** `FieldGraph` class, `Node` / `Edge` discriminated unions, `Schema` / `Section` / `Category` / `View` / `Field` / `EnumValue` node kinds, the full edge-kind taxonomy, query API (`getField`, `resolveFieldByAnyKey`, `sourcesOf`, `fieldsInSection`, etc.), load-time invariants (dangling edge detection, cardinality check), `buildGraph()` entry point.
  - **Spec references:** [`architecture/01-abstract-and-motivation.md`](architecture/01-abstract-and-motivation.md) and [`02-how-it-works.md`](architecture/02-how-it-works.md) (mental model), [`08-clarifying-the-mental-model.md`](architecture/08-clarifying-the-mental-model.md) §8.1–8.2 (node/edge shapes), [`14-key-lookup-and-renames.md`](architecture/14-key-lookup-and-renames.md) (resolveFieldByAnyKey), [`15-multi-section-membership.md`](architecture/15-multi-section-membership.md) (cardinality), [`17-schema-as-a-first-class-graph-entity.md`](architecture/17-schema-as-a-first-class-graph-entity.md) (schema as first-class node).
  - **Files:** new `src/shared/domain/field-graph/` directory.
  - **DoD:** `npm run test` green; new unit tests against a hand-built toy graph (< 10 nodes / edges) cover happy path + each invariant's failure mode.
  - **Dependencies:** none.
  - **Out of scope:** any real field/edge declarations. No consumers wired yet.
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 2 — Top-level catalog nodes**
  - **Scope:** Declare all Schema nodes (`schema:v1`, `schema:v2`, `schema:v3`), Section nodes (`section:battleReport`, `section:coins`, `section:damage`, ...), Category nodes (`category:combat`, `category:economic`, `category:modules`, ...), View nodes (`view:run-details:battle-report`, `view:charts:tier-stats`, ...). Still dead code.
  - **Spec references:** [`architecture/17-schema-as-a-first-class-graph-entity.md`](architecture/17-schema-as-a-first-class-graph-entity.md) (schema taxonomy), existing `section-config.ts` and chart / analysis pages for section + view inventory.
  - **Files:** `src/shared/domain/field-graph/catalog/*.nodes.ts` (split by node kind for readability).
  - **DoD:** `npm run test` green; catalog is loaded by `buildGraph()`; invariant test asserts that every declared node has a unique id.
  - **Dependencies:** commit 1.
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 3 — Field nodes**
  - **Scope:** Declare a `FieldNode` for every V3 canonical field from `sampleData/supportedFields.json` (≈147 fields) plus the 5 internal fields (`_date`, `_time`, `_notes`, `_runType`, `_rank`). No edges yet other than the minimum `kind: 'field'`; edge attribution starts in phase 2.
  - **Spec references:** [`architecture/08-clarifying-the-mental-model.md`](architecture/08-clarifying-the-mental-model.md) (node shapes), [`11-internal-app-fields.md`](architecture/11-internal-app-fields.md) (internal fields).
  - **Files:** `src/shared/domain/field-graph/catalog/fields.nodes.ts` (one big data file is fine for this commit).
  - **DoD:** Invariant test asserts `fieldNodes.length === supportedFields.length`; every field id matches a supportedFields entry.
  - **Dependencies:** commits 1, 2.
  - **Status:** `TODO` · **PR/SHA:** —

### Phase 2 — Vertical slices (each deletes imperative code)

- [ ] **Commit 4 — `ACCEPTS_VALUE` edges + `_runType` cutover**
  - **Scope:** Declare `ACCEPTS_VALUE` edges for `_runType` (`farm`, `tournament`, `milestone`). Rewrite `run-type-detection.ts` and `run-type-selector-options.ts` to query the graph. Replace hardcoded `RunTypeValue` literals in filter components with `graph.enumValuesOf('_runType')`.
  - **Spec references:** [`architecture/11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.2 (enum expressiveness), [`12-extending-with-a-new-run-type-and-sub-category.md`](architecture/12-extending-with-a-new-run-type-and-sub-category.md) (dissonance uses this same pattern), [`18-write-path.md`](architecture/18-write-path.md) §18.2 (validation via graph).
  - **Files touched:** ~8–12 existing. Deletions: hardcoded enum duplications.
  - **DoD:** Run-type filter still works identically; test that adding a fake run-type value to the graph makes it show up in the filter without code changes.
  - **Dependencies:** commits 1–3.
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 5 — `IS_INTERNAL_FIELD` + `HAS_CSV_HEADER` edges**
  - **Scope:** Declare `IS_INTERNAL_FIELD` edges for `_date`, `_time`, `_notes`, `_runType`, `_rank`. `HAS_CSV_HEADER` edges for their human-friendly headers (`_Date`, `_Time`, etc.). Rewrite `csv-exporter.ts` header logic and `internal-field-config.ts` to query the graph.
  - **Spec references:** [`architecture/11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.1 (internal field representation), §11.4 (gotchas).
  - **Files touched:** ~5 existing. Deletes `INTERNAL_FIELD_MAPPINGS` / `INTERNAL_FIELD_ORDER` hand-authored arrays.
  - **DoD:** CSV round-trip tests still pass; header ordering identical.
  - **Dependencies:** commit 4 (shares the `_runType` enum pattern).
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 6 — `BELONGS_TO_SECTION` + `RENDERS_AS_IN_SECTION` edges**
  - **Scope:** Declare section membership for every field. Rewrite `section-config.ts` to query the graph — `BATTLE_REPORT_ESSENTIAL`, `DAMAGE_TAKEN_CONFIG`, etc. become graph queries. `RENDERS_AS_IN_SECTION` handles per-section display overrides (e.g. `battleReport_cellsEarned` showing under both battleReport and currencies).
  - **Spec references:** [`architecture/15-multi-section-membership.md`](architecture/15-multi-section-membership.md) (multi-section cardinality), [`11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.4 (render override).
  - **Files touched:** `section-config.ts` (massive rewrite), `use-run-details-data.ts`, plus a few chart pages that reference section configs.
  - **DoD:** Run-details card renders identically to pre-commit state. Snapshot test of rendered sections against a fixture run.
  - **Dependencies:** commits 1–3.
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 7 — `IS_SOURCE_OF` edges + breakdown-sources deletion**
  - **Scope:** Declare `IS_SOURCE_OF` edges from each coin / damage source to its total (`coins_goldenTower IS_SOURCE_OF battleReport_coinsEarned`, etc.). Delete `coin-sources.ts`, `damage-sources.ts`, `breakdown-sources/index.ts`. Breakdown components now call `graph.sourcesOf(totalField)`.
  - **Spec references:** [`architecture/09-cross-cutting-concerns.md`](architecture/09-cross-cutting-concerns.md) §9.1 (aggregation impact), [`03b-renaming-a-field-v28-to-v29.md`](architecture/03b-renaming-a-field-v28-to-v29.md) (source example).
  - **Files touched:** `coin-sources.ts` (delete), `damage-sources.ts` (delete), `breakdown-sources/index.ts` (delete or reduce to re-exports), `source-analysis/*` consumers.
  - **DoD:** Source-analysis charts render identically. The hand-enumerated color palette migrates to the field-node payloads.
  - **Dependencies:** commit 6.
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 8 — `HAS_DATA_TYPE` edges + parser type-detector rewrite**
  - **Scope:** Declare the data type (`'number' | 'duration' | 'date' | 'string'`) for every field via `HAS_DATA_TYPE` edges. Rewrite `getFieldConfig` in `field-utils.ts` to query the graph instead of pattern-matching labels. Closes the "composite key vs label" class of bugs structurally.
  - **Spec references:** [`architecture/11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.1, [`09-cross-cutting-concerns.md`](architecture/09-cross-cutting-concerns.md) §9.5 (runtime type-mismatch).
  - **Files touched:** `field-utils.ts`, `createGameRunField`, a handful of consumers that currently pattern-match field names.
  - **DoD:** `v28-sample-parse.invariant.test.ts` still passes; add a new invariant that every field node has exactly one `HAS_DATA_TYPE` edge.
  - **Dependencies:** commits 1–3.
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 9 — `IS_DERIVED_FROM` edges + derivation cascade**
  - **Scope:** Express `_date` and `_time` deriving from `battleReport_battleDate` as `IS_DERIVED_FROM` edges. Implement `applyDerivations(fields, graph)` that walks the edges in topological order. Parser calls it; form updates call it; single derivation code path.
  - **Spec references:** [`architecture/11-internal-app-fields.md`](architecture/11-internal-app-fields.md) §11.3 (derivation edges), [`18-write-path.md`](architecture/18-write-path.md) §18.4 (update cascade).
  - **Files touched:** `data-parser.ts`, `csv-parser.ts`, `field-update-logic.ts`.
  - **DoD:** Existing battle-date derivation tests pass; add a test that editing `battleReport_battleDate` in the form cascades to `_date` / `_time`.
  - **Dependencies:** commits 1–3, 8.
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 10 — `RENAMED_FROM` edges + `resolveFieldByAnyKey` cutover**
  - **Scope:** Turn `V2_TO_V3_FIELD_MAP` into `RENAMED_FROM` edges on each renamed field node. The migration adapter and bulk-import path call `graph.resolveFieldByAnyKey(rawKey)` instead of the hand-authored map. `remapV2FieldKeys` shrinks to one line.
  - **Spec references:** [`architecture/14-key-lookup-and-renames.md`](architecture/14-key-lookup-and-renames.md) (full resolution model), [`17-schema-as-a-first-class-graph-entity.md`](architecture/17-schema-as-a-first-class-graph-entity.md) §17.3 (schema evolution).
  - **Files touched:** `v2-to-v3-field-map.ts` (data moves to edges; file deleted or reduced to re-export), `remap-v2-field-keys.ts`, `csv-parser.ts`, `data-parser.ts`.
  - **DoD:** The 687-row V2 fixture still migrates end-to-end; new invariant test for RENAMED_FROM cycles.
  - **Dependencies:** commits 1–3.
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 11 — Schema lifecycle edges (`SHIPPED_IN_SCHEMA`, `INTENTIONALLY_DROPPED_IN_SCHEMA`, `MIGRATED_TO_SCHEMA`)**
  - **Scope:** Declare schema lifecycle per field. `INTENTIONALLY_DROPPED_V2_FIELDS` becomes `INTENTIONALLY_DROPPED_IN_SCHEMA` edges. Every V3-canonical field gets `SHIPPED_IN_SCHEMA` to `schema:v3` (unless explicitly inherited from v2). The migration gate reads lifecycle from the graph.
  - **Spec references:** [`architecture/17-schema-as-a-first-class-graph-entity.md`](architecture/17-schema-as-a-first-class-graph-entity.md) (schema taxonomy), [`09-cross-cutting-concerns.md`](architecture/09-cross-cutting-concerns.md) §9.2 (lifecycle diagram).
  - **Files touched:** `intentionally-dropped.ts` (deleted; data moves to edges), `commit-v3-migration.ts` (consumes graph for version resolution).
  - **DoD:** Lockstep invariant test: `V3_COLUMN_PREFIX_VERSION === graph.currentSchema().version`.
  - **Dependencies:** commits 1–3, 10.
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 12 — `APPEARS_IN_VIEW` + `APPEARS_IN_FILTER` edges**
  - **Scope:** Declare which fields appear in which views (tier-stats, tier-trends, source-analysis, field-analytics, coverage, etc.) and filters. View components query `graph.fieldsInView(viewId)` instead of hardcoded arrays.
  - **Spec references:** [`architecture/09-cross-cutting-concerns.md`](architecture/09-cross-cutting-concerns.md) §9.4 (new-view walkthrough), [`12-extending-with-a-new-run-type-and-sub-category.md`](architecture/12-extending-with-a-new-run-type-and-sub-category.md) (filter auto-discovery for dissonance).
  - **Files touched:** each chart / analysis page component; filter bar components.
  - **DoD:** Adding a `APPEARS_IN_VIEW` edge to a new field auto-includes it in the relevant view (tested with a fixture field).
  - **Dependencies:** commit 6 (section membership established first).
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 13 — `CONDITIONAL_ON` edges**
  - **Scope:** Declare conditional visibility — `_rank CONDITIONAL_ON _runType=tournament`, `_dissonanceSubCategory CONDITIONAL_ON _runType=dissonance`. Form components query `graph.conditionallyVisibleFields(run)`. Replaces the scattered `if (runType !== 'tournament') setRank('')` pattern at `use-data-input-form.ts:180` and similar sites.
  - **Spec references:** [`architecture/18-write-path.md`](architecture/18-write-path.md) §18.3 (conditional visibility).
  - **Files touched:** `use-data-input-form.ts`, `rank-field-logic.ts`.
  - **DoD:** Rank field hides/clears automatically when run type changes away from tournament.
  - **Dependencies:** commits 4, 12.
  - **Status:** `TODO` · **PR/SHA:** —

- [ ] **Commit 14 — `IS_REQUIRED_IN` + `PARTICIPATES_IN_COMPOSITE_KEY` edges**
  - **Scope:** `battleReport_battleDate IS_REQUIRED_IN import:manual-entry`. `battleReport_tier`, `battleReport_wave`, `battleReport_battleDate PARTICIPATES_IN_COMPOSITE_KEY`. Validation and duplicate-detection code query the graph.
  - **Spec references:** [`architecture/09-cross-cutting-concerns.md`](architecture/09-cross-cutting-concerns.md) §9.6 (specific-field references), [`18-write-path.md`](architecture/18-write-path.md) §18.2 (validation).
  - **Files touched:** `use-data-input-form.ts`, `duplicate-detection.ts`, `date-issue-detection.ts`.
  - **DoD:** Existing required-validation tests pass; composite key stays backward-compatible with V2 data via `RENAMED_FROM` transitive lookup.
  - **Dependencies:** commits 9, 10.
  - **Status:** `TODO` · **PR/SHA:** —

### Phase 3 — First new feature on the graph

- [ ] **Commit 15 — Dissonance run-type + subcategory**
  - **Scope:** Add `'dissonance'` to `_runType` via a new `ACCEPTS_VALUE` edge. New field node `_dissonanceSubCategory` with its own `ACCEPTS_VALUE` edges (`attack`, `defense`, `ultimate-weapons`, `utility`). `CONDITIONAL_ON _runType=dissonance`. Parser detection from filename regex (`Dissonance_(Attack|Defense|UltimateWeapons|Utility)_*.txt`). Filter auto-appears on analytics pages via `APPEARS_IN_FILTER`.
  - **Spec references:** [`architecture/12-extending-with-a-new-run-type-and-sub-category.md`](architecture/12-extending-with-a-new-run-type-and-sub-category.md) (full worked example), [`18-write-path.md`](architecture/18-write-path.md) (form integration).
  - **Files touched:** one new field-node declaration, ~5 edge additions, parser filename-detection branch. No filter / form code touched — auto-discovered via graph.
  - **DoD:** Import a dissonance sample; subcategory detected; filter shows on analytics pages; run-details renders the subcategory.
  - **Dependencies:** commits 4, 12, 13.
  - **Status:** `TODO` · **PR/SHA:** —

### Phase 3.5 — Cleanup (revert all migration-era escape hatches)

- [ ] **Commit 16 — Remove temporary suppressions and re-enable deferred tests**
  - **Scope:** This epic accumulates short-lived workarounds across earlier commits — `eslint-disable` comments, ESLint config overrides, `test.skip` markers, deferred fixtures, and any Husky / pre-commit allowances added to keep `integration-precheck` green during intermediate states. This commit deletes them all and confirms the underlying fixes have actually landed in commits 1–15. Nothing new is *added* here; it is a closing audit + revert pass.
  - **Pre-work checklist** (run before opening the PR):
    1. `git log <epic-base>..HEAD --pretty=format:'%h %s' | grep -iE 'skip|disable|override|temporary|defer'` — surface anything tagged as temporary in commit messages.
    2. `rg -n 'eslint-disable|@ts-expect-error|@ts-ignore' src/` — diff against the same query at the epic base; anything new is a candidate.
    3. `rg -n 'test\.skip|test\.fixme|describe\.skip|xit\(|xdescribe\(' e2e/ src/` — every match added during the epic must come back to life.
    4. Diff `eslint.config.ts` against the epic base; any new `files:` override block tagged "field-graph", "migration", or "scripts/migration-data-prep" must be re-evaluated.
    5. Check `package.json` (Husky / lint-staged sections) for any rule that was loosened mid-epic.
    6. Read the **Migration-era suppressions** section near the top of this doc — it should match the diff from steps 1–5. If they disagree, the doc has drifted and needs reconciling first.
  - **Files touched:** purely deletions / reverts. No new product code.
  - **DoD:**
    - `npm run integration-precheck` green with **zero** skipped tests added by this epic.
    - The "Migration-era suppressions" section below is empty (or contains only items explicitly deferred to a follow-up issue, with link).
    - Grep queries from steps 2–3 return the same set of pre-existing matches that existed at the epic base — no net new suppressions.
  - **Dependencies:** commits 1–15. This is the last code commit before manual verification.
  - **Out of scope:** any product fix. If a skipped test still fails after the relevant earlier commit shipped, file a follow-up issue and document it under "Migration-era suppressions" rather than patching here.
  - **Status:** `TODO` · **PR/SHA:** —

### Phase 4 — Manual verification (not a code commit)

- [ ] **Full-flow manual verification**
  - Reset Chrome localStorage to a snapshot of prod V2 data.
  - Refresh → gate fires → download backup → run migration → verify success.
  - Check every analytics page: Coverage, Tier Stats, Tier Trends, Source Analysis, Field Analytics, Deaths Analytics, Cell Analytics, Coin Analytics, Activity Heatmap.
  - Import V28 samples (farming, tournament, each dissonance sub-type) via single-entry and bulk-import.
  - Verify section-config renders every field correctly.
  - Bulk export → re-import → round-trip equivalence.
  - **Only after this passes**: bump package version, draft release notes, push to main.

## Notes & Findings (filled in during implementation)

Use the `Notes-and-findings.md` doc with your findings to capture cross-commit learnings, scope adjustments, or deferred work. Each entry: date + commit number + note.

- [YYYY-MM-DD] [commit N] — ...
