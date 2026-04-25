# Exploration: FieldGraph engine API shape — how should query methods scale?

> **Date:** 2026-04-25
> **Branch:** `204-v28-migration-safety`
> **Author:** prep doc for human review (commit 5b)
> **Status:** awaiting human decision — see "Human decision" section below
>
> **Recommendation summary (30-second read):**
> - **Adopt Option A — per-edge query modules — with Style 2
>   (singleton-bound) consumer ergonomics.** Each edge concept ships its
>   declarations + queries + tests as a co-located group. `FieldGraph`
>   reduces to a stable primitives layer (`edgesFrom`, `edgesTo`,
>   `edgesOfType`, `nodesOfKind`, `terminalOf`, `toId`, `getField`,
>   `resolveFieldByAnyKey`) — ~8 methods, never grows after this commit.
>   Consumers call queries directly: `csvHeaderOf(_DATE_NODE)` —
>   strictly fewer characters than today's `appGraph().csvHeaderOf(...)`.
> - **Singleton has no temporal-coupling cost.** `appGraph()` is already
>   lazy: first call hydrates + caches; all subsequent calls (whether
>   directly or via wrapped queries) reuse the cached instance. Each
>   query function calls `appGraph()` internally; no consumer needs to
>   "set up the graph" before calling queries.
> - **Tests do NOT need to mock the singleton.** The recommended testing
>   stance is integration-style: build (or use) the production graph,
>   call the query, assert on outcomes. We test the *mechanism* (the
>   query correctly walks edges) and let catalog-invariant tests cover
>   the *data* (every internal field has a CSV header). The two-shape
>   testing model: `*.queries.test.ts` for behavior; `*.invariants.test.ts`
>   for catalog shape. No `setAppGraphForTesting` needed for routine
>   query tests; reserve it for "what happens when a NEW edge value gets
>   added" scenarios.
> - **Directory shape locked: `catalog/edges/<concept>/`.** Nodes stay
>   flat at `catalog/` root (6 `*.nodes.ts` files, slow growth). Each
>   edge concept gets its own subdirectory holding declarations,
>   queries, and tests as a co-located unit. Suffix convention preserved
>   inside the folders (`internal-fields/internal-fields.edges.ts`) for
>   `**/*.queries.ts`-style grep discoverability. Cross-concept edges
>   (`HAS_DISPLAY_NAME`, `HAS_COLOR`) go under purpose-named folders
>   like `edges/presentation/`. See `code-organization-naming` agent
>   recommendation in §6 below.
> - **AI discoverability: a maintained query index in
>   `field-graph-for-ai.md` is the cold-start answer.** A compact
>   table — query name, return type, "use when…" — lives in the
>   standing context every AI agent reads. Estimated 50-80 lines at
>   commit-15 steady state. Future CLI tooling (`graph:list-queries`,
>   `graph:describe-edge`) extends discoverability for runtime
>   inspection but is post-epic. Glob patterns (`**/*.queries.ts`,
>   `**/*.edges.ts`) answer "what exists?" mechanically without the
>   index.
> - **Defer implementation to commit 5d.** Per the epic DoD's explicit
>   deferral option. Commit 5b ships the ADR + `Node.tags` removal.
>   Commit 5d (proposed) implements: directory restructure, 14 method
>   moves, 3 consumer migrations, the `field-graph-for-ai.md` query
>   index, and updates to the contributor guide.
> - **Ruled out (per human review 2026-04-25):** Option B (sub-API
>   namespaces) — engine class still grows + cross-concern naming
>   bikeshedding. Option C (plugin/registry) — neither TypeScript nor
>   AI cold-start gains anything. Hybrid honorable-mention — two
>   redundant access patterns is one too many.
>
> Cross-links:
> - **EPIC:** [`EPIC-migration.md`](./EPIC-migration.md) — commit 5b is
>   the active commit; this doc is its primary deliverable. Commit 6+
>   gates on the human decision recorded below.
> - **Standing context:** [`field-graph-for-ai.md`](./field-graph-for-ai.md) —
>   read first if you don't have the field-graph mental model loaded.
> - **Companions:**
>   - [`EXPLORATION-node-identity-abc-deep-dive.md`](./EXPLORATION-node-identity-abc-deep-dive.md) —
>     locked the named `*_NODE` exports + polymorphic `FieldRef` API in
>     commit 4. This doc builds on those conventions.
>   - [`EXPLORATION-tag-vs-edge.md`](./EXPLORATION-tag-vs-edge.md) — the
>     other half of commit 5b (already-decided: `Node.tags` is removed).
>   - Spec [`architecture/02-how-it-works.md`](./architecture/02-how-it-works.md)
>     and [`08-clarifying-the-mental-model.md`](./architecture/08-clarifying-the-mental-model.md)
>     describe the engine's mental model; nothing in the spec prescribes
>     the consumer-facing API shape.

---

## Human decision

**Decided 2026-04-25 by Jarek (project owner):**

Adopt Option A (per-edge query modules) with Style 2 (singleton-bound consumer ergonomics) and the per-concept directory layout (`catalog/edges/<concept>/`). Land the entire refactor — engine slim-down, query modules, directory restructure, consumer migration, and `field-graph-for-ai.md` cold-start query index — inside commit 5b itself. No separate 5d commit.

