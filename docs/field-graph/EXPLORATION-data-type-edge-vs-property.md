# Exploration: Data type as edge or node property?

> **Date:** 2026-04-25
> **Branch:** `204-v28-migration-safety`
> **Author:** prep doc for human review (commit 8 vertical slice)
> **Status:** Accepted 2026-04-25 by Jarek — implementing in commit 8. See `## Human decision` below.
>
> **Recommendation summary (30-second read):**
> - **Adopt Option A — every Field declares an edge, no defaulting.** All
>   ~150 fields get an explicit edge entry; absence is a build-time
>   invariant violation, not a "fall back to `'number'`" signal.
> - **Rename the edge from `HAS_DATA_TYPE` to `IS_OF_TYPE`** (see §2.5).
>   The `HAS_X` shape implies "may or may not have X" (matching
>   `HAS_CSV_HEADER`, which is genuinely an override). For data type the
>   compile-time invariant is universal — every declared Field IS of some
>   type — so a declarative verb fits the semantic and removes the bipartite
>   "has/doesn't have" framing. Reversible: one entry in the `EdgeType`
>   union plus a grep-and-replace.
> - **The differentiating arguments for an edge over a node property are
>   refactor-safety, build-time invariant enforcement, and conformance with
>   the declarative-only `Node` shape established in
>   `EXPLORATION-node-identity-abc-deep-dive.md`.** Earlier drafts also
>   leaned on cross-cutting query ergonomics; in honest re-examination at
>   ~150 fields that argument doesn't differentiate the options (every
>   consumer that cares about types still filters by type after enumerating
>   fields, regardless of where the value lives). Dropped from the lead.
> - **Reject Option B (override-only edge with `'number'` default).**
>   `HAS_CSV_HEADER` is override-only because the alternative is auto-derived
>   from a deterministic rule (`v3_<canonical>` prefix). The data type has
>   no such rule — `'number'` is just the most common value, not a derived
>   default. Encoding "absent means number" is the same parallel-default
>   problem the `field-utils.ts` heuristics already cause: a fact that
>   matters for behavior, hidden by absence.
> - **Reject Option C (promote `dataType` to `Node.payload` / a typed Node
>   field).** A typed `Node.dataType` (C.2) actually gives *better*
>   exhaustiveness narrowing in switches than the edge-plus-type-guard
>   path — that earlier "loses TypeScript narrowing" con was wrong and is
>   corrected in §2.3. The real cost is shape: today every `Node` is
>   `{ id, kind, payload? }` uniformly; C either widens that to include an
>   optional `dataType` that's `undefined` for most kinds (Section, View,
>   Schema, Category, EnumValue), or splits `Node` into discriminated
>   per-kind variants (a much bigger refactor flagged as deferred work in
>   `EXPLORATION-node-identity-abc-deep-dive.md`). Conformance with the
>   declarative-only Node shape is the principled cost.
> - **Reject Option D (hybrid).** Two parallel surfaces is one too many —
>   same lesson as commit 5's tag+edge duplication.
> - **Land in commit 8.** All ~150 game fields get their `IS_OF_TYPE` edge
>   declared in the same vertical slice that cuts over `getFieldConfig` in
>   [`field-utils.ts`](../../src/features/analysis/shared/parsing/field-utils.ts).
>   The cardinality stays `'one'`; an `'at-least-one'` invariant lands once
>   every Field is declared.
> - **Two-world model for unknown fields (see §2.6).** The graph's
>   "every Field has an `IS_OF_TYPE` edge" invariant is *catalog-time* and
>   *catalog-scoped*. At runtime, a brand-new game-patch field arrives as a
>   passthrough (`unrecognizedField_*`) — it's never a Field node in the
>   graph, so it has no edge. The parser's default-to-`'number'` behavior
>   lives at that runtime boundary only, not in the graph.
> - **Surface the broader litmus test.** A four-question checklist
>   (relates-to-another-node? drives behavior? absence is a bug?
>   refactor-safety required?) reproducibly produces "edge" for every
>   structural fact in the catalog and produces "payload" only for the
>   currently-empty set of node-local debug metadata. Codify in
>   `field-graph-for-ai.md` so future commits don't re-litigate.
> - **Propose a new catalog-level `PATTERN.md` (see §6).** The existing
>   `catalog/edges/PATTERN.md` is per-concept-edge-folder scoped. A higher
>   doc — "what is a node, what is an edge, the litmus, the
>   `Node.payload` carve-out" — would seat the litmus and the broader
>   doctrine where contributors actually land. Outline only in this doc;
>   commission as a follow-up if the human agrees.
>
> Cross-links:
> - **Prior ADRs:**
>   - [`EXPLORATION-tag-vs-edge.md`](./EXPLORATION-tag-vs-edge.md) — the
>     "edges over tags" decision; this doc generalizes its principle to
>     "edges over node properties." Read its `## Human decision` section
>     first.
>   - [`EXPLORATION-engine-api-shape.md`](./EXPLORATION-engine-api-shape.md) —
>     locked the per-concept query-module pattern. `dataTypeOf` already lives
>     under that pattern; this doc decides what edges feed it.
>   - [`EXPLORATION-node-identity-abc-deep-dive.md`](./EXPLORATION-node-identity-abc-deep-dive.md) —
>     established named `*_NODE` exports and `Node` shape conventions. Any
>     change to `Node` shape (Option C) rubs against this ADR's "compile-
>     time `readonly` only; nothing else" stance.
> - **Standing context:** [`field-graph-for-ai.md`](./field-graph-for-ai.md) —
>   read first if the field-graph mental model isn't loaded.
> - **EPIC:** [`EPIC-migration.md`](./EPIC-migration.md) — commit 8 owns the
>   game-fields rollout of the data-type edge (rename from `HAS_DATA_TYPE`
>   to `IS_OF_TYPE` lands in the same commit per §2.5). Commit 9 owns
>   derivation cascade, which depends on the data-type taxonomy this doc
>   helps shape.
> - **Notes-and-findings:** the `[commit 5b]` and `[commit 5c]` entries on
>   the engine-API ADR + extractor pattern are the immediate precedent.

---

## Human decision

**Decided 2026-04-25 by Jarek:**

Adopt Option A — every declared Field gets an `IS_OF_TYPE` edge (renamed from `HAS_DATA_TYPE`). Land in commit 8 alongside the parser cutover. Commission a new catalog-level `PATTERN.md` in the same commit so the four-question litmus and the node-vs-edge doctrine have a home contributors can find.

