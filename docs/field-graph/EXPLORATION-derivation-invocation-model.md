# Exploration: Derivation invocation model — where does `applyDerivations` belong?

> **Date:** 2026-05-13 (revised; original 2026-05-13 morning)
> **Branch:** `204-v28-migration-safety`
> **Author:** prep doc for human review (commit 9 staged; closeout pending)
> **Status:** Decision pending — model leans Option 3 after revisit; human decision section TBD.
>
> **Recommendation summary (30-second read):**
> - **Adopt Option 3 — graph hydrates `ParsedGameRun` via a `hydrateRun(rawFields, context)` entry point.** Both parsers collapse to ~5 lines apiece (input-shape detection + `hydrateRun` call). The graph-orchestrated function owns the four shared steps: V2-key remap, derivation cascade, cached-prop extraction, final `ParsedGameRun` assembly. Parsers retain irreducible responsibilities (text-shape detection, raw-to-key-value extraction, top-level policy like id generation and timestamp fallback hierarchy). The "consumers shouldn't see the cascade" framing is satisfied structurally for the parse path.
> - **`hydrateRun` lives at the graph-engine layer with restricted public surface.** Treat it as a lifecycle method (alongside engine build) rather than a per-edge query — the prior commit 5b boundary ("engine class closed for new methods") was about query-method bloat, not fundamental APIs. Hydration is fundamental. The user explicitly reopened this: *"hydrate run, like, if I'm in a time series graph and I call the, you know, like, you know, coins over time chart, I, like, that shouldn't need to call hydrate run, right? Like, that's a lifecycle method from, like, from consumers of the graph shouldn't necessarily need to access."* So: keep it in the engine surface but classify it lifecycle, not query.
> - **Edit-time cascade rides on a sibling `graph.updateField(run, fieldId, value)` API.** Symmetric with `hydrateRun`. The cascade is hidden — `applyDateFix` and `prepareRunForSave` rewrite as `updateField` calls, never naming `cascadeFromInputChange`. Spec §18.4's `applyUpdate` is exactly this function under a different name.
> - **Migration is one commit (call it 9b), folded into the staged commit 9 if a rebase is cheap.** Commit 9's mechanism (the deriver registry + `applyDerivations` infrastructure) stays unchanged; the invocation surface changes. The staged-not-committed status of commit 9 is load-bearing: there's no "ship as-is then revisit" — there's "restructure the staged commit." The commit-9 status note in §5 reflects this.
> - **Reject Option 1 family (status-quo + V1's polish-only Option 4 merged).** Even with the cosmetic comment cleanup the prior version proposed, four named cascade sites across two parsers + two write-path mutators is more than the spec's vision and more than the owner's stated preference. The shipped shape works; it just isn't the destination.
> - **Reject Option 2 (lazy / cached).** Punted explicitly by the user.

> Cross-links:
> - **PREREQUISITE READING:** [`EXPLORATION-state-and-graph-boundary.md`](./EXPLORATION-state-and-graph-boundary.md) — the foundational doc explaining what's in memory at runtime, where the graph touches state, and what the parser actually does. **Read that before this.**
> - **EPIC:** [`EPIC-migration.md`](./EPIC-migration.md) — commit 9 is *staged not committed* at time of writing. A restructure under Option 3 lands as a revised commit 9 (or a commit 9b on top, depending on rebase appetite). Commit 11b's locked shape composes with Option 3's `hydrateRun` (resolver lives inside it). Commit 13's CONDITIONAL_ON form cascade composes with the `updateField` write-path API.
> - **Standing context:** [`field-graph-for-ai.md`](./field-graph-for-ai.md) — the `applyDerivations` / `cascadeFromInputChange` rows in the cold-start query index need updating under Option 3 (they become lifecycle / write-path methods, not standalone query exports).
> - **Spec:**
>   - [`architecture/11-internal-app-fields.md`](./architecture/11-internal-app-fields.md) §11.3 — derivation as a first-class edge with a deriver registry; spec's example shows `applyDerivations(rawFields)` as a single parser line. Option 3 wraps that single line inside `hydrateRun`.
>   - [`architecture/18-write-path.md`](./architecture/18-write-path.md) §18.4 — edit-time cascade via `applyUpdate` + `fieldsDerivedFrom`. Spec's `applyUpdate` is Option 3's `updateField`.
> - **Sibling exploration docs:**
>   - [`EXPLORATION-engine-api-shape.md`](./EXPLORATION-engine-api-shape.md) — commit 5b's "engine class is closed for new methods" rule, **with the lifecycle-vs-query carve-out captured below**.
>   - [`EXPLORATION-data-type-edge-vs-property.md`](./EXPLORATION-data-type-edge-vs-property.md) — the four-question litmus the user is implicitly applying.
>   - [`EXPLORATION-tag-vs-edge.md`](./EXPLORATION-tag-vs-edge.md) — the precedent for "facts about a thing live as edges, not as inline call-site logic."

---

## Human decision

**Decided 2026-05-13 by Jarek:**

Adopt Option 3. Parsers transform raw input into a `Record<string, GameRunField>`; the graph absorbs the back-half via `hydrateRun(rawFields, ctx)` which returns a fully-hydrated `ParsedGameRun`. Write-path consumers use a sibling `updateField(run, fieldId, newField)` API; the cascade is hidden inside it.

**Reasoning (the human's words, captured for future revisits):**

> "Focusing on the hydrate run, so I think this does make sense. And I think what we're getting at is the CSV parser and the data parser essentially both return raw fields, and then you pass raw fields into hydrate run, and I like that. Essentially the two parsers help transform the input data into a common format, and then we can pass the common format into the graph right so via hydrate run."

> "I do agree that the parser should focus on doing the transformation into that shared object — so while you're dealing with a single game run or a CSV of game runs, um, just get each shape into something that can be passed to hydrate fields."

> "For now I'm fine with hydrate run living at the the top level um field graph for now."

> "Shape A is fine. ... I think that's not clear to me here and it's totally fine to defer on it maybe add another commit to the list to deal with this because battle date editing isn't the thing right now which is the feature i was thinking about dealing with later."

> "Keeping these systems separate means consumers need to be aware of both, and I'm wondering if this is again a leaky abstraction of these two systems. Maybe the graph becomes the metadata and data storage, and you access it via graph queries. I don't know — I'd say let's defer that to another commit to make evaluate the consolidation of the game run data, the parsing, the hydrating of it, and accessing it."

The decision rests on three threads converging: (a) parsers should do shape-transformation only, with the graph orchestrating the hydration back-half; (b) `hydrateRun` and `updateField` at the top-barrel layer is acceptable engine surface growth because they're lifecycle methods, not query methods; (c) the bigger graph-vs-state consolidation question — whether the graph itself should hold values rather than just metadata — is real but deferred to a dedicated follow-up commit.

**Where the decision deviates from the recommendation:**

- **`extractNotesValue` / `extractRunTypeValue` / `extractRankValue` and the `createUpdated*` family stay in place for commit 9.** The doc's §3d worked rewrite (`field-update-logic.ts` shrinking from ~113 to ~30 lines) is deferred to the new graph+state consolidation commit. Commit 9 ships `hydrateRun` + `updateField` at the parse / save / fix call sites; the run-details edit handlers and their accessor helpers wait for the broader consolidation work.
- **Battle-date editing as a user-facing feature is out of scope.** The `updateField` API is structurally ready for it, but the actual UI surface (an editable battleDate field in run-details) is a separate future feature, not part of this migration epic.
- **V28-vs-V2 input-shape detection stays in the parser for commit 9.** The user surfaced this as a candidate for graph-driven (schema-edge / RENAMED_FROM territory) — agreed in principle; deferred to commit 11 (schema lifecycle), where each schema can declare its input shape and the parser asks the graph "which schema does this input match?"

**Scope of decision (which commits implement it):**

- **Commit 9** (this commit, currently staged) — adds `hydration.ts` with `hydrateRun(rawFields, ctx)` and `updateField(run, fieldId, newField)`. Refactors both parsers + `applyDateFix` + `prepareRunForSave`'s battleDate-materialization to use them. Removes `applyDerivations` and `cascadeFromInputChange` from the top-level barrel (they remain accessible via the per-concept derivations folder for internal use + tests). Deletes the staged leaky cascade-explanatory comments in consumer code. Restructures the staged commit in place — no separate commit 9b.
- **Commit 11** — absorb V28-vs-V2 input-shape detection into a schema-aware graph query (each schema declares its input shape; parser asks the graph).
- **Commit 11b** — absorb two-parser back-half consolidation via the resolver. `pickField(v3Key, v2Key)` shim audit already scoped here.
- **Commit 12** — read-time hardcoded field strings (`'coinsEarned'` etc. in chart code; `run.fields['battleReport_realTime']`-style accesses) cut over to `*_NODE.id` imports as part of APPEARS_IN_VIEW cutover. Cached-prop necessity (`run.tier`, `run.coinsEarned` etc.) re-evaluated here — if a `valueOf(run, fieldRef)` helper makes them redundant, drop them.
- **New post-migration commit (Phase 4-adjacent — call it commit 19)** — evaluate consolidating graph (metadata) and state (values) into a single system. Includes the deferred `extractNotesValue` / `createUpdated*` cleanup. Spawn a fresh exploration doc when that commit starts; do not pre-design here.

**Status:** Accepted; pending implementation in commit 9 (restructure in place).

**Future revisit triggers:**

- If commit 13 (CONDITIONAL_ON) makes the `updateField` API feel cramped (multiple cascades stacking awkwardly), revisit the lifecycle-vs-query carve-out on the 5b ADR.
- If the post-migration "graph + state consolidation" commit (commit 19) determines values should live on graph nodes, this doc is superseded — `hydrateRun` becomes graph-internal and consumer access changes shape.
- If the AI-prompt friction the §7 meta-question flagged escalates (more than 1 exploration doc per future commit), retreat is on the table — possibly dropping CONDITIONAL_ON entirely. The commit-17 enforcer agent is the diagnostic.

---

## Changelog (2026-05-13)

This doc was originally written earlier on 2026-05-13 with a four-option frame; the human reviewed it, and this revision incorporates that review.

- **Folded V1's Options 1 and 4 into a single "status-quo family" (now Option 1).** The human flagged: *"Option four, to me, doesn't really, to me, it's another version of option one. And it doesn't address those things that use data, things that use the graph, feel like they need to know more about the graph than I want."* Agreed — both keep the parser-side named cascade.
- **Demoted Option 2 (lazy / cached) to a footnote.** The human ruled this out explicitly; only a one-paragraph treatment remains.
- **Made Option 3 (graph hydrates) the centerpiece.** The human said: *"I'm leaning towards option three now, but I do want to get a better understanding of, like, what the drawbacks are. Are we crossing architectural boundaries? And does it make sense to?"* This revision treats Option 3 as the recommended direction and unpacks the architectural-boundary question rather than rejecting it on those grounds.
- **Rebutted the prior 5b-boundary concern.** V1 cited commit 5b's "engine class closed for new methods" rule as a structural objection to Option 3. The human explicitly rebutted: *"I mainly talked about that to avoid, and that was growth of API growth. Something like this is fundamental, like hydrate run, I'd be open to exposing on the graph. … I wanted to limit API growth to only when it's really relevant and not for every single edge that's added."* V1's framing was wrong — the 5b rule targets per-edge query bloat, not fundamental lifecycle methods.
- **Added the "build-phase vs query-phase" framing for Option 3.** The human surfaced: *"like, how we hydrate it, you know, maybe you have a hydration return, the public consumption object or whatever you want to call it."* This revision considers (and rejects, with reasoning) a two-object split where hydration returns a different object shape than the consumer-facing graph.
- **Added per-option in-memory state-shape sketches** (§3) showing what `ParsedGameRun.fields` looks like under each option for the same input. Helps make the abstract concrete.
- **Fixed the comparison-matrix Option 3 row** on "eliminates `applyDerivations` from non-parser call sites." V1 marked this `partial (only parse-time)` which confused the human. Resolved: under Option 3, derivations are baked into the hydrated run at parse time, and non-parser consumers never invoke them. The score is `✓`.
- **Cross-linked the new state-architecture doc as prerequisite reading.** The human asked for a grounding doc that explains how the graph and state interact today; that doc is [`EXPLORATION-state-and-graph-boundary.md`](./EXPLORATION-state-and-graph-boundary.md). Read it first.
- **Noted commit 9 is staged, not committed.** V1 talked about commit 9 as a shipped thing. It isn't. The restructure under Option 3 lands as a rewrite of the staged commit (or commit 9b on top, depending on rebase appetite). Per-commit impact table (§5) reflects this.
- **Removed `notes-encoding` and `pickField` from §5 adjacent concerns.** Both now have homes: notes-encoding sunset is scoped into commit 14 per the EPIC update; the `pickField` V2 fallback is scoped into commit 11b (audit + delete) per the EPIC update + the breadcrumb comment in [`run-type-detection.ts:9`](../../src/shared/domain/run-types/run-type-detection.ts).
- **Added §7 — a meta-question on whether the architecture is fighting the codebase.** The human raised this directly and asked for an honest answer rather than a hedge.

---

## 0. Prerequisite reading

Before reading this doc, read [`EXPLORATION-state-and-graph-boundary.md`](./EXPLORATION-state-and-graph-boundary.md). It establishes how the graph and React state interact today: what's in memory, where the graph is consulted at runtime (metadata frequency, not value-extraction frequency), what each parser does, and which responsibilities are genuinely parser-owned vs graph-owned. The options below assume that grounding.

---

## 1. The problem

Commit 9 (staged) shipped a parse-time + edit-time derivation cascade per spec §11.3 / §18.4. The mechanism works: `_date` and `_time` derive from `battleReport_battleDate`; `_runType` derives from `battleReport_tier`. Editing the battleDate refreshes the derived fields via `cascadeFromInputChange`. Three derivers are registered in `DERIVERS`.

The human reviewed and objected to the **invocation shape**, not the mechanism:

> "It's a little bit odd for me to see a consumer applying the derivation functions. To me this is a leaky abstraction. … I thought I was going to see another function instead — you've got the `applyDerivations` function which is then consumers use. … Consumers should just need to call a thing and bam you're done."

> "Going back to like, do you want to apply derivation on runtime every single time you're accessing a field? Well that gets kind of you know if you have like 500 or 1000 runs, you know, that's a lot of functions to apply over and over and over. Can we do this once?"

> "If we do this once, how do you store that, where do you store that … where do we persist that, how does — I guess the graph — can we use the graph to hydrate in memory representation of this data as well? Does that make sense to cross that boundary?"

Today, four consumers name the cascade by hand: both parsers (`data-parser.ts:196`, `csv-parser.ts:195`), the date-fix helper (`date-issue-detection.ts:applyDateFix`), and (transitively) the manual-entry form's `prepareRunForSave`. The state-and-graph-boundary doc §3 establishes that these are the *only* places that name the cascade — read-path consumers (charts, run-details, table cells) never do. The question is whether four named call sites is too many, and if so, what replaces them.

---

## 2. Options

### Option 1 — Status-quo family (V1's Options 1 + 4, merged)

**Shape.** Keep the parser-side `applyDerivations(remapped)` call at the end of `parseGameRun` / `parseRow`. Optionally polish the write-path: introduce a small `applyFieldUpdate(run, fieldId, newValue)` helper that wraps `cascadeFromInputChange` so `applyDateFix` and edit-handlers stop naming the cascade. (V1's "Option 4" was this polish; V1's "Option 1" was without it. The human read them as the same family — *"Option four, to me, doesn't really, to me, it's another version of option one"* — and this revision honors that.)

**Pros.**
- Smallest patch. The staged commit 9 stays as-is (with optional `applyFieldUpdate` polish ~15 LOC).
- Parser-side cascade call is *defensible* — the parser is the pipeline orchestrator; the spec's §11.3 example shows `applyDerivations(rawFields)` as a parser line.
- Aligns with spec §18.4's `applyUpdate` (Option 4's `applyFieldUpdate` is that function, renamed).
- Zero engine API growth.

**Cons.**
- **The two parsers still name the cascade.** Both `data-parser.ts:196` and `csv-parser.ts:195` carry the same `applyDerivations(remapped)` line. The duplication is real.
- **The "parser is just a pipeline orchestrator" framing relies on a charitable reading of the user's complaint.** Re-reading: *"Consumers should just need to call a thing and bam you're done."* The parser IS a consumer of the graph. The complaint applies to it.
- **Both parsers' final assembly is structurally identical** (V2-remap → cascade → cached-prop extraction → object construction). Keeping that duplicated in two files is a smell that Option 3 eliminates.
- **The graph layer never gets to talk about hydration as a concept.** The spec gestures at it (*"the parser's `deriveDateTimeFromBattleDate` call becomes one generic line"*); Option 1 keeps that single line in two places forever.

**Implementation complexity: S** (zero, or +15 LOC for the write-path `applyFieldUpdate` helper).

---

### Option 2 — Lazy / cached on read (footnote)

Skipped — the human explicitly ruled this out. For completeness: this option would have derived fields compute on first read and cache via a sidecar map. It would have eliminated every named cascade site at the cost of (a) cache invalidation as a new ongoing concern, (b) breaking the parse-once-persist-with-derived-values round-trip, and (c) a per-access cost on cold loads that doesn't exist today. The state-and-graph-boundary doc §4 establishes that derivations don't run per-render today, so the performance motivation is gone. Not pursued.

---

### Option 3 — Graph hydrates `ParsedGameRun` (centerpiece)

This option treats run construction as a graph concern. The graph exposes a `hydrateRun(rawFields, context)` entry point that absorbs the shared back-half of both parsers' pipelines. Parsers retain their irreducible front-half (text-shape detection, raw-text-to-key-value extraction, top-level policy) but never name the cascade.

#### 3a. The shape

```typescript
// src/features/analysis/shared/parsing/data-parser.ts — clipboard parser (after)
export function parseGameRun(
  rawInput: string,
  customTimestamp?: Date,
  importFormat?: ImportFormatSettings,
): ParsedGameRun {
  const rawFields = parseRawClipboard(rawInput, importFormat);    // text → key-value
  return hydrateRun(rawFields, {
    fallbackTimestamp: customTimestamp ?? new Date(),
    dateFormat: importFormat?.dateFormat ?? 'month-first',
  });
}

// src/features/data-import/csv-import/csv-parser.ts — CSV row parser (after)
function parseRow(context: RowParseContext): { run: ParsedGameRun; warning: DateValidationWarning | null } {
  const rawFields = parseCsvRow(context);                          // row → key-value
  const run = hydrateRun(rawFields, {
    fallbackTimestamp: undefined,    // CSV path lets parseTimestampFromFields decide
    dateFormat: context.importFormat?.dateFormat,
  });
  const warning = detectBattleDateWarning(run, context);
  return { run, warning };
}
```

Where `hydrateRun` is the engine-layer entry point:

```typescript
// src/shared/domain/field-graph/hydration.ts (new — graph-engine layer)
export interface HydrationContext {
  readonly fallbackTimestamp?: Date;
  readonly dateFormat?: 'month-first' | 'day-first';
}

export function hydrateRun(
  rawFields: Record<string, GameRunField>,
  context: HydrationContext,
): ParsedGameRun {
  const remapped = remapV2FieldKeys(rawFields);            // graph-driven RENAMED_FROM walk
  const fields = applyDerivations(remapped);               // graph-driven IS_DERIVED_FROM walk
  const timestamp = resolveTimestamp(fields, context);     // battleDate → fallback hierarchy
  const cachedProps = extractCachedProps(fields);          // tier, wave, coinsEarned, …
  return {
    id: crypto.randomUUID(),
    timestamp,
    fields,
    ...cachedProps,
    ...(context.dateValidationError && { dateValidationError: context.dateValidationError }),
  };
}
```

Concretely, **what disappears from parser code**:

- The `applyDerivations(remapped)` call sites (both parsers).
- The `remapV2FieldKeys(rawFields)` import (both parsers — moves inside `hydrateRun`).
- The `extractKeyStatsFromFields(fields)` import (both parsers — folds into `extractCachedProps` inside `hydrateRun`).
- The timestamp-resolution policy block in `parseGameRun:177-194` (~17 lines — folds into `resolveTimestamp`).
- The duplicated final object construction (both parsers — `hydrateRun` returns the assembled object).

**What stays in parser code**:

- Input-shape detection (`looksLikeV28SectionedInput`).
- Tab-delimited / sectioned / CSV row text-to-key-value extraction.
- Per-cell `createGameRunField` invocation (which itself is graph-driven internally).
- Top-level error handling, mapping reports, and the warning surface for CSV import.

#### 3b. Where `hydrateRun` lives

This is the architecturally-loaded question. V1 framed it as a direct violation of commit 5b's "engine class closed for new methods" rule. The human rebutted:

> "I mainly talked about that to avoid, and that was growth of API growth. Something like this is fundamental, like hydrate run, I'd be open to exposing on the graph. Ideally, again, consumers shouldn't need to use this, right? This is a one-time thing, hydrate run, but I don't want to make it like it's set in stone, like the API can't grow. I wanted to limit API growth to only when it's really relevant and not for every single edge that's added, you know, throws in, you know, 5 or 10 new query API methods. That's what I wanted to avoid, but when there's a justification for it, the core graph API can grow."

So: the 5b rule is about *query-method bloat* (one method per new edge type — at commit 15 that would be ~30 methods on `FieldGraph`), not about *fundamental lifecycle methods*. `hydrateRun` is a lifecycle method, not a per-edge query. It's adjacent to engine build (`buildGraph()`) and hydration is a build-phase concern conceptually.

**Recommendation: `hydrateRun` lives at the top-level barrel** (`src/shared/domain/field-graph/index.ts`), alongside the existing barrel exports. Internally it's implemented in a dedicated file (`hydration.ts`) under the engine directory. It's *not* a method on the `FieldGraph` class — keep the class as primitives + indexes only, per commit 5b's locked shape. The barrel-level placement gives it the same "engine-level public API" status as `appGraph()`, `buildGraph()`, and `setAppGraphForTesting()` — the small set of functions that aren't queries but are part of the engine's public surface.

This **does** count as engine API growth. The mitigation: codify the lifecycle-vs-query distinction in `field-graph-for-ai.md`. Lifecycle methods are rare (build, hydrate, hypothetical future `freeze`/`export`); query methods are per-edge and live in `catalog/edges/*/queries.ts`. The 5b ADR's "engine class closed" rule continues to mean "no new query methods on the engine class." The cold-start query index gains a small "Lifecycle methods" section.

#### 3c. Hydration vs query — should there be two object shapes?

The human surfaced this:

> "this is like one of those things when we build the graph, maybe we call some certain methods and what we expose to consumers, like the built graph, the hydrated graph is a different object with different accessors. But, like, how we hydrate it, you know, maybe you have a hydration return, the public consumption object or whatever you want to call it."

Read: maybe `hydrateRun` should return a richer object that exposes accessors (`run.getField('_date').value` rather than `run.fields._date.value`), and the "raw" `ParsedGameRun` shape is internal-only.

**Doc recommendation: don't do this.** The reasons:

1. **`ParsedGameRun` is already the consumer-facing shape.** Every chart, every aggregation, every cell-rendering component receives `ParsedGameRun` and reads `run.fields[id]` or `run.coinsEarned`. Replacing that with `run.getField('_date')` is an API churn that ripples across ~30+ files (see the state-and-graph-boundary doc §3 for the consumer list). The churn isn't paid for by a meaningful ergonomic win at the read site.
2. **It re-introduces the layer of indirection the cached props were designed to eliminate.** `run.coinsEarned` (a plain number) is a deliberate ergonomic for hot loops. Forcing `run.getField('coinsEarned').value` (or even `run.coinsEarned.value`) loses the type inference and adds a property access per loop iteration. Charts aggregating 600 runs would pay the cost.
3. **The "consumers shouldn't see the hydration mechanism" goal is satisfied without two shapes.** Consumers don't call `hydrateRun`. The parsers do. Once the parsers have called it, consumers receive a `ParsedGameRun` and have nothing to do with hydration. The lifecycle is invisible because consumers are downstream of it, not because the returned object hides it.

**The right framing:** `hydrateRun` is a *constructor* in the OOP sense — it builds an object, and the object it builds has no further connection to the constructor. Hiding that fact in a different return-type shape is misdirection. The constructor is a graph concern; the constructed object is run-scoped data. That's the same boundary the spec articulates and the state-and-graph-boundary doc §5 confirms.

#### 3d. Edit-time cascade under Option 3 — the key question

This is what the human asked about most pointedly:

> "I guess the edit time cascade works without consumer awareness. I guess that's the question. How do you, when you're editing a row and you're changing, you know, you're adding notes or you're changing the run type, how, in the option three, how would you update the member representation of a derived value without the consumer actually having to?"

Concrete scenario: user is in the run-details panel and edits `_notes` from "good wave RNG" to "good wave RNG, paid attention to UW timing." What's the API call?

Three plausible shapes:

- **Shape A — `graph.updateField(run, fieldId, newValue)`.** A top-level function symmetric with `hydrateRun`. Returns a new `ParsedGameRun` with the field updated, the cascade re-run for downstream fields, and any cached props refreshed.

  ```typescript
  // current write-path (Option 1 / today, post-cleanup):
  const updatedFields = createUpdatedNotesFields(run.fields, newNotes);
  updateRun(run.id, { fields: updatedFields, runType: newRunType });

  // Option 3 write-path:
  const updatedRun = updateField(run, _NOTES_NODE.id, newNotes);
  updateRun(run.id, updatedRun);
  ```

  `createUpdatedNotesFields` and its siblings in [`field-update-logic.ts`](../../src/features/game-runs/editing/field-update-logic.ts) disappear. The graph knows how to construct a `GameRunField` for an internal field (it already does — `createInternalField` queries `dataTypeOf`); `updateField` reuses that machinery, runs `cascadeFromInputChange`, returns the new `ParsedGameRun`.

- **Shape B — A returned `RunHandle` object.** `const handle = openRun(run); handle.setField('_notes', value); const updated = handle.commit();`. Stateful, builder-style. Familiar from ORMs.

- **Shape C — Reducer-style `applyEdit(run, edit)`.** `applyEdit(run, { type: 'set-field', fieldId: '_notes', value })`. Composable, replayable. Familiar from Redux.

**Doc recommendation: Shape A** (`graph.updateField`).

Justification:
- It's spec §18.4's `applyUpdate` under a different name. The spec already prescribes it.
- Symmetric with `hydrateRun` — both take a run-or-fields and a context, return a new run. Two functions, same shape.
- Composes naturally with commit 13's CONDITIONAL_ON cascade — `updateField` runs both the derive cascade and the conditional-clearing cascade. One function, two cascades, hidden.
- Shape B is over-engineered for the current scale (single-field edits, no transaction semantics needed).
- Shape C is over-engineered for the same reason and additionally introduces an `Edit` type taxonomy that no consumer needs.

What the consumer code becomes — concretely:

```typescript
// src/features/game-runs/card-view/run-details.tsx — handleUserFieldsUpdate (after)
const handleUserFieldsUpdate = (newNotes: string, newRunType: RunTypeValue, newRank: RankValue) => {
  let updatedRun = run;
  if (newNotes !== extractNotesValue(run.fields)) {
    updatedRun = updateField(updatedRun, _NOTES_NODE.id, newNotes);
  }
  if (newRunType !== extractRunTypeValue(run)) {
    updatedRun = updateField(updatedRun, _RUN_TYPE_NODE.id, newRunType);
  }
  if (newRank !== extractRankValue(run.fields)) {
    updatedRun = updateField(updatedRun, _RANK_NODE.id, newRank === '' ? null : String(newRank));
  }
  updateRun(run.id, updatedRun);
};
```

`field-update-logic.ts` (currently a 113-line file with `createUpdatedNotesFields`, `createUpdatedRunTypeFields`, `createUpdatedRankFields`, plus the extractors) shrinks to just the three `extract*` getters. The "create-updated" helpers all disappear into `updateField`.

`applyDateFix` rewrites:

```typescript
// src/shared/formatting/date-issue-detection.ts:applyDateFix (after)
export function applyDateFix(run: ParsedGameRun, derivedDate: Date): ParsedGameRun {
  // Drop the legacy V2 key; updateField will install the V3 canonical and re-cascade.
  const { battleDate: _legacy, ...rest } = run.fields;
  const cleaned = { ...run, fields: rest, timestamp: derivedDate, dateValidationError: undefined };
  return updateField(cleaned, BATTLE_REPORT__BATTLE_DATE_NODE.id, derivedDate);
}
```

`prepareRunForSave`'s "materialize battleDate then re-cascade" branch becomes a direct `updateField` call rather than the awkward `applyDateFix(run, run.timestamp)` lever.

**The "consumer awareness" question answered.** Under Option 3 the consumer says `updateField(run, fieldId, value)`. They never see `cascadeFromInputChange`. They never see derivation. They never see V2-key remap. The graph handles all of it. That's the structural answer to the user's *"how, in the option three, how would you update the member representation of a derived value without the consumer actually having to?"*.

#### 3e. What moves into the graph from the parser

Per the state-and-graph-boundary doc §6, the parser's irreducible responsibilities are:

1. Input-shape detection.
2. Raw text → key-value extraction.
3. Top-level orchestration of `createGameRunField` per entry.
4. Error reporting / warning shape / mapping report.

Everything else moves into `hydrateRun`:

- V2-key remap (`remapV2FieldKeys`).
- Derivation cascade (`applyDerivations`).
- Timestamp resolution from battleDate + fallback hierarchy.
- Cached-prop extraction (`extractKeyStatsFromFields`).
- Final `ParsedGameRun` assembly.

Under Option 3 + commit 11b's locked resolver, the parser-boundary key resolution (today's `deriveCanonicalKey` in `field-utils.ts` and its three duplicates) also folds in. The `createGameRunField` call internally goes through the centralized resolver. Commit 11b's scope shrinks slightly — it's "fold the resolver into `hydrateRun`'s machinery" rather than "centralize across four files" — and that scope is easier.