**Reasoning (the human's words, captured for future revisits):**

> "I'm heavily leaning towards option A — the version which does a singleton-bound — because I don't want to have consumers reach out to the graph directly. I like the signature better of you're just calling the query or passing what you want and internally handle stuff. … For testing maybe in tests you don't mock that out, maybe in the tests you want to verify the outcome and they become more integration tests, which I think I like better because for these graph queries like load up the hydrated graph and then run the query against it. … I like the encapsulation of option A. … We've got an approach now. Did exploration. We have a good and better idea of the problem. Let's do all the refactoring and updates."

In other words: consumers should not have to reach into the graph singleton; queries should read like ordinary domain functions. Engine encapsulation matters; engine API growth does not. Tests of queries should run against the production graph (or a small fixture) and verify outcomes — they should not assert on graph wiring or mock the singleton. The decision was made after reviewing the four-way option matrix; the model's recommendation (Option A + Style 2 + per-concept directories + maintained query index) was accepted.

**Where the decision deviates from the recommendation:**

- The recommendation deferred the refactor to a follow-up commit (5d). The human chose to land the entire scope in commit 5b — *"let's do all that in the scope of this commit."* This collapses the ADR, the API refactor, the directory restructure, the consumer migration, and the docs index into a single PR. Tradeoff accepted: bigger diff, but the architectural decision and its embodiment ship together.
- Discoverability future-work (CLI tooling) explicitly deferred — *"I think I'm going to leave discoverability for later."* The cold-start query index in `field-graph-for-ai.md` is the immediate answer; CLI tooling is post-epic.
- All other doc recommendations (testing approach, lazy-singleton non-coupling, barrel concern downgrade, directory shape) accepted as recommended.

**Scope of decision (which commits implement it):**

- **Commit 5b** absorbs everything: this ADR, `Node.tags` removal (see [`EXPLORATION-tag-vs-edge.md`](./EXPLORATION-tag-vs-edge.md)), engine slim-down to primitives, 5 new `catalog/edges/<concept>/` directories with declarations + queries + tests, top-level barrel with Style 2 wrappers, 3 production consumer migrations (csv-exporter, run-type-display, run-type-filter), 2 catalog-test migrations (fields.nodes.test, enum-sync invariant), and the cold-start query index in `field-graph-for-ai.md`.
- **Commits 6–14** declare each new edge concept under `catalog/edges/<concept>/` from the start, add bound wrappers to the barrel, and append rows to the cold-start query index. No new methods on `FieldGraph`.
- **No separate 5d commit needed.**

**Status:** Accepted; implemented in commit 5b.

**Future revisit triggers:**

- If a real consumer ever needs a query that crosses multiple edge concepts so cleanly that splitting the function across two `*.queries.ts` files feels wrong — re-evaluate whether a third "cross-concept" folder (like `presentation/`) is the right fix or whether the directory shape needs adjustment.
- If `FieldGraph` grows new query methods despite this ADR — the convention has drifted. A code-org review pass should catch this; if it slips through, this doc gets re-opened.
- If discoverability via the manually-maintained query index becomes a real friction point (drift between table and code, AI agents picking the wrong query because the table's "use when" wording is stale) — the deferred CLI tooling becomes load-bearing rather than nice-to-have.

---

## Update — refinements from human review (2026-04-25)

The initial recommendation went out as Option A + Style 2. The project owner reviewed and accepted the direction but raised five concrete open questions. This section captures the answers integrated into the recommendation above; the body of the doc (sections 1–7 below) is the original deliberation that produced the recommendation and is preserved for context.

### A. "How does testing work under Style 2 if queries hit a singleton?"

The owner's instinct: don't mock the singleton. Run integration-style tests that build (or use) the real graph and assert on outcomes. Verify the *mechanism* (the query function correctly walks edges) and let catalog-invariant tests cover the *data* (every declared internal field has a CSV header). This matches the owner's broader testing philosophy — *"don't test the flat file defining the nodes or the edges, that's just essentially data; verify the mechanism."*

**Adopted.** The two test shapes:

- `<concept>.queries.test.ts` — **behavior**: build a small fixture graph, call the query directly with the explicit `(graph, ...)` form, assert outcomes. Verifies the query mechanism. ~3–6 tests per query.
- `<concept>.invariants.test.ts` — **catalog shape**: assert that the production catalog satisfies certain shape constraints ("every underscore-prefixed field has IS_INTERNAL_FIELD edge", "every internal field has a CSV header"). These already exist today as `*.test.ts` files; they get a clearer name under the new convention.

The Style 2 (singleton-bound) wrapper is tested implicitly by the production-consumer paths — if `csvHeaderOf(_DATE_NODE)` returns `'_Date'` in the csv-export round-trip test, the wrapper works. No need for a dedicated wrapper-binding unit test.

**Implication for `setAppGraphForTesting`.** It stays available but becomes rarely-needed. The intended use case shrinks to "what happens when a new edge value gets added at runtime" scenarios — which today is exactly one test (`enum-sync.invariant.test.ts` and the like). Routine query tests don't need it.

### B. "Does the singleton introduce temporal coupling?"

Owner's worry: each query function calls `appGraph()` — does that mean we hydrate the graph on every call, or do we have to manually initialize it before any query runs?

**Neither.** `appGraph()` (today's implementation in `app-graph.ts`) is already lazy: the first call hydrates and caches; every subsequent call returns the cached instance. Wrapped queries inherit that behavior — `csvHeaderOf(_DATE_NODE)` triggers hydration on first invocation, returns instantly thereafter. No temporal-coupling burden on consumers.

**No change needed in commit 5d** for this. The wrappers are zero-cost on the singleton lifecycle.

### C. "Why are barrel imports a discoverability factor?"

Fair pushback. The original "barrel becomes a god object" concern in §6 was overstated. A barrel `index.ts` that re-exports ~30 thunks is mechanical and easy to scan; in fact, it's a *better* discoverability surface than a 400-line class because each entry is one line `export const X = (...)`. The barrel concern is downgraded to "make sure each entry has a one-line JSDoc summary" — comparable cost to maintaining a method's JSDoc.

The **real** discoverability concern is "an AI cold-walks into the codebase and needs to find which queries exist for a task" — addressed below in §D.

### D. "How does a cold-start AI find the right query?"

This is the load-bearing question. The owner's pragmatic framing: *"discoverability could be solved later on with [CLI tools]; maybe that's the answer."* Multi-pronged response, in order of immediacy:

1. **Index in `field-graph-for-ai.md` (immediate, manually maintained).** A compact table:

   ```markdown
   ## Available queries (cold-start index)

   | Query | Returns | Use when |
   |---|---|---|
   | `sourcesOf(field)` | string[] | "What fields sum into this total?" |
   | `csvHeaderOf(field)` | string \| undefined | "What custom CSV header for this field?" |
   | `acceptedValuesFor(field)` | string[] | "What enum values does this field accept?" |
   | … | | |
   ```

   Estimated ~30 entries by commit 15 → ~50–80 lines. Fits comfortably in the standing context every AI reads.

2. **Glob conventions (immediate, no maintenance).** An AI runs:
   - `glob('**/catalog/edges/**/*.queries.ts')` → enumerates every query file. ~12 hits at commit 15.
   - `glob('**/catalog/edges/**/*.edges.ts')` → enumerates every edge declaration.
   - The directory name carries the concept (`internal-fields/`, `presentation/`, `sources/`); the filename carries the kind (`.queries.ts`, `.edges.ts`).

3. **Function names are domain-named.** `sourcesOf` and `csvHeaderOf` and `acceptedValuesFor` tell you what they answer without context. Pattern-matching them against a task description ("which fields are sources of this total?") is mechanically straightforward.

4. **Future CLI tooling (post-epic).** `graph:list-queries`, `graph:describe-edge`, `graph:explain <fieldId>` — runtime introspection over the actual graph. The standing-context guide will eventually point at these. Out of scope for the migration epic.

**Adopted: layers 1–3 in commit 5d's scope.** The `field-graph-for-ai.md` query index is part of the 5d deliverable. The glob conventions and naming convention are the architectural defaults the directory shape locks in. CLI tooling stays out of scope.

### E. "What's the directory structure?"

Delegated to the `code-organization-naming` agent. Recommendation summary (full text in §6 below):

- **Nodes stay flat at `catalog/` root.** ~6 `*.nodes.ts` files, slow growth, suffix convention sufficient.
- **Edges move into `catalog/edges/<concept>/` subdirectories.** Each edge concept (internal-fields, enum-values, sections, sources, …) gets its own folder holding all related files (`<concept>.edges.ts`, `<concept>.queries.ts`, `<concept>.queries.test.ts`, `<concept>.invariants.test.ts`).
- **Suffix convention preserved inside folders.** Use `internal-fields/internal-fields.edges.ts`, NOT `internal-fields/edges.ts` — the redundant prefix is what makes `**/*.edges.ts` glob work as a discoverability primitive.
- **Cross-concept edges go in purpose-named folders.** `HAS_DISPLAY_NAME` and `HAS_COLOR` (declared on both Fields and EnumValues) live under `edges/presentation/`, not split between `edges/fields/` and `edges/enum-values/`.
- **`HAS_CSV_HEADER` rule of thumb: live with your source concept until 2+ source concepts use it.** Today HAS_CSV_HEADER is internal-fields-only, so it stays in `edges/internal-fields/`. If commit 7 adds it to game fields, promote it to `edges/csv-headers/` at that moment. Don't preemptively split.
- **Two-level aggregator:** `catalog/edges/index.ts` rolls up every concept folder; `catalog/index.ts` consumes that and adds the node aggregations.

Migration footprint at commit 5d: 2 file moves (`internal-fields.edges.ts` + `internal-fields.test.ts` → `edges/internal-fields/`; same for enum-values) + 1 new aggregator. No node files touched.

---

## 1. The question

After commits 4 and 5, `FieldGraph` carries 14 query methods:

| Domain | Methods | Source |
|---|---|---|
| Field lookup | `getField`, `resolveFieldByAnyKey` | commit 1 |
| Section | `fieldsInSection`, `sectionsOf` | commit 1 |
| Source | `sourcesOf` | commit 1 |
| Generic primitives | `edgesFrom`, `edgesTo`, `nodesOfKind`, `edgesOfType` | commit 1 |
| Enum value | `enumValuesOf`, `acceptedValuesFor`, `isAcceptedValue`, `matchAcceptedValue`, `enumValueMeta` | commit 4 |
| Field metadata | `displayNameOf`, `colorOf` | commit 4 |
| Internal field | `internalFields`, `isInternalField`, `csvHeaderOf` | commit 5 |

Plus a private `toId(FieldRef)` and a private `terminalOf(nodeId, type)`.

Phase 2 commits 6–14 will roughly **double** that surface:

| Commit | New methods (planned) |
|---|---|
| 6 — BELONGS_TO_SECTION + RENDERS_AS_IN_SECTION | `rendersAsIn` |
| 7 — IS_SOURCE_OF | (uses existing `sourcesOf`) |
| 8 — HAS_DATA_TYPE | `dataTypeOf` |
| 9 — IS_DERIVED_FROM | `fieldsDerivedFrom`, `derivationsOf`, `topologicallyOrderDerivations` (private) |
| 10 — RENAMED_FROM cutover | (uses existing `resolveFieldByAnyKey`) |
| 11 — Schema lifecycle | `currentSchema`, `schemaOf`, `fieldsShippedIn`, `fieldsDroppedIn` |
| 12 — APPEARS_IN_VIEW + APPEARS_IN_FILTER | `fieldsInView`, `fieldsInFilter`, `viewsOf`, `filtersOf` |
| 13 — CONDITIONAL_ON | `conditionalOn`, `conditionallyVisibleFields` |
| 14 — IS_REQUIRED_IN + PARTICIPATES_IN_COMPOSITE_KEY | `isRequiredIn`, `requiredFieldsIn`, `participatesInCompositeKey`, `compositeKeyFieldsFor` |

That's **~16 more** methods — landing at **~30 methods** on `FieldGraph` by commit 15. Each method is short (3–10 lines, mostly `edgesFromIdx.get(...).filter(...).map(...)` + `toId()` boilerplate), but they all live in one file, all need to be tested via the same engine-test scaffolding, and all answer questions that *belong to* a specific edge type whose declaration lives in a different file.

Two architectural concerns:

1. **The engine class becomes a god object.** Not a hard problem at 30 methods (Map / Array / Set in JS each have similar counts), but the per-method boilerplate gets copied 30 times instead of factoring through one well-named primitive.

2. **Locality is broken.** The "fact" that `_date` has a CSV header lives in `internal-fields.edges.ts`. The "method" that returns it lives in `field-graph.ts`. The "test" for that method lives in `field-graph.test.ts`. Three files for one feature. Compare with the catalog organization (one file per concern) — the engine surface drifts away from that organization.

This doc considers four shapes for the engine API plus a status-quo baseline.

## 2. Options

Each option is described in terms of: **shape** (what the catalog and engine look like), **consumer ergonomics** (what call sites read like), **test ergonomics**, **TypeScript story**, and **how it scales** as commits 6–14 add edge types.

### Option A — Per-edge query modules

**Shape.** Each `catalog/*.edges.ts` ships a sibling `catalog/*.queries.ts`. `FieldGraph` exposes a small primitive surface; domain queries live next to their declarations.

```
catalog/
  internal-fields.edges.ts      ← unchanged
  internal-fields.queries.ts    ← new: csvHeaderOf, internalFields, isInternalField
  internal-fields.test.ts       ← unchanged (catalog-level invariants)
  internal-fields.queries.test.ts ← new: query unit tests against a toy graph
  enum-values.edges.ts          ← unchanged
  enum-values.queries.ts        ← new: acceptedValuesFor, enumValueMeta, …
  …
```

`FieldGraph` keeps:

```ts
// Stable primitives — never grows after commit 5b.
class FieldGraph {
  edgesFrom(node: FieldRef, type?: EdgeType): readonly Edge[]
  edgesTo(node: FieldRef, type?: EdgeType): readonly Edge[]
  edgesOfType(type: EdgeType): readonly Edge[]
  nodesOfKind(kind: NodeKind): readonly Node[]
  terminalOf(node: FieldRef, type: EdgeType): string | undefined
  getField(id: string): Node | null
  resolveFieldByAnyKey(rawKey: string): Node | null
  toId(ref: FieldRef): string  // public so queries can use it
}
```

Each `*.queries.ts` looks like:

```ts
// catalog/internal-fields.queries.ts
import type { FieldGraph, FieldRef } from '../field-graph';

export function internalFields(graph: FieldGraph): readonly string[] {
  return graph.edgesOfType('IS_INTERNAL_FIELD').map((e) => e.from);
}

export function isInternalField(graph: FieldGraph, field: FieldRef): boolean {
  return graph.edgesFrom(field, 'IS_INTERNAL_FIELD').length > 0;
}

export function csvHeaderOf(graph: FieldGraph, field: FieldRef): string | undefined {
  return graph.terminalOf(field, 'HAS_CSV_HEADER');
}
```

**Consumer ergonomics.** Two viable styles; recommend **Style 2** (singleton-bound):

```ts
// Style 1 (explicit graph):
import { csvHeaderOf } from '@/shared/domain/field-graph/catalog/internal-fields.queries';
import { appGraph } from '@/shared/domain/field-graph';
const header = csvHeaderOf(appGraph(), _DATE_NODE);

// Style 2 (singleton-bound — RECOMMENDED for app code):
import { csvHeaderOf } from '@/shared/domain/field-graph';
const header = csvHeaderOf(_DATE_NODE);  // wraps appGraph() internally
```

The barrel re-exports thin wrappers that bind to `appGraph()`:

```ts
// shared/domain/field-graph/index.ts
import { appGraph } from './app-graph';
import * as internalQueries from './catalog/internal-fields.queries';
export const csvHeaderOf = (f: FieldRef) => internalQueries.csvHeaderOf(appGraph(), f);
export const internalFields = () => internalQueries.internalFields(appGraph());
export const isInternalField = (f: FieldRef) => internalQueries.isInternalField(appGraph(), f);
// …same for every queries module
```

Tests use Style 1 with a hand-built graph (no singleton dependency); production code uses Style 2.

**Test ergonomics.** Each `*.queries.ts` ships a `*.queries.test.ts` next to it, building a tiny toy graph and asserting the function's behavior. Engine tests in `field-graph.test.ts` shrink to just primitives + invariants. The `enum-sync.invariant.test.ts` and `internal-fields.test.ts` catalog-level tests stay where they are (different layer — they assert the production catalog satisfies certain shape constraints).

**TypeScript story.** Each query is a regular exported function. IDE autocomplete works perfectly. The IDE can find references in the standard way. Renaming `csvHeaderOf` propagates through TS-aware tools.

**Scaling.** Each new edge type = 1 new `*.queries.ts` + 1 new `*.queries.test.ts`. Existing files don't change. The engine class doesn't change.

**Tradeoffs.**
- (++) **Co-location** matches the catalog's organization (per-edge file).
- (++) **Engine surface stops growing.** ~6 methods forever after this commit.
- (+) **Consumer ergonomics IMPROVE** under Style 2 (`csvHeaderOf(_DATE_NODE)` < `appGraph().csvHeaderOf(_DATE_NODE)`).
- (+) **Tests modular** — each queries file owns its tests.
- (–) **Two import styles** (Style 1 explicit, Style 2 bound) introduce a subtle "which one do I use here?" decision. Mitigation: rule of thumb in `field-graph-for-ai.md` — production code uses Style 2; tests use Style 1.
- (–) **More files.** ~12 new `*.queries.ts` files by commit 15. Mitigation: the *codebase* is shorter overall (engine class shrinks by ~250 lines; new files average 30 lines each).
- (–) **Discovery via the barrel.** A consumer trying to find every available query has to scan the barrel re-exports rather than scrolling one class. Mitigation: the IDE's outline view of the barrel file replaces the engine-class outline view.

---

### Option B — Sub-API namespaces on `FieldGraph`

**Shape.** One class, multiple namespaced sub-objects assembled in the constructor.

```ts
class FieldGraph {
  readonly enums: EnumQueries;
  readonly internal: InternalFieldQueries;
  readonly sections: SectionQueries;
  readonly sources: SourceQueries;
  // …

  constructor(nodes, edges) {
    // …existing indexing…
    this.enums = new EnumQueries(this);
    this.internal = new InternalFieldQueries(this);
    // …
  }

  // Stable primitives stay on the root.
  edgesFrom(...) {…}
  // …
}

class InternalFieldQueries {
  constructor(private g: FieldGraph) {}
  fields(): readonly string[] { … }
  is(field: FieldRef): boolean { … }
  csvHeaderOf(field: FieldRef): string | undefined { … }
}
```

**Consumer ergonomics.**

```ts
appGraph().internal.csvHeaderOf(_DATE_NODE);
appGraph().enums.acceptedValuesFor(_RUN_TYPE_NODE);
appGraph().sources.of(BATTLE_REPORT__COINS_EARNED_NODE);
```

**Test ergonomics.** Each `*Queries` class can ship its own test file, but it must be tested *through a `FieldGraph`* — there's a mandatory wiring step.

**TypeScript story.** Excellent. The IDE autocompletes `graph.` with the namespace list, then `.internal.` with the methods. Discoverability is the best of any option.

**Scaling.** Each new edge type either adds methods to an existing namespace or introduces a new namespace. Slow constructor growth (one new field assignment per namespace).

**Tradeoffs.**
- (++) **Discoverability via autocomplete.** `graph.` shows ~10 namespaces; each is a manageable size.
- (+) **One singleton, one access pattern.** No "do I import the function or call the method?" ambiguity.
- (–) **Namespace ambiguity for cross-concern methods.** Where does `csvHeaderOf` live? `graph.internal.csvHeaderOf` (it's about internal fields)? `graph.csv.headerOf` (it's about CSV)? `graph.fields.csvHeaderOf` (it's about fields)? Every cross-cutting query reopens this debate. Per-edge co-location (Option A) sidesteps it — the query lives where its edge is declared.
- (–) **Constructor wiring per namespace.** Adds 1 line per namespace to the constructor. Trivial cost but a non-zero coupling between every namespace and the engine.
- (–) **Plumbing per query class.** Each `*Queries` class needs a `private g: FieldGraph` field and a constructor. Boilerplate to mock for tests.
- (=) **Engine class still grows** as new namespaces get attached, just more slowly than option D.

---

### Option C — Plugin / registry

**Shape.** Each edge file calls `registerQueryMethods({...})` at module load; `FieldGraph` indexes them.

```ts
// catalog/internal-fields.edges.ts
import { registerQueryMethods } from '../query-registry';
registerQueryMethods({
  internalFields: (graph) => graph.edgesOfType('IS_INTERNAL_FIELD').map(…),
  csvHeaderOf: (graph, field) => graph.terminalOf(field, 'HAS_CSV_HEADER'),
});

// consumer:
appGraph().query('csvHeaderOf', _DATE_NODE);
// or with a typed wrapper:
appGraph().queries.csvHeaderOf(_DATE_NODE);
```

**Consumer ergonomics.** Either stringly-typed (lose autocomplete) or requires a typed-augmentation pattern (TypeScript module augmentation, hard to teach).

**Test ergonomics.** Tests have to either set up the registry manually or rely on the production registration order. Both fragile.

**TypeScript story.** Bad. Module augmentation works but is invisible to readers and breaks IDE jump-to-definition for the augmenters.

**Scaling.** Mechanically the easiest — drop a file in. But the dynamic surface degrades the team's ability to reason about "what does this graph do?" by reading the type.

**Tradeoffs.**
- (++) **Zero coupling between the engine and any specific edge type.**
- (–––) **TypeScript story is bad.** Either lose autocomplete or use module augmentation that's invisible to readers.
- (–) **Registration order matters.** Production builds happen to register everything; ad-hoc tests might miss imports and silently lose queries.
- (–) **Hard to discover.** "Where is `csvHeaderOf` defined?" requires knowing the registration pattern.

**Verdict.** Hard pass. Loses the compile-time-discovery property the team values (cf. node-identity ADR's emphasis on named exports + IDE refactor-safety).

---

### Option D — Status quo + lint cap

**Shape.** Keep the flat method-per-consumer surface. Add a lint rule capping the method count at, say, 30. When the cap trips, the ADR re-opens.

**Consumer ergonomics.** Unchanged. `appGraph().csvHeaderOf(_DATE_NODE)`.

**Test ergonomics.** Unchanged.

**TypeScript story.** Unchanged.

**Scaling.** Linear. By commit 15 we have ~30 methods on one class. Adding a method is a 5-minute edit + a unit test. Easy to do, easy to review.

**Tradeoffs.**
- (++) **Zero refactor cost.**
- (+) **One mental model.** "It's a method on the graph." Every contributor already gets it.
- (–) **Boilerplate duplication.** Every method copies the `toId(ref)` + `edgesFromIdx.get(...).filter(...).map(...)` pattern.
- (–) **One file owns 30+ unrelated concerns.** Touch this file for any edge change.
- (–) **Engine tests grow linearly.** `field-graph.test.ts` is already 430 lines; will be 800+ by commit 15.
- (=) **Not actually a god-object problem at 30 methods.** Many JS/TS standard classes have more. The discomfort is more about *coupling* (one file owns everything) than *count*.

---

### Honorable mention — hybrid (A + class instance) — RULED OUT

What if `FieldGraph` *also* exposes the queries as bound methods, with the queries co-located with their edge files? E.g. each `*.queries.ts` exports both the function and a method-installer that the engine constructor calls. Result: consumers could write `graph.csvHeaderOf(_DATE_NODE)` (current style) OR import the function (new style). Best of both worlds — but TypeScript can't infer the dynamically-attached methods without `interface FieldGraph` declaration merging, which is invisible to readers.

**Verdict.** Pass. Confirmed by human review: *"the honorable mention I'm not too keen on, I'm gonna pass on that."* Two redundant access patterns is one too many.

---

## 3. Trade-off matrix

Scored 1–5 (5 = best). Not weighted.

| Criterion | A: per-edge modules | B: namespaces | C: plugin | D: status quo |
|---|---|---|---|---|
| Engine surface stability across commits 6–14 | **5** | 3 | 5 | 1 |
| Consumer ergonomics (call-site length, mental model) | 4 | 4 | 2 | 4 |
| TypeScript discoverability / autocomplete | 4 | **5** | 1 | 4 |
| Test isolation (per-feature test file) | **5** | 3 | 2 | 1 |
| Co-location with `*.edges.ts` declarations | **5** | 2 | 4 | 1 |
| Boilerplate reduction (DRY on `toId` + index walks) | 4 | 4 | 4 | 1 |
| Refactor cost from today | 2 | 2 | 1 | **5** |
| Bikeshedding risk for cross-cutting queries | **5** | 1 | 4 | 4 |
| Avoidance of "AI slop" (one-place-for-this-concern) | **5** | 3 | 2 | 2 |
| Composability with future commits 11–14 | **5** | 4 | 5 | 2 |
| **Total** | **44** | 31 | 30 | 25 |

Option A wins on every dimension that the team has explicitly prioritized in CLAUDE.md (refactor safety, co-location with concerns, "each change should leave the codebase in a better state, not create one-off patterns") *except* refactor cost from today. Option D's only real strength is "doing nothing is free" — and that strength is exactly what every "kicked the can" outcome looks like at the moment we're trying to avoid it.

## 4. Recommendation

**Adopt Option A.** Concretely:

1. **Establish the `*.queries.ts` convention.** A single `catalog/internal-fields.queries.ts` lands in the follow-up commit (5d) demonstrating the shape. The other 11 query files follow as commits 6–14 land their respective edges.

2. **Shrink `FieldGraph` to its primitives.** After commit 5d, the engine has:
   - Node lookup: `getField`, `resolveFieldByAnyKey`
   - Edge lookup: `edgesFrom`, `edgesTo`, `edgesOfType`
   - Node enumeration: `nodesOfKind`
   - Polymorphic helpers: `toId(ref)` (now public), `terminalOf(node, type)` (now public)
   - Build-time invariants in the constructor (unchanged)

3. **Move the existing 14 query methods into `*.queries.ts` modules.** Mapping:
   - `acceptedValuesFor`, `isAcceptedValue`, `matchAcceptedValue`, `enumValueMeta`, `enumValuesOf`, `displayNameOf` (when called on enum-value nodes), `colorOf` (when called on enum-value nodes) → `catalog/enum-values.queries.ts`.
   - `displayNameOf` / `colorOf` (when called on field nodes — currently shared) → `catalog/field-presentation.queries.ts` (new; will absorb HAS_DISPLAY_NAME / HAS_COLOR for field-side use as commits 6+ land them).
   - `sourcesOf` → `catalog/sources.queries.ts` (new).
   - `fieldsInSection`, `sectionsOf` → `catalog/sections.queries.ts` (new).
   - `internalFields`, `isInternalField`, `csvHeaderOf` → `catalog/internal-fields.queries.ts` (new).

4. **Add a top-level barrel re-export for the bound (Style 2) form.** `shared/domain/field-graph/index.ts` re-exports each query as a singleton-bound thunk. App code imports from the barrel; engine-tests import the underlying function from the queries file.

5. **Migrate the 3 production consumers.**
   - `csv-exporter.ts`: `appGraph().internalFields()` → `internalFields()`. `graph.csvHeaderOf(field)` → `csvHeaderOf(field)`.
   - `run-type-display.ts`: `appGraph().enumValueMeta(_RUN_TYPE_NODE, runType)?.color` → `enumValueMeta(_RUN_TYPE_NODE, runType)?.color`.
   - `run-type-filter.ts`: same as above for `displayName`.

6. **Update `field-graph-for-ai.md`** with the new convention:
   > **Adding a query method.** Find the `catalog/*.edges.ts` whose edge
   > the query reads. Add an exported function to its sibling
   > `*.queries.ts` (create the file if it doesn't exist). Add a
   > singleton-bound re-export to the barrel `index.ts`. Co-locate
   > tests in `*.queries.test.ts`. Do NOT add new methods to
   > `FieldGraph`; the engine is closed for new query methods.

7. **Defer steps 2–6 to commit 5d** — the implementing commit. This ADR commit (5b) lands only:
   - The doc itself
   - The `Node.tags` removal (separately decided)

   Keeping the ADR commit small lets the human review and approve the shape on paper before we churn 14 method bodies and 3 consumer files. Once the human confirms, 5d is mechanical.

### What we accept by taking this trade

- **Two import styles.** Production code uses the bound form
  (`csvHeaderOf(_DATE_NODE)` from the barrel). Tests use the explicit
  form (`csvHeaderOf(graph, _DATE_NODE)` from the queries file). The
  rule is one-line; new contributors can grok it from the barrel
  comment.
- **One more file per edge concept.** The catalog directory grows from
  ~10 files today to ~22 by commit 15. Manageable; each new file is
  short (~30 LOC including imports + per-function 5-line bodies).
- **Engine class loses its method roster as a discoverability surface.**
  "What can I ask the graph?" stops being "scroll the engine class"
  and starts being "scroll the barrel." Comparable cognitive load;
  different file. The engine class becomes a primitives layer that
  rarely changes.
- **Refactor cost in commit 5d.** Estimated ~3 hours: move 14 method
  bodies, write the barrel, migrate 3 consumers, move existing tests
  to per-file `*.queries.test.ts`. Each step is a near-mechanical
  rename + relocate. The risk is a skipped consumer; the
  `appGraph()\.\w+\(` grep makes that exhaustive.

## 5. Impact on adjacent commits

### Commit 5b (this one) — minimal diff

- This ADR doc.
- `Node.tags` removal (separate; see [`EXPLORATION-tag-vs-edge.md`](./EXPLORATION-tag-vs-edge.md)).
- No engine code changes; no consumer migration.

### Commit 5c (HAS_CSV_EXTRACTOR)

If the human picks Option A: `csvExtractorOf` lands as a function in
`catalog/internal-fields.queries.ts` (or its own `csv-extractors.queries.ts`),
not as a method on `FieldGraph`. The csv-exporter loop reads it via the
bound form. The HAS_CSV_EXTRACTOR edge type goes into `EdgeType` /
`EDGE_META` as today.

If the human picks Option D: `csvExtractorOf` lands as a method on
`FieldGraph` per the engine-method-per-consumer rule. No structural
change.

### Commit 5d (proposed — refactor existing methods + directory restructure)

The follow-up commit that implements steps 2–6 from §4 plus the
directory shape from §6 (per the `code-organization-naming` agent
recommendation). New entry to add to the epic when the human's decision
lands. Proposed scope:

- **Directory restructure:** create `catalog/edges/` with per-concept subdirectories. Move existing files:
  - `catalog/internal-fields.edges.ts` → `catalog/edges/internal-fields/internal-fields.edges.ts`.
  - `catalog/internal-fields.test.ts` → `catalog/edges/internal-fields/internal-fields.invariants.test.ts`.
  - `catalog/enum-values.edges.ts` → `catalog/edges/enum-values/enum-values.edges.ts`.
  - `catalog/enum-values.test.ts` → `catalog/edges/enum-values/enum-values.invariants.test.ts`.
  - `*.nodes.ts` files stay at `catalog/` root — unchanged.
- **Files added:**
  - `catalog/edges/index.ts` (rolls up every concept's `*_EDGES` and re-exports queries).
  - `catalog/edges/internal-fields/internal-fields.queries.ts` + `.queries.test.ts`.
  - `catalog/edges/enum-values/enum-values.queries.ts` + `.queries.test.ts`.
  - `catalog/edges/sections/sections.queries.ts` + `.queries.test.ts` (covers `fieldsInSection`, `sectionsOf`).
  - `catalog/edges/sources/sources.queries.ts` + `.queries.test.ts` (covers `sourcesOf`).
  - `catalog/edges/presentation/presentation.queries.ts` + `.queries.test.ts` (covers `displayNameOf`, `colorOf` — cross-concept since both Field and EnumValue source it).
- **Files modified:**
  - `field-graph.ts` (delete moved methods; expose `toId` / `terminalOf` as public; engine drops to ~150 lines).
  - `index.ts` (add Style 2 singleton-bound re-exports — one thunk per query).
  - `field-graph.test.ts` (delete moved tests; leave primitives + invariants + symmetric-edge tests).
  - `csv-exporter.ts`, `run-type-display.ts`, `run-type-filter.ts` (Style 2 consumer migration: `appGraph().X(...)` → `X(...)`).
  - `field-graph-for-ai.md` (new convention block + the cold-start query index per §1.5/D above + worked example for "adding a new query").
  - `catalog/index.ts` (consume `catalog/edges/index.ts` aggregation).
- **DoD:**
  - `npm run integration-precheck` green.
  - Engine class is < 250 lines.
  - All 14 originally-on-the-engine queries reachable via the Style 2 barrel.
  - 3 production consumers compile without changes to call-site shape (just imports).
  - `field-graph-for-ai.md` query index lists every available query (~17 entries at end-of-5d state, growing to ~30 by commit 15).
  - `glob('src/shared/domain/field-graph/catalog/edges/**/*.queries.ts')` returns 5 hits at end-of-5d (one per concept).

### Commits 6+

Each commit declares its edge file AND its sibling queries file in the
same vertical slice. Cutover requirement (per epic preamble §5)
applies to both: every consumer of the legacy mechanism migrates to
the new query function in the same commit.

If the human picks Option D: each commit adds methods to `FieldGraph`
per the engine-method-per-consumer rule (current shape).

If the human picks Option B: each commit either adds methods to an
existing namespace or introduces a new namespace; the Cutover
requirement still drives the migration.

Either way, the trajectory concern (≥30 methods by commit 15) is
addressed: A and B both bend the curve; D explicitly accepts it; C is
rejected.

### Commit 16 (suppressions sweep)

If A is picked, no impact (the refactor in 5d landed cleanly).
If D is picked, this commit could optionally re-evaluate now that the
final method count is known (at ~30, it's still defensible to leave
alone).

## 6. Anticipated objections

### "Style 2 (singleton-bound) hides the graph dependency."

The argument: `csvHeaderOf(_DATE_NODE)` doesn't make it obvious that a
graph is being consulted. A future debugger can't easily trace which
graph was used.

The counter: today's `appGraph().csvHeaderOf(_DATE_NODE)` makes the
*singleton lookup* explicit but the *graph dependency* implicit (the
caller never sees the indexing, the invariant validation, the build
process). The bound form preserves the meaningful information ("ask
the field graph for the CSV header for this field") and elides the
singleton-access ceremony. Tests can still inject a custom graph via
`setAppGraphForTesting`; production code never wants the
non-singleton form.

### "More files is harder to navigate."

The argument: 22 files in `catalog/` is twice as many as 11 files.

The counter: `catalog/` is already grouped by concern (per-kind nodes
files, per-edge edges files, per-edge tests). The new `*.queries.ts`
files slot into the same naming pattern. IDE file-search by name
(e.g. `Ctrl-P "csv"`) finds them faster than scrolling a 600-line
engine class.

### "The barrel becomes a god object."

The argument: instead of one big class, we get one big barrel file.

The counter: the barrel is mechanical — each entry is two lines (one
import, one bound re-export). Adding a query is mechanical. Reading
the barrel tells you "here's every public query" in compact form. The
class form intermixes implementation with surface; the barrel
separates them.

### "Why not just keep going (Option D) and revisit if it actually hurts?"

The argument: 30 methods isn't a real god-object. Wait until pain.

The counter: this is a defensible position. The reason to act now:
every commit between now and commit 15 *adds* to the engine class
under D. Refactoring at commit 15 is bigger (refactoring 30 methods
+ 30 consumers) than refactoring at commit 5d (14 methods + 3
consumers). The cost-of-delay is monotonic. If D is chosen, the
follow-up trigger should be explicit: "if engine method count
exceeds X, re-open this ADR."

### "Spec doesn't prescribe an API shape."

Correct. The architecture spec is silent on the consumer surface for
the engine. This doc is filling a gap, not contradicting an existing
decision.

## 7. Open questions (deferred)

These don't block the recommendation; flagging for the human's
attention.

- **Should `displayNameOf` / `colorOf` live in two places (one for fields, one for enum values)?** Currently they're polymorphic on `FieldRef`. Under Option A, the natural split is per-edge (HAS_DISPLAY_NAME and HAS_COLOR are declared once per source kind), but consumers don't care about the source kind. Maybe one `field-presentation.queries.ts` covering both is cleaner. Defer to commit 5d.

- **Should `toId(ref: FieldRef)` and `terminalOf(node, type)` become public engine methods or live as exported helpers in a `query-helpers.ts`?** Both are needed by every queries file. Either form works; the public-on-engine form is the smaller diff. Defer to 5d.

- **Should the engine class also expose `isAppGraphSingleton()` or similar to help debugging?** Nice-to-have; not required.

- **When does the barrel become big enough to split?** If the barrel grows to ~50 entries by commit 15, consider grouping the bound re-exports into per-domain modules (`field-graph/queries-internal.ts`, `field-graph/queries-enums.ts`, …) re-exported from the index. Defer until the count justifies it.

---

## Appendix A: a 30-second worked diff for Option A

Production code today:

```ts
// csv-exporter.ts
import { appGraph } from '@/shared/domain/field-graph';
const graph = appGraph();
const internalFieldOrder = graph.internalFields();
// …
originalKey: graph.csvHeaderOf(fieldName) ?? fieldName,
```

After commit 5d (Option A, Style 2):

```ts
// csv-exporter.ts
import { internalFields, csvHeaderOf } from '@/shared/domain/field-graph';
const internalFieldOrder = internalFields();
// …
originalKey: csvHeaderOf(fieldName) ?? fieldName,
```

Net change: one fewer line; one fewer named local; same call ergonomics
sans the singleton ceremony.

Engine class today (excerpt):

```ts
class FieldGraph {
  // …14 query methods, each ~5 lines…
  internalFields(): readonly string[] {
    return (this.edgesByType.get('IS_INTERNAL_FIELD') ?? []).map((e) => e.from);
  }
  isInternalField(field: FieldRef): boolean { … }
  csvHeaderOf(field: FieldRef): string | undefined { … }
  // …
}
```

After commit 5d:

```ts
// field-graph.ts — primitives only
class FieldGraph {
  edgesFrom(node: FieldRef, type?: EdgeType): readonly Edge[] { … }
  edgesTo(node: FieldRef, type?: EdgeType): readonly Edge[] { … }
  edgesOfType(type: EdgeType): readonly Edge[] { … }
  nodesOfKind(kind: NodeKind): readonly Node[] { … }
  toId(ref: FieldRef): string { … }
  terminalOf(node: FieldRef, type: EdgeType): string | undefined { … }
  getField(id: string): Node | null { … }
  resolveFieldByAnyKey(rawKey: string): Node | null { … }
  // …invariant validation in constructor unchanged…
}

// catalog/internal-fields.queries.ts — new
export function internalFields(graph: FieldGraph): readonly string[] {
  return graph.edgesOfType('IS_INTERNAL_FIELD').map((e) => e.from);
}
export function isInternalField(graph: FieldGraph, field: FieldRef): boolean {
  return graph.edgesFrom(field, 'IS_INTERNAL_FIELD').length > 0;
}
export function csvHeaderOf(graph: FieldGraph, field: FieldRef): string | undefined {
  return graph.terminalOf(field, 'HAS_CSV_HEADER');
}

// shared/domain/field-graph/index.ts — barrel addition
import { appGraph } from './app-graph';
import * as internalQ from './catalog/internal-fields.queries';
export const internalFields = () => internalQ.internalFields(appGraph());
export const isInternalField = (f: FieldRef) => internalQ.isInternalField(appGraph(), f);
export const csvHeaderOf = (f: FieldRef) => internalQ.csvHeaderOf(appGraph(), f);
```

Net: engine class drops from ~400 lines to ~150; new catalog files
average ~20–40 lines each; barrel grows by ~3 lines per query.

## Appendix B: where each existing engine method lands under Option A

| Method | Lives in (after 5d) | Notes |
|---|---|---|
| `getField` | `field-graph.ts` (primitive) | Parser-boundary; stays string-only. |
| `resolveFieldByAnyKey` | `field-graph.ts` (primitive) | Parser-boundary; stays string-only. |
| `edgesFrom`, `edgesTo` | `field-graph.ts` (primitive) | Public for queries to use. |
| `edgesOfType` | `field-graph.ts` (primitive) | Public for queries to use. |
| `nodesOfKind` | `field-graph.ts` (primitive) | Public for queries + invariant tests. |
| `toId(ref)` | `field-graph.ts` (primitive, becomes public) | Used by every query file. |
| `terminalOf(node, type)` | `field-graph.ts` (primitive, becomes public) | Used by every terminal-edge query. |
| `sourcesOf` | `catalog/sources.queries.ts` (new) | Reads IS_SOURCE_OF. |
| `fieldsInSection` | `catalog/sections.queries.ts` (new) | Reads BELONGS_TO_SECTION. |
| `sectionsOf` | `catalog/sections.queries.ts` (new) | Reads BELONGS_TO_SECTION (other end). |
| `enumValuesOf` | `catalog/enum-values.queries.ts` (new) | Reads ACCEPTS_VALUE. |
| `acceptedValuesFor` | `catalog/enum-values.queries.ts` (new) | Reads ACCEPTS_VALUE + HAS_STRING_VALUE. |
| `isAcceptedValue` | `catalog/enum-values.queries.ts` (new) | Predicate over `acceptedValuesFor`. |
| `matchAcceptedValue` | `catalog/enum-values.queries.ts` (new) | Predicate-and-return over `acceptedValuesFor`. |
| `enumValueMeta` | `catalog/enum-values.queries.ts` (new) | Reads HAS_DISPLAY_NAME + HAS_COLOR + HAS_STRING_VALUE. |
| `displayNameOf` | `catalog/field-presentation.queries.ts` (new) | Polymorphic on Field/EnumValue source. |
| `colorOf` | `catalog/field-presentation.queries.ts` (new) | Polymorphic on Field/EnumValue source. |
| `internalFields` | `catalog/internal-fields.queries.ts` (new) | Reads IS_INTERNAL_FIELD. |
| `isInternalField` | `catalog/internal-fields.queries.ts` (new) | Predicate over edges. |
| `csvHeaderOf` | `catalog/internal-fields.queries.ts` (new) | Reads HAS_CSV_HEADER. (Could move to a future `csv.queries.ts` when commit 5c's HAS_CSV_EXTRACTOR adds enough mass.) |

Total: 14 methods → 5 new query files (avg 2.8 methods/file); engine
keeps 8 primitives.