**Reasoning (the human's words, captured for future revisits):**

> "I do agree, enforcing every field has a data type is true and I want that. However, during runtime there's gonna be cases where you're importing a new field and we're just not familiar with it... so the runtime-unknown case is its own thing, but at compile time everything has a data type — versus the `has data type` framing, which suggests there's two worlds. I think the current edge name doesn't really make sense."
>
> "I don't see the equivalence of tags to a data type, because tags is an unbounded list of values... while data type is gonna be a single value, and every field node is gonna have one."
>
> "I'm fine with keeping this as an edge, given the litmus test. I do have some starting-to-bubble reservations... not reservations, but something feeling off about the loss of TypeSafety via TypeScript. I'm interested to see if this actually works out — because at work I have this constant problem with how a piece of data is used, transformed between five views and three layers and two repositories... is this massive refactor we're doing actually worthwhile? So I'm fine with taking this experiment."
>
> "Whatever the outcome of this current discussion is should probably represent a new pattern doc and maybe extensions to other pattern docs."

The human accepted the edge-over-property framing on the strength of the litmus test (§3.3) — particularly the build-time-invariant argument. The TypeScript-vs-graph trade-off was acknowledged as a real concern but parked as a revisit trigger after commit 16, not a blocker for this decision.

**Where the decision deviates from the recommendation:**

- **Catalog-level `PATTERN.md` lands in commit 8, not deferred.** The doc proposed deferring (§6.1's recommendation) to a follow-up commit so the pattern could be derived from a fully cut-over example. The human chose to commission it now: the doctrine has been re-litigated three times across commits 5b / 5c / 8 already, and codifying it before the next vertical slice (commit 6 onward) prevents a fourth round.
- Otherwise accepted as recommended.

**Scope of decision (which commits implement it):**

- **Commit 8 (this commit)** — declare `IS_OF_TYPE` for all ~150 Fields; rename the edge type; cut over `getFieldConfig` + `createInternalField` in `field-utils.ts` to be graph-driven; delete `EXACT_FIELD_CONFIGS` + `PATTERN_FIELD_CONFIGS` pattern-matching; flip `EDGE_META.IS_OF_TYPE.cardinality` to `'at-least-one'`; add invariant test "every Field has exactly one IS_OF_TYPE edge"; rename `data-types/` directory contents to align (file naming + symbol exports); write the new catalog-level `PATTERN.md`; update `field-graph-for-ai.md` with the four-question litmus + cross-link to the new PATTERN.
- **Commit 9 (already updated)** — the csv-exporter's transitional `withPopulatedAppFields` preprocessor (added in this commit's vertical slice) gets deleted once the derivation cascade ensures `_date` / `_time` / `_runType` are populated at parse time. Commit 9's "Cutover requirement" line should call this out.
- **Commit 16 (suppression sweep)** — verify the litmus is being applied (no new node properties / payload entries snuck in across commits 9–14). Update revisit-trigger answer if applicable.

**Status:** Accepted; implemented in commit 8 (the commit currently in flight under what was originally branded as 5c then 5c → 8). The catalog-level `PATTERN.md` lands as part of the same commit per the deviation note above.

**Future revisit triggers:**

- **After commit 16 lands**: audit whether the graph metadata system has demonstrably reduced bugs / made changes easier — or whether it's added ceremony without proportional payoff. The TypeScript-vs-graph trade-off (where TypeScript's role as "what shape is this entity" gets displaced by the graph) is the meta-question to evaluate. Specific signals: (a) did adding a new field in commits 6–15 take fewer file edits than it would have under the pre-graph approach? (b) did a bug surface that the graph would have caught structurally but TypeScript missed (or vice versa)? (c) did contributor onboarding take longer because the graph adds a new mental model on top of TypeScript?
- **If a fact about a field comes up that the litmus produces a different answer from the team's intuition for**: the litmus is wrong somewhere and needs refinement. Update §3.3 in the same PR that surfaces the disagreement.
- **If the catalog grows past ~500 fields** (e.g., game adds many more sections): re-evaluate the cross-cutting-query argument honestly — at that scale, edge-vs-property performance differences may start to matter and the §2.3 honest-re-examination may need updating.

---

## 1. Background — the bug that surfaced this

> **Note on edge naming**: this doc was originally drafted with the edge
> name `HAS_DATA_TYPE` (matching the existing `EdgeType` literal in
> [`types.ts`](../../src/shared/domain/field-graph/types.ts):44). §2.5
> recommends renaming to `IS_OF_TYPE`. Sections 1–2.4 below preserve the
> historical name in code samples that describe what's already in the
> codebase; the recommended rename applies prospectively to the commit-8
> rollout. Treat `HAS_DATA_TYPE` and `IS_OF_TYPE` as the same concept while
> reading; pick one when the rename lands.

Commit 8 is in flight. Its scope: declare a data-type edge for every Field
node and rewrite `getFieldConfig` in
[`field-utils.ts`](../../src/features/analysis/shared/parsing/field-utils.ts)
(lines 14–91) to query the graph instead of pattern-matching field labels.

The commit-8 author refactored
[`csv-exporter.ts`](../../src/features/data-export/csv-export/csv-exporter.ts)
to dispatch uniformly off `field.dataType` for both app fields and game
fields — eliminating the per-internal-field switch ladder commit 5c
already removed for *extractors*, and applying the same simplification to
*formatting*. The bulk-import E2E broke: `_runType` exported as `'0'`
instead of `'farm'`.

The mechanism, traced through:

1. `formatFieldValue` (csv-exporter line 260) returns `field.rawValue`
   when `field.dataType !== 'number'`, otherwise treats `field.value` as a
   `number` and runs the locale-formatting branch.
2. The bulk-import path constructs `_runType`'s `GameRunField` with a
   `dataType` derived from `getFieldConfig('_runtype')` —
   today's `EXACT_FIELD_CONFIGS` lookup at line 23 returns `{ type: 'string' }`
   for `'_runtype'` (the lowercased key). So `_runType` *should* be
   `'string'` and the `rawValue` branch should fire.
3. But somewhere along the import path the canonicalization replaces
   `_runtype` with `_runType` (preserving case) and the lookup misses on
   the camel-case key, defaulting to `'number'`. `field.value` is the
   string `'farm'`, `typeof !== 'number'` triggers the `?? 0` fallback,
   and the formatter returns `'0'`.

The proximate fix is a single-line normalization. The root cause is
deeper: **there is no single source of truth for a field's data type**.
Three sources today:

1. The hand-written `EXACT_FIELD_CONFIGS` + `PATTERN_FIELD_CONFIGS` tables
   in `field-utils.ts` (label-pattern-matching with a default of
   `'number'`).
2. `GameRunField.dataType` set inline at parse time
   ([`game-run.types.ts`](../../src/shared/types/game-run.types.ts) line
   48 — the field literal is `'number' | 'duration' | 'string' | 'date'`).
3. The graph's `HAS_DATA_TYPE` edge — declared today only for the five
   internal fields
   ([`data-types.edges.ts`](../../src/shared/domain/field-graph/catalog/edges/data-types/data-types.edges.ts)).

Three sources, three drift paths. The whole point of commit 8 is to
collapse them into one — the graph — and have the parser AND exporter
both query it. The narrow question for this doc: **what shape does
`HAS_DATA_TYPE` take on the graph side?**

## 2. The narrow question — `HAS_DATA_TYPE` shape

### 2.1 Options

**Option A — Edge per field (every field declared explicitly).**
Every Field node in the catalog gets one `HAS_DATA_TYPE` edge.
~140 of those edges read `'number'`; ~10 read `'duration' | 'date' | 'string'`.
Cardinality stays `'one'`. Once every Field is declared (commit 8 ships all
~150), an `'at-least-one'` invariant lands so a missing edge is a
build error, not a silent fallback.

```ts
// catalog/edges/data-types/data-types.edges.ts
export const DATA_TYPE_EDGES: readonly Edge[] = [
  // internal fields — already declared today
  dataTypeEdge(_DATE_NODE,                       'date'),
  dataTypeEdge(_TIME_NODE,                       'string'),
  dataTypeEdge(_NOTES_NODE,                      'string'),
  dataTypeEdge(_RUN_TYPE_NODE,                   'string'),
  dataTypeEdge(_RANK_NODE,                       'number'),
  // game fields — added in commit 8
  dataTypeEdge(BATTLE_REPORT__TIER_NODE,         'number'),
  dataTypeEdge(BATTLE_REPORT__WAVE_NODE,         'number'),
  dataTypeEdge(BATTLE_REPORT__BATTLE_DATE_NODE,  'date'),
  dataTypeEdge(BATTLE_REPORT__REAL_TIME_NODE,    'duration'),
  dataTypeEdge(BATTLE_REPORT__GAME_TIME_NODE,    'duration'),
  dataTypeEdge(BATTLE_REPORT__KILLED_BY_NODE,    'string'),
  dataTypeEdge(BATTLE_REPORT__COINS_EARNED_NODE, 'number'),
  // ...~145 more, ~140 of them 'number'
];
```

**Option B — Override-only edge (default `'number'` when absent).**
Mirror the `HAS_CSV_HEADER` precedent. Declare only the ~7–10 non-numeric
fields; absence means `'number'`. `dataTypeOf` returns `'number'` when no
edge exists.

