# Exploration: Node identity — A / B / C deep-dive (revised)

> **Revised 2026-04-19 based on author feedback.** This revision overwrites the
> prior pass. Decisions below reflect the author's current position.
>
> **Recommendation summary (30-second read):**
> - **Option B** — named `*_NODE` exports, one per `fieldNode(...)` call, all
>   in one file (`catalog/fields.nodes.ts`) grouped by section with
>   comment-bar headers.
> - **Option C — polymorphic input** — graph methods accept `string | Node`.
>   Return types stay `readonly string[]` (node keys), not `Node[]`.
> - **Catalog aggregation via `import * as`** — `Object.values(fieldNodes)`
>   spread into the catalog. No `import.meta.glob`, no per-section files.
> - **Variable naming: `SECTION__FIELD_NODE`** — double-underscore between
>   the section and the field. Uniform. No stutter carve-out.
> - **Mutability: compile-time `readonly` only.** No `Object.freeze`. The
>   existing `Node` type in `types.ts` already has the right shape.
> - **Enum metadata: one call returns everything** — enrich `enumValueMeta`
>   to include `color`, `displayName`, etc., instead of chaining
>   `enumValueMeta(...).id` into `colorOf(id)`.
> - **All of the above lands in commit 4** (currently staged, not yet
>   committed). `EPIC-migration.md` may show commit 4 complete; the author
>   will revert that marker.
>
> Partner doc to [`EXPLORATION-node-identity.md`](./EXPLORATION-node-identity.md)
> (A–G enumeration and tentative B+C recommendation). Read first:
> [`field-graph-for-ai.md`](./field-graph-for-ai.md) §critical invariants.

---

## Human decision

> **This section was added retroactively on 2026-04-25** as the "Human decision"
> convention was not yet established when this doc landed. Content reconstructed
> from the doc itself + the EPIC's commit-4 status + the rules in the EPIC's
> preamble §10 ("Conventions locked by commits 1–4").

**Decided 2026-04-19 by Jarek (project owner):**

Adopt the recommendation summary above wholesale. Specifically:

- **Option B** for node identity — named `*_NODE` exports per `fieldNode(...)` call, all in one file per kind (`catalog/fields.nodes.ts`, `catalog/sections.nodes.ts`, etc.).
- **Option C polymorphism** — `FieldRef = string | Node` on every query method. Returns stay `readonly string[]`.
- **Catalog aggregation via `import * as` + structural `Object.values` filter** — non-node helpers (lookup records, helper fns) coexist with node handles in the same module.
- **Variable naming: `SECTION__FIELD_NODE`** with double-underscore separator. Internal fields preserve their leading `_` (`_DATE_NODE`).
- **Compile-time `readonly` only** — no `Object.freeze`.
- **`enumValueMeta` returns enriched metadata** — `id`, `wireValue`, optional `displayName`, optional `color` — collapsing two-step lookup chains.