#### 3f. Cost analysis

**Implementation complexity: M-L.**

- New: `src/shared/domain/field-graph/hydration.ts` (~80 lines: `hydrateRun`, `updateField`, `resolveTimestamp`, `extractCachedProps`).
- Modified: `data-parser.ts` (parseGameRun shrinks from 71 lines to ~20), `csv-parser.ts:parseRow` (shrinks from 32 lines to ~15), `field-update-logic.ts` (shrinks from 113 lines to ~30 — just extractors).
- Deleted: `extractKeyStatsFromFields` from both parsers, `createUpdatedNotesFields`/`createUpdatedRunTypeFields`/`createUpdatedRankFields` from field-update-logic, the timestamp-resolution block from `parseGameRun`.
- Tests: `hydration.test.ts` with ~10 tests covering the orchestration. Existing parser tests stay — they test the end-to-end shape, which doesn't change.

Migration is **one commit's worth of work**: restructure commit 9's staged changes to land the hydration layer alongside the cascade infrastructure rather than separately. The diff is roughly +200 LOC (new hydration file + tests) and -150 LOC (parser cleanups), netting +50 LOC for clear architectural ownership.

**Parser consolidation:** Per the state-and-graph-boundary doc §6, the back half of `parseGameRun` and `parseRow` is structurally identical and that's exactly what `hydrateRun` absorbs. The two parsers stay as separate functions (different front-halves: clipboard text-shape vs CSV row) but the duplicated tail disappears.

