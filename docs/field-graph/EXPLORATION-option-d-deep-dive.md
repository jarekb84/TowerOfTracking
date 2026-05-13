> **Date:** 2026-05-03
> **Branch:** 204-v28-migration-safety
> **Status:** Decided 2026-05-03 — D-α resolver, no categories, build-time collision errors, declare every form as explicit edges, schema-version only. Feeds commit 11b.
> **Related:**
> - [`EXPLORATION-parser-boundary-resolution.md`](./EXPLORATION-parser-boundary-resolution.md) — parent doc; picked Option D as the direction and deferred its concrete shape here
> - [`EPIC-migration.md`](./EPIC-migration.md) — commit 11b implements whatever this doc lands on; commit 11 (`SHIPPED_IN_SCHEMA` + `currentSchema()`) is a soft dependency for D-α auto-derivation
> - [`architecture/14-key-lookup-and-renames.md`](./architecture/14-key-lookup-and-renames.md) — current `resolveFieldByAnyKey` contract
> - [`src/shared/domain/field-graph/types.ts`](../../src/shared/domain/field-graph/types.ts) — `Edge`, `EdgeType`, `EDGE_META` cardinality table

# Option D deep dive — concrete shape for the pure edge-keyed resolver

## Recommendation summary (30-second read)

The parent doc picked Option D ("the engine does ONE thing — find the edge with this exact string, return the node it points to"). User review surfaced five sub-questions that the original three-option frame didn't resolve. This doc surfaces options for each; it does not pick.

The five sub-questions cluster into one architectural question — **how much structure does the catalog put on edges, and how much does the resolver assume about that structure?** A leaning, NOT a pick:

- **Sub-Q 1 (edge-type-aware vs agnostic):** edge-type-agnostic resolver (D-β) only works cleanly if Sub-Q 3 lands "edges have categories." Without categories, a Field's `HAS_DISPLAY_NAME 'Tier'` would compete with the edge whose `to: 'Tier'` is a Section's display name. With an `inbound` category filter, the resolver becomes "find the inbound-category edge with this string" and the question of "which edge wins" mostly evaporates because the catalog declared which edges are eligible.
- **Sub-Q 2 (multi-edge collisions):** with categories in place, the remaining collision class is "two inbound-category edges declare the same string for two different fields" — that should be a build-time error, full stop. Without categories, collisions are routine and the resolver needs a priority rule, which is fragile.
- **Sub-Q 3 (edge categories):** introducing `direction: 'inbound' | 'outbound' | 'structural'` (or similar) cleanly partitions the resolver problem and makes future edge-type additions self-classifying. The cost is a new taxonomy decision per edge type and a tougher classification call for `HAS_CSV_HEADER` (genuinely both-direction). This is the load-bearing decision for the rest.
- **Sub-Q 4 (display labels with spaces):** if Sub-Q 3 lands categories, the cleanest story is **D.1 (declare every recognized form as an inbound edge)** — auto-derived from `RENAMED_FROM` legacyKey via `spaceCase()` at catalog build time. Engine has zero string-transform logic. The user's quote "*every field would have to be defined in the edge configurations... it does bring clarity, I think*" captures the tradeoff.
- **Sub-Q 5 (schema-version vs game-version):** the two axes are orthogonal. `RENAMED_FROM.atSchema` references the **app schema** (drives migration gate). A new `gameVersion?: string` payload field on inbound edges captures the **game version** (drives "where did this name come from?" tooling). The `appVersion` / `gameVersion` payload on Schema nodes today already half-acknowledges this; making it explicit on the inbound-edge level surfaces the lineage cleanly.

These five answers are coupled. Picking one constrains the others. The Human decision section below collects the choices in one place.

## Human decision

**Decided 2026-05-03 by Jarek:**

Commit 11b implements a **simple, edge-type-aware resolver (D-α)** that hard-codes a handful of named edge lookups (canonical id → RENAMED_FROM → HAS_CSV_HEADER → schema-prefixed key). **No edge-category abstraction; no `toCamelCase` transform.** Every recognized form of a field name is declared as an explicit edge — casing variants count as renames. Schema lineage uses the existing app-schema axis only; no game-version axis. Collisions are build-time errors.