```ts
// catalog/edges/data-types/data-types.edges.ts
export const DATA_TYPE_EDGES: readonly Edge[] = [
  // internal fields
  dataTypeEdge(_DATE_NODE,    'date'),
  dataTypeEdge(_TIME_NODE,    'string'),
  dataTypeEdge(_NOTES_NODE,   'string'),
  dataTypeEdge(_RUN_TYPE_NODE,'string'),
  // _RANK_NODE not declared — defaults to 'number'
  // game fields — only the ~5 non-numeric ones
  dataTypeEdge(BATTLE_REPORT__BATTLE_DATE_NODE, 'date'),
  dataTypeEdge(BATTLE_REPORT__REAL_TIME_NODE,   'duration'),
  dataTypeEdge(BATTLE_REPORT__GAME_TIME_NODE,   'duration'),
  dataTypeEdge(BATTLE_REPORT__KILLED_BY_NODE,   'string'),
  // ~140 numeric fields — undeclared
];
```

```ts
// catalog/edges/data-types/data-types.queries.ts
export function dataTypeOf(graph: FieldGraph, field: FieldRef): DataType {
  const value = graph.terminalOf(field, 'HAS_DATA_TYPE');
  return value !== undefined && isDataType(value) ? value : 'number';
  //                                                       ^^^^^^^^ default
}
```

**Option C — Promote `dataType` to a Node property.** Extend `Node`
(or, more narrowly, a per-kind shape) with an optional `dataType`. Edges
disappear; `dataTypeOf` reads the property.

Two sub-flavors:

- **C.1** — Loose: stash on `Node.payload`.
  ```ts
  export const COINS__GOLDEN_TOWER_NODE = fieldNode('coins_goldenTower', {
    payload: { dataType: 'number' },
  });
  ```
- **C.2** — Typed: extend the `Node` interface (or introduce a
  `FieldNode` discriminated variant) with a first-class `dataType`.
  ```ts
  export interface Node {
    readonly id: string;
    readonly kind: NodeKind;
    readonly dataType?: DataType;  // new — only meaningful when kind === 'Field'
    readonly payload?: Readonly<Record<string, unknown>>;
  }
  ```
  ```ts
  export const COINS__GOLDEN_TOWER_NODE = fieldNode('coins_goldenTower', {
    dataType: 'number',
  });
  ```

The narrow-question discussion treats C as one option and notes the
sub-flavor difference where it matters.

**Option D — Hybrid.** Every field declares `dataType` as a node
property AND the graph surfaces it via the edge query layer (which now
reads the property internally instead of the edge index). Effectively
"property on the node, edge-flavored query API on top." The intent:
preserve the per-concept query-module ergonomics while moving the
storage from edges to properties.

### 2.2 Per-option matrix

Scored 1–5 (5 = best). Not weighted; total in last row for orientation.

| Criterion | A: edge-per-field | B: override-only | C.2: typed Node prop | D: hybrid |
|---|---|---|---|---|
| **Single source of truth** (no defaults living elsewhere) | **5** | 2 | 5 | 4 |
| **Absence semantics are unambiguous** | **5** | 2 | 4 | 3 |
| **Refactor-safety** (rename, closed value set) | 4 | 4 | **5** | 4 |
| **Build-time invariant catches drift** | **5** | 3 | 3 | 3 |
| **Conformance with `tag-vs-edge` ADR principle** | **5** | 4 | 1 | 2 |
| **Conformance with per-concept query-module convention** | **5** | 5 | 2 | 4 |
| **Cross-cutting query ergonomics** ("every field where dataType is X") (~tied at 150 fields) | 4 | 3 | 4 | 4 |
| **AI cold-start discoverability** ("is data type modeled here?") | **5** | 3 | 2 | 2 |
| **Catalog file size / signal-to-noise** | 2 | **5** | 4 | 4 |
| **Future evolution** (new dataType variants, per-source-kind dataType) | 4 | 3 | 2 | 3 |
| **Migration cost from today** | 3 | 4 | 2 | 1 |
| **Total (orientation only)** | **47** | 38 | 34 | 34 |

A wins on the dimensions the standing ADRs prioritize — build-time
invariant enforcement, single source of truth, conformance with
declarative-only Node shape, refactor-safety. It loses on catalog file
size (~140 uniform `'number'` rows) and is roughly tied with C.2 on
the dimensions that earlier drafts over-claimed (cross-cutting query
ergonomics, refactor-safety on closed-set values). The design question
is whether ~140 lines of explicit-and-uniform declarations are worth
the build-time-invariant + Node-shape-conformance gains. The
recommendation says yes; sections 2.3 and 3 explain why. The matrix is
orientation only — don't add up the columns and pick the winner.

### 2.3 Per-option pros/cons

#### Option A — Edge per field

**Pros:**
- **(Lead differentiator) Build-time invariant catches drift.**
  `cardinality: 'one'` catches double-declarations today;
  `'at-least-one'` (added in commit 8 once every Field is declared)
  catches missing ones. Both fail loud at engine-build time. The
  comparable enforcement on a typed `Node.dataType` requires a separate
  parallel mechanism (per-kind required-property invariant) that doesn't
  exist in the engine yet. Edge cardinality reuses an enforcement
  primitive that already runs.
- **(Lead differentiator) Refactor-safety via named-export ids.** Each
  entry references `<NAME>_NODE.id`, so renaming a node propagates
  through every edge declaration that mentions it via the same IDE-rename
  mechanism that already covers every other edge file. The data-type
  literal is a member of a closed `as const` union (`DataType`), so
  typos there are caught by TS compile-time. Both halves of the
  declaration are refactor-safe by the same primitives the rest of the
  catalog uses.
- **(Lead differentiator) Conforms to the declarative-only `Node` shape.**
  `EXPLORATION-node-identity-abc-deep-dive.md` established that `Node` is
  `{ id, kind, payload? }` — uniform across all kinds, declarative only,
  with `payload` as the (currently empty) escape hatch for non-queried
  metadata. Storing data type as a typed property either widens that
  shape with a field that's optional/undefined for most kinds (Section,
  View, Schema, Category, EnumValue) or splits Node into per-kind
  discriminated variants (a much larger refactor that ADR flagged as
  deferred work). An edge keeps the Node shape declarative-only and
  defers that decision to when it's actually warranted.
- **Closes the bug structurally.** When every field has the data-type
  edge AND the build-time invariant requires it, the `_runType` failure
  mode is impossible: there's no path where a field's data type is
  "undeclared and defaulted to number." The runtime `dataTypeOf` cannot
  return undefined for any declared field.
- **Single source of truth, full stop.** Parser, exporter, formatter,
  aggregator, validator all read the same edge. No defaults living in
  consumer code. No "where does this default fall through?" debugging.
- **Cross-cutting queries are *expressible*, not *better*.** "Every
  field where dataType is `'date'`" is expressible against an edge as
  `edgesOfType('HAS_DATA_TYPE').filter(e => e.to === 'date').map(e =>
  e.from)`. **Honesty check:** at ~150 fields, every consumer that cares
  about types (field-analytics chart picker, coverage report,
  tier-stats aggregator) STILL has to filter by type after enumerating
  fields, regardless of where the value lives. A property-based
  representation reaches the same answer with
  `nodesOfKind('Field').filter(n => n.dataType === 'date')`. Same shape,
  same cost. This is not a differentiator and should not carry the
  argument; the matrix score in §2.2 row 7 was over-stated and should be
  read as a tie. Listed here for completeness, demoted from a lead pro.
- **AI discoverability via convention alone.** A future
  `graph:describe <field>` CLI tool returns `HAS_DATA_TYPE → number` for
  every field, no carve-outs to know about. An AI cold-walking the
  catalog sees "every field has a data type" rather than "some fields
  override their data type" — and the second framing is the one that
  produces the bug we're trying to fix.
- **Conforms to the `tag-vs-edge` ADR's framing.**
  [`EXPLORATION-tag-vs-edge.md`](./EXPLORATION-tag-vs-edge.md) §1: *"every
  fact a consumer queries should be an edge."* Data type is the
  most-queried fact about a field that exists. A is the principled call.
- **Conforms to the per-concept query-module pattern.** The directory
  shape locked by 5b
  ([`catalog/edges/<concept>/`](../../src/shared/domain/field-graph/catalog/edges/PATTERN.md))
  already houses `data-types/`. A keeps the data inside the same
  directory the queries live in.