#### 3g. Drawbacks (honest)

The human explicitly asked for these:

> "I'm leaning towards option three now, but I do want to get a better understanding of, like, what the drawbacks are. Are we crossing architectural boundaries? And does it make sense to?"

Real drawbacks:

1. **The engine surface grows by a fundamental method.** `hydrateRun` and `updateField` are public, lifecycle-class methods on the engine. The 5b ADR's "engine class closed for new methods" rule needs an explicit lifecycle carve-out documented. That's a small ADR-level update, not a contradiction. But it does mean the rule isn't strictly "closed" anymore — it's "closed for queries, open for lifecycle." A future-me reading the 5b ADR will need this note to make sense of the carve-out.

2. **The boundary between "metadata graph" and "value layer" gets crossed at hydration time.** The graph is metadata; `hydrateRun` takes raw key-value pairs and returns a run with values. The graph's `applyDerivations` already does this internally — it takes a `Record<string, GameRunField>` and returns one — but `hydrateRun` does it at the level of the whole `ParsedGameRun`. The boundary is the same; the granularity of the cross is larger. The user partially articulated the principled objection themselves: *"the graph is really metadata … it's not the values of the data itself."* Option 3 has the graph orchestrating value construction without owning the values. That's defensible (the constructor analogy in §3c) but it's worth being clear-eyed that there's a step here, not a clean separation.

