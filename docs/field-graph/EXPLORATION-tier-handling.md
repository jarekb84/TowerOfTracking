> **Date:** 2026-04-25
> **Branch:** 204-v28-migration-safety
> **Status:** Decided 2026-04-25 — Option T2 (dedicated `'tier'` data type). Implements in commit 9.
> **Related:**
> - [`EPIC-migration.md`](./EPIC-migration.md) — commit 9 (`IS_DERIVED_FROM` edges + derivation cascade) is the natural absorber
> - [`architecture/11-internal-app-fields.md`](./architecture/11-internal-app-fields.md) §11.3 / §11.4 gotcha 4 — derivation framework + run-type detection two-tier fallback
> - [`Notes-and-findings.md`](./Notes-and-findings.md) — commit 10 entries capturing the duplication

# Tier handling — derivation, dedicated data type, or parser fix?

## Recommendation summary (30-second read)

Tier values arrive in two shapes: clean numbers (`"10"`, V28 export) and tournament suffixes (`"10+"`, V2 clipboard or pre-V28 storage). Today, the leading-int regex extraction is **duplicated across `data-parser.ts:extractKeyStatsFromFields` and `run-type-detection.ts:extractNumericStats`** — both files now carry transitional comments pointing at commit 9.

The user's framing during commit 10 review: *"this would be another thing I would have thought, like, hey, get me this value. And if we have special handling for how to parse it, that should be, you know, declared as a function that just ran for this field."*

Three options:

- **Option T1 — Self-deriver.** `battleReport_tier IS_DERIVED_FROM battleReport_tier { deriver: 'parseTierLeadingInt' }`. The deriver consumes its own field's `rawValue`, returns the parsed leading-int. Conceptually weird (a field deriving from itself) but mechanically uniform with other derivers.

- **Option T2 — Dedicated `'tier'` data type.** Add `'tier'` to the `DataType` union. The parser dispatches on data type and calls a tier-specific number parser that handles the `+` suffix. Tier becomes "a number with optional tournament suffix" as a first-class shape.

- **Option T3 — Parser-level fix.** Improve `parseShorthandNumber` to treat trailing `'+'` as a no-op terminator (return the leading int). Tier stays `dataType: 'number'`; the parser learns one more edge case.

