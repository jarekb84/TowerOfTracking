# Field Graph Architecture — Table of Contents

This is the working spec for the Field Graph implementation, derived from the monolithic [`../field-registry-exploration/07-relationship-graph.md`](../field-registry-exploration/07-relationship-graph.md) (kept as historical reference). Each section of the original spec is split into its own file so changes during implementation happen in focused, reviewable chunks.

**If you are an AI agent working on a Field Graph implementation commit**, load only the sections referenced by your commit's spec pointers in [`../EPIC-migration.md`](../EPIC-migration.md). Do not read the full spec cover-to-cover unless asked. Always keep [`../field-graph-for-ai.md`](../field-graph-for-ai.md) in context as standing contributor guidance.

## Sections

| # | Section | Summary |
|---|---|---|
| [01](./01-abstract-and-motivation.md) | Abstract & motivation | Relationships (not fields) are what drift. Promoting relationships to typed edges in a graph lets queries replace hand-maintained arrays, and gives migration/rename history a single substrate. |
| [02](./02-how-it-works.md) | How it works | Five node kinds (Field, Section, Category, View, Schema) and thirteen edge kinds form a labeled property graph in plain TypeScript, indexed once at load and queried via a small synchronous API. |
| [03a](./03a-adding-a-new-v29-field.md) | Adding a new V29 field | One node declaration plus a handful of edges is sufficient to introduce a new field; every consumer (breakdown chart, source analysis, run-details, color palette) picks it up automatically. |
| [03b](./03b-renaming-a-field-v28-to-v29.md) | Renaming a field (V28 → V29) | A rename is a node-id change plus one `RENAMED_FROM` edge carrying the legacy key; the reverse index handles multi-hop renames transitively. |
| [03c](./03c-adding-a-new-ui-view.md) | Adding a new UI view | Declaring a View node with `APPEARS_IN_VIEW` edges makes the view queryable from both directions — the component asks what to render, and `graph.viewsThatUse(field)` grows automatically. |
| [03d](./03d-discoverability-where-is-coins-goldentower-used.md) | Discoverability — "where is `coins_goldenTower` used?" | `graph.describe(field)` returns every attribute, relationship, and view membership in one call, replacing the grep-seven-files workflow with a deterministic query. |
| [03e](./03e-silent-break-modes.md) | Silent-break modes | Structural invariants on the graph (every field has a section, every coin belongs to the coin-total) convert silent miscategorizations into loud CI failures. |
| [03f](./03f-file-tree-impact.md) | File tree impact | `src/shared/domain/field-graph/` holds nodes, edges, builder, query API, and invariants; legacy arrays become derived wrappers during migration, then delete. |
| [03g](./03g-concrete-code-samples.md) | Concrete code samples | Full TypeScript of the Edge discriminated union, helper constructors, a real 40-edge slice, the FieldGraph query class, and before/after consumer refactors, plus a Mermaid visualizer. |
| [03h](./03h-pros-cons-honest-critique.md) | Pros, cons, honest critique | Pros (cohesion, discoverability, rename safety, structural invariants) and cons (learning curve, edge proliferation, runtime cost, risk of reinventing a graph DB) weighed against the app's scale. |
| [03i](./03i-when-this-wins-loses.md) | When this wins / loses | Wins when relationships dominate change and discoverability is the top pain; loses when fields are flat, teams are small, or algorithmic derivation covers 80% at 10% of the cost. |
| [04](./04-combinations.md) | Combinations | The graph composes with algorithmic derivation (derive easy display names, edge-declare exceptions), trait/tag systems (tags are flat edges), and invariant tests (structural assertions replace pairwise file-consistency tests). |
| [05](./05-migration-plan.md) | Migration plan | Nine sequential steps starting with one edge type, one consumer refactor, and expanding outward; each PR is revertible and partial migration is a valid end state. |
| [08](./08-clarifying-the-mental-model.md) | Clarifying the mental model | In-memory JSON shapes for nodes and edges, a taxonomy table of kinds, build-time validation of dangling references, and the cardinality table that governs multi-declaration behavior. |
| [09](./09-cross-cutting-concerns.md) | Cross-cutting concerns | Eight concrete concerns — aggregation impact, cross-version lifecycle, debuggability, new-capability workflow, runtime type mismatches, specific-field references, branch-fresh vs in-place, and runtime discoverability CLI/UI. |
| [10](./10-pattern-enforcing-test-library.md) | Pattern-enforcing test library | Twelve invariant assertions cover schema correctness, structural health, migration safety, and domain rules — five-to-fifteen queries replace hundreds of pairwise file-consistency tests. |
| [11](./11-internal-app-fields.md) | Internal app-fields — how the graph handles them | The five underscore-prefixed internal fields (`_date`, `_time`, `_notes`, `_runType`, `_rank`) fit the existing graph via a tag plus `IS_INTERNAL_FIELD` edge, with `EnumValue` nodes and `ACCEPTS_VALUE` edges capturing enum expressiveness. |
| [12](./12-extending-with-a-new-run-type-and-sub-category.md) | Extending with a new run type + sub-category (dissonance) | Adding V28 dissonance runs plus the four sub-categories touches ~10 files of data declarations in the graph world vs ~25-35 files of scattered logic in the status quo. |
| [13](./13-commit-pr-strategy-recommendation.md) | Commit / PR strategy recommendation (for THIS approach) | A single hybrid big-bang PR with 15 internal atomic commits, followed by a one-week-soak legacy-cleanup PR, is the right strategy because the graph's value is cohesion and its bulk is self-similar data. |
| [14](./14-key-lookup-and-renames.md) | Key lookup and renames — the conceptual model | One node per field; legacy keys live as payload on outgoing `RENAMED_FROM` edges, not as separate nodes; `resolveFieldByAnyKey` accepts legacy keys only at the parser boundary while `getField` is the canonical-only hot path. |
| [15](./15-multi-section-membership.md) | Multi-section membership — confirming cardinality | `BELONGS_TO_SECTION` has cardinality `many`; a `RENDERS_AS_IN_SECTION` edge gives per-section display overrides (label, color, hideIfZero) without polluting the membership declaration. |
| [16](./16-testing-philosophy.md) | Testing philosophy — system not configuration | Edge files are pure configuration with zero per-entry tests; two-to-three invariant tests per edge type (~30 total) plus graph-engine unit tests cover the system regardless of entry count. |
| [17](./17-schema-as-a-first-class-graph-entity.md) | Schema as a first-class graph entity | Schemas are nodes carrying app/game-version metadata; `SHIPPED_IN_SCHEMA`, `INTENTIONALLY_DROPPED_IN_SCHEMA`, and `MIGRATED_TO_SCHEMA` edges plus `graph.migrationsBetween(a, b)` turn schema evolution into a queryable data diff. |
| [18](./18-write-path.md) | Write path — forms, updates, user edits | Validation, conditional visibility, and derivation cascades are all driven by graph edges; edit handlers become one-liners that delegate to `applyUpdate` and `autoClearNewlyInvalidFields`. |
| [19](./19-logic-as-data-and-ai-usability-guide.md) | "Logic as data" — mental model and AI-usability guide | The paradigm flips authorship from features declaring fields to fields declaring their own feature memberships; includes a full draft of `field-graph-for-ai.md` and a debugging playbook for AI agents. |