3. **Coupling to commit 11b.** Commit 11b's locked D-α resolver wants to consolidate the parser-boundary key normalization (`deriveCanonicalKey` + three duplicates) into a graph-engine resolver. Under Option 3 that resolver lives inside `hydrateRun`. Commit 11b's scope changes shape — it becomes "consolidate inside `hydrateRun`" rather than "centralize across four call sites." This is mostly an order-of-operations concern: ship Option 3 first, then 11b folds into it cleanly. If 11b ships first, the resolver lives in the engine, then Option 3 wraps it inside `hydrateRun`. Either order works; the second is slightly more churn (one shape, then another).

4. **Commit 9's cascade mechanism becomes engine-internal in a stronger sense.** Today `applyDerivations` and `cascadeFromInputChange` are public barrel exports. Under Option 3, consumers shouldn't call them directly — they should use `hydrateRun` / `updateField`. The barrel exports could stay (for tests and for engine-internal use), but the cold-start query index in `field-graph-for-ai.md` should mark them as engine-internal mechanisms, not consumer-facing queries. That's a small docs update with a real benefit: future readers won't be tempted to call `cascadeFromInputChange` from a UI component.

5. **`hydrateRun` takes a `HydrationContext` parameter that the graph itself doesn't really use.** `fallbackTimestamp` and `dateFormat` are parse-time policy that flows through `hydrateRun` to be applied to specific fields. The graph hosts the function but doesn't *care* about most of what's in the context. That's a mild "code lives here but reads weirdly here" smell — Option 1 keeps the policy in the parser where it visibly belongs. The smell is real but contained: `HydrationContext` is one type, exported once, threaded through one function. It's not load-bearing across the engine.