**Reasoning (the human's words at the time):**

The recommendation aligned with the project's existing conventions (single-file per kind, `import * as` aggregation pattern already used elsewhere) and minimized churn against in-flight commit-4 work. The polymorphic `FieldRef` won out over string-only because consumers that already hold a `*_NODE` handle gain refactor-safety; consumers at the parser boundary (raw strings from clipboard / storage) are explicitly carved out via `getField` and `resolveFieldByAnyKey`. Compile-time `readonly` chosen over `Object.freeze` because the build-time invariants in `FieldGraph`'s constructor catch every concrete way nodes get mis-shaped at this scale; runtime freezing is a tax for protection nothing currently needs.

**Scope of decision (which commits implement it):**

- **Commit 4** absorbed all six bullets above. The implementation shipped alongside commit 4's `_runType` enum cutover.
- **Locked into the EPIC preamble §10** as "Conventions locked by commits 1–4" — every subsequent phase-2/3 commit follows these defaults; deviation requires explicit justification.
- **`field-graph-for-ai.md` updated** with the polymorphic-input guidance, the named-export rename pattern, and the `enumValueMeta` shape.

**Status:** Accepted; implemented in commit 4 (2026-04-25); locked as a project convention.

**Future revisit triggers:**

If the field count grows past ~500 (5× current), Option F (codegen) starts earning its keep — the named-export file would become unwieldy by hand. Revisit at that point. If a real performance issue emerges from Map lookups on the graph singleton, Option D (OOP with closures) becomes worth re-examining; today the indexed lookups are O(1) and unmeasured-but-fine.

---

## 1. Summary of narrowing

Options D (OOP with graph-singleton closures), E (typed-key union), F
(codegen), G (branded symbols) are off the table. D breaks the declarative
paradigm; E needs a 150-entry union beside the node declarations; F earns
its keep past 500 fields; G's ceremony loses to string interop at every
seam (CSV, localStorage, URL params).

A, B, and C remain. C's polymorphism stays — methods accept
`string | Node`. Build-time consumers import and pass nodes;
parser-boundary and declaration sites that legitimately hold strings
keep working without a lifting helper.

---

## 2. Catalog assembly — wildcard import, not glob

### 2.1 Pattern

Flat named exports in one file; aggregator wildcards them in:

```ts
// catalog/fields.nodes.ts
import { fieldNode } from '../builders';

export const BATTLE_REPORT__TIER_NODE = fieldNode('battleReport_tier');
export const BATTLE_REPORT__WAVE_NODE = fieldNode('battleReport_wave');
export const COINS__GOLDEN_TOWER_NODE = fieldNode('coins_goldenTower');
// … ~150 total
```

```ts
// catalog/index.ts
import * as fieldNodes from './fields.nodes';
import * as sectionNodes from './sections.nodes';
// …

function nodesOf<T extends Node>(mod: Record<string, T>): readonly T[] {
  return Object.values(mod);
}

export const CATALOG_NODES: readonly Node[] = [
  ...nodesOf(fieldNodes),
  ...nodesOf(sectionNodes),
  ...nodesOf(categoryNodes),
  ...nodesOf(viewNodes),
  ...nodesOf(schemaNodes),
  ...ENUM_VALUE_NODES,
];
```

No 200-line hand-maintained array. Adding a field is one line.

### 2.2 Type-narrowing tradeoff

`Object.values(fieldNodes)` TS-infers as the union of every export's
value type. Because every export returns `Node`, the union collapses
to `Node` and the cast is a no-op. The `nodesOf` generic above
centralizes the assertion; the constraint flags the one-off case where
a `*.nodes.ts` module accidentally exports a non-node.

### 2.3 Why not `import.meta.glob`

Prior pass entertained `import.meta.glob` at length — a misread. Author
never wanted 150 files. Wildcard `import * as` achieves "no manual
array" without per-field file explosion, Vite coupling, or prototype.
Glob discussion dropped.

### 2.4 Drift protection

Existing `fields.nodes.test.ts` invariants (bijection with
`supportedFields.json`) still hold. A `fieldNode(...)` call without
`export const` is invisible to `Object.values` and fails the
bijection test.

---

## 3. Node mutability — compile-time only

Threat model: "AI or human writes `RUN_TYPE_NODE.id = 'hacked'` at build
or edit time." That's static, caught by the type system.

`types.ts` already declares every property on `Node` as `readonly`:

```ts
export interface Node {
  readonly id: string;
  readonly kind: NodeKind;
  readonly tags?: readonly string[];
  readonly payload?: Readonly<Record<string, unknown>>;
}
```

`RUN_TYPE_NODE.id = 'hacked'` is already a compile error. No builder
change, no `Object.freeze`, no freeze test. Runtime mutation via
misbehaving libraries, `Object.assign`, etc. is out of scope.

**Action: none.** Close the question.

---

## 4. API shape — polymorphic input, string-array return

### 4.1 Decision

- **Input is polymorphic** (`string | Node`) because authorship contexts
  differ. Build-time consumer holds `BATTLE_REPORT__COINS_EARNED_NODE`
  and passes the node. Parser-boundary function holds a raw key string.
  Migration call site holds a legacy string constant. All three should
  Just Work.
- **Return stays `readonly string[]`.** Engine indexes are string-keyed;
  converting to `Node[]` at each method boundary would insert a
  `byId.get()` per returned edge, cascade through chained calls, and
  offer no concrete win.

### 4.2 Shape

```ts
// field-graph.ts
export type FieldRef = string | Node;

function toId(ref: FieldRef): string {
  return typeof ref === 'string' ? ref : ref.id;
}

sourcesOf(ref: FieldRef): readonly string[] {
  return (this.edgesToIdx.get(toId(ref)) ?? [])
    .filter((e) => e.type === 'IS_SOURCE_OF')
    .map((e) => e.from);
}

fieldsInSection(ref: FieldRef): readonly string[]    // same pattern
sectionsOf(ref: FieldRef): readonly string[]          // same pattern
acceptedValuesFor(ref: FieldRef): readonly string[]   // same pattern
isAcceptedValue(ref: FieldRef, raw: string): boolean
matchAcceptedValue(ref: FieldRef, raw: string): string | null
enumValueMeta(ref: FieldRef, wireValue: string): EnumValueMeta | null  // §7
```

Every public method gains one line (`const id = toId(ref)`). Internal
lookups stay string-keyed.

### 4.3 Consumer shape

```ts
import { _RUN_TYPE_NODE, BATTLE_REPORT__COINS_EARNED_NODE }
  from '@/shared/domain/field-graph/catalog/fields.nodes';

graph.acceptedValuesFor(_RUN_TYPE_NODE);              // Node in → string[] out
graph.sourcesOf(BATTLE_REPORT__COINS_EARNED_NODE);    // Node in → string[] out
graph.sourcesOf('battleReport_coinsEarned');          // still legal — migration-era
graph.resolveFieldByAnyKey(rawCsvHeader);             // parser boundary — string in, Node out
```

### 4.4 Parser-boundary exception

`resolveFieldByAnyKey(rawKey: string): Node | null` keeps string-in.
That function's job **is** to turn a raw storage/clipboard/URL key into
a `Node`. `getField(id: string): Node | null` stays public — consumers
that hold a raw id (from storage, a previous `string[]` return, a test
fixture) need a clean lift-to-node path.

### 4.5 Migration cost

Three sites today. `run-type-display.ts` and `run-type-filter.ts` swap
`RUN_TYPE_FIELD_ID` for `_RUN_TYPE_NODE` and pass the node.
`enum-values.edges.ts` writes `_RUN_TYPE_NODE.id` inside its `edge(...)`
calls — edges serialize by id; declaration surface stays string-keyed.

---

## 5. Flat vs hierarchical namespace

Flat (`BATTLE_REPORT__TIER_NODE` top-level export) beats hierarchical
(`fields.battleReport.tier`) under AI-dominant authorship:

- Flat wins on find-all-references (unique identifier; no destructure
  aliasing).
- Flat wins on TS rename (propagates cleanly vs occasional misses in
  nested `as const` literals).
- Flat wins on tree-shaking (§8).
- Hierarchical's only advantage is discovery autocomplete — a
  non-concern when AI sees the catalog in context.

**Stance: flat.**

---

## 6. Variable-name collisions and the `__` convention

### 6.1 Real collision space

Dozens of field-name collisions across sections: `coinsEarned`,
`cellsEarned`, `deathWave` (4 sections), `blackHole` (4 sections),
`flameBot`, `goldenTower`, `landMines`, `orbs`, `projectiles`,
`smartMissiles`, `thorns`, `chainLightning`, `deathRay`, `poisonSwamp`,
`innerLandMines` each in 2-4 sections. Any convention must disambiguate
uniformly.

### 6.2 Convention: `<SECTION>__<FIELD>_NODE`

Section in SCREAMING_SNAKE, **double-underscore** separator, field in
SCREAMING_SNAKE, `_NODE` suffix:

```ts
// battleReport_tier          → BATTLE_REPORT__TIER_NODE
// battleReport_coinsEarned   → BATTLE_REPORT__COINS_EARNED_NODE
// coins_goldenTower          → COINS__GOLDEN_TOWER_NODE
// coins_deathWave            → COINS__DEATH_WAVE_NODE
// coins_coinsEarned          → COINS__COINS_EARNED_NODE
// damage_deathWave           → DAMAGE__DEATH_WAVE_NODE
// damage_blackHole           → DAMAGE__BLACK_HOLE_NODE
// enemiesHitBy_blackHole     → ENEMIES_HIT_BY__BLACK_HOLE_NODE
// totalEnemies_totalEnemies  → TOTAL_ENEMIES__TOTAL_ENEMIES_NODE
```

**Why double-underscore.** Single-underscore
(`COINS_COINS_EARNED_NODE`) forces the reader to mentally parse where
the section boundary sits — is it `COINS / COINS_EARNED` or
`COINS_COINS / EARNED`? With `__` the boundary is explicit: double
marks the section/field seam, single is always an intra-segment word
break.

### 6.3 No stutter carve-out

`TOTAL_ENEMIES__TOTAL_ENEMIES_NODE` and `COINS__COINS_EARNED_NODE` stay
as-is despite the visual stutter. Uniformity wins. A one-off carve-out
introduces an exception every reader has to remember in exchange for
aesthetic polish on five-ish names. Not worth it.

### 6.4 Internal fields: `_` prefix for the variable too

Internal field ids start with `_`. Mirror it on the variable name:
`_RUN_TYPE_NODE`, `_DATE_NODE`, `_TIME_NODE`, `_NOTES_NODE`, `_RANK_NODE`.
Reasons: (a) leading `_` already means "internal" throughout the
codebase — reuse the convention; (b) internal fields are frequently
referenced and shouldn't carry a 9-character `INTERNAL__` prefix; (c)
no collision risk among five internal fields vs game fields.

---

## 7. Enum-value metadata — one call, rich return

### 7.1 The pain today

After commit 4's first pass, the consumer path for "give me the color
for `_runType=farm`" is two calls:

```ts
const meta = graph.enumValueMeta(_RUN_TYPE_NODE, 'farm');
if (!meta) return null;
const color = graph.colorOf(meta.id);    // second call
```

Per the commit-4 rule in `Notes-and-findings.md` (2026-04-19):
consumer-facing usage patterns should be single-call. This is plumbing.

### 7.2 Decision: enrich `enumValueMeta`'s return

```ts
// field-graph.ts
export interface EnumValueMeta {
  readonly id: string;             // e.g. 'enum:runType.farm'
  readonly wireValue: string;      // e.g. 'farm'
  readonly displayName?: string;   // HAS_DISPLAY_NAME terminal
  readonly color?: string;         // HAS_COLOR terminal
  // Future: icon, description, …
}

enumValueMeta(ref: FieldRef, wireValue: string): EnumValueMeta | null {
  for (const enumId of this.enumValuesOf(toId(ref))) {
    if (this.terminalOf(enumId, 'HAS_STRING_VALUE') !== wireValue) continue;
    return {
      id: enumId,
      wireValue,
      displayName: this.terminalOf(enumId, 'HAS_DISPLAY_NAME'),
      color: this.terminalOf(enumId, 'HAS_COLOR'),
    };
  }
  return null;
}
```

Consumer:

```ts
const meta = graph.enumValueMeta(_RUN_TYPE_NODE, 'farm');
const color       = meta?.color ?? FALLBACK_COLOR;
const displayName = meta?.displayName ?? 'Unknown';
```

One call, optional-chain everything else.

### 7.3 Why not dedicated helpers?

Alternative was `enumValueColor` / `enumValueDisplayName`. Rejected:
every new metadata field would need a new method (icon, description,
…), and consumers wanting two pieces would pay two graph calls.
`enumValueMeta` + destructure is one call and scales for free.

### 7.4 `colorOf` stays for non-enum nodes

`colorOf(nodeId)` is still useful for `HAS_COLOR` edges on *fields*
themselves (per-source colors on coin breakdown). Separate usage
pattern; keep both methods.

---

## 8. Overhead and tree-shaking

Object creation is a wash — 150 named exports vs 150 array entries are
byte-identical at runtime. Flat named exports tree-shake per field in
principle, though the `appGraph()` singleton neutralizes that today by
pulling the full catalog at bootstrap. Flat wins concretely once
out-of-graph consumers emerge (e.g. a `scripts/` CLI importing a few
nodes). Hierarchical object exports tree-shake worse in every case
(touching one key pulls the whole object). Flat costs nothing relative
to hierarchical; take the theoretical benefit for free.

---

## 9. Comparison matrix (revised)

Scored 1–5 (5 = best). Not weighted.

| | A (constants) | B flat alone | **B + C (recommended)** | D (OOP) | E (typed union) | E + F (generated) |
|---|---|---|---|---|---|---|
| Refactor safety | 2 | 5 | 5 | 5 | 3 | 5 |
| Drift resistance | 2 | 4 | 4 | 4 | 3 | 5 |
| Consumer ergonomics | 3 | 3 | **5** | 5 | 4 | 4 |
| Declarative shape | 4 | 5 | 5 | 2 | 4 | 4 |
| AI-friendliness | 3 | 4 | 5 | 2 | 4 | 5 |
| Migration cost (higher = cheaper) | 5 | 4 | 4 | 2 | 4 | 3 |
| Tree-shakeability | 5 | 5 | 5 | 3 | 5 | 5 |
| Scale to 150 fields | 3 | 4 | 4 | 4 | 4 | 5 |
| Tooling story | 3 | 3 | 3 | 2 | 4 | 5 |
| **Total** | 30 | 37 | **40** | 29 | 35 | 41 |

B + C ties E + F numerically. E + F's edge is purely the generator,
which the author has ruled out at 150 fields. B + C wins as the commit-4
landing shape.

---

## 10. Revised recommendation

**Adopt B + polymorphic C + flat named exports with `__` separator +
`_`-prefix for internal + single-file layout + wildcard aggregation +
rich `enumValueMeta` return + compile-time `readonly` only.** Lands in
commit 4.

### 10.1 Engine changes

```ts
// field-graph.ts
export type FieldRef = string | Node;

function toId(ref: FieldRef): string {
  return typeof ref === 'string' ? ref : ref.id;
}

// Public queries accept FieldRef; return string[] (unchanged)
sourcesOf(ref: FieldRef): readonly string[]
fieldsInSection(ref: FieldRef): readonly string[]
sectionsOf(ref: FieldRef): readonly string[]
acceptedValuesFor(ref: FieldRef): readonly string[]
isAcceptedValue(ref: FieldRef, raw: string): boolean
matchAcceptedValue(ref: FieldRef, raw: string): string | null

// Rich return
enumValueMeta(ref: FieldRef, wireValue: string): EnumValueMeta | null

// Parser boundary / direct lookup — string in, unchanged
resolveFieldByAnyKey(rawKey: string): Node | null
getField(id: string): Node | null
```

No `Object.freeze`. `Node`'s existing `readonly` properties carry the
mutability contract.

### 10.2 Catalog shape

Single `catalog/fields.nodes.ts` with comment-bar section headers
(full example in §2.1, §6, §7). Skeleton:

```ts
// catalog/fields.nodes.ts
// ─── Internal fields ─────────────────────────
export const _RUN_TYPE_NODE = fieldNode('_runType', { tags: ['internal'] });
// ... 4 more

// ─── Battle Report ───────────────────────────
export const BATTLE_REPORT__TIER_NODE = fieldNode('battleReport_tier');
// ... 9 more

// ─── Coins ───────────────────────────────────
export const COINS__GOLDEN_TOWER_NODE = fieldNode('coins_goldenTower');
// ... 14 more

// ─── remaining sections ──────────────────────
```

Aggregator wildcard-imports every `*.nodes.ts` module (see §2.1 for full
code). `catalog/index.ts` drops the `RUN_TYPE_FIELD_ID` re-export; same
for `field-graph/index.ts`.

### 10.3 Consumer refactor — diff shape

```ts
// Before (current staged commit 4)
import { appGraph, RUN_TYPE_FIELD_ID } from '@/shared/domain/field-graph';

// run-type-filter.ts
appGraph().enumValueMeta(RUN_TYPE_FIELD_ID, runType)?.displayName ?? 'Unknown';

// run-type-display.ts — two calls, manual null-check
const meta = appGraph().enumValueMeta(RUN_TYPE_FIELD_ID, runType);
return (meta && appGraph().colorOf(meta.id)) || FALLBACK_COLOR;

// breakdown-coins.ts (hypothetical, commit 7)
appGraph().sourcesOf('battleReport_coinsEarned');
```

```ts
// After
import { _RUN_TYPE_NODE, BATTLE_REPORT__COINS_EARNED_NODE }
  from '@/shared/domain/field-graph/catalog/fields.nodes';

// run-type-filter.ts — node in place of id constant
appGraph().enumValueMeta(_RUN_TYPE_NODE, runType)?.displayName ?? 'Unknown';

// run-type-display.ts — chain collapses via rich enumValueMeta
appGraph().enumValueMeta(_RUN_TYPE_NODE, runType)?.color ?? FALLBACK_COLOR;

// breakdown-coins.ts — imported node, clean call
appGraph().sourcesOf(BATTLE_REPORT__COINS_EARNED_NODE);
```

Net: `RUN_TYPE_FIELD_ID` disappears everywhere; `run-type-display.ts`
sheds a line via rich `enumValueMeta`; two consumer files swap an
import; `enum-values.edges.ts` uses `_RUN_TYPE_NODE.id` inside its
`edge(...)` calls; `catalog/index.ts` and `field-graph/index.ts` stop
re-exporting `RUN_TYPE_FIELD_ID`.

### 10.4 Adoption path — all in commit 4

`EPIC-migration.md` may show commit 4 as complete; it is **not**
committed yet — changes are currently staged. The author will revert the
stale marker. Everything below lands in a single commit-4 vertical slice:

1. **Engine change** (~40 LOC). Add `FieldRef` type and `toId` helper.
   Update public method signatures. Enrich `enumValueMeta` to include
   `color`. Keep `resolveFieldByAnyKey` and `getField` string-in. Update
   `field-graph.test.ts`.
2. **Catalog rewrite** (~200 LOC). Replace the 150-entry `FIELD_NODES`
   array in `fields.nodes.ts` with 150 named `export const` declarations
   using `<SECTION>__<FIELD>_NODE` / `_<FIELD>_NODE` convention. Add
   comment-bar section headers.
3. **Aggregator rewrite** (~15 LOC). Update `catalog/index.ts` to use
   `import * as` + `Object.values`. Add `nodesOf` typed helper. Drop
   `RUN_TYPE_FIELD_ID` re-export.
4. **Retire the stopgap.** Delete `RUN_TYPE_FIELD_ID` from
   `enum-values.nodes.ts`. Update `enum-values.edges.ts` to use
   `_RUN_TYPE_NODE.id` in its `edge(...)` calls.
5. **Consumer swaps** (~6 LOC). `run-type-filter.ts` and
   `run-type-display.ts` import `_RUN_TYPE_NODE`. The latter collapses
   its color chain into `meta?.color`.
6. **Invariant tests** (~10 LOC). Update `fields.nodes.test.ts` to
   assert `Object.values(fieldNodes).length === supportedFields.length`.

Subsequent commits consume the convention without structural work:
commit 5 (`IS_INTERNAL_FIELD`) queries the edge; commit 6 (section
membership) takes nodes via `FieldRef`; commit 7 (`IS_SOURCE_OF` +
breakdown rewrite) imports `BATTLE_REPORT__COINS_EARNED_NODE` and
`DAMAGE__DAMAGE_DEALT_NODE`; commit 10 (`RENAMED_FROM`) is unchanged
because `resolveFieldByAnyKey` stays string-in; commit 15 (dissonance)
adds entries to `RUN_TYPE_VALUES` and the graph picks them up via the
existing enum-sync invariant.

End state: every field is a named export (~150). Uniform. The cost over
the anonymous-array baseline is ~0 extra lines — the entries *become*
the exports.

---

## 11. Appendix — open questions

None blocking commit 4. Items previously listed as open are resolved:

- **Glob import?** Resolved — wildcard `import * as` with named exports;
  no glob.
- **Polymorphic API?** Resolved — keep `string | Node` input; keep
  `string[]` return.
- **File split per section?** Resolved — single file with comment-bar
  headers.
- **`getField` public/private?** Resolved — stays public.
- **Internal fields as separate exported array?** Resolved — collapsed.
  `IS_INTERNAL_FIELD` edge answers the query.

One genuinely-open item, deferred:

- **Per-kind node types** (`Node<'Field'>` vs `Node<'Section'>`) would
  enable `FieldRef = string | Node<'Field'>` with kind-narrowing at the
  type level. Orthogonal to this decision. Track in
  `Notes-and-findings.md` if it becomes relevant — likely after commit 8.
