> **Date:** 2026-04-25
> **Branch:** 204-v28-migration-safety
> **Status:** RESOLVED 2026-05-03 — Option D picked; concrete shape locked in [`EXPLORATION-option-d-deep-dive.md`](./EXPLORATION-option-d-deep-dive.md) as D-α resolver with explicit form-as-edge declarations. Implementation in commit 11b.
> **Related:**
> - [`EPIC-migration.md`](./EPIC-migration.md) — commit 10's cutover surfaced this question; commit 11b implements the chosen Option D shape
> - [`EXPLORATION-option-d-deep-dive.md`](./EXPLORATION-option-d-deep-dive.md) — successor doc that decides D's concrete shape
> - [`architecture/14-key-lookup-and-renames.md`](./architecture/14-key-lookup-and-renames.md) — current `resolveFieldByAnyKey` shape
> - [`Notes-and-findings.md`](./Notes-and-findings.md) — context entries from commits 4, 5, 5b, 8, 10

# Parser-boundary resolution: should the graph absorb all input shapes?

## Recommendation summary (30-second read)

After commit 10's `RENAMED_FROM` cutover, the graph resolves canonical + camelCase-legacy keys, but parser-boundary callers (csv-parser, csv-field-mapping, field-utils, v2-to-v3-migrator) each still run their own normalization layer (camelCase, leading-underscore handling, `v3_` prefix stripping, display-label-to-camelCase) before asking the graph. This duplication is the architectural smell the user surfaced during commit 10 review.

**Direction picked: Option D — pure edge-keyed exact-match resolver.** The engine does ONE thing — find the edge with this exact string, return the node it points to. No procedural transforms in the engine.

**Concrete shape deferred to [`EXPLORATION-option-d-deep-dive.md`](./EXPLORATION-option-d-deep-dive.md).** User review of this doc surfaced unresolved sub-questions that are too substantial to settle inside the original three-option frame:

1. **Why do specific edge types appear in the resolver chain?** This doc's draft listed `RENAMED_FROM` + `HAS_CSV_HEADER` + `HAS_V3_STORAGE_KEY` as separate reverse-indexed checks. User: *"why can't you just look up the key and see which edges are returned?"* Open question: should the resolver be edge-type-agnostic (find any edge with this string-key, regardless of type) or filtered to a specific subset?
2. **Multi-edge results.** If a string maps to >1 edge of different types, what does the resolver return? What if those edges point to different nodes?
3. **Edge categories.** Should edges declare what they're FOR (inbound parsing / structured-data usage / outbound output)? Today's edge types are heterogeneous: `RENAMED_FROM` is a parsing concern, `HAS_DISPLAY_NAME` is a UI concern, `BELONGS_TO_SECTION` is a structured-data-usage concern. The lookup question gets clearer if categories are explicit.
4. **Display labels with spaces.** Why apply `toCamelCase` at all? Why not declare `'Coins From Black Hole'` as a verbatim edge target? D.1 / D.2 / D.3 from this doc's earlier draft are revisited under the categorization frame.
5. **Schema-version vs game-version separation.** App's V3 storage format ≠ game's V28 export format. The current `RENAMED_FROM { atSchema: 'schema:v3' }` distinguishes by APP schema; game-version is in the schema node payload. User flagged that surfacing this distinction more obviously matters when the next V4 / V29 hits.

**The earlier doc body (Options A / B / C below) is retained as the framing context that produced Option D.** Options A and B are explicitly superseded by D's "no procedural transforms" intent; Option C (status quo) remains the fallback if D's deep-dive concludes the verbosity tradeoff is too steep.

**Per-commit scope holds:** commit 11b implements whatever Option D shape the deep-dive lands on. Depends on commit 11 (`currentSchema()` query for auto-derivation) AND on the deep-dive's edge-categorization conclusion.

## Human decision

**Decided <YYYY-MM-DD> by <author>:**

<One-sentence summary of the decision. Make it copy-pasteable into a commit message.>