6. **Scope creep risk.** Once `hydrateRun` exists, every "should the parser own X or should the graph?" question has a default answer (move it to the graph). The state-and-graph-boundary doc §6 was deliberate about which steps belong in the parser vs the graph; that boundary needs to be respected post-Option-3, or `hydrateRun` becomes a black hole that absorbs the parser entirely. Discipline matters more under Option 3 than Option 1.

---

## 3. Per-option in-memory state sketch

Same input (a single farm row from `farmingRun_2025-08-16.txt`), different in-memory shapes:

### Under Option 1 (today's shape)

```typescript
// run.fields after parseGameRun:
{
  battleReport_battleDate: { value: Date, rawValue: '2025-08-16T19:30:00', displayValue: '...', dataType: 'date', originalKey: 'battleReport_battleDate' },
  battleReport_tier:       { value: 10,   rawValue: '10', displayValue: '10', dataType: 'tier', originalKey: 'Tier' },
  battleReport_coinsEarned:{ value: 1.13e12, rawValue: '1.13T', displayValue: '1.13T', dataType: 'number', originalKey: 'Coins Earned' },
  // ... (~50 game fields, omitted)
  _date:    { value: '8/16/2025',  rawValue: '8/16/2025',  displayValue: '8/16/2025',  dataType: 'date',   originalKey: '_date' },
  _time:    { value: '7:30:00 PM', rawValue: '7:30:00 PM', displayValue: '7:30:00 PM', dataType: 'string', originalKey: '_time' },
  _runType: { value: 'farm',       rawValue: 'farm',       displayValue: 'farm',       dataType: 'string', originalKey: '_runType' },
}
// + cached props on run itself: tier=10, wave=5881, coinsEarned=1.13e12, ...
```