**Recommended direction: Option T2 (dedicated `'tier'` data type)**, with a tightly-scoped runtime parser. Reasoning:
- **`number` carries an implicit promise: "you can do arithmetic on this."** Sum, average, min, max — these are operations a `number` field is expected to support. Tier fails the test (you don't add tier 5 + tier 8). Calling tier a `number` is a semantic lie that blast-radius-leaks: any consumer that aggregates "all number fields" silently picks up tier and produces nonsense.
- The `+` suffix carries information (tournament-ness). Encoding it inside a generic `number` parser hides that information; encoding it via a dedicated data type makes it discoverable.
- Adding a data type is structurally consistent with how every other parsing concern is dispatched in commit 8's design.
- The information `_runType IS_DERIVED_FROM battleReport_tier { deriver: 'runTypeFromTier' }` stays a separate edge — pure derivation framework, no tier-specific oddity in the deriver registry.
- Commits 6+ that need to know "is this a tournament tier?" can ask `dataTypeOf(field) === 'tier'` and then probe rawValue, instead of writing per-call-site regex.

**Counter-argument worth weighing**: data types so far describe *parsing strategy*, not *semantic kinds*. Adding `'tier'` blurs that line slightly. But it's a small, principled blur; the alternative options have their own awkwardness (T1's self-derivation, T3's parser-level edge case lacks field-awareness AND has wider blast radius).

## Human decision

**Decided 2026-04-25 by Jarek:**

Adopt **Option T2 — dedicated `'tier'` data type**. `IS_OF_TYPE battleReport_tier 'tier'`; parser dispatches a tier-specific case in `field-utils.ts`'s switch. Implements in commit 9. The `_runType IS_DERIVED_FROM battleReport_tier` deriver stays separate (also commit 9) — different concern.

**Reasoning (the human's words, captured for future revisits):**

> *"a number data type would imply that you can do arithmetic on it. So it's not just what it looks like, which is, hey, it's a numeric value, but what is it used for? ... we're not going to be adding tiers together. We're not going to be averaging tiers versus all other numeric fields. The assumption is it's a numeric field because you'll be doing arithmetic on it. And so maybe this is where I'm another slight edge to having a tier specific type."*

> *"option T3, the cons, totally aligning with what I'm saying. Like I, this whole, part of what I'm hoping to achieve with this graph-based approach is capturing a history of changes. ... but I don't want to have tribal knowledge kind of strewn around all over the code base."*

> *"the comparison matrix also, the thing about effects unrelated number fields, that's another great call out because what is the blast radius of your change? And what is the likelihood that you may have inadvertent changes that you don't want? And so having a specific thing to data type, it is a one-off right now."*

Three threads converged on T2: (a) **`number` semantically means "you can do arithmetic on it"** — tier fails this test (no summing, averaging across tiers); (b) **encapsulating tribal knowledge** — T3's parser-level `+`-strip is exactly the kind of "why is this here?" tribal-knowledge smell the graph is supposed to eliminate; (c) **blast radius** — T3's strip applies to ALL number fields, opening regression risk for unrelated columns. T2 limits the special-casing to one declared field via a structural type-system change.

**Where the decision deviates from the recommendation:**

- Accepted as recommended (T2). The user surfaced an additional rationale (arithmetic-vs-non-arithmetic semantics) that wasn't in the original doc — added below to the option-T2 description as a strengthening argument.

**Scope of decision (which commits implement it):**

- **commit 9** (derivation cascade + tier data type) — adds `'tier'` to `DATA_TYPES`, declares `IS_OF_TYPE battleReport_tier 'tier'`, adds the tier case to `field-utils.ts`'s parser switch, deletes the duplicated regex from `data-parser.ts:extractKeyStatsFromFields` and `run-type-detection.ts:extractNumericStats`. The separately-tracked `_runType IS_DERIVED_FROM battleReport_tier { deriver: 'runTypeFromTier' }` also lands in commit 9 alongside this — different concern, same commit, both per spec §11.4 gotcha 4.

**Status:** ACCEPTED; pending implementation in commit 9.

**Future revisit triggers:**

- The `'+'` suffix is genuinely removable code today — game V28 exports never produce it; only V2 clipboard / V2 storage do. User confirmed: *"the plus suffix on tiers has been removed, like, for a while."* Keep the special-casing for now (handles old import flows) but **flag it as sunset code in commit 9's implementation**: if a year passes with no `+`-tier import detected (could be measured via PostHog if/when analytics ship), the `'tier'` data-type's `+`-handling logic becomes a deletion candidate. Update this section's status at that point.
- A second field surfaces with a similar shape (numeric value with semantic suffix). If yes, the decision generalizes (refactor to a `'number-with-suffix'` data type or similar); if no, this stays a one-off.

---

## 1. The duplication

[`data-parser.ts:extractKeyStatsFromFields`](../../src/features/analysis/shared/parsing/data-parser.ts):

```ts
const tierStr = tierField?.rawValue || '';
const tierMatch = tierStr.match(/^(\d+)/);
const tier = tierMatch ? parseInt(tierMatch[1], 10) : 0;
```

[`run-type-detection.ts:extractNumericStats`](../../src/shared/domain/run-types/run-type-detection.ts):

```ts
const tierStr = pickField(fields, 'battleReport_tier', 'tier')?.rawValue ?? '';
const tierMatch = tierStr.match(/^(\d+)/);
const tier = tierMatch ? parseInt(tierMatch[1], 10) : 0;
```

Identical. Both files carry transitional comments referencing commit 9. The duplication is the smell.

There's also [`run-type-detection.ts:detectRunTypeFromFields`](../../src/shared/domain/run-types/run-type-detection.ts) which uses `/\+/.test(tierStr)` to decide tournament vs farm. That's a separate concern — it's commit 9's `_runType IS_DERIVED_FROM battleReport_tier` deriver per spec §11.4 gotcha 4.

So tier really has two concerns:
- **Concern A: tier value extraction.** `"10+"` → `10`, `"10"` → `10`. Returns a number.
- **Concern B: run-type derivation from tier.** `"10+"` → `'tournament'`, `"10"` → `'farm'`. Drives the `_runType` field when explicit run-type isn't provided.

Concern B is unambiguously commit 9's deriver framework. Concern A is the open question this doc addresses.

## 2. Options in detail

### Option T1 — Self-deriver

```ts
edge('battleReport_tier', 'IS_DERIVED_FROM', 'battleReport_tier', { deriver: 'parseTierLeadingInt' }),
```

Deriver implementation:
```ts
'parseTierLeadingInt': (inputs) => {
  const raw = inputs.battleReport_tier?.rawValue ?? '';
  const m = raw.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
},
```

**Pros:** uniform with the date/time derivers (one mechanism, one cascade walker). Eliminates per-field-id parsing logic from consumers; they read `tier.value` and trust it.

**Cons:** a field deriving from itself is conceptually odd. The cascade walker has to detect and allow self-loops without falling into infinite recursion. Tests for `IS_DERIVED_FROM` cycle detection (commit 9's invariant) need a carve-out for self-loops, which weakens the invariant.

### Option T2 — Dedicated `'tier'` data type *(recommended)*

```ts
// data-types.constants.ts
export const DATA_TYPES = ['number', 'duration', 'date', 'string', 'tier'] as const;

// catalog/edges/data-types/data-types.edges.ts
edge('battleReport_tier', 'IS_OF_TYPE', 'tier'),

// field-utils.ts
case 'tier': {
  const m = rawValue.match(/^(\d+)/);
  processedValue = m ? parseInt(m[1], 10) : 0;
  displayValue = rawValue; // preserve "10+" as display
  dataType = 'tier';
  break;
}
```

**Pros:** parser dispatch is uniform — every data type maps to a parsing strategy. The semantic distinction (tier ≠ plain number) is recorded in the catalog. Future "is this a tournament tier?" checks become `field.dataType === 'tier' && field.rawValue.includes('+')` — field-aware without per-call-site regex. No invariant carve-outs.

**Cons:** the `DataType` union grows from 4 to 5. Conceptually the existing types describe *parsing strategy* (number / duration / date / string); adding `'tier'` adds a *semantic kind*. Slight conceptual blur — but small, and a cleaner blur than T1's self-derivation.

**Catalog impact:** one edge changes from `IS_OF_TYPE 'number'` to `IS_OF_TYPE 'tier'`. Catalog growth: zero new edges.

### Option T3 — Parser-level fix in `parseShorthandNumber`

```ts
// number-scale.ts
export function parseShorthandNumber(value: string, ...): number {
  // ... existing logic ...
  // NEW: tolerate trailing '+' (tournament-tier suffix)
  const stripped = cleaned.endsWith('+') ? cleaned.slice(0, -1) : cleaned;
  // ... continue parsing ...
}
```

**Pros:** smallest change. Tier stays `'number'`. No new data type, no new edge, no infrastructure.

**Cons:** the parser learns about a tier-specific concern with no signal that the change is tier-related — a future maintainer reading `parseShorthandNumber` sees a `'+'` strip with no obvious reason. Worse, the strip applies to ALL number fields, not just tier — `"100+"` in a coins field would silently parse as `100` instead of failing/warning. The `+` suffix is genuinely tier-specific, so the fix should be tier-specific.

If chosen, gate the strip behind a field-aware call: parse-with-context taking the canonical id and only allowing the `+` strip when `id === 'battleReport_tier'`. But now the parser knows about field ids, which is exactly the field-aware logic Option T2 is offering to encapsulate cleanly.

## 3. Comparison matrix

| Concern | **Option T2** *(recommended)* | Option T1 | Option T3 |
|---|---|---|---|
| Eliminates duplicated regex in `data-parser.ts` + `run-type-detection.ts` | ✓ via `field.value` (parser sets it) | ✓ via cascade-set value | ✓ via `parseShorthandNumber` |
| Field-awareness (only tier triggers special parsing) | ✓ via `IS_OF_TYPE 'tier'` | ✓ via `IS_DERIVED_FROM` self-edge | ✗ (or breaks encapsulation) |
| Adds new framework concept | new data type literal | self-deriver edge | none |
| Cycle / self-loop concerns | none | requires invariant carve-out | none |
| Catalog data growth | 1 edge changes value | 1 new edge | none |
| Affects unrelated number fields | no | no | yes (strip applies to all) |
| Surfaces tier semantics in tooling (`graph:describe`) | yes (data type appears) | yes (deriver appears) | no |

## 4. Per-commit impact

If T2 (recommended) is picked:

| Commit | Change |
|---|---|
| 9 (existing scope expanded) | Pick T2. Add `'tier'` to `DATA_TYPES`. Update `IS_OF_TYPE battleReport_tier 'tier'` declaration. Add `'tier'` case to `field-utils.ts:createGameRunField`'s switch. Add `_runType IS_DERIVED_FROM battleReport_tier { deriver: 'runTypeFromTier' }` (already in commit 9's scope). Delete the duplicated regex from both call sites — they read `field.value` directly. |

If T1 picked: same commit, different mechanism. If T3: minimal commit; lives in `number-scale.ts`.

## 5. Open questions for the human

1. **Is `'tier'` a parsing strategy or a semantic kind?** The current `DataType` union members describe parsing strategies. T2 stretches that slightly. Decide whether the conceptual blur is acceptable or whether to keep the union strictly parsing-strategy-only and pick T1 instead.
2. **What's the long-term plan for the `+` suffix?** If V28+ exports never produce it (only V2 clipboard / V2 storage do), the special handling is sunset code. T3's "parser learns one edge case" might be enough — but only if you accept the field-id-specific gating that T3 then needs.
3. **Should `_runType IS_DERIVED_FROM battleReport_tier` be added in commit 9 regardless of T1/T2/T3?** Yes — that's a separate concern (run-type detection) and the spec already has it in scope.