**Reasoning (the human's words, captured for future revisits):**

> *"having lookup by the, you know, Kanako ID, legacy ID, etc. That makes, maybe it's a decent draw, trade off right now. Like we only have two, maybe three, maybe four edges that we can look up. So it's not quite a category of issue right now."*

> *"if we did add a, you know, category, like, do you want to prioritize them, and then you're adding another field to the node to edge types. And so, you're making a more complex solution, but it's unclear if the problem actually needs it."*

> *"every field would have to be defined in the edge configurations... it does bring clarity, I think... so let's not do two camel casing."*

> *"the schema we're talking about is, should for now be the app schema. And maybe in the future we can, we can consider adding something else for game schemas, if, if it makes sense. But I think, again, right now would be premature."*

> *"I've appreciated how we've created these deep dive docs for these discussions that are clear, but I want to make some progress on that."*

The user explicitly chose the simplest mechanically-consistent shape on every sub-question, ruling out abstractions that would be valuable at scale but premature now. The bias is "ship the simple shape, revisit if/when the edge-type count or collision rate makes the simple shape painful." Multiple sub-questions are noted as **deferrable** rather than rejected — see grab-bag list below.

**Sub-decisions:**

- **Sub-Q 1 — Resolver shape:** **D-α (edge-type-aware)**. Hard-code the named edge lookups in the resolver. Adds maintenance cost when a new alias edge type lands (~6-month estimated frequency), accepted vs the maintenance cost of a new category taxonomy.
- **Sub-Q 2 — Multi-edge collisions:** **Build-time error (collision-as-bug).** No priority rule. If a string is declared as a legacy key for one field AND a CSV header for another, the catalog build fails loud. User noted they're not certain whether collisions are always invalid, but absence of a known valid case ⇒ start strict.
- **Sub-Q 3 — Edge categories:** **No categories.** Premature with current edge-type count (~24, but only 2-4 participate in resolution). Revisit if (a) resolver maintenance becomes painful as new alias-shaped edge types arrive, or (b) a clear category split surfaces from a different concern. Captured in deferred-grab-bag.
- **Sub-Q 4 — Display labels with spaces:** **D.1 (declare every form as explicit RENAMED_FROM edges).** No `toCamelCase` transform anywhere. Casing-change-as-rename is the user's explicit model. The catalog grows by N entries per recognized form, accepted in exchange for searchability (a future AI agent can find every name a field has had by grepping `RENAMED_FROM`). Auto-derivation of edges from canonical-id NOT used — explicit declaration wins.
- **Sub-Q 5 — Schema vs game version on edges:** **S-1 (`atSchema` only; app-schema axis).** No game-version edge axis. The user noted that game-export field renames happen between minor game patches (not just major versions), so capturing them on a per-game-version axis isn't useful at this scale. Revisit only if a future migration genuinely needs the distinction.

**Naming cleanup folded into commit 11b:** rename `resolveFieldByAnyKey` to something shorter (e.g. `resolveField` or `getFieldByAlias`). The "by any key" name leaks implementation detail. Internal lookups should reference the participating edge by edge-type name (`renamedFrom` lookup, `csvHeader` lookup, etc.) — NOT invent new terms like "legacy ID" or "canonical ID" that don't appear elsewhere in the codebase.

**Where the decision deviates from the recommendation:**

- Doc's leaning was toward edge categories + D.1 auto-derivation as a coupled choice. User rejected categories (premature for 2-4 edges) and rejected auto-derivation (loses searchability). The chosen shape is D-α + explicit-edge D.1 — simpler than the doc's leaning, more verbose at the catalog layer, no engine-side procedural transforms. Conceptually consistent with the user's overarching vision: **"configuration over convention."**

**Scope of decision (which commits implement it):**

- **commit 11b** (parser-boundary resolver centralization) — implements D-α with explicit edges per the sub-decisions. Declares ~150 V3-storage-prefixed-form edges + ~150 V2-display-form edges (with spaces and capitalization). Likely uses the existing `RENAMED_FROM` edge type for both, since casing-change = rename. Adds a `HAS_V3_STORAGE_KEY` (or similar) only if needed for collision avoidance; otherwise V3 storage forms ride on `RENAMED_FROM` too. Renames `resolveFieldByAnyKey` → cleaner name. Build-time invariant: every inbound lookup-string is unique across all edges.
- **commit 10** (predecessor) — flips to `DONE` immediately. The shape commit 10 left in place is consistent with what 11b will refactor; no commit-10 rework needed.

**Future revisit triggers (grab-bag — re-open if any fires):**

- **Edge categories**: a new edge type lands where direction (inbound vs outbound) is genuinely ambiguous AND a real consumer needs the distinction. Today's `HAS_CSV_HEADER` is the only borderline case; if it doesn't grow company, categories stay deferred.
- **Auto-derivation of forms from canonical id**: if commit 11b's catalog growth makes hand-authoring painful (e.g. >300 edges per concept), revisit whether `spaceCase()` / similar transforms run at catalog build time. Trade-off: searchability vs verbosity.
- **Game-version edge axis**: a future migration needs to express "this field was renamed in game V29 but not in app schema V4." Today neither has happened; defer.
- **`+`-suffix sunset for tier**: V28 game exports never produce `+` suffix. If a year passes with no `+`-tier import detected, the special-casing in commit 9's `'tier'` data type becomes a deletion candidate.
- **`resolveFieldByAnyKey` rename**: small code change touching ~13 files; done as part of commit 11b's refactor rather than as a standalone rename commit.

---

## 1. Edge-type-aware vs edge-type-agnostic resolver

### The question

Today's `resolveFieldByAnyKey` (see [`field-graph.ts:221`](../../src/shared/domain/field-graph/field-graph.ts)) hits two indexes by name:

```ts
resolveFieldByAnyKey(rawKey: string): Node | null {
  const direct = this.getField(rawKey);                        // 1. canonical id index
  if (direct) return direct;
  const canonical = this.legacyKeyIdx.get(rawKey);              // 2. RENAMED_FROM legacyKey index
  return canonical ? this.getField(canonical) : null;
}
```

The parent doc's Option D draft proposed adding two more named indexes (`HAS_CSV_HEADER` reverse, `HAS_V3_STORAGE_KEY` reverse). The user's question challenges that shape directly: *"why can't you just look up the key and see which edges are returned?"*

Two sub-shapes of Option D follow:

### D-α: specific edge types in the resolver (current draft)

The engine knows by name which edge types feed lookup. Internally:

```ts
// at construction time, build per-type reverse indexes
this.byCanonicalIdIdx     // canonical Field ids
this.byLegacyKeyIdx        // RENAMED_FROM payload.legacyKey
this.byCsvHeaderIdx        // HAS_CSV_HEADER terminal `to`
this.byStorageKeyIdx       // HAS_V3_STORAGE_KEY terminal `to`

// at resolve time, sequential check
resolveFieldByAnyKey(raw):
  return byCanonicalIdIdx.get(raw)
      ?? byLegacyKeyIdx.get(raw)
      ?? byCsvHeaderIdx.get(raw)
      ?? byStorageKeyIdx.get(raw)
      ?? null
```

**Pros:**
- Explicit. Reading the resolver tells you exactly which edge types participate.
- Per-type indexes can have per-type validation (e.g. `HAS_CSV_HEADER` always points at a Field; `RENAMED_FROM` payload validation already runs).
- Per-type ordering is easy to reason about: canonical wins over legacy, etc.

**Cons:**
- Adding a new alias edge type (say `HAS_GAME_EXPORT_HEADER` for V29) requires updating the resolver. The "scales without resolver maintenance" promise the user wants doesn't hold.
- The taxonomy of "edge types that participate in resolution" lives implicitly in the resolver code, not in the catalog.
- Two callers' debugging questions get split: "which edge type does my string match?" requires reading the resolver to know.

### D-β: edge-type-agnostic resolver

Build ONE reverse index over every string-keyed lookup-eligible edge in the catalog. Resolution is a single map lookup:

```ts
// at construction time, scan every edge that has a "lookup string"
for (const e of edges) {
  if (e.type === 'RENAMED_FROM') addToIdx(e.payload.legacyKey, e.from);
  // generalize: any edge whose `to` is a terminal AND is marked
  // "participates in resolution" contributes its `to` string
  else if (isInboundCategory(e.type)) addToIdx(e.to, e.from);
}

// at resolve time
resolveFieldByAnyKey(raw):
  return canonicalIdIdx.get(raw)
      ?? unifiedAliasIdx.get(raw)
      ?? null
```

**Pros:**
- Adding a new alias edge type means: (a) declare the edge type, (b) categorize it as inbound. The resolver picks it up automatically.
- Catalog is the single source of truth for "what string forms resolve."
- Matches the user's mental model: *"you get a string, find the edge with that exact string."*

**Cons:**
- Requires Sub-Q 3's answer to land cleanly. Without an `inbound` category, the resolver doesn't know which edges to scan. Falling back to "scan EVERY terminal-target edge" sweeps `HAS_DISPLAY_NAME`, `HAS_COLOR` into the index — wrong (display names are UI-direction strings, not lookup keys).
- Per-type-specific validation (legacy keys must not collide with node ids; csv headers may legitimately repeat across schemas) gets harder to attach.
- Debug introspection tools (`graph:describe`) lose the "this string is a CSV header for field X" sub-classification unless the unified index keeps the contributing edge type as metadata.

### Three concrete scenarios

**Scenario 1 — V3 storage parser reads `'v3_battleReport_tier'`.** D-α: prefix-strip happens at the boundary (or as a pre-scan in the engine), then `byCanonicalIdIdx` hits. D-β: same — but if `HAS_V3_STORAGE_KEY` edges are declared (one per field carrying the prefixed string `'v3_battleReport_tier'`), the unified index hits directly with no prefix-strip step. D-β strictly requires the edges to exist; D-α can fake it with one prefix-strip line in the engine.

**Scenario 2 — V2 clipboard parser reads `'tier'` (legacy bare name).** Both shapes hit on the RENAMED_FROM legacyKey index; resolution returns `battleReport_tier`. No difference.

**Scenario 3 — A future V29 export emits `'tier_with_a_plus'` as a tournament-tier marker.** D-α: developer writes a new `HAS_V29_GAME_EXPORT_KEY` edge type, updates `EDGE_META`, adds a fourth named index to the resolver, declares the edges. D-β: developer writes a new edge type, marks it as an inbound-category edge, declares the edges. The resolver doesn't change.

### Comparison

| Concern | D-α | D-β |
|---|---|---|
| Resolver requires update per new alias edge type | yes | no (if categorized) |
| Per-type validation (legacy-key uniqueness, schema-existence) | natural | requires per-type validation hooks during construction |
| Debug introspection (`why did 'foo' resolve?`) | natural — name the index that hit | requires preserving contributing edge type as metadata |
| Resolver code length | grows with edge-type count | constant |
| Coupling to Sub-Q 3 (categories) | independent | required |

Recommendation leaning: D-β is the user's stated vision, but it's a package deal with categories. If Sub-Q 3 lands "no categories," fall back to D-α to avoid silently hoovering UI-direction edges into the resolver.

---

## 2. Multi-edge results — collision-as-bug vs collision-as-feature

### The question

Imagine a catalog where `'Black Hole'` is registered both as a `RENAMED_FROM.legacyKey` for `damage_blackHole` (V2 input form) AND as a `HAS_DISPLAY_NAME.to` for `coins_blackHole` (UI label). User: *"would they both point to the same node? Could it be misleading if a has display label look returns the, the wrong node?"*

The answer depends on (a) whether `HAS_DISPLAY_NAME` participates in resolution at all (Sub-Q 3 territory) and (b) whether collisions across participating edge types are tolerated.

### Collision-as-bug

Build-time invariant: every string registered for resolution must map to exactly ONE Field node. If `'Black Hole'` is both a legacy key for one field and a CSV header for another, the build fails with the two claimants named.

**Pros:**
- Forces catalog clarity. Two fields can't claim the same input form silently.
- Removes ambiguity from the resolver — every string has at most one answer.
- Matches the existing legacy-key uniqueness invariant in [`field-graph.ts:158`](../../src/shared/domain/field-graph/field-graph.ts) (`checkLegacyKeyUnique`); just generalize the rule across all participating edge types.

**Cons:**
- Across the four input shapes (canonical, legacy, CSV header, storage key), a string can legitimately repeat. Example: `'_Date'` is BOTH the canonical id-strip-prefix-form `_date` (no — `_Date` would never appear as canonical) AND the CSV header. Realistically: legacy keys and CSV headers are disjoint enough that collisions are rare; if they happen, treating them as bugs is correct.
- A future field whose canonical id equals another field's legacy key crashes the build. The current `checkLegacyKeyUnique` rule already enforces this for legacy-vs-canonical; generalizing is consistent.

### Collision-as-feature (priority rule)

Allow collisions. The resolver picks the "best" match by some priority:

**Edge-type priority** (e.g. `canonical > RENAMED_FROM > HAS_CSV_HEADER > HAS_STORAGE_KEY > HAS_DISPLAY_NAME`):
- Resolution is deterministic.
- Adding a new edge type requires extending the priority order — same maintenance trap as D-α.
- "Why did this string resolve to this node?" requires reading the priority table.

**Node-type priority** (e.g. Field > anything-else):
- Less useful here because every participating edge points at a Field already (current `EDGE_META` constraints).
- Doesn't disambiguate between two Fields claiming the same key.

**Section / view-prominence priority** (e.g. "the Field with the most BELONGS_TO_SECTION edges wins"):
- Conceptually plausible for display-name collisions (the "primary" `'Black Hole'` is the damage one).
- Computed at construction time from the graph itself — feels too magical, hides intent.

### What about the "same node" case?

If both edges point at the SAME node, no collision exists. Returning the node is unambiguously correct. The build can permit this case but it's also dead-coding (why register the same string as both a legacy key and a CSV header for the same field?). Recommendation: also flag as a build-time warning — "duplicate registration for `_date`: both RENAMED_FROM and HAS_CSV_HEADER." Not an error, but a smell.

### Misleading-result risk

The user's concern *"could it be misleading if a has display label look returns the wrong node?"* is the strongest argument for the category answer in Sub-Q 3. If `HAS_DISPLAY_NAME` doesn't participate in resolution at all (because it's outbound-only), the misleading-result class disappears entirely. This is structural: not "we promise the resolver won't hit display-name edges," but "the resolver structurally cannot hit them because they're not in the inbound index."

### Comparison

| Concern | Collision-as-bug | Edge-type priority | Node-type / prominence priority |
|---|---|---|---|
| Resolution determinism | yes (single answer) | yes | yes |
| Adding a new edge type | classification only | classification + priority slot | classification only |
| Build-time signal of catalog drift | strong (build fails) | none (silent best-match) | none |
| Surfaces real ambiguity for human review | yes | hides it | hides it |
| Maintenance complexity | low | medium | high |

Recommendation leaning: collision-as-bug is the cleaner answer, on the same principle as the existing `checkLegacyKeyUnique` invariant. The graph already adopts "fail loud at build time" elsewhere; extending that to all participating edge types is consistent.

---

## 3. Edge categories — should edges declare what they're FOR?

### The question

The user's three-bucket framing: *"is there like parsing edges and are there, um, reading edges?"* The implicit categories:

- **Inbound:** parsing unstructured data → structured data. The resolver's eligible inputs.
- **Processing / structural:** structured-data-in-memory relationships. Don't participate in lookup; drive aggregation, validation, derivation.
- **Outbound:** structured data → output format. UI rendering, export formatting.

If edges declare their direction explicitly, the resolver problem partitions cleanly:
- Resolver only scans inbound-category edges.
- UI rendering only reads outbound-category edges.
- Aggregation / derivation / validation only walk structural edges.

### Classification of every existing EdgeType

Going through [`types.ts`](../../src/shared/domain/field-graph/types.ts)'s `EdgeType` union one by one:

| Edge type | Proposed category | Notes |
|---|---|---|
| `BELONGS_TO_SECTION` | structural | drives section rendering, but as "which fields belong here?" — a graph-walk, not a string lookup |
| `BELONGS_TO_CATEGORY` | structural | same as above |
| `IS_SOURCE_OF` | structural | aggregation source tracking |
| `IS_DERIVED_FROM` | structural | derivation cascade |
| `APPEARS_IN_VIEW` | structural | view membership |
| `APPEARS_IN_FILTER` | structural | filter membership |
| `SHARES_LABEL_WITH` | structural | sibling relationship; not a lookup key |
| `PARTICIPATES_IN_COMPOSITE_KEY` | structural | composite-key membership |
| `REPLACED_BY` | structural | sibling rename relationship |
| `INTENTIONALLY_DROPPED_IN_SCHEMA` | structural | schema lifecycle |
| `IS_CORRELATED_WITH` | structural | analytics relationship |
| `SHIPPED_IN_SCHEMA` | structural | schema lifecycle |
| `MIGRATED_TO_SCHEMA` | structural | schema lifecycle |
| `RENDERS_AS_IN_SECTION` | structural / outbound | borderline — tells UI how to render in a specific section. Probably structural |
| `IS_REQUIRED_IN` | structural | validation membership |
| `CONDITIONAL_ON` | structural | form-clearing relationship |
| `ACCEPTS_VALUE` | structural | enum acceptance — relates Field to EnumValue node |
| `IS_INTERNAL_FIELD` | structural | marker |
| `HAS_DISPLAY_NAME` | **outbound** | UI label; not a lookup key |
| `HAS_COLOR` | **outbound** | UI color; not a lookup key |
| `HAS_CSV_HEADER` | **inbound + outbound** | the one genuine ambiguity (see below) |
| `IS_OF_TYPE` | structural | parser dispatch — drives behavior, but isn't a lookup key |
| `HAS_STRING_VALUE` | structural / outbound | EnumValue's wire string; can match input or rendered output |
| `RENAMED_FROM` | **inbound** | legacy key resolution |

So the classification at a glance:
- **Inbound:** RENAMED_FROM. Plus future HAS_V3_STORAGE_KEY / HAS_GAME_EXPORT_KEY / etc.
- **Outbound:** HAS_DISPLAY_NAME, HAS_COLOR.
- **Structural:** everything else (~17 edge types).
- **Ambiguous:** HAS_CSV_HEADER (both — see below). HAS_STRING_VALUE (probably structural; needs review).

### The HAS_CSV_HEADER straddler

`HAS_CSV_HEADER` is genuinely both:
- **Inbound:** when reading a CSV import, the parser sees `'_Date'` as a column header and needs to resolve it to the canonical `_date` field.
- **Outbound:** when writing a CSV export, the exporter renders the canonical field as `'_Date'` in the header row.

Three options for handling:

**Option C-1: Two separate edge types (`HAS_CSV_INPUT_HEADER` + `HAS_CSV_OUTPUT_HEADER`).**
- Pro: each has one direction, classification is clean.
- Con: ~5 internal-field declarations double; inputs and outputs are likely identical strings, so this duplicates data.
- Con: a future "synonym input forms" need (e.g. accept `'Date'` as well as `'_Date'`) is awkward to model — `HAS_CSV_INPUT_HEADER` becomes `cardinality: 'many'` while `HAS_CSV_OUTPUT_HEADER` stays `cardinality: 'one'`. This is actually a useful shape, not a bug.

**Option C-2: One edge type with `categories: ['inbound', 'outbound']` (multi-category).**
- Pro: one declaration, two roles.
- Con: every category-aware query has to handle the multi-category case. Resolver scans this edge AND the exporter reads it. The "resolver only scans inbound" rule becomes "resolver scans edges whose categories includes 'inbound'."
- Con: subtler — encourages other edge types to acquire multiple categories, eroding the partition.

**Option C-3: One edge type with implicit category (no `direction` declaration).**
- Pro: smallest catalog change. Status quo.
- Con: defeats the point of categorizing — exactly the implicit "everyone knows what edges are for" model that Sub-Q 3 was meant to fix.

### Verdict on categories

If categories are adopted, recommendation leaning: **C-1 (split HAS_CSV_HEADER into two edge types)** because:
1. It preserves the "one edge has one direction" rule structurally, not by convention.
2. The cardinality difference (input may have synonyms; output is canonical-one) actually surfaces a real distinction.
3. Five fields × two declarations = ten edges. The duplication is small and visible.

The cost of categories overall: every new edge type needs a one-line classification call. The benefit: Sub-Q 1 + Sub-Q 2 simplify dramatically. Net: worth it, IF the team is comfortable with "edges have direction" as a permanent design discipline.

### How categories would be expressed in code

Two flavors:

**Flavor 1: a discriminator on `EdgeMeta`:**

```ts
// types.ts
export type EdgeDirection = 'inbound' | 'outbound' | 'structural';

export interface EdgeMeta {
  readonly sourceKind: NodeKind | readonly NodeKind[];
  readonly targetKind: EdgeTargetKind;
  readonly cardinality: Cardinality;
  readonly symmetric?: boolean;
  readonly direction: EdgeDirection;   // NEW
}
```

Engine uses `EDGE_META[type].direction` in the resolver. Test: every EdgeType has a direction declared.

**Flavor 2: a separate registry:**

```ts
const INBOUND_EDGE_TYPES = ['RENAMED_FROM', 'HAS_V3_STORAGE_KEY', 'HAS_CSV_INPUT_HEADER'] as const;
```

Engine reads from the registry. Less integrated; easier to forget to update.

Flavor 1 is cleaner and matches how `cardinality` / `symmetric` already work. Recommendation leaning: Flavor 1.

### Comparison

| Concern | No categories | Categories (C-1: split CSV header) | Categories (C-2: multi-category) |
|---|---|---|---|
| Resolver knows what edges to scan | implicit (must hardcode in resolver) | explicit (filter by direction) | explicit (filter by direction array) |
| HAS_CSV_HEADER handled | implicit (whoever reads it knows the role) | structural (split into 2 edge types) | structural (one type, two categories) |
| New edge type ceremony | none | one-line classification | one-line classification |
| Misleading resolver result possible | yes (Sub-Q 2 risk) | no (structural barrier) | no (structural barrier) |
| Catalog data growth | none | +5 edges (CSV header split) | none |
| Coupling between sub-questions | tight (Sub-Q 1 + 2 stay messy) | loose (each sub-question simpler) | medium |

---

## 4. Display labels with spaces

### The question

V2 clipboard paste produces headers like `'Coins From Black Hole'`. Today the parser does `toCamelCase('Coins From Black Hole')` → `'coinsFromBlackHole'` → RENAMED_FROM hit → `coins_blackHole`. The user pushed back on the camelCase step: *"why apply this transformation, why not just look up coins from black hole as the direct stream of spaces and uppercase, you know, uppercase first letters."*

The user's vision: declare `'Coins From Black Hole'` as a verbatim recognized form. No procedural transform anywhere.

The three sub-options from the parent doc, refined for this deep-dive:

### D.1 — Declare every recognized form as an edge

For every Field that has a known display-label-with-spaces input form (V2 clipboard headers, UI labels users might type into a search bar, etc.), declare the verbatim string.

Two flavors:

**D.1-a: Add `'Coins From Black Hole'` as a `RENAMED_FROM` legacyKey.**
- Pro: reuses existing edge type.
- Con: semantically RENAMED_FROM means "this canonical was previously known by name X" — a name-form-history claim. A space-separated UI label isn't really "a previous name" in the same sense; it's "an alternate input form." Loose semantics.
- Con: today's `RENAMED_FROM` payload validation expects `legacyKey` to look like a code identifier (it doesn't enforce this, but the catalog convention is consistent). Adding `'Coins From Black Hole'` breaks the visual pattern in the catalog file.

**D.1-b: New edge type `HAS_DISPLAY_LABEL` (inbound).**
- Pro: clean semantic split. `HAS_DISPLAY_NAME` is outbound (what the UI renders); `HAS_DISPLAY_LABEL` is inbound (what the parser accepts as a label form).
- Pro: catalog file separates the two concerns visually.
- Con: catalog grows by ~150 entries (one per Field — although see the auto-derivation note below).

**Auto-derivation:** the catalog can auto-derive `HAS_DISPLAY_LABEL` edges at build time from `RENAMED_FROM.legacyKey` via `spaceCase()` (camelCase → space-separated, capitalize). For `legacyKey: 'coinsFromBlackHole'`, derive `HAS_DISPLAY_LABEL: 'Coins From Black Hole'`. Most cases work. Edge cases (acronyms, special characters) need overrides — those become explicit declarations.

If the catalog auto-derives, the boilerplate cost is zero per field; manual overrides handle the few edge cases.

### D.2 — One explicit `toCamelCase` retry at the parser boundary

Keep the engine pure (exact-match indexed lookup only). Outside the engine, in the parser-boundary helper, do ONE retry:

```ts
// parser-boundary.ts
export function resolveFieldHeader(raw: string): Node | null {
  const direct = appGraph().resolveFieldByAnyKey(raw);
  if (direct) return direct;
  // explicit, named, scoped retry — the ONLY procedural transform
  return appGraph().resolveFieldByAnyKey(toCamelCase(raw));
}
```

But the parent doc's user-quote section explicitly rejected the two-method API: *"I don't know if we actually need a, like, an X one... resolve field by any key, but that function just returns you a reference to the node."* So D.2 either:
- Becomes "the engine itself does one toCamelCase retry" (procedural transform in engine — exactly what user rejected for Option D).
- Becomes a parser-boundary helper that wraps the engine call (two-function API — also rejected).

So D.2 is hard to land cleanly given the user's stated constraints. It survives only as a transitional fallback.

### D.3 — Sunset the V2-clipboard space-form input path

V28 sectionized parser already emits camelCase. Display-label-with-spaces is only a concern for the legacy V2 clipboard-paste flow, which is end-of-life:

- Bulk import in production now expects V28 sectionized headers.
- Manual single-entry uses canonical fields directly.
- Backups in `sampleData/` are V2-storage shape (camelCase keys), not display-label shape.

If V2-clipboard-paste truly is sunset, the answer to "how do we handle space-form headers" is "we don't — the path is gone."

**Risk:** users might still paste from old game-export forms or external tools that produce space-form labels. Worth checking: does any production usage path still produce space-form headers today? If no, D.3 is the no-op answer.

### Verbosity tradeoff

The user's own framing on D.1's verbosity:

> *"every field would have to be defined in the edge configurations. And so you might have the same concept enshrined in code, like these edge definitions, four times over. And that is just configuration data, so it's a lot of boilerplate. So it may make things like verbose, but it does bring clarity, I think."*

The boilerplate count for a typical field at maximum-D.1 (every recognized form declared):

```ts
// 1. Node declaration
export const COINS__BLACK_HOLE_NODE = fieldNode('coins_blackHole');

// 2. Legacy V2 storage form (camelCase legacy)
renamedFromEdge(COINS__BLACK_HOLE_NODE.id, { legacyKey: 'blackHole', atSchema: SCHEMA_V3_NODE.id }),

// 3. V3 storage form (with v3_ prefix) — could auto-derive
edge(COINS__BLACK_HOLE_NODE.id, 'HAS_V3_STORAGE_KEY', 'v3_coins_blackHole'),

// 4. Display label form (V2 clipboard) — could auto-derive from legacyKey
edge(COINS__BLACK_HOLE_NODE.id, 'HAS_DISPLAY_LABEL', 'Black Hole'),

// 5. CSV header form — only needed if different from canonical
// (most fields don't need this; internal fields like _date do)
```

With auto-derivation (storage-key from `SHIPPED_IN_SCHEMA`, display-label from RENAMED_FROM legacyKey via spaceCase), the per-field cost in the catalog file is just the node declaration + the RENAMED_FROM edge (already required) + edge cases. The user's "four times over" concern is real for fully-explicit declarations but auto-derivation absorbs most of it.

### Comparison

| Concern | D.1-a (reuse RENAMED_FROM) | D.1-b (new HAS_DISPLAY_LABEL edge) | D.2 (explicit boundary retry) | D.3 (sunset path) |
|---|---|---|---|---|
| Procedural transforms in engine | none | none | one (engine or boundary helper) | none |
| Catalog growth (with auto-derivation) | 0 | ~0–10 manual overrides | 0 | 0 |
| Catalog growth (no auto-derivation) | +150 entries | +150 entries | 0 | 0 |
| Semantic cleanness | weak (RENAMED_FROM holding label data) | strong | strong | strong (path gone) |
| Survives Sub-Q 1's no-categories case | yes (just another legacyKey) | no (need inbound classification) | yes | n/a |
| Future input shapes (snake_case, hyphen-case) | extension via auto-derivation | extension via new edge type | extension via more transforms | n/a |
| Risks misroute on display-label collision | yes (Sub-Q 2 territory) | yes (Sub-Q 2 territory) | yes | no |

Recommendation leaning (depending on Sub-Q 3):
- If categories adopted: **D.1-b** with auto-derivation. Cleanest semantic split, low catalog cost.
- If no categories: **D.1-a** as a transitional lift, OR **D.2** if the team accepts one named transform at the boundary.
- If V2-clipboard truly dead: **D.3** — confirm no production users hit this path, then drop.

---

## 5. Schema-version vs game-version distinction

### The question

User: *"the V3, V2, that's my internal application storage format that is not necessarily correlate to the game versions. ... I may have a V28 game export, but my old V2 data format didn't correctly capture the fact that you have one field in multiple sections. And so you have a V28 game field that is in V2 app format. And in the future, you may have a V28 game field represented as a V3 data format."*

The two axes:

- **App schema:** internal storage format. V1 / V2 / V3. Drives migration gate. Today's `Schema` node payload: `{ appVersion: '0.12.x', gameVersion: 'V28' }` for V3.
- **Game version:** the Tower game export format. V27 / V28 / V29. Drives parser shape (sectionized vs non-sectionized) and field availability.

These are coupled in today's `Schema` node payload (`schema:v3.payload.gameVersion = 'V28'`), but they're orthogonal axes. Possible combinations:

| App schema | Game version | Real or hypothetical? |
|---|---|---|
| V1 | V25 | historical (early app, pre-V28 game) |
| V2 | V28 | historical transitional state |
| V3 | V28 | today |
| V3 | V29 | hypothetical (V29 export imported into V3-storage app) |
| V4 | V28 | hypothetical (app refactor without game change) |

The current `RENAMED_FROM.atSchema` payload references `schema:v3` — meaning "this rename happened as the V3 app schema rolled out." The game version is implicit in `schema:v3`'s payload (`'V28'`).

### Why this matters for inbound edges

If commit 11b adds a new inbound edge type (storage key, display label, game-export header), the question is: which axis does it reference?

- **Storage key edges** (`HAS_V3_STORAGE_KEY` or generalized `HAS_STORAGE_KEY` with `atSchema`): obviously app-schema-scoped. The `v3_` prefix is an app-storage convention, unrelated to which game version emitted the underlying field.
- **Game-export header edges** (hypothetical `HAS_GAME_EXPORT_HEADER` for V28 sectionized parser): game-version-scoped. The header `'Coins From Black Hole'` was a V27 export form; V28 emits sectionized headers.
- **Display label edges** (D.1-b's `HAS_DISPLAY_LABEL`): probably game-version-scoped, since they originate from game-export display strings.

### Three options for representing the two axes

**Option S-1: Use `atSchema` for everything, game version stays on Schema node payload.**
- Pro: status quo. One axis on edges; the second axis is queryable via `schemaNode.payload.gameVersion`.
- Con: an edge declaring "this was the V27 form" has to lie or omit — V27 wasn't a separate Schema. Today's RENAMED_FROM payloads sidestep this by having only one rename event per app-schema (V2→V3), but a future V29 export adding new aliases at the SAME app schema (V3) needs a second axis.

**Option S-2: Add a `gameVersion?: string` payload field on inbound edges.**
- Pro: explicit. `RENAMED_FROM { legacyKey, atSchema, gameVersion?: 'V28', reason? }`. Reads cleanly.
- Pro: per-edge, so different aliases for the same field can declare different game-version origins.
- Con: introduces a free-form string field (`'V28'`, `'V29'`). Loose. Could collide / drift.
- Mitigation: validate against an enumerated list at build time; today's known game versions are V25–V29 or so.

**Option S-3: Introduce a `GameVersion` node kind.**
- Pro: most rigorous. Game versions become first-class graph entities. Edges can structurally reference them.
- Pro: enables queries like "which fields shipped in V28?" without poking at Schema-node payloads.
- Con: significant new infrastructure for what might be 5-6 nodes total.
- Con: blurs the schema-vs-game-version distinction back together. The user's framing wants them ORTHOGONAL — both as first-class concepts. S-3 actually delivers that, but is the heaviest option.

### Worked example

A field `coins_dragonBreath` is added in V29. The app schema is still V3 (no app-side refactor needed for the new field). Two inbound edges might be declared:

**S-1 (status quo):**
```ts
edge(COINS__DRAGON_BREATH_NODE.id, 'SHIPPED_IN_SCHEMA', SCHEMA_V3_NODE.id),
// Game version 'V29' implicit — but the schema node says gameVersion='V28' (LIE!)
```

This is the conflict the user surfaced. `schema:v3.gameVersion === 'V28'` is wrong if V3 also accepts V29-only fields. Either Schema nodes split (introduce `schema:v3.5` or `schema:v3+v29`) — bad — or the gameVersion moves to per-edge metadata.

**S-2:**
```ts
edge(COINS__DRAGON_BREATH_NODE.id, 'SHIPPED_IN_SCHEMA', SCHEMA_V3_NODE.id, { gameVersion: 'V29' }),
renamedFromEdge(COINS__DRAGON_BREATH_NODE.id, {
  legacyKey: 'dragonsBreath',           // hypothetical V28 spelling
  atSchema: SCHEMA_V3_NODE.id,
  gameVersion: 'V28',
  reason: 'V29 dropped the apostrophe',
}),
```

Each edge carries its own game-version provenance. The Schema node payload's `gameVersion: 'V28'` becomes "the dominant game version this app schema was designed for" — descriptive, not authoritative.

**S-3:**
```ts
const GAME_VERSION_V29_NODE = ...;
edge(COINS__DRAGON_BREATH_NODE.id, 'INTRODUCED_IN_GAME_VERSION', GAME_VERSION_V29_NODE.id),
edge(COINS__DRAGON_BREATH_NODE.id, 'SHIPPED_IN_SCHEMA', SCHEMA_V3_NODE.id),
// Two structural edges, two axes, fully orthogonal
```

### Recommendation

The user's framing strongly implies the two axes need to be visible. Recommendation leaning: **S-2** — add `gameVersion?` to inbound-edge payloads. Lightest-weight option that makes the distinction explicit. S-3 (full GameVersion node kind) is reserved for if/when game-version-aware queries become a frequent need.

For commit 11b's storage-key edge specifically: **app-schema-scoped only**. The `v3_` prefix is purely an app-storage concern. The user's quote covers the FIELDS-vs-APP question; for storage-prefix edges specifically, only the app axis applies.

For commit 11b's display-label / game-export-header edges (if D.1 lands): **add `gameVersion?` to RENAMED_FROM** (and to the new inbound edge type if introduced). This is the lightest path forward.

### Comparison

| Concern | S-1 (status quo) | S-2 (gameVersion on edge payload) | S-3 (GameVersion node kind) |
|---|---|---|---|
| V28-field-in-V3-storage representable | poorly (Schema node payload lies) | yes (per-edge) | yes (separate node) |
| Per-edge game-version provenance | no | yes | yes |
| Catalog ceremony per new field | low | low (one optional payload field) | medium (declare relationship to GameVersion node) |
| Engine surface change | none | none (existing payload mechanism) | new node kind, new edge types |
| Future "fields shipped in V29" query | needs schema-payload tour | filter on edge payload | structural query |
| Architectural weight | minimal | small | significant |

---

## 6. Comparison matrix (combined view)

The five sub-questions don't have a single dominant answer — but they do cluster. Here's how the recommendation leanings flow together:

| Sub-question | Lean | Triggers / depends on |
|---|---|---|
| 1. Resolver shape | **D-β** (agnostic) IF Sub-Q 3 lands categories; otherwise D-α | depends on Sub-Q 3 |
| 2. Multi-edge collisions | **collision-as-bug** (build-time error) | independent — applies to any shape |
| 3. Edge categories | **adopt** with C-1 (split HAS_CSV_HEADER) | load-bearing; gates Sub-Q 1's cleaner answer |
| 4. Display labels | **D.1-b** (HAS_DISPLAY_LABEL inbound edge, auto-derived) IF Sub-Q 3 lands; else D.2 or D.3 | depends on Sub-Q 3 |
| 5. Schema vs game version | **S-2** (gameVersion on edge payload) | independent; light-touch |

A consistent "all-in" answer: D-β + collision-as-bug + categories + D.1-b + S-2. A consistent "minimal" answer: D-α + collision-as-bug + no categories + D.3 (if V2-clipboard truly dead) + S-1.

The all-in answer is closer to the user's stated vision. The minimal answer is closer to "ship 11b with the smallest edge surface." Pick based on willingness to invest in the categories taxonomy now vs later.

## 7. Per-commit impact

### If "all-in" answer chosen (D-β + categories + D.1-b + S-2):

| Commit | Change |
|---|---|
| **11b** | Adds `direction` field to `EdgeMeta`; classifies all 24 existing edge types. Splits `HAS_CSV_HEADER` into `HAS_CSV_INPUT_HEADER` + `HAS_CSV_OUTPUT_HEADER`. Adds `HAS_DISPLAY_LABEL` inbound edge type (auto-derived from RENAMED_FROM legacyKey via `spaceCase()`). Adds `HAS_V3_STORAGE_KEY` inbound edge type (auto-derived from canonical id + schema prefix). Resolver becomes a single agnostic indexed lookup over inbound-direction edges. Adds optional `gameVersion?: string` to RENAMED_FROM and HAS_DISPLAY_LABEL payloads (validated against enumerated list). Cuts over csv-parser, csv-field-mapping, field-utils, v2-to-v3-migrator. Deletes `deriveCanonicalKey`. Build-time cross-axis uniqueness invariant: every inbound-direction lookup string maps to exactly one Field. |
| 11 (predecessor) | `currentSchema()` query needed for storage-key auto-derivation. Light dependency. |
| 10 (predecessor) | RENAMED_FROM edges already shipped. Existing payload schema extended (additive `gameVersion?`); no breaking change. |
| 12+ (downstream) | New edge types require direction classification. Convention enforced by lint or test. |

### If "minimal" answer chosen (D-α + no categories + D.3 + S-1):

| Commit | Change |
|---|---|
| **11b** | Adds `HAS_V3_STORAGE_KEY` inbound (or `HAS_STORAGE_KEY` with `atSchema`). Reverse-indexes HAS_CSV_HEADER. Resolver gains two named indexes. No category infrastructure. Storage-key auto-derived from canonical id + V3_COLUMN_PREFIX. Display-label-with-spaces handled by sunsetting the V2-clipboard path (verify in user testing first); if cannot fully sunset, fall back to D.2 with one explicit `toCamelCase` retry at the parser-boundary (single named helper, with a comment "this is the last procedural step; everything else is data"). Cuts over the four files; deletes `deriveCanonicalKey`. |
| 11 | unchanged. |
| 10 | unchanged. |
| 12+ | unchanged. |

### Either way:

- Commit 9's `IS_DERIVED_FROM` cascade is unaffected — derivation is a structural concern, not an inbound-resolution concern.
- Commit 12's `APPEARS_IN_VIEW` is unaffected — view membership is structural.
- Commit 13's `CONDITIONAL_ON` is unaffected — form clearing is structural.
- The four-question litmus in `catalog/PATTERN.md` is unaffected — categories add a *direction* discriminator on edges; the litmus is about edges-vs-properties at a different axis.

## 8. Open questions for the human

1. **Sub-Q 1 + Sub-Q 3 are coupled.** If you adopt categories, D-β becomes natural; if not, D-α is the safe choice. Pick the categories question first — it gates the rest.

2. **Sub-Q 2 — the collision-as-bug rule.** I lean strongly toward build-time error. Confirm.

3. **Sub-Q 3 — edge direction taxonomy.** What are the exact category values? My proposed three (`inbound` / `outbound` / `structural`) cover the existing 24 edge types but might be too granular or too coarse. Some alternatives the user might prefer: `parsing` / `rendering` / `relational`; `read` / `write` / `relate`. Naming the categories is a real design decision.

4. **Sub-Q 4 — does any production usage path still produce display-label-with-spaces headers?** If no: D.3. If yes: D.1 vs D.2 depends on the categories answer. Worth verifying before the decision lands. Action: grep `sampleData/` for header rows that contain spaces between alphabetic segments; check whether bulk-import test fixtures cover this case.

5. **Sub-Q 5 — should `gameVersion` be enumerated?** Free-form string is loose; an `as const` tuple (`['V25', 'V26', 'V27', 'V28', 'V29'] as const`) gives type safety. The decision: how brittle is fixing typos vs how often does a new game version arrive? Low frequency of additions argues for enumeration.

6. **D.1's auto-derivation correctness.** If D.1-b is adopted with auto-derivation, the catalog needs a `spaceCase()` function that's the inverse of `toCamelCase()`. Edge cases: acronyms (`'gameTime'` → `'Game Time'`? `'GAME TIME'`? Game's own labels?), already-spaced inputs, special characters. Worth a one-page sub-spec before committing to auto-derivation. If too brittle, fall back to manual declarations for the ~150 fields (a one-time cost, then auto-validated by an invariant test).

7. **C-1's HAS_CSV_HEADER split — is there real value in synonyms-on-input?** The motivating case: a user pasting CSV with `'Date'` instead of `'_Date'` should still resolve. If the team doesn't want that flexibility, C-1 collapses to "rename for clarity, but inputs and outputs are always one-to-one." That weakens the C-1 case relative to C-2 (one type, two categories). Worth a five-minute "do we want input synonyms?" check.

8. **Does the field-graph-enforcer agent (commit 17) gain a new rule?** If categories land, the agent should enforce: every new edge type declares a `direction`. Add to its rule set if 17 hasn't shipped yet.