**Cons:**
- **~140 redundant `'number'` entries.** The catalog file becomes ~150
  lines for one concept. Mitigation: the entries are uniform (same
  helper call, one symbol per line), they read top-to-bottom as a flat
  table, and the file is grouped under section comment-bars (matching
  the existing `fields.nodes.ts` layout) so navigation stays cheap.
- **Migration cost.** ~140 new edge declarations in commit 8. Each is
  one helper call. Mitigation: deterministic — copy the field-name
  enumeration from `fields.nodes.ts`, default everything to `'number'`,
  fix the ~10 non-numeric ones. Estimate: 30 minutes including the
  commit's own self-checks.
- **No reuse of the "default by convention" trick.** Other override-only
  edges (`HAS_CSV_HEADER`, `HAS_DISPLAY_NAME`) get away with sparse
  declarations because their consumer-side defaults are deterministic
  (CSV header is `v3_<canonical>`; display name is the camelCase
  identifier humanized). Data type has no deterministic default —
  `'number'` is the *modal* type, not the *derived* type. So the
  override-only pattern is not appropriate here in the first place. This
  con is more about "the precedent doesn't apply" than "Option A
  squanders it."

#### Option B — Override-only edge

**Pros:**
- **Smaller catalog file.** ~10 entries vs ~150. Easier to scan
  visually.
- **Mirrors `HAS_CSV_HEADER` precedent.** Same shape — declare only
  what overrides the default.

**Cons:**
- **The "default" is not derived; it's a guess.** `HAS_CSV_HEADER`'s
  default (`v3_<canonical>` header) is deterministic from the field id.
  `HAS_DATA_TYPE`'s default of `'number'` is a statistical claim about
  the catalog's current shape. If a future game version ships, say, 30
  new string fields, the modal type might shift, and the default
  becomes wrong for the majority. Worse, it would silently miscategorize
  the new fields as numeric until someone notices the bug — the
  failure mode the original `field-utils.ts` heuristic already exhibits
  and that commit 8 is trying to remove.
- **Recreates the `field-utils.ts` problem in a new file.** The whole
  point of replacing `getFieldConfig` is to stop having "fall through to
  number" as the dispatch fallback. B keeps that fallback alive — just
  in a different file. The bug from §1 happens because *this exact
  pattern* (default to number when no explicit declaration is found)
  silently mistypes a string field. Encoding the same default in the
  graph layer doesn't fix the bug class; it relocates it.
- **No build-time guarantee that every field has a data type.** The
  `at-least-one` cardinality invariant (which would catch a missing
  declaration) cannot be applied to an override-only edge — by
  definition many sources have zero of them. So drift is silent until a
  consumer observes wrong behavior at runtime.
- **AI / CLI discoverability is weaker.** A future `graph:describe
  <field>` tool's output for `coins_goldenTower` reads "no
  HAS_DATA_TYPE edge declared (defaults to 'number')." That's a
  carve-out the AI has to remember. The CLI either always prints the
  defaulted value (lying about what the catalog actually says) or
  always prints "no edge" (forcing the reader to know the default
  rule). Both are worse than A's "every field has a HAS_DATA_TYPE
  edge — read the catalog directly."
- **Doesn't conform to the `tag-vs-edge` ADR's framing.** The ADR
  argued against representations where "consumers query the fact
  through a default-when-missing convention." That's exactly what B is.

#### Option C — Promote `dataType` to a Node property

> **Note on the earlier "tags resurrection" framing:** an earlier draft
> compared a typed `Node.dataType` to the retired `Node.tags`. That
> analogy was unfair and is dropped. Tags were an unbounded multi-string
> array with no type discipline; a typed `Node.dataType` would be a
> single closed-enum value present on every Field. The principled
> objection from the `tag-vs-edge` ADR — "every behavior-driving fact is
> a structural contract" — applies as a *generalization*, not a one-to-
> one analogy. The real cons are about Node-shape conformance and
> build-time enforcement, below.

**Pros:**
- **Compile-time exhaustiveness on the value space.** A typed
  `Node.dataType?: DataType` (C.2) gives the IDE direct union narrowing
  in switch statements, which is genuinely nice for parser dispatch.
  Edge-based access via `dataTypeOf(graph, field): DataType | undefined`
  also gives narrowing at the consumer boundary, but adds a `isDataType`
  type-guard step at parse time because the edge stores a `string`. Net:
  C.2 has a small ergonomics edge for direct-on-node consumers; the gap
  vanishes once consumers go through `dataTypeOf`.
- **Smaller catalog file.** Data type sits inline at the node
  declaration; no separate edges file row per field.
- **Locality at the declaration site.** Reading `fields.nodes.ts` tells
  you the data type without cross-referencing.