## Cold-start reading order

If you are a contributor new to the project and want to understand the whole design, read these in order:

1. [01. Abstract & motivation](./01-abstract-and-motivation.md) — why relationships-as-edges at all.
2. [02. How it works](./02-how-it-works.md) — node kinds, edge kinds, query API at a glance.
3. [08. Clarifying the mental model](./08-clarifying-the-mental-model.md) — literal in-memory shapes and build-time validation.
4. [14. Key lookup and renames](./14-key-lookup-and-renames.md) — the load-bearing one-node-per-identity rule and the parser-boundary/canonical-state split.
5. [17. Schema as a first-class graph entity](./17-schema-as-a-first-class-graph-entity.md) — how schema evolution becomes a data diff.
6. [19. "Logic as data"](./19-logic-as-data-and-ai-usability-guide.md) — the paradigm shift and the companion AI guide.

After those six you have enough to navigate everything else in the order the commits require.

## By-task cross-reference

| Task | Read |
|---|---|
| Adding a new field | [01](./01-abstract-and-motivation.md), [03a](./03a-adding-a-new-v29-field.md), [08](./08-clarifying-the-mental-model.md), [14](./14-key-lookup-and-renames.md) |
| Renaming a field | [03b](./03b-renaming-a-field-v28-to-v29.md), [14](./14-key-lookup-and-renames.md), [17](./17-schema-as-a-first-class-graph-entity.md) |
| Adding a new chart / view | [03c](./03c-adding-a-new-ui-view.md), [09](./09-cross-cutting-concerns.md) (9.4) |
| Adding a new run-type or enum value | [11](./11-internal-app-fields.md), [12](./12-extending-with-a-new-run-type-and-sub-category.md), [18](./18-write-path.md) (18.2–18.3) |
| Bumping the storage schema (v3 → v4) | [14](./14-key-lookup-and-renames.md), [17](./17-schema-as-a-first-class-graph-entity.md) |
| Debugging a missing value | [03d](./03d-discoverability-where-is-coins-goldentower-used.md), [03e](./03e-silent-break-modes.md), [09](./09-cross-cutting-concerns.md) (9.3), [19](./19-logic-as-data-and-ai-usability-guide.md) (19.4) |
| Adding invariant tests for a new edge type | [10](./10-pattern-enforcing-test-library.md), [16](./16-testing-philosophy.md) |
| Planning the PR sequence | [05](./05-migration-plan.md), [13](./13-commit-pr-strategy-recommendation.md) |