`_date`, `_time`, `_runType` are materialized values produced by `applyDerivations` at parse time. Constructed inside the parser; the parser names the cascade.

### Under Option 3

```typescript
// run.fields after hydrateRun:
{
  // ...IDENTICAL shape to Option 1...
}
// + cached props on run itself: ...IDENTICAL to Option 1...
```

**The shape is identical.** The construction *path* differs (the graph orchestrates rather than the parser), but the output object is bit-for-bit the same. Consumers downstream of `hydrateRun` cannot tell which option produced their `ParsedGameRun`. That's the load-bearing property of Option 3: it changes the *who-orchestrates* without changing the *what-results*.

This matters because the persistence path (state-and-graph-boundary doc §1, Phase 3) writes `field.rawValue` per cell. Whatever the cell holds at export time gets persisted. Identical in-memory shape ⇒ identical CSV round-trip. No migration concerns from the user's existing localStorage data.

---

## 4. Comparison matrix

Scored ✓ (yes) / ✗ (no) / partial / N/A. Not weighted.

| Concern | Opt 1 — Status-quo family | Opt 3 — Graph hydrates |
|---|---|---|
| Eliminates `applyDerivations` from non-parser call sites | partial (only if `applyFieldUpdate` polish lands) | ✓ |
| Eliminates `applyDerivations` from parser call sites | ✗ | ✓ |
| Eliminates `cascadeFromInputChange` from consumer code | partial (`applyFieldUpdate` hides it from write-path; parsers still implicit) | ✓ |
| Derivation runs at most once per run-load | ✓ | ✓ |
| Edit-time cascade works without consumer awareness | ✓ (if `applyFieldUpdate` lands) | ✓ |
| Doesn't introduce a memoization / caching layer | ✓ | ✓ |
| Compatible with commit 5b's engine boundary | ✓ (no change) | partial (lifecycle carve-out required; rebutted as fine) |
| Compatible with commit 11 (Schema lifecycle) | ✓ | ✓ (Schema-aware hydration folds in naturally) |
| Compatible with commit 11b (parser-boundary resolver) | ✓ | ✓ (resolver lives inside `hydrateRun`) |
| Compatible with commit 13 (CONDITIONAL_ON form cascade) | partial (separate `applyConditionalClearing` helper) | ✓ (composes inside `updateField`) |
| Parser's responsibility after this option | text-shape + key-value + cascade orchestration | text-shape + key-value extraction only |
| Consumer code references field nodes (not raw strings) by default | partial | ✓ (forced by `updateField`'s `fieldId` parameter being a `*_NODE.id`) |
| Test surface added vs removed | 0 / 0 (or +1 small wrapper test) | + hydration tests; - 6 `createUpdated*` helper tests |
| Eliminates duplication between two parsers' back-halves | ✗ | ✓ |
| Code lives where its concern is named | parser names cascade (defensible if you call parser "the orchestrator"; leaky otherwise) | graph names cascade (matches the spec's framing exactly) |
| Implementation effort | S (zero or ~15 LOC for `applyFieldUpdate`) | M-L (~200 LOC new, ~150 LOC deleted from parsers + field-update-logic) |

**Row that V1 confused the human on (now corrected).** "Eliminates `applyDerivations` from non-parser call sites" was marked `partial (only parse-time)` for Option 3 in V1. The human pushed back: *"I guess a question, looking at the comparison matrix, you're saying eliminate supply derivations from non-parse or call sites. For option three, that's not the case. Is it just saying it's only done at parse time?"*

Resolved: under Option 3, **non-parser consumers never call `applyDerivations`.** Derived values are baked into the hydrated run at parse time (just like Option 1) AND the edit path goes through `updateField` (which hides `cascadeFromInputChange`). The V1 score was wrong. The correct score is `✓`.

---

## 5. Per-commit impact

**Status note up front: commit 9 is staged, not committed.** The branch carries the cascade infrastructure (deriver registry, `applyDerivations`, `cascadeFromInputChange`, `IS_DERIVED_FROM` edges, the four consumer call sites) as staged changes. Nothing prevents restructuring that staged work — there's no published commit hash to amend or follow up on. The "commit 9 ships as-is" framing from V1 was wrong on that point.

| Option | Commit 9 (staged) | Commit 11 (Schema) | Commit 11b (resolver) | Commit 12 (APPEARS_IN_VIEW) | Commit 13 (CONDITIONAL_ON) | Commit 14 (composite key + notes sunset) | Commit 15 (dissonance) |
|---|---|---|---|---|---|---|---|
| **1 — Status-quo family** | Land staged commit 9 as-is, then add optional `applyFieldUpdate` polish in commit 9b (~15 LOC) OR fold into commit 13. Delete cascade-explanatory comments from 4 consumer files as polish. | No interaction. | No interaction. | No interaction. | CONDITIONAL_ON form cascade lands separately; `applyConditionalClearing` is its own helper alongside `applyFieldUpdate`. | Notes-encoding sunset per current EPIC scope (already updated). | New `_dissonanceSubCategory IS_DERIVED_FROM` deriver lands; parsers still call `applyDerivations` (no new consumer site). |
| **3 — Graph hydrates** | **Restructure staged commit 9.** Add `hydration.ts` (~80 LOC). Shrink both parsers to use `hydrateRun`. Shrink `field-update-logic.ts` (delete the three `createUpdated*` helpers; keep the extractors). Rewrite `applyDateFix` + `prepareRunForSave` to use `updateField`. Net: similar LOC, much cleaner shape. | Schema-aware hydration folds INTO `hydrateRun`. Cleaner story; bigger commit. | Commit 11b's resolver lives inside `hydrateRun`'s machinery. Scope shrinks slightly. | View code unchanged. | `updateField` is extended to also run CONDITIONAL_ON cascade. One function, two cascades, hidden from consumers. **Natural composition.** | Notes-encoding sunset per current EPIC scope. csv-exporter unaffected by hydration layer. | New deriver registers; `hydrateRun` picks it up automatically. Form's dissonance auto-detection routes through the deriver registry per the existing plan. |

**Recommended scoping if Option 3 is chosen:** restructure the staged commit 9 in place. Don't ship the current shape and then redo it; that's two reviews for one decision. The diff is bigger (hydration layer + parser cleanup + field-update-logic cleanup) but the result is the destination shape. Commit 9 status changes from "shipping cascade infrastructure" to "shipping cascade infrastructure + hydration layer + write-path API."

**Alternative scoping:** if the staged commit 9 is too far along to restructure cleanly, ship it as-is and land Option 3 as a commit 9b. Acceptable but less clean — readers of the epic see two related commits where one would do.

---

## 6. Open questions for the human

1. **Is the `hydrateRun` boundary too far for what's effectively spec §11.3's recommendation?** Spec §11.3 frames `applyDerivations(rawFields)` as a parser line. Option 3 wraps that line and several others in a graph-orchestrated function. The wrapping is the destination spec implicitly points at (the architecture is moving toward "the graph orchestrates"), but spec §11.3's specific phrasing supports Option 1 too. Pick the framing.

2. **Is the lifecycle-vs-query carve-out on the 5b ADR a meaningful exception or a slippery slope?** Today: build, hydrate, updateField. Tomorrow: ... what? If the answer is "very few additions, all genuinely lifecycle (freeze, export, …)," the carve-out is fine. If the answer is "every new edge brings a lifecycle concern," the carve-out becomes the same growth concern 5b was designed to prevent, with a different label.

3. **Should `updateField` (the write-path API) ship in the same commit as `hydrateRun`, or land later in commit 13?** Bundling them: cleaner architectural shape, bigger commit. Splitting them: 9 ships hydration + read-path consequences; 13 ships CONDITIONAL_ON + `updateField` as the write-path consequence. Either works; bundling is more cohesive.

4. **Does the staged commit 9 get restructured (Option 3 lands in place) or does it ship as commit 9 + commit 9b under Option 3?** The bigger-diff option (restructure) is recommended; the smaller-diff option (9 + 9b) is acceptable. The first is more reviewer load up front but produces a cleaner epic.

---

## 7. A meta-question — is the architecture fighting us?

The human raised this directly:

> "One is how easy it is for AI agents to, or my, you know, prompts to not adhere to the architecture. So, I'm wondering, is that a signal, um, like when you're fighting the architecture and you're constantly having to fix things that are not following the architecture, is that a sign of a larger issue that I'm choosing to ignore? … when you actually get them into the implementation, like, hey, you know what, like, we're, we're fighting the architecture more than it's benefiting us."

Two honest reads, and conditions under which each is true:

**Read A: the architecture is sound; the friction is unfamiliarity.** AI agents (and humans) joining the codebase don't yet have the graph mental model loaded. Commits 12-13 are exactly where that friction would surface most (view registration + conditional clearing both require ergonomic graph queries to feel natural). Once enough consumers have been cut over and the `field-graph-for-ai.md` cold-start index has saturated, the friction drops because the patterns are stamped out and visible.

This read is **true if** the friction concentrates at the cut-over commits (12-13) and decays after; if new contributors who weren't there for the migration can read `field-graph-for-ai.md` + a `PATTERN.md` and stamp out a new edge in under an hour; if AI prompts that say "add a new field to section X" produce the right shape without architectural prose in the prompt.

**Read B: the architecture is genuinely fighting parts of the codebase.** The CONDITIONAL_ON cascade is the most-uncertain edge concept in the epic — multiple exploration docs orbit it, the spec discusses it briefly, and no consumer has built one yet. If CONDITIONAL_ON requires its own walking machinery, its own composition with derive-cascade, and its own consumer ergonomics, that's three new mechanisms for what could be a single hand-rolled `if (runType !== 'tournament') setRank('')` line in form code.

This read is **true if** every new edge concept beyond commit 14 requires a fresh exploration doc to land cleanly; if the count of "exploration doc per commit" stays high through commits 15-16 instead of decaying; if the user keeps needing to do detailed architectural reviews to catch drift that the agents introduced.

**The doc's read:** it's too early to call. The migration epic has been honest about its uncertainty — there have been ~10 exploration docs so far, and three of them (tag-vs-edge, data-type-edge-vs-property, the resolver D-α deep dive) genuinely simplified the architecture in response to friction. That's evidence the architecture is *responsive* to friction, not rigid in the face of it. The 5b ADR was a deliberate brake on engine-API growth; the lifecycle carve-out this doc proposes is a deliberate exception. If exceptions stay rare and motivated, the architecture is fine. If they accumulate, that's the signal to retreat.

A concrete retreat path, in case it's needed: **drop CONDITIONAL_ON from the epic** and keep `if (runType !== 'tournament') setRank('')` as a hand-coded form rule. CONDITIONAL_ON is the edge concept with the weakest "this drives consumer behavior" justification (it drives one consumer, the form). If commit 13 lands and feels like over-engineering after the fact, that's a clear signal — and reverting is cheap because no other commit depends on it.

That's not a recommendation to retreat now. It's a recommendation to **watch commits 12-13 closely** as the decision point. If commit 13 lands and the user's response is "this is cleaner than the hand-rolled version," the architecture is paying off. If it's "this is more machinery for the same outcome," it's time to consider scope retreats. Either signal is recoverable from where we are now.

On AI agents specifically: the commit-17 enforcer agent in the EPIC is designed exactly for this concern. If that agent makes AI prompts reliably produce the right shape, the friction problem is structural-solvable. If it doesn't, the friction is architectural and a retreat is warranted. The agent is the diagnostic, not the cure.

---

## Appendix — pattern history

This is the first exploration doc to question the invocation model of a graph-driven mechanism (as opposed to the declaration model, which `EXPLORATION-data-type-edge-vs-property.md` and `EXPLORATION-tag-vs-edge.md` covered). Future revisits to similar invocation-model questions for CONDITIONAL_ON (commit 13), composite-key validation (commit 14), and APPEARS_IN_VIEW (commit 12) should reference this doc as the precedent — particularly:

- the parse-time-vs-edit-time split (Option 3's `hydrateRun` + `updateField` pair);
- the lifecycle-vs-query carve-out on the 5b ADR (allow lifecycle methods on the engine surface; query methods stay closed);
- the "graph orchestrates without owning values" framing (the boundary the spec articulates is preserved even as the orchestration crosses it).

If a future commit ships a write-path mechanism whose API surface re-opens the "do consumers call cascade directly?" question, the answer is: re-read this doc's Option 3 description first, then check whether the new mechanism composes inside `updateField` or needs its own lifecycle method.

**V1 → V2 evolution (2026-05-13).** V1 of this doc was written morning-of and reviewed same-day. Five rounds of user feedback compressed into the changelog at the top. The notable architectural shift across the revision: V1 framed Option 3 as architecturally tempting but blocked by the 5b boundary; V2 inverts that, accepting Option 3 as the destination after the user's explicit rebuttal of the 5b objection. The lesson for future revisions: when an option is rejected on "this conflicts with prior ADR X," that conflict should be confirmed with the human who owns ADR X before treating it as load-bearing. ADRs evolve.