**Cons:**
- **C.2 widens the `Node` shape, which is the principled cost.** Today
  every `Node` has shape `{ id, kind, payload? }` uniformly across all
  kinds. C.2 either adds an optional `dataType?: DataType` to that
  shape (where most Node kinds — Section, View, Schema, Category,
  EnumValue — never set it, so it's optional-undefined for the
  majority), or splits `Node` into per-kind discriminated variants
  (`FieldNode | SectionNode | …`), which is a much larger refactor that
  `EXPLORATION-node-identity-abc-deep-dive.md` explicitly flagged as
  deferred work, not load-bearing for any current commit. The human is
  already aware of the optional-on-Node case ("yeah, they will not
  have, unnecessarily, a data type, but every field node will, which is
  what I'm getting at") and is okay with it — so this is a real cost,
  not a blocker. Edge keeps the Node shape narrow today and leaves the
  per-kind-discriminated-variants door open for when it's actually
  warranted.
- **Routes around the per-concept query-module convention.** Per
  [`PATTERN.md`](../../src/shared/domain/field-graph/catalog/edges/PATTERN.md)
  every fact about a field lives under
  `catalog/edges/<concept>/`. A node-property data type lives at
  `catalog/fields.nodes.ts` and the query lives at
  `catalog/edges/data-types/data-types.queries.ts`, but the two are now
  in different directories — the convention is silently violated.
  Future contributors learning the pattern from `PATTERN.md` would
  reasonably ask "where do new structural facts go?" and either pick
  the wrong place or have to learn the carve-out.
- **Build-time invariants get split across two systems.** The current
  `cardinality: 'one'` / `'at-least-one'` invariants live in
  `EDGE_META` and run when the engine builds. A `Node.dataType`
  invariant ("every Field must declare one") needs a parallel
  mechanism — a per-kind required-property check that doesn't exist in
  the engine today. Plus the value-space check (`isDataType`) needs to
  live somewhere that gets called at build time, not just at consumer
  time. More moving pieces; same enforcement payoff as A's
  edge-cardinality invariant which already runs.
- **C.1 (payload stash) loses TypeScript narrowing.** `payload` is
  `Record<string, unknown>`, so consumers reading it would need a
  runtime cast. The compile-time-exhaustiveness pro disappears for the
  payload sub-flavor. C.1 is not the case being weighed seriously
  against A; C.2 is. (Earlier draft incorrectly listed "loses
  TypeScript narrowing" against the whole of C, which was wrong — only
  C.1 has that problem; C.2 actually gives *better* narrowing than the
  edge-plus-type-guard path. Corrected here.)
- **Future evolution gets harder.** If `'user-text'` arrives as a
  variant alongside `'string'`, A is one new tuple entry plus updating
  the relevant edge declarations. C.2 is a node-shape evolution
  (touches `Node` interface and every consumer that destructures Node
  shape). The blast radius is bigger.

#### Option D — Hybrid

**Pros:**
- Tries to combine A's query ergonomics with C's locality.

**Cons:**
- **Two parallel sources of truth on the same fact.** This is exactly
  the failure mode commit 5 surfaced (`tags: ['internal']` *and*
  `IS_INTERNAL_FIELD` edge declared the same fact in two places). The
  `tag-vs-edge` ADR closed that loop by removing one. D reopens it.
- **The query layer becomes a translation shim.** `dataTypeOf` reads
  the property; the rest of the engine indexes by edges. Now the engine
  has two indexing paths to keep consistent — node properties and
  edge indexes — for the same fact.
- **Worst of both worlds for migration cost.** Every field gets both a
  property AND an edge declaration at the catalog layer. Or the edge
  is auto-derived from the property at build time, in which case D is
  just C with extra steps.

### 2.4 Recommendation for the narrow question

**Adopt Option A — edge per field, no defaulting.** All ~150 game
fields declared in commit 8 alongside the existing five internal-field
entries. Cardinality `'one'` (already set); add an `'at-least-one'`
cardinality once every Field is declared. The edge gets renamed from
`HAS_DATA_TYPE` to `IS_OF_TYPE` in the same commit (see §2.5 for the
naming argument).

Concretely the diff in commit 8 (sketch — the per-commit-impact §4
captures the authoritative ordered list, including the §2.5 rename and
the §2.6 parser-boundary cleanup):

1. Extend
   [`data-types.edges.ts`](../../src/shared/domain/field-graph/catalog/edges/data-types/data-types.edges.ts)
   from 5 entries to ~150 — one `dataTypeEdge(FIELD_NODE, type)` call per
   `*_NODE` export in `fields.nodes.ts`.
2. Update
   [`data-types.invariants.test.ts`](../../src/shared/domain/field-graph/catalog/edges/data-types/data-types.invariants.test.ts)
   to assert "every Field has exactly one HAS_DATA_TYPE edge" (replacing
   the "internal-fields slice" carve-out it carries today).
3. Flip `EDGE_META.HAS_DATA_TYPE.cardinality` to `'at-least-one'` in
   [`types.ts`](../../src/shared/domain/field-graph/types.ts) (currently
   `'one'`) so a missing declaration is a build error.
4. Cut over `getFieldConfig` in
   [`field-utils.ts`](../../src/features/analysis/shared/parsing/field-utils.ts)
   to call `dataTypeOf(graph, field)` instead of label-pattern-matching.
   `EXACT_FIELD_CONFIGS` and `PATTERN_FIELD_CONFIGS` get deleted along
   with `getFieldConfig`'s pattern-matching branches.
5. Lift the inline union `'number' | 'duration' | 'string' | 'date'` in
   [`game-run.types.ts`](../../src/shared/types/game-run.types.ts)
   `GameRunField.dataType` to import from
   [`data-types.constants.ts`](../../src/shared/domain/field-graph/catalog/edges/data-types/data-types.constants.ts).
6. Audit the `csv-exporter.ts` formatting branch and the parser
   construction sites for any code path that constructs a `GameRunField`
   without setting `dataType` from the graph; route them through a
   shared `dataTypeOf` call so the bug from §1 cannot recur.

Net catalog growth: ~145 lines in `data-types.edges.ts`. No new edge
type. No engine API change. No new node-shape concept. Conforms to all
three prior ADRs.

### 2.5 Naming the edge — `HAS_DATA_TYPE` is wrong

The current edge name `HAS_DATA_TYPE` was inherited from when only the
five internal fields had it declared, and the rest of the system
"didn't yet have one." Once Option A lands, every declared Field IS of
some type — the `HAS_X` shape no longer fits.

The semantic problem with `HAS_X`:

- `HAS_X` carries an implicit "may or may not have X" connotation.
  `HAS_CSV_HEADER` genuinely uses this — most fields don't have a
  custom CSV header, only the five with `_<TitleCase>` overrides do
  (it's an override-only edge by design).
- `HAS_DATA_TYPE` after commit 8 is the opposite: every declared Field
  has one, by build-time invariant. Reading the edge name as
  "may-or-may-not-have" produces the wrong mental model — the same
  bipartite framing that makes Option B (override-only) tempting and
  Option A (universal) feel weird.

The compile-time vs runtime split is bipartite differently (see §2.6):

- **Compile time / catalog**: every declared Field MUST be of some type.
  No "has" question.
- **Runtime / passthrough**: a brand-new game-patch field has no Field
  node at all (it's an `unrecognizedField_*`). The parser handles it
  with a default. The graph never sees it.

So the absence of an edge in the catalog never represents "this field
has no data type" — it represents "this field is undeclared, full
stop." `HAS_DATA_TYPE` doesn't communicate that.

Candidates:

| Name             | Semantic                  | Pros                                                                                      | Cons                                                                                                       |
|------------------|---------------------------|-------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `HAS_DATA_TYPE`  | "may have a data type"    | No rename cost; matches existing `HAS_DISPLAY_NAME` / `HAS_COLOR` / `HAS_CSV_HEADER` shape. | Wrong mental model for a universal-by-invariant edge; the human flagged this explicitly.                   |
| `IS_OF_TYPE`     | "field IS of this type"   | Declarative; matches the universal-by-invariant semantic; reads naturally in the catalog (`IS_OF_TYPE 'number'`). | Slightly different rhythm from the existing `HAS_*` family — but `IS_INTERNAL_FIELD` is also `IS_*`, so the family already mixes. |
| `TYPED_AS`       | "field is typed as"       | Short.                                                                                    | Reads passive ("typed *by whom*?"); awkward in code (`edgesOfType('TYPED_AS')`).                            |
| `DECLARES_TYPE`  | "catalog declares the type" | Surfaces the catalog-declaration semantic explicitly.                                     | Long; "declares" double-counts what every catalog row already does.                                        |
| `OF_TYPE`        | "field of type"           | Shortest.                                                                                 | Loses the verb-phrase shape that the rest of `EdgeType` uses (every other entry is verb-led).              |

**Recommendation: `IS_OF_TYPE`.** It matches the universal-by-invariant
semantic the post-commit-8 world will have; it reads naturally at the
declaration site (`isOfTypeEdge(_RUN_TYPE_NODE, 'string')`); it
parallels `IS_INTERNAL_FIELD` and `IS_SOURCE_OF` which are already in
the `EdgeType` family; and it removes the bipartite "has / doesn't
have" reading that obscures the actual catalog/runtime split.

Mechanically: a one-entry edit in the `EdgeType` union in
[`types.ts`](../../src/shared/domain/field-graph/types.ts):44 + the
matching `EDGE_META` row + the `data-types/` directory rename to
`is-of-type/` (or keep the directory name as `data-types/` since that
describes the concept, not the edge — the per-concept directory
PATTERN.md actually argues for purpose-named folders, not edge-named
ones). Plus a grep-and-replace across the catalog file, the queries
file, and a handful of tests. Net change: ~30 lines, all mechanical.
Reversible if a future commit decides otherwise.

### 2.6 Runtime-unknown fields — explicit two-world treatment

The catalog-time invariant `'every declared Field is of some type'` is
universal *within the catalog*. At runtime the graph encounters two
classes of inbound field:

1. **Catalog Fields** — declared in `fields.nodes.ts` with a matching
   `IS_OF_TYPE` edge. Build-time `'at-least-one'` invariant catches a
   missing declaration.
2. **Uncategorized fields** — produced when a new game patch ships an
   unfamiliar key. The parser creates them as `unrecognizedField_*`
   passthroughs. They are NOT Field nodes in the graph (the graph only
   knows what the catalog declared). They never get an `IS_OF_TYPE`
   edge because they never get a node to hang one on.

**The default-to-`'number'` behavior for uncategorized inputs is a
parser-boundary concern, not a graph concern.** It belongs in the parser
(adjacent to where `unrecognizedField_*` keys are minted) and lives
exactly *one* place. The catalog has no defaults at all — every
declared Field is type-specified explicitly; absence of declaration
means absence of node, not absence of type.

Why this matters for the option choice: it removes Option B's last
remaining pro. The "we need a default for new game-patch fields"
argument is true — but the default lives at the parser boundary for
*undeclared inputs*, not at the catalog layer for *declared fields*.
Options A and B both need the parser-side default for passthroughs;
only Option A keeps the catalog itself free of "absent means number."

Implementation note: `getFieldConfig` after the cutover (step 4 of §2.4)
calls `dataTypeOf(graph, fieldId)` for catalog fields and falls through
to `'number'` only for the passthrough branch (where `getField(fieldId)`
returns `null`). One default, one place, well-commented.

## 3. The broader question — edge vs node property

The narrow question raised a sharper meta-question (per the prompt):
*"is that the litmus test for what should be an edge versus what should
be a property — if it applies to everything, it should be on a node?"*

Worth interrogating, because the same call recurs every commit.
`HAS_CSV_EXTRACTOR` (commit 5c), `IS_DERIVED_FROM` (commit 9), `IS_REQUIRED_IN`
(commit 14), `PARTICIPATES_IN_COMPOSITE_KEY` (commit 14) — each one
implicitly answers it. Codifying the litmus saves future
contributors from re-litigating.

### 3.1 What lived experience has told us so far

- **`tag-vs-edge` ADR (commit 5b).** The `tags` axis was retired
  precisely because "every fact a consumer queries should be an edge."
  The ADR carved out exactly one home for non-edge facts on a node:
  `Node.payload`, restricted to "node-local debug metadata that no
  consumer queries." That carve-out has ZERO members today. It exists
  as an escape hatch the codebase has not needed.
- **`HAS_CSV_HEADER` precedent (commit 5).** Override-only is
  legitimate when the absent case derives deterministically from a
  rule the consumer also knows (`v3_<canonical>` prefix). The
  precedent is narrow: it's not "use override-only when the absent
  case is the modal value"; it's "use override-only when the absent
  case is *derivable* without consulting any external state."
- **Engine-API ADR (commit 5b).** Per-concept query modules read
  `graph.edgesFrom`, `graph.edgesOfType`, `graph.terminalOf`,
  `graph.nodesOfKind`. The primitives are edge-shaped because edges
  are the universal indexing surface. Putting facts on nodes routes
  around this surface — they have to be queried by iterating
  `nodesOfKind('Field')`, which works but is the slower / ad-hoc path.
- **Commit 5c (`HAS_CSV_EXTRACTOR`).** The newest edge type, declared
  on five sources with terminal-string targets. Easily could have
  been a node property ("every internal field has an extractor name").
  Wasn't, because the team had just internalized the
  edge-as-default-shape framing in 5b.

### 3.2 Considerations and dimensions

The hypothesis from the prompt — "if it applies to everything, it should
be on a node" — has surface appeal but doesn't survive contact with the
ADRs. **Universality is the weakest signal**, not the strongest. Every
Field has BELONGS_TO_SECTION (universal); BELONGS_TO_SECTION is
indisputably an edge because it relates the Field to another node. Every
Field eventually has APPEARS_IN_VIEW, IS_REQUIRED_IN, HAS_DATA_TYPE,
etc. — all edges, all universal. The "node property" carve-out has to
hinge on something other than "applies to everything."

The dimensions that actually discriminate:

- **Queryability (the `tag-vs-edge` ADR's primary axis, recalibrated).**
  Is the fact consumed in any "find me every X where this fact is Y"
  query? If yes, edges are the natural store — but at our scale
  (~150 fields) the *performance* claim is a wash. Both
  `edgesOfType(...).filter(...)` and `nodesOfKind('Field').filter(...)`
  resolve in microseconds. The real win for edges on this axis is
  **uniformity of the indexed surface**: one consumer pattern
  (`edgesOfType('X').filter(e => e.to === Y)`) regardless of which fact
  X is. Properties require the consumer to know that *some* facts are
  on nodes (read via `nodesOfKind`) and *some* are on edges (read via
  `edgesOfType`). Tax falls on the contributor learning the catalog,
  not on runtime.
- **Cardinality.** 1..many naturally fits edges (each edge is a
  relationship). 0..1 fits both properties and edges, but properties
  more naturally encode "absence means default" while edges more
  naturally encode "absence is a build error." The cardinality
  enforcement primitives in the engine work on edges. **This is a real
  differentiator for `IS_OF_TYPE`** — `'at-least-one'` cardinality on
  an edge is enforced by the engine builder; the equivalent for a typed
  property requires a parallel per-kind required-property mechanism
  that doesn't exist yet.
- **Default semantics.** "Absent means the default" is awkward for
  edges (the default lives in consumer code, not the catalog) and
  natural for properties (`x?: T ?? defaultValue`). If a fact has a
  legitimate default — derivable from consumer-known rule, not just
  modal value — that's a signal toward override-only edge OR property,
  not toward exhaustive edge.
- **Closed-set value space.** Both representations get TypeScript
  narrowing. Properties win marginally on switch-exhaustiveness if you
  destructure (`const { dataType } = node` narrows directly), but
  query functions returning `DataType | undefined` give the same
  exhaustiveness at the consumer boundary. Marginal win for properties.
- **Relates-to-another-node.** This is the *only* dimension where
  edges are categorically required. If the fact relates the source to
  another *named entity* (a Section, an EnumValue, another Field), it
  has to be a between-nodes edge — there's no node-property
  equivalent that preserves the target identity refactor-safely. (You
  could write `node.belongsToSection: 'section:coins'` as a string,
  but that loses every node-identity ADR's win.)
- **Refactor-safety.** Edges to a non-existent target throw at build
  time (the "dangling edge reference" invariant in
  [`field-graph.ts:104`](../../src/shared/domain/field-graph/field-graph.ts)).
  Property typos only fail if a consumer's exhaustive switch catches
  them. Edge wins on between-nodes facts; tied on terminal-string
  facts.
- **Future evolution.** Adding a value variant to a closed set is
  cheap in both. Adding a new dimension (e.g. "data type now also
  carries a precision") is easier on edges (extend payload) than on
  node properties (touch `Node` shape).
- **AI / CLI discoverability.** Edges are uniform — every fact lives
  in `catalog/edges/<concept>/`. Properties create carve-outs the AI
  has to remember. The cold-start guide in `field-graph-for-ai.md`
  lists queries; the queries are uniform; the underlying storage is
  uniform.

### 3.3 Proposed litmus test

A four-question checklist a contributor (or AI) can apply when adding a
new fact about a field. Pass any of (1)–(4) → edge. Fail all four →
candidate for `Node.payload`.

The questions are ordered by discriminating power: (1) and (2) are
categorical; (3) is the principled `tag-vs-edge` framing; (4) catches
the build-time-invariant case. Earlier drafts opened with "does any
consumer cross-cutting-query this fact?" — that question doesn't
discriminate (properties and edges both filter the same way at our
scale, see §3.2 Queryability). The reframed question 1 is about
*uniformity of the indexed surface*, not raw query-shape.

1. **Would routing the fact through the edge index keep the catalog's
   query surface uniform?** If yes → edge (the contributor cost of
   "some facts are on nodes, some are on edges" is real even when the
   runtime cost is a wash). Note: this question alone is rarely
   load-bearing — it's a tiebreaker between a property and an edge
   when (2)–(4) don't fire.
2. **Is the fact the relationship to another named node** — a
   Section, an EnumValue, another Field, a Schema, a View? If yes →
   edge, no exceptions. (No property-based representation preserves
   target-identity refactor-safety.)
3. **Does the fact drive consumer behavior** (parser dispatch,
   formatter dispatch, validator branching, UI rendering)? If yes →
   edge. The `tag-vs-edge` ADR's framing, generalized: every
   behavior-driving fact should be a build-time-enforceable structural
   contract, regardless of where the value lives.
4. **Would absence of an explicit declaration constitute a bug**
   (rather than a deliberately-defaulted-from-rule case)? If yes →
   edge with `cardinality: 'at-least-one'`. (Properties default
   silently; required-edge cardinality fails the build via an
   enforcement primitive that already runs.)

If all four are no — query surface uniformity isn't worth bothering
about; it doesn't relate to another node; it doesn't drive behavior;
absence is fine — then `Node.payload` is the home. Today no fact in
the catalog satisfies all four "no" answers, which is why
`Node.payload` is empty. That's a healthy state, not a missing
feature.

The hypothesis "applies to everything → property" is wrong because
universality and edge-vs-property are orthogonal. Universal facts
become `'at-least-one'` edges (question 4); they don't become
properties.

### 3.4 How the litmus applies to `IS_OF_TYPE` (née `HAS_DATA_TYPE`)

1. **Query-surface uniformity?** Soft yes — keeping data-type lookups
   on the same `edgesOfType` index as every other field-fact reduces
   contributor cognitive load. Not load-bearing on its own.
2. **Relates to another node?** No (terminal string `'number' |
   'duration' | 'date' | 'string'`). → no signal.
3. **Drives behavior?** Yes — parser, exporter, formatter, aggregator
   all dispatch on it. The bug in §1 is *exactly* what happens when this
   driver is unreliable. → edge.
4. **Absence is a bug?** Yes — every declared Field needs a data type.
   Falling back to `'number'` at the catalog layer is the original sin
   we're correcting (the parser-boundary default for *undeclared*
   passthroughs is a separate concern, see §2.6). → edge with
   `'at-least-one'`.

Questions 3 and 4 carry the verdict; question 1 is a tiebreaker; question
2 doesn't apply. **Verdict: edge per field, with `'at-least-one'`
cardinality. Confirms section 2.4.**

### 3.5 How the litmus applies to existing edges (sanity check)

If the litmus produces different answers from the ones the codebase has
already arrived at, the litmus is wrong. Spot-checks:

- **`IS_INTERNAL_FIELD` (commit 5).** (1) Soft yes — `internalFields()`
  enumerates them and uniformity-of-surface helps. (2) No (marker).
  (3) Yes — drives CSV column ordering and per-internal-field handling.
  (4) No — most fields legitimately don't have it; cardinality is
  `'one'` (i.e., 0..1). → edge. Question 3 carries; question 1 is a
  tiebreaker. ✓ Matches.
- **`HAS_CSV_HEADER` (commit 5).** (1) Soft yes — csv-exporter looks
  it up per field through the same edge surface. (2) No (terminal).
  (3) Yes — drives CSV header rendering. (4) No — absence is the
  legitimate "use the v3_ default" case (deterministic-rule default).
  → edge, override-only. Question 3 carries. ✓ Matches the override-
  only shape.
- **`BELONGS_TO_SECTION` (commit 6).** (2) Yes — relates to a Section
  node. → edge, by question 2 alone. ✓ Matches.
- **`ACCEPTS_VALUE` (commit 4).** (2) Yes — relates to an EnumValue
  node. → edge. ✓ Matches.
- **`HAS_CSV_EXTRACTOR` (commit 5c).** (1) Soft yes — `csvExtractorOf`
  shares the same query surface. (2) No (terminal — registry name).
  (3) Yes — drives extractor dispatch in csv-exporter. (4) No — only
  internal fields override the default extraction. → edge with
  `cardinality: 'one'`. Question 3 carries. ✓ Matches.
- **`SHIPPED_IN_SCHEMA` (commit 11, planned).** (2) Yes — relates to a
  Schema node. → edge. ✓ Matches the planned shape.
- **`PARTICIPATES_IN_COMPOSITE_KEY` (commit 14, planned).** (1) Soft
  yes — duplicate-detection enumerates them via the edge surface.
  (2) No (terminal — composite-key scope). (3) Yes — drives composite-
  key construction. (4) No — participation is opt-in. → edge.
  Question 3 carries. ✓ Matches the planned shape.

Litmus reproduces the existing answers across six structurally
different edges spanning markers, terminal-strings, between-nodes, and
override-only patterns. Healthy.

What about the carve-outs the prior ADRs explicitly considered as
property candidates?

- **`'tournament-only'` (originally proposed as a tag in commit 3).**
  (2) No, but the *effective* relationship is "rank's validity is
  conditioned on run-type tournament" — which IS a between-nodes
  fact, just expressed via CONDITIONAL_ON. The litmus correctly says
  edge. ✓ Matches the ADR's resolution.
- **`'user-text'` (planned for `_notes`, commit 8/14).** (1) Soft yes —
  csv-exporter pre-encodes notes specifically; future user-text fields
  would join the same surface. (3) Yes — drives encoding/decoding
  behavior. → edge (or new `IS_OF_TYPE` variant). ✓ Matches the
  `tag-vs-edge` ADR's recommendation.

The litmus is internally consistent with every prior decision the
ADRs reached. Codify it in `field-graph-for-ai.md` so commit 9
onwards doesn't have to re-derive it per fact.

## 4. Per-commit impact

### Commit 5c (HAS_CSV_EXTRACTOR — already shipped)

No retroactive change. The shipped shape is consistent with the
litmus (edge, override-only, drives behavior, absence is fine). The
litmus would have predicted the same outcome.

### Commit 8 (this commit — game-fields data-type rollout, per §2.5 also renames `HAS_DATA_TYPE` → `IS_OF_TYPE`)

Per Option A + §2.5 rename + §2.6 parser-boundary cleanup:

1. **Rename the edge type** (per §2.5): `HAS_DATA_TYPE` → `IS_OF_TYPE`
   in `EdgeType` union ([`types.ts`](../../src/shared/domain/field-graph/types.ts):44),
   `EDGE_META`, the `data-types.edges.ts` helper, the `data-types.queries.ts`
   bindings, and the catalog tests. Mechanical grep-and-replace.
   `data-types/` directory keeps its purpose-name (the PATTERN.md prefers
   purpose-named folders over edge-named ones).
2. Extend `data-types.edges.ts` from 5 → ~150 entries.
3. Update `data-types.invariants.test.ts`: replace the "internal-fields
   slice" carve-out with "every Field has exactly one IS_OF_TYPE edge."
4. Flip `EDGE_META.IS_OF_TYPE.cardinality` from `'one'` →
   `'at-least-one'` in `types.ts`.
5. Cut over `getFieldConfig` in `field-utils.ts` to query the graph
   (`dataTypeOf(graph, fieldId)`); delete `EXACT_FIELD_CONFIGS` and
   `PATTERN_FIELD_CONFIGS`. Per §2.6, retain a single
   default-to-`'number'` branch *only* for the passthrough case (when
   `getField(fieldId)` returns `null`); document inline that this is
   the parser-boundary fallback for undeclared inputs and is the only
   place "default to number" is allowed.
6. Lift `GameRunField.dataType`'s inline union to import `DataType`
   from `data-types.constants.ts`.
7. Audit `GameRunField` construction sites; route every catalog-field
   site through `dataTypeOf(graph, fieldId)` and every passthrough
   site through the parser-boundary default.
8. Add a regression test for the §1 bug: bulk-import a CSV with
   `_runType=farm`, export it, assert the export round-trips
   `'farm'`, not `'0'`.

Cutover principle (per epic preamble §5): zero call sites still
derive data type by label-matching after this commit. Variable-swap
risk is moderate — `formatFieldValue`'s `field.dataType !== 'number'`
check stays as-is, but its *input* (the `field.dataType` value) now
comes from the graph. The conditional-logic ladder it's part of stays
collapsed (commit 5c already eliminated the per-field switches);
commit 8 doesn't reintroduce ladders, just makes the existing
data-type dispatch reliable.

### Commit 9 (IS_DERIVED_FROM — derivation cascade)

The litmus applies to derivers similarly to extractors (commit 5c).
Each `IS_DERIVED_FROM` edge has a deriver name; a `DERIVERS` registry
maps name → function. No node-property representation. Forward note:
the same litmus also indicates `IS_DERIVED_FROM` should be an edge,
not a node property — relates to other fields (question 2), drives
parser behavior (question 3). No re-litigation needed.

### Commit 14 (IS_REQUIRED_IN, PARTICIPATES_IN_COMPOSITE_KEY)

Both edges by litmus. Question 2 alone settles `IS_REQUIRED_IN`
(relates to a View). `PARTICIPATES_IN_COMPOSITE_KEY` is a terminal
edge (the composite-key scope is a string, not a Node) but questions
1 + 3 + 4 all say edge. No node-property representation considered.

### Commit 16 (suppression sweep)

If Option A is chosen, no impact. The cardinality flip in commit 8
should land cleanly; no migration-era suppression needed for the
data-type rollout.

If Option B (override-only) had been chosen instead, commit 16 would
inherit the "default to number" debt and probably add a follow-up
issue to revisit. Not applicable under the recommendation.

## 5. Open questions / future revisits

These are intentionally not decided here.

- **Per-data-type variants** (e.g. `'user-text'` vs `'string'`,
  `'number-with-suffix'` vs `'number-exact'`). When a variant lands,
  is it a new `IS_OF_TYPE` literal, or a separate marker edge
  (`IS_USER_TEXT`) layered on top of the base type? The
  `tag-vs-edge` ADR Sec 7 left this as deferred. The data-type
  taxonomy in `data-types.constants.ts` is the natural home for
  variants; whether to grow it or to introduce orthogonal markers is
  a decision for the commit that introduces the first variant.
- **Cross-source-kind data type.** EnumValue nodes don't carry an
  `IS_OF_TYPE` edge today (they're typed by virtue of being EnumValue
  + the wireValue terminal). If a future use case demands typing
  enum values (e.g. an enum value carrying a numeric coefficient
  alongside its display name), revisit whether `IS_OF_TYPE`
  generalizes to EnumValue source kind or whether enum values get
  their own typing edge.
- **The litmus codification.** This doc proposes adding the four-
  question checklist to `field-graph-for-ai.md` (or, if §6's PATTERN
  proposal lands, to the new catalog-level `PATTERN.md` instead, with
  `field-graph-for-ai.md` cross-linking to it). The exact wording is
  decided here; the placement decision tracks the §6 outcome.
- **Deferred Node-shape evolution.** The
  `EXPLORATION-node-identity-abc-deep-dive.md` appendix flagged
  per-kind discriminated `Node<'Field'>` variants as deferred work.
  If that ever lands (likely after commit 8 stabilizes the field
  model), revisit whether typed `FieldNode.dataType` becomes a
  no-cost win — the litmus would still say edge by question 4 (build-
  time invariant), but the ergonomics gap narrows substantially.
- **Invariant timing.** Commit 8 flips `IS_OF_TYPE` cardinality to
  `'at-least-one'` once every Field is declared. If commit 8 lands
  in stages (e.g. one section's data types per sub-commit),
  cardinality stays `'one'` until the final sub-commit. Worth
  flagging in the commit's Notes-and-findings entry so the
  invariant flip isn't forgotten.
- **The deeper TypeScript-vs-graph trade-off (revisit after commit 16).**
  The field-graph is in the process of becoming the metadata source of
  truth — what was previously expressed as TypeScript shape (a `Field`
  interface knowing what `dataType` it has, what section it belongs
  to) is being moved into edges queried at runtime. The trade-off is
  real and the human flagged it explicitly: *"this is a totally new
  architectural approach... what are type definitions for then?...
  it's one of my biggest challenges at work, understanding how a
  single concept gets renamed, reused, transformed... I'm fine with
  taking this experiment."*

  TypeScript narrows beautifully along code paths but doesn't index
  cross-cutting field metadata; the graph indexes cross-cutting field
  metadata but adds a query indirection at every consumer. Both
  approaches have legitimate value, and the codebase is now leaning
  hard on the graph for the kinds of metadata this doc is about. **This
  is not a question to resolve here.** Surfacing as an explicit
  trade-off the codebase is taking on, with a revisit trigger:

  > **After commit 16 lands**, audit whether the graph metadata system
  > has demonstrably reduced bugs and made cross-field changes easier
  > — or whether it's added ceremony without proportional payoff. If
  > the audit comes back negative, the doctrine to question is "every
  > metadata fact lives on the graph," not the specific call this doc
  > makes about data type. (Data type would still want to be edge-or-
  > property singular, not split across both sources, regardless.)

  Concrete signals to look for in the audit: number of "where does this
  field metadata come from?" debugging sessions; time-to-add a new
  field; number of catalog-vs-runtime drift bugs; contributor-onboarding
  complaints about needing to learn both TS and the graph.

## 6. Pattern docs to write or update

This doc adds two pieces of documentation work that aren't strictly
required to land commit 8 but would lock the doctrine in for future
contributors and AI agents. **Listed as proposals, not decisions** —
the human decides whether to fold them into commit 8 or defer to a
follow-up commit.

### 6.1 Proposed: new `src/shared/domain/field-graph/catalog/PATTERN.md` (catalog-level)

The existing
[`src/shared/domain/field-graph/catalog/edges/PATTERN.md`](../../src/shared/domain/field-graph/catalog/edges/PATTERN.md)
is per-concept-edge-folder scoped — it tells contributors how to add a
new concept folder, what files go inside, the naming convention. It
deliberately does **not** answer the *which-shape-does-my-fact-take*
question that this doc has been wrestling with on every commit
(`tag-vs-edge`, `engine-api-shape`, this doc). That question recurs and
each ADR re-derives the answer.

A new file at `src/shared/domain/field-graph/catalog/PATTERN.md` (one
level above the existing edges-PATTERN, sibling to `fields.nodes.ts`,
`sections.nodes.ts`, etc.) would seat the broader doctrine. Outline:

- **What is a Node?** Identity (`{ id, kind, payload? }`), kinds (Field,
  Section, Category, View, Schema, EnumValue), the declarative-only
  shape established in `EXPLORATION-node-identity-abc-deep-dive.md`,
  the `*_NODE` named-export convention.
- **What is an Edge?** Source / target / payload, the `EdgeType` union,
  cardinality (`one` / `at-least-one` / `many`), the three target-kind
  flavors (between-nodes / terminal / none).
- **What's `Node.payload`?** The escape hatch for non-queried
  metadata. Currently empty. The "if you think you need it, run the
  litmus first" rule.
- **The four-question litmus** (the one drafted in §3.3 of this doc,
  promoted to live here once accepted).
- **Edge-vs-property worked example** — link to this doc as the worked
  exploration. Optional inline summary if the doc grows long.
- **Where to find more.** Cross-link to the existing
  `edges/PATTERN.md` ("once you've decided it's an edge, here's how to
  add a new concept folder"), to `field-graph-for-ai.md` (the AI-facing
  cold-start), and to the relevant explorations.
- **Appendix — pattern history**: links to `EXPLORATION-tag-vs-edge.md`,
  this doc, `EXPLORATION-engine-api-shape.md`, and
  `EXPLORATION-node-identity-abc-deep-dive.md`. Per the project's
  PATTERN.md convention, the appendix is for pattern *evolvers*, not
  pattern *users*.

### 6.2 Proposed: cross-link in `field-graph-for-ai.md`

The cold-start AI guide today points to the per-concept
`edges/PATTERN.md` for "how to add an edge." A second cross-link at the
"## Critical invariants" section (or near the "Never introduce
`Node.tags`" bullet) pointing to the new catalog-level PATTERN.md
would land AI agents on the broader doctrine when they're considering
*whether* something should be an edge or a property in the first place.

A two-line edit at the existing "Never introduce `Node.tags`" bullet:

> If a fact about a node is consumer-queried or behavior-driving, it's
> an edge — see [`catalog/PATTERN.md`](../../src/shared/domain/field-graph/catalog/PATTERN.md)
> for the four-question litmus.

### 6.3 Recommendation

**Defer 6.1 (the new PATTERN.md) to a separate doc-only commit.** The
per-concept-edge-folder PATTERN.md is enough to land commit 8 cleanly,
and the broader doctrine is more useful when its scope is "the whole
catalog" — which means writing it after commit 8 is in flight (so the
data-type cutover is concrete evidence, not a hypothetical example).
Plus: writing a PATTERN.md is itself a small commit's worth of work
(the existing `edges/PATTERN.md` runs ~200 lines), and folding it into
a vertical slice that's already moving 150 edge declarations risks
diluting both.

**Land 6.2 (the cross-link) in commit 8** alongside the data-type
rollout. It's a two-line edit and points to a doc-that-doesn't-exist-
yet, which can be replaced with the actual link once 6.1 lands. Or
defer both together. Human's call.