**Reasoning (the human's words, captured for future revisits):**

> *"I would want to query the graph for that term just straight up... it finds the edge with that exact term... so that you don't need any of this, hey, let me see if there's a strip value, hey, let me see if there's a direct value, hey, let me see if there's a camel, like, no, just, you get the raw string, and let me find an edge with that exact string. Now, that assumes all edges have a string that can be looked up by too."*

> *"I don't want consumers to have to have knowledge of this. They just get a, you get a string of a field name and you pass it through the graph and you know how to get the node correctly for it... you pass in a string, I get a node back. What that string is maybe has been renamed over time but like the concept hasn't changed."*

> *"I don't know if we actually need a, like, an X one, it's, I guess it's fine to have resolve field by any key, but that, that function just returns you a reference to the node."*

The user explicitly rejected procedural transforms in the engine (rules out Option A's prefix-strip / camelCase fallthrough) AND rejected the two-method API (rules out Option B's `resolveFieldHeader` helper). The vision is **one resolver** that does **exact-match lookup over edge-declared strings**, with the catalog carrying every recognized string form as data.

**Where the decision deviates from the recommendation:**

- *Pending finalization.* Initial leaning (per discussion): Option D, with **D.2** for the display-label-with-spaces residual (one explicit `toCamelCase` retry at the parser boundary). The user noted the residual is acceptable as long as it's a *named, scoped* transform — not a hidden engine fallback.

**Scope of decision (which commits implement it):**

- **commit 11b** (newly added to the epic) — implements the chosen option. Adds `HAS_V3_STORAGE_KEY` (or generalized `HAS_STORAGE_KEY` per open question 5) auto-derived from `SHIPPED_IN_SCHEMA`. Reverse-indexes `HAS_CSV_HEADER`. Cuts over csv-parser, csv-field-mapping, field-utils, v2-to-v3-migrator. Deletes `deriveCanonicalKey`.
- **commit 11** (depends-on) — provides the `currentSchema()` query that 11b's auto-derivation needs.
- **commit 10** (this commit's predecessor) — already shipped; held open pending this decision. If Option D is picked, commit 10 marker flips to `DONE` with a Notes-and-findings entry referencing 11b for the centralization follow-up.

**Status:** discussion captured; decision pending; commit 10 held open until finalization.

**Future revisit triggers:**

- A V4 schema arrives and chooses a different storage prefix (`v4_` vs `v3_`). Confirms the value of the generalized `HAS_STORAGE_KEY` over the specific `HAS_V3_STORAGE_KEY`.
- The legacy V2 clipboard-paste flow is sunset (D.3 becomes the no-op answer).
- A future commit re-introduces parser-side normalization. If that happens, the field-graph-enforcer agent (see [`EXPLORATION-architecture-enforcer-agent.md`](./EXPLORATION-architecture-enforcer-agent.md)) should have a rule catching it.

---

## 1. The problem the user surfaced

Commit 10 cut over every consumer to `resolveFieldByAnyKey`. The cutover delivered: one rename mechanism, hand-authored maps deleted, 153 RENAMED_FROM edges declared, every legacy key resolves through one graph call.

But during code review, the user noticed `field-utils.ts` still had a `deriveCanonicalKey` helper that normalized input *before* asking the graph:

```ts
function deriveCanonicalKey(originalKey: string): string {
  if (originalKey.startsWith(V3_COLUMN_PREFIX)) {
    return originalKey.slice(V3_COLUMN_PREFIX.length);
  }
  if (originalKey.startsWith('_')) {
    return '_' + toCamelCase(originalKey.slice(1));
  }
  return toCamelCase(originalKey);
}

function getFieldConfig(originalKey: string): FieldConfig {
  const camel = deriveCanonicalKey(originalKey);
  const canonicalId = resolveFieldByAnyKey(camel)?.id ?? camel;
  return { type: dataTypeOf(canonicalId) ?? 'number' };
}
```

The user's point: *why does the consumer need a normalization layer at all?* The graph should accept whatever string the caller has and figure out the canonical id. Field-aware logic belongs in the graph, not strewn across consumers.

Looking around the codebase, the same shape lives in three other places:

- **`csv-parser.ts:buildColumnToFieldMap`**: V3-prefix strip, `_underscore` handling, camelCase fallthrough.
- **`csv-field-mapping.ts:createFieldMappingReport`**: same shape — V3-prefix strip, `_underscore` handling, then `resolveFieldByAnyKey(camel)?.id` for legacy resolution.
- **`v2-to-v3-migrator.ts:classifyV2Header`**: V3 prefix doesn't apply here (it's V2 input), but the underscore + camelCase normalization runs.

That's **four files**, each running ~10 lines of "normalize raw header → call graph" plumbing. The patterns are nearly identical. Adding a fifth shape (e.g. snake_case from a future export format) means touching four files.

## 2. The current contract

Per [`architecture/14-key-lookup-and-renames.md`](./architecture/14-key-lookup-and-renames.md) §14.2:

> When the parser reads a raw key from storage or a V28 clipboard paste, it needs to figure out which canonical field node that key maps to. Three scenarios:
>
> - Scenario A — the raw key is already canonical.
> - Scenario B — the raw key is a known legacy.
> - Scenario C — the raw key is unknown.

The spec's "raw key" implicitly assumes camelCase-normalized input. It doesn't address display labels (`'Real Time'`), CSV header overrides (`'_Date'`), or storage prefixes (`'v3_battleReport_tier'`). So today, the contract is:

| Caller-provided shape | Resolved by the graph? |
|---|---|
| Canonical id (`battleReport_tier`) | Yes — direct hit |
| Camel-case legacy (`tier`) | Yes — RENAMED_FROM reverse-index hit |
| Display label (`'Tier'`) | No — caller must `toCamelCase` first |
| Internal-field display (`'_Date'`) | No — caller must `'_' + toCamelCase(rest)` first |
| Storage-prefixed (`'v3_realTime'`) | No — caller must strip the prefix first |
| Storage-prefixed legacy (`'v3_tier'`) | No — strip prefix → graph resolves the suffix |

Every cell in the "No" column is duplicated normalization across consumers. The user's question is whether those should all flip to "Yes."

## 3. Options

### Option A — Absorb all input shapes into `resolveFieldByAnyKey`

The engine's resolution becomes:

```
resolveFieldByAnyKey(raw):
  1. Direct hit on canonical id  (existing)
  2. Strip storage prefix; retry as 1 + 3..6
  3. RENAMED_FROM reverse index  (existing)
  4. HAS_DISPLAY_NAME reverse index   (NEW)
  5. HAS_CSV_HEADER reverse index     (NEW)
  6. camelCase-normalize input; retry as 1, 3, 4, 5
  7. null
```

**What gets deleted:**
- `deriveCanonicalKey` in `field-utils.ts` (entire function)
- The `if (header.startsWith(V3_COLUMN_PREFIX)) ... else if (header.startsWith('_')) ...` ladder in `csv-parser.ts:buildColumnToFieldMap` (entire function collapses to a single resolve call)
- The matching ladder in `csv-field-mapping.ts:createFieldMappingReport`
- The `toCamelCase` + intentionally-dropped check in `v2-to-v3-migrator.ts:classifyV2Header` (mostly — the dropped check stays until commit 11 absorbs it)

**What gets added:**
- Two new reverse indexes built at graph-construction time (`displayNameByLowerCaseIdx`, `csvHeaderByLowerCaseIdx`).
- Storage-prefix stripping via a `currentSchemaPrefix()` query (commit 11's `graph.currentSchema()` payload provides the prefix string).
- Two-three new invariant tests covering: unique display-name index, unique CSV-header index, prefix-strip + retry path.

**Cost:** ~150 LOC engine changes; near-zero LOC change in callers (mostly deletions).

**Risk:** display-name index collisions. Game uses the same label across sections (`'Black Hole'` appears in damage, coins, enemies-hit-by, killed-with-effect-active). Today's `HAS_DISPLAY_NAME` is one-per-Field; building a reverse index requires lowercase-key collisions to be either disallowed (would force the catalog to invent unique display names — bad) or resolved by some priority rule. Spec §11.4 / §15 implies `SHARES_LABEL_WITH` edges acknowledge this collision exists; the resolution rule for the reverse index would need a structural guarantee that "the bare label resolves to the most-section-prominent field" — non-trivial.

This is the single biggest architectural concern with Option A. **The display-label reverse index is more subtle than the RENAMED_FROM index because labels are deliberately reused across sections.**

### Option B — Centralized parser-boundary helper, graph stays narrow

Keep `resolveFieldByAnyKey` as-is (canonical + RENAMED_FROM only). Extract a single `normalizeAndResolve(raw)` helper that lives next to the engine, applying the storage-prefix strip + underscore handling + camelCase fallback before delegating to `resolveFieldByAnyKey`.

```ts
// src/shared/domain/field-graph/parser-boundary.ts
export function resolveFieldHeader(raw: string): Node | null {
  // 1. Strip storage prefix if present
  const stripped = raw.startsWith(currentSchemaPrefix())
    ? raw.slice(currentSchemaPrefix().length)
    : raw;
  // 2. Try direct + RENAMED_FROM resolution
  const direct = resolveFieldByAnyKey(stripped);
  if (direct) return direct;
  // 3. Normalize underscore-prefixed display labels
  const camel = stripped.startsWith('_')
    ? '_' + toCamelCase(stripped.slice(1))
    : toCamelCase(stripped);
  return resolveFieldByAnyKey(camel);
}
```

**What gets deleted:** the same caller-side normalization ladders, replaced by `resolveFieldHeader(header)` calls.

**What stays:** `resolveFieldByAnyKey`'s contract is unchanged (the graph still doesn't know about display labels or storage prefixes — that's the helper's job).

**Cost:** ~50 LOC new helper; deletions in callers.

**Risk:** lower than Option A. The display-label collision problem is sidestepped because the helper falls back to `toCamelCase` of the raw input — which, for game fields with multiple sections sharing a label, yields the bare label as a legacy key (today most multi-section labels have RENAMED_FROM edges pointing to one of the sections; that's the V2-era last-write-wins decision recorded in `V2_TO_V3_FIELD_MAP`).

**Drawback:** the consumer-visible API has *two* parser-boundary entry points: `resolveFieldByAnyKey` (graph-only, raw key matches a declared legacy or canonical) and `resolveFieldHeader` (CSV-shape input, applies normalization). Risk of caller picking the wrong one. Mitigation: lint rule or AST check enforcing that csv/parser code uses `resolveFieldHeader` only, while migration adapters use `resolveFieldByAnyKey` directly.

### Option D — Pure edge-keyed exact-match resolver *(recommended after user review)*

Every recognized form of a string is encoded as an edge with that string as the lookup key. The engine's resolver is a single indexed lookup with no procedural transforms.

```
resolveFieldByAnyKey(raw):
  1. Direct hit on canonical id           (existing — node id index)
  2. RENAMED_FROM reverse index            (existing — payload.legacyKey)
  3. HAS_CSV_HEADER reverse index          (NEW — terminal-target reverse-index)
  4. HAS_V3_STORAGE_KEY reverse index      (NEW — auto-derived edge type)
  5. null
```

**No prefix-stripping. No `toCamelCase`. No fallthrough chain.** The engine just looks up the input string in four reverse indexes and returns the matching node, or null.

**Why this matches the architectural intent better than A or B.** A debugger asks "why didn't `'Foo'` resolve?" and the answer is structural: `'Foo'` isn't a declared key in any of the four indexes. With Options A or B, the answer is procedural: "the camelCase normalization didn't produce a known legacy key, AND the prefix-strip didn't match the schema prefix, AND..." — every step is an opportunity for surprise.

**What gets deleted:**
- `deriveCanonicalKey` in `field-utils.ts` (entire function)
- The `if (header.startsWith(V3_COLUMN_PREFIX)) ... else if (header.startsWith('_')) ...` ladder in `csv-parser.ts:buildColumnToFieldMap`
- The matching ladder in `csv-field-mapping.ts`
- The `toCamelCase` + dropped check in `v2-to-v3-migrator.ts:classifyV2Header` (most of it — the intentionally-dropped check stays until commit 11 absorbs it)

**What gets added:**
- A new edge type `HAS_V3_STORAGE_KEY` (or generalized as a `HAS_STORAGE_KEY` with `atSchema` payload, in case V4 / V5 ever needs distinct prefixes). Auto-derived at catalog build time from `SHIPPED_IN_SCHEMA` declarations + canonical id; ZERO hand-authoring per field.
- One new reverse index for `HAS_V3_STORAGE_KEY` and one for `HAS_CSV_HEADER` (already declared on internal fields; just needs reverse-indexing).
- Invariant test: every node and every recognized-string-form (RENAMED_FROM legacyKey, HAS_CSV_HEADER terminal, HAS_V3_STORAGE_KEY terminal) is unique across the catalog. Build-time error on collision.

**Cost:** Engine: ~80 LOC (reverse-index construction + uniqueness check). Catalog: ZERO hand-authored edges (auto-derivation does the heavy lifting). Caller: ~80 LOC deleted.

**Display-label-with-spaces residual case.** V2 clipboard paste produces headers like `'Coins From Black Hole'`. Today's path: `toCamelCase` → `'coinsFromBlackHole'` → RENAMED_FROM hit → `coins_blackHole`. Three options for handling this:
- **D.1**: Declare `HAS_DISPLAY_LABEL` edges for every Field with a known space-form label. Catalog grows by ~150 entries; auto-derivable from `RENAMED_FROM` legacyKey via `spaceCase()` if we want; zero procedural transforms remain. *Cleanest but most catalog data.*
- **D.2**: Accept ONE pure-transform pass at the parser boundary: caller applies `toCamelCase(raw)` and retries `resolveFieldByAnyKey` once. *Simpler implementation; one pure transform allowed at a clearly-named boundary.*
- **D.3**: Rely on the V28 sectionized parser to never produce space-form headers (it already emits camelCase keys). Display labels are only a concern for the legacy V2 clipboard-paste flow, which is itself end-of-life. *Smallest change; limits the residual concern to a sunset path.*

The user's stated preference is "no procedural transforms in the engine"; D.1 honors that fully, D.2 makes one allowed exception at the boundary, D.3 sidesteps. Recommendation: **D.2** for now (one explicit boundary transform with a comment "this is the last procedural step; everything else is data") with the future option to migrate toward D.1 if the catalog wants the structural property.

**Risk:** display-label collisions disappear because the engine's reverse indexes are over `RENAMED_FROM` legacyKey + `HAS_CSV_HEADER` + `HAS_V3_STORAGE_KEY` — none of which is a free-form display label. Each Field has unique strings on each axis (build-time invariant). The `'Black Hole'` ambiguity from Option A doesn't arise in Option D because `'Black Hole'` is a UI label, not any of these edge values.

**Two-method vs one-method API.** The user explicitly rejected the Option B two-function shape (`resolveFieldByAnyKey` + `resolveFieldHeader`). Option D keeps a single `resolveFieldByAnyKey(raw): Node | null`. The "transform the value" concern (parse number, duration, date) is a SEPARATE consumer responsibility addressed by `dataTypeOf(node)` + parser dispatch — already cleanly separated in field-utils.ts post-commit-10.

### Option C — Status quo (deriveCanonicalKey lives, normalization stays per-caller)

Accept the duplication. Each caller normalizes for its own input shape. Add a comment noting the smell + why it's not worth absorbing.

**Cost:** zero. **Drawback:** duplication, the user's stated concern.

This is what commit 10 shipped. Not viable as an end-state given the user's review feedback.

## 4. Comparison matrix

| Concern | **Option D** *(recommended)* | Option A | Option B | Option C (today) |
|---|---|---|---|---|
| Eliminates per-caller normalization | ✓ all four files | ✓ all four files | ✓ all four files | ✗ |
| Engine surface change | + 2 reverse indexes (no procedural transforms) | + 2 reverse indexes + procedural fallthrough | + 1 helper function (procedural) | none |
| **Procedural transforms in engine** | **NONE** | yes (prefix-strip, camelCase fallback) | none (helper has them) | none |
| Display-label collision handled structurally | sidestepped (no display-label index) | requires invariant decision | sidestepped (falls back to camelCase) | sidestepped |
| Storage-prefix handled as data | ✓ auto-derived edges (commit 11 unlocks) | ✗ procedural strip in engine | ✗ procedural strip in helper | ✗ hardcoded in caller |
| Adding a future input shape (e.g. snake_case) | declare an edge or one explicit transform | one place: graph (procedural) | one place: helper | four places |
| Risk of caller picking wrong API | low (one function) | low (one function) | medium (two functions) | n/a |
| Catalog-data growth | ~150 auto-derived storage-key edges | 0 | 0 | 0 |
| LOC delta | engine +80, catalog auto-derivation, callers −80 | engine +150, callers −80 | helper +50, callers −80 | 0 |
| Restructures resolveFieldByAnyKey contract | extends (more reverse indexes; same behavior) | yes (significant; adds procedural fallthrough) | no | no |
| Matches user's stated architectural intent | ✓ fully | partial (procedural transforms remain) | partial (just moved to helper) | ✗ |

## 5. Tier-with-`+` parsing — related concern

A second smell the user surfaced during the same review: tier extraction logic exists in two places (`data-parser.ts:extractKeyStatsFromFields` and `run-type-detection.ts:extractNumericStats`), both running an identical regex to extract the leading integer from values like `"10+"`. This is per-field-id logic — the graph is supposed to subsume it.

**This is commit 9's territory** (derivations). Per spec §11.3, the planned shape is:

```ts
edge('_runType', 'IS_DERIVED_FROM', 'battleReport_tier', { deriver: 'deriver:runTypeFromTier' }),
```

The deriver function takes the tier `rawValue`, returns `'tournament'` if `'+'` suffix is present else `'farm'`. `_runType` then derives from tier when not explicitly provided. The leading-int extraction for `tier` itself is either:
- A separate self-deriver (`battleReport_tier IS_DERIVED_FROM battleReport_tier { deriver: 'parseTierLeadingInt' }`) — feels weird.
- A new data type `'tier'` with custom number-parsing logic — cleanest.
- A parseShorthandNumber improvement (handle trailing `+` as no-op terminator) — narrowest fix; doesn't surface as field-aware.

**Recommendation:** address as part of commit 9 (derivations). Add the data-type-or-self-deriver decision to that commit's scope.

## 6. Per-commit impact

If Option D (recommended) is picked, the proposed commit shape:

| Commit | Change |
|---|---|
| 10 (this) | No change to shipped scope. Breadcrumbs updated to point at 11b. |
| 11 | Schema lifecycle edges + `currentSchema()` query as a side-effect of `SHIPPED_IN_SCHEMA` work. Provides the data Option D needs to auto-derive storage-key edges. |
| **11b (NEW)** | Implement Option D. Add `HAS_V3_STORAGE_KEY` edge type + auto-derivation at catalog build time. Reverse-index `HAS_CSV_HEADER` and `HAS_V3_STORAGE_KEY`. Cut over csv-parser, csv-field-mapping, field-utils, v2-to-v3-migrator to single-call graph resolution. Delete `deriveCanonicalKey`. Add invariant tests for cross-axis uniqueness (no string in two reverse indexes resolves to different fields). Decide D.1 / D.2 / D.3 for display-label-with-spaces residual. |
| 9 (unchanged framing; tier scope expanded) | Already in scope: `IS_DERIVED_FROM` edges + DERIVERS registry. **Tier scope explored separately** — see [`EXPLORATION-tier-handling.md`](./EXPLORATION-tier-handling.md) for the data-type vs self-deriver vs parser-fix tradeoff. |

If Option C (status quo) is picked, no commit change needed. Add Notes-and-findings entries documenting the accepted-as-debt decision.

## 7. Open questions for the human

1. **Display-label-with-spaces residual** (Option D's sub-question). Pick D.1 (declare `HAS_DISPLAY_LABEL` edges — no procedural transforms anywhere), D.2 (one explicit `toCamelCase` retry at parser boundary), or D.3 (rely on V28 sectionized parser to never produce space-form headers; the legacy V2-clipboard-paste path is sunset). My recommendation: **D.2** balances purity with simplicity — one named, scoped transform at the boundary, "everything else is data."

2. **Tier-`+` parsing.** Spun off into [`EXPLORATION-tier-handling.md`](./EXPLORATION-tier-handling.md) as its own decision. Outcome feeds commit 9.

3. **Two-method vs one-method API.** User explicitly rejected Option B's two-function shape. Option D keeps one resolver: `resolveFieldByAnyKey(raw): Node | null`. Confirmed in user's vision capture: *"I don't know if we actually need a, like, an X one... resolve field by any key, but that function just returns you a reference to the node."*

4. **Scope of commit 11b.** Separate commit immediately after 11 (since it depends on `currentSchema()` from 11). Schema lifecycle is data-only; 11b is engine-API change. Different review surfaces.

5. **`HAS_V3_STORAGE_KEY` vs generalized `HAS_STORAGE_KEY`.** When V4 ships, will it use a different storage prefix (`v4_`)? If yes, generalize the edge with an `atSchema` payload now (zero extra cost, future-proof). If V4 always inherits the V3 prefix, keep it specific. My recommendation: generalize.
