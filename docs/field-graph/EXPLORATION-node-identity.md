# Exploration: Node identity — how should consumers reference field nodes?

> Design-options document. Not a decision. Not an implementation plan until the
> final recommendation. Partner doc to
> [`EPIC-migration.md`](./EPIC-migration.md), picked up between commits 3 and 4
> when the first real consumers start querying the graph.
>
> Read first: [`field-graph-for-ai.md`](./field-graph-for-ai.md),
> [`architecture/08-clarifying-the-mental-model.md`](./architecture/08-clarifying-the-mental-model.md),
> [`architecture/19-logic-as-data-and-ai-usability-guide.md`](./architecture/19-logic-as-data-and-ai-usability-guide.md).

---

## 1. The problem, stated concretely

`src/shared/domain/field-graph/catalog/fields.nodes.ts` declares ~150 field
nodes today as `fieldNode('_runType')`, `fieldNode('battleReport_coinsEarned')`,
etc. Consumer code — run-type selectors, coin-breakdown charts, validators,
CSV export — needs to refer to specific fields. Today that looks like this:

```ts
// run-type-detection.ts
const RUN_TYPE_FIELD_ID = '_runType';               // local const
const enumId = graph.enumValueByStringValue(RUN_TYPE_FIELD_ID, runTypeValue);

// breakdown-coins.ts (hypothetical, after commit 7)
const sources = graph.sourcesOf('battleReport_coinsEarned');  // string literal

// use-run-details-data.ts (hypothetical, after commit 6)
const coinFields = graph.fieldsInSection('section:coins');    // string literal
```

Every literal `'battleReport_coinsEarned'` or `'_runType'` is a drift risk:
rename the node in the catalog, forget to update a consumer, silent breakage.
The graph engine fails loudly on dangling *edge* references at build time; it
does **not** fail on dangling *string* references in consumer code. That's the
gap this document explores.

The two orthogonal axes: (1) where identifiers live — constants, named
exports, typed union, generated file; (2) what consumers pass — string id,
node object, rich method-bearing object, or typed key. Every option is a
specific combination of those two.

---

## 2. What "good" looks like

Before ranking, list the properties we care about so we can measure each
option against the same yardstick.

| Property | What it means |
|---|---|
| **Refactor safety** | Rename a field → every consumer follows automatically (or fails loudly at compile time). "Find all references" finds them. |
| **Drift resistance** | Impossible (or CI-caught) to have two sources of truth disagreeing about whether `_runType` exists. |
| **Consumer ergonomics** | Typical 3-line usage is short and easy to write from memory. Autocomplete surfaces the right names. |
| **Declarative shape** | Reads as data, not as OO call chains. Fits the "logic as data" paradigm per §19. |
| **AI-friendliness** | An AI agent reading a consumer file can infer field identity without loading five more files. Loud compile errors preferred to silent string drift. |
| **Migration cost** | Can be adopted in a single commit of the epic without rewriting commits 1–3. Incremental path from today's string literals. |
| **Tree-shakeability** | Consumer that touches 3 fields doesn't pull in 150. |
| **Scale to ~150 fields** | File size / readability / authoring ergonomics stay acceptable. |

---

## 3. The options

### Option A — Hand-authored ID constants object

A plain TypeScript constants object, separate from the `fieldNode(...)` calls.

```ts
// src/shared/domain/field-graph/catalog/internal-field-ids.ts
export const INTERNAL_FIELD_IDS = {
  DATE: '_date',
  TIME: '_time',
  NOTES: '_notes',
  RUN_TYPE: '_runType',
  RANK: '_rank',
} as const;
export type InternalFieldId =
  typeof INTERNAL_FIELD_IDS[keyof typeof INTERNAL_FIELD_IDS];

// (and the big cousin)
export const FIELD_IDS = {
  BATTLE_REPORT_TIER: 'battleReport_tier',
  BATTLE_REPORT_COINS_EARNED: 'battleReport_coinsEarned',
  COINS_GOLDEN_TOWER: 'coins_goldenTower',
  DAMAGE_DEATH_WAVE: 'damage_deathWave',
  // … ~150 …
} as const;
export type FieldId = typeof FIELD_IDS[keyof typeof FIELD_IDS];
```

Consumer:

```ts
import { INTERNAL_FIELD_IDS } from '@/shared/domain/field-graph/catalog/internal-field-ids';
const enumId = graph.enumValueByStringValue(INTERNAL_FIELD_IDS.RUN_TYPE, raw);
```

This already exists in the codebase for internal fields only
(`src/shared/domain/fields/internal-field-config.ts` has
`INTERNAL_FIELD_NAMES`). Option A scales that pattern out.

**Refactor safety.** Good for the constant itself — rename the key
`RUN_TYPE` and every consumer updates. But the *value* (`'_runType'`) and the
`fieldNode('_runType')` call in the catalog are two independent string
literals. Renaming the node id in the catalog requires a separate edit to the
constants file. Find-usages on the string literal `'_runType'` still works, but
the abstraction leaks: you have to know to search both places.

**Drift potential.** Real. Two sources of truth. Catchable via an invariant
test (walk `FIELD_IDS`, assert each value exists as a declared Field node),
but the test has to be written and maintained.

**Consumer ergonomics.** Verbose: `INTERNAL_FIELD_IDS.RUN_TYPE` vs
`'_runType'`. Autocomplete helps.

**Performance.** Zero. Tree-shakes perfectly — the constants object is a plain
literal.

**Scale to ~150 fields.** The constants file is ~150 lines. Manageable but
dull. Pick a naming scheme (`BATTLE_REPORT_COINS_EARNED`) and stick to it.

**Migration path.** Trivial. Add the file in commit 4 alongside the
`_runType` cutover. Expand as later commits need more constants.

**Pros / cons.**
- ✅ Simplest mechanism; no builder changes; tree-shakes; local precedent.
- ❌ Two sources of truth — renaming requires edits in both files.
- ❌ 150 SCREAMING_SNAKE constants to maintain; drift caught only by a
  bespoke invariant test, not by the builder.

**Wins / loses.** Wins at small stable sets (~5 internal fields). Loses at
150 entries — ceremony-to-value ratio gets bad.

---

### Option B — Export the result of `fieldNode()` as named variables

Each `fieldNode(...)` call becomes a named export, and the aggregate array is
built from the named exports.

```ts
// catalog/fields.nodes.ts
import { fieldNode } from '../builders';
import type { Node } from '../types';

// Internal
export const RUN_TYPE_NODE        = fieldNode('_runType', { tags: ['internal'] });
export const DATE_NODE            = fieldNode('_date',    { tags: ['internal'] });
export const TIME_NODE            = fieldNode('_time',    { tags: ['internal'] });
export const NOTES_NODE           = fieldNode('_notes',   { tags: ['internal'] });
export const RANK_NODE            = fieldNode('_rank',    { tags: ['internal'] });

// battleReport
export const BATTLE_REPORT_TIER_NODE          = fieldNode('battleReport_tier');
export const BATTLE_REPORT_COINS_EARNED_NODE  = fieldNode('battleReport_coinsEarned');
// … ~140 more …

// coins
export const COINS_GOLDEN_TOWER_NODE = fieldNode('coins_goldenTower');
export const COINS_DEATH_WAVE_NODE   = fieldNode('coins_deathWave');
// …

export const FIELD_NODES: readonly Node[] = [
  RUN_TYPE_NODE, DATE_NODE, TIME_NODE, NOTES_NODE, RANK_NODE,
  BATTLE_REPORT_TIER_NODE, BATTLE_REPORT_COINS_EARNED_NODE,
  COINS_GOLDEN_TOWER_NODE, COINS_DEATH_WAVE_NODE,
  // … 145 more …
];
```

Consumer:

```ts
import { RUN_TYPE_NODE, BATTLE_REPORT_COINS_EARNED_NODE }
  from '@/shared/domain/field-graph/catalog/fields.nodes';

const enumId = graph.enumValueByStringValue(RUN_TYPE_NODE.id, runTypeValue);
const sources = graph.sourcesOf(BATTLE_REPORT_COINS_EARNED_NODE.id);
```

**Refactor safety.** Excellent. One source of truth — the `fieldNode('_runType')`
call. Rename the const `RUN_TYPE_NODE` → every consumer updates via TS rename.
Rename the string `'_runType'` → builder fails loud on any dangling edge.

**Drift potential.** Very low. Only way to drift is to declare a `fieldNode`
that isn't exported, or export a node not included in the `FIELD_NODES` array.
Both catchable with a one-liner invariant test.

**Consumer ergonomics.** The `.id` suffix on every call is annoying
(`RUN_TYPE_NODE.id` vs just `RUN_TYPE_NODE`). Fixable with Option C
(graph accepts node objects) — see §3.3. Import lines get long but autocomplete
handles it.

**Performance.** Zero runtime cost. Tree-shakes fine — consumers pull only the
named exports they use. The `FIELD_NODES` array is a module-level constant;
`buildGraph()` walks it once at startup.

**Scale to ~150 fields.** The file grows to ~300 lines (each field is 2 lines:
the export and a trailing entry in `FIELD_NODES`). The `FIELD_NODES` array
rebuild at the bottom is the awkward part — 150 named identifiers, one per
line. Mitigation: split the file by section prefix (`fields/battle-report.ts`,
`fields/coins.ts`, each exporting its subset + a subset array; roll up in
`index.ts`).

**Migration path.** Medium. Commit 3 already landed `FIELD_NODES` as
anonymous entries; converting to named exports is a mechanical rewrite of one
file. Can be done in commit 4 alongside `_runType` cutover, OR — better —
gradually: only promote fields to named exports when a consumer actually needs
one. Unused fields stay anonymous until someone imports them.

**Pros / cons.**
- ✅ Single source of truth; renames propagate; `Find All References` works;
  tree-shakes; incremental (promote to named export only when needed).
- ❌ `.id` on every access is noise unless paired with C.
- ❌ The 150-entry `FIELD_NODES` array rebuild is visually heavy; mitigate by
  splitting per-section (`fields/coins.ts`, `fields/damage.ts`, roll up in
  `index.ts`).

**Wins / loses.** Wins when consumers want more than just the id (display
name, color, etc.). Loses standalone when consumers only ever want strings —
`.id` ceremony becomes pure overhead unless paired with C.

---

### Option C — Graph API accepts node objects OR ids

Orthogonal to B. Instead of consumers typing `RUN_TYPE_NODE.id`, graph methods
accept either a string id or a `{ id: string }` node object:

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

enumValueByStringValue(ref: FieldRef, stringValue: string): string | null {
  const fieldId = toId(ref);
  // … rest as today …
}
```

Consumer (paired with Option B's named exports):

```ts
import { RUN_TYPE_NODE, BATTLE_REPORT_COINS_EARNED_NODE }
  from '@/shared/domain/field-graph/catalog/fields.nodes';

const enumId  = graph.enumValueByStringValue(RUN_TYPE_NODE, runTypeValue);
const sources = graph.sourcesOf(BATTLE_REPORT_COINS_EARNED_NODE);
```

Or, for a migration call site still holding a raw V3 key:

```ts
graph.sourcesOf('battleReport_coinsEarned');   // still compiles
```

**Refactor safety.** Same as B (single source of truth), plus the `.id`
ceremony disappears.

**Drift potential.** Same as B.

**Consumer ergonomics.** Best of the bunch in terms of reading. `sourcesOf(COINS_GOLDEN_TOWER_NODE)`
reads naturally. The type `FieldRef = string | Node` is forgiving enough for
migration code and test fixtures that hold ids as strings.

**Performance.** One tiny branch (`typeof ref === 'string'`) per call. Negligible.

**Scale to ~150 fields.** Pure win — the more fields, the more the `.id`
ceremony adds up.

**Migration path.** Low. Adding `toId` + changing method signatures is a
~20-line patch in `field-graph.ts`. Doesn't require consumers to change first.
Can land in commit 4.

**Pros / cons.**
- ✅ Natural call sites; backward-compatible with string ids (existing tests
  and migration-era code unchanged); composes with B, E, and F.
- ❌ `FieldRef = string | Node` admits non-Field nodes; narrowable to
  `string | Node<'Field'>` once node kinds become type parameters.
- ❌ Not a solution alone — makes B feel better but doesn't provide names.

**Wins / loses.** Wins paired with any named-handle option. Loses alone.

---

### Option D — OOP on the node object

Each node is a rich object with methods that close over the graph.

```ts
// defined-field.ts
interface DefinedField {
  readonly id: string;
  acceptedValues(): readonly string[];
  displayName(): string | undefined;
  sourcesOf(): readonly string[];
  section(): string | undefined;
}

function defineField(id: string): DefinedField {
  return {
    id,
    acceptedValues: () => appGraph().enumValuesOf(id),
    displayName:    () => appGraph().displayNameOf(id),
    sourcesOf:      () => appGraph().sourcesOf(id),
    section:        () => appGraph().sectionsOf(id)[0],
  };
}

// catalog/fields.ts
export const RUN_TYPE               = defineField('_runType');
export const BATTLE_REPORT_COINS_EARNED = defineField('battleReport_coinsEarned');
export const COINS_GOLDEN_TOWER     = defineField('coins_goldenTower');
```

Consumer:

```ts
import { RUN_TYPE, BATTLE_REPORT_COINS_EARNED } from '.../catalog/fields';

const values  = RUN_TYPE.acceptedValues();
const sources = BATTLE_REPORT_COINS_EARNED.sourcesOf();
const label   = BATTLE_REPORT_COINS_EARNED.displayName();
```

**Refactor safety.** Same as B.

**Drift potential.** Same as B.

**Consumer ergonomics.** Feels great at the call site — object-oriented,
reads like English. Fewer imports: a single `RUN_TYPE` export replaces
`RUN_TYPE_NODE` + `graph`.

**Performance.** Each `defineField` call allocates a closure holding four
method references. At 150 fields that's 150×4 = 600 closure slots at module
load. Negligible absolute cost, but worth noting: the graph is *referenced* by
every definition. If `appGraph()` is a getter over a cached singleton, fine.
If it's built lazily, all definitions lazily wire to whichever graph instance
is current — tricky in tests that build a toy graph.

**Scale to ~150 fields.** File size similar to B. What changes is the mental
model: each field is "a little object with methods." More code behind each
field, more surface area to understand.

**Migration path.** Significant. The graph engine must expose a stable
`appGraph()` accessor before definitions evaluate (order-of-import bug risk).
Tests that today pass a custom `FieldGraph` instance to a consumer would have
to swap or mock `appGraph()`. Landing this cleanly is a 3–4 file change.

**Pros / cons.**
- ✅ Ergonomic call sites; self-describing encapsulation.
- ❌ **Breaks the declarative paradigm.** Field declarations become
  *behaviors* with a hidden dependency on a graph singleton. Per §19, the
  project explicitly prefers declarations over behaviors. Primary reason to
  reject D.
- ❌ Harder to test — substituting a test graph requires mocking
  `appGraph()`. B + C makes the graph an explicit parameter.
- ❌ Harder for AI to reason about. `fieldNode('_runType')` is data;
  `defineField('_runType')` is implicit behavior.
- ❌ Couples catalog to engine — risks circular imports if engine ever reads
  from catalog.

**Wins / loses.** Wins if the team prefers OO style. Loses given the explicit
declarative preference and test-isolation concern.

---

### Option E — Typed key union (no constants object)

No constants. Instead, a TypeScript union type enumerates the valid ids, and
graph methods are typed against it.

```ts
// catalog/field-ids.types.ts
export type InternalFieldId = '_date' | '_time' | '_notes' | '_runType' | '_rank';
export type BattleReportFieldId = 'battleReport_tier' | 'battleReport_coinsEarned' | /* … */;
export type CoinsFieldId = 'coins_goldenTower' | 'coins_blackHole' | /* … */;
// …
export type FieldId = InternalFieldId | BattleReportFieldId | CoinsFieldId | /* … */;

// field-graph.ts
sourcesOf(fieldId: FieldId): readonly string[] { /* … */ }
enumValueByStringValue(fieldId: InternalFieldId, stringValue: string): string | null { /* … */ }
```

Consumer:

```ts
const enumId  = graph.enumValueByStringValue('_runType', runTypeValue);  // OK
const sources = graph.sourcesOf('battleReport_coinsEarned');              // OK
const bad     = graph.sourcesOf('battleReport_coinzEarned');              // compile error
```

**Refactor safety.** Rename a field id in the catalog, the union type becomes
stale, the consumer compile-breaks. Good. *But*: TS Rename Symbol doesn't
follow string literals — a rename of `'battleReport_coinsEarned'` has to be
done via find/replace on the exact string, across catalog + union type + every
consumer. That's still fast because all references are string literals of the
exact same shape, but it's a discipline, not a click.

**Drift potential.** The union and the node array are still separate. Build
an invariant test — walk all `FIELD_NODES`, assert every `node.id` is in
`FieldId` (via `Extract<FieldId, typeof node.id>` or runtime set comparison).
Catchable but adds surface area.

**Consumer ergonomics.** Short and natural. `graph.sourcesOf('coins_goldenTower')`
reads well. No import of a constant, which some find freeing and others find
less discoverable (autocomplete on a string literal depends on the IDE).

**Performance.** Zero cost — it's a type, erased at compile time.

**Scale to ~150 fields.** The union type definition is ~150 strings.
Split-by-section helps (`CoinsFieldId | DamageFieldId | ...`). Can be generated
from the catalog (Option F) to eliminate drift.

**Migration path.** Low. Add the union in commit 4. Tighten method signatures
field-by-field as each commit cuts over. Consumers that already pass string
literals get compile-time checking for free.

**Pros / cons.**
- ✅ Compile-time enforcement (typo → error); zero runtime cost; short
  call sites; easy for AI to discover (one file enumerates valid keys).
- ❌ Union must stay in sync with `FIELD_NODES` (needs invariant test).
- ❌ IDE rename doesn't follow string literals — grep + replace.
- ❌ No "node object" handle to pass around beyond the string.

**Wins / loses.** Wins when string literals are fine and compile-time
narrowing is valued. Loses when code wants a handle to a field beyond its id.

---

### Option F — Generated file

Introduce a one-shot build step (following
`scripts/migration-data-prep/*.mjs` precedent) that reads
`catalog/fields.nodes.ts` and emits `catalog/generated-ids.ts`:

```ts
// catalog/generated-ids.ts — AUTO-GENERATED, DO NOT EDIT
// Source: catalog/fields.nodes.ts (and siblings)
// Regenerate: npm run graph:generate-ids

export const FIELD_IDS = {
  _DATE: '_date',
  _TIME: '_time',
  _RUN_TYPE: '_runType',
  BATTLE_REPORT_COINS_EARNED: 'battleReport_coinsEarned',
  COINS_GOLDEN_TOWER: 'coins_goldenTower',
  // … all 150 …
} as const;

export type FieldId = typeof FIELD_IDS[keyof typeof FIELD_IDS];
```

Consumer:

```ts
import { FIELD_IDS, type FieldId } from '.../catalog/generated-ids';

const enumId = graph.enumValueByStringValue(FIELD_IDS._RUN_TYPE, runTypeValue);
```

Generation runs in `npm run graph:check` (existing target) or as a pre-commit
hook; CI re-runs and fails if the file is out of sync.

**Refactor safety.** Excellent. The generated file is always in lockstep
because it *is* regenerated. Renaming a field → re-run the generator → all
consumers follow via the constants (or compile-break if the old constant key
was referenced).

**Drift potential.** Near zero, as long as the generator runs on every
relevant commit. The failure mode is "generator didn't run" — easy to gate
with a CI check (`git diff --exit-code` after running the generator).

**Consumer ergonomics.** Identical to Option A, but the constants maintain
themselves.

**Performance.** Zero runtime.

**Scale to ~150 fields.** Scales gracefully — the file can be 150 or 1500
lines, the author doesn't touch it.

**Migration path.** Medium-high. Requires: a generator script, a CI check, a
commit hook, documentation for "what to do when the generated file is stale."
Meaningful infrastructure to add mid-epic. Could slot into commit 4 but
probably better in commit 8 or later after the catalog stops moving.

**Pros / cons.**
- ✅ Zero drift once wired; one pass emits constants + typed union + richer
  per-section or per-enum types.
- ❌ New build-step dependency and CI check; stale generated file is
  confusing to debug; meta-layer that contributors must learn.
- ❌ Non-trivial infrastructure to add mid-epic.

**Wins / loses.** Wins at 500+ fields or many contributors. Loses at 150 —
an invariant test buys most of the safety for far less machinery.

---

### Option G — Symbol-keyed opaque ids (honorable mention, not a primary candidate)

```ts
// field-brand.ts
declare const FieldIdBrand: unique symbol;
export type BrandedFieldId = string & { readonly [FieldIdBrand]: never };

export const RUN_TYPE = '_runType' as BrandedFieldId;
export const BATTLE_REPORT_COINS_EARNED = 'battleReport_coinsEarned' as BrandedFieldId;
```

Graph methods accept `BrandedFieldId`. A raw string literal no longer
compiles; consumers must import a named constant.

Rejected as primary candidate because: (a) the brand is a one-way street —
every interop with string APIs (CSV export, URL params, tests) requires `as
BrandedFieldId` casts that defeat the purpose; (b) it's the ceremony of B
without the ergonomics of C; (c) TS enums do most of the job better for this
codebase (see §4.2).

---

## 4. Cross-cutting topics

### 4.1. Performance considerations (the "dynamic system might run slow" worry)

The user raised persisting the built graph to session storage, rebuilding
only when a commit-hash-like marker changes. **Is it warranted?** No, not at
150 fields.

Sizing: ~180 nodes, ~600 edges at epic completion, each edge/cardinality
check O(1). `buildGraph()` after commits 1–3 runs in low single-digit
milliseconds on a mid-range laptop. Extrapolating 40× edges still lands in
the 20–50ms range — below user-perception threshold.

None of Options A–F change this budget meaningfully. B adds ~150 named
exports (module-parse, not build); D allocates ~600 closures (kilobytes); E
and F are zero runtime cost.

Session-storage caching would be warranted at 5000+ fields or with async
catalog loading. Neither applies. Revisit only if post-commit-12 profiling
shows double-digit ms on cold mobile start; the cache is a lever that can be
pulled *after* node-identity design lands. Orthogonal concern.

### 4.2. Interaction with TS enums (per commit-4 decision)

[`architecture/11-internal-app-fields.md`](./architecture/11-internal-app-fields.md)
§11.2 and the commit-4 plan in the epic keep the existing `RunType` TS enum
authoritative for the union of *accepted values*. Node identity is a
different axis — it's about how consumers refer to the *field that owns* the
enum, not about the enum values themselves. So:

```ts
// still true under any option
export const RunType = {
  FARM:       'farm',
  TOURNAMENT: 'tournament',
  MILESTONE:  'milestone',
  // DISSONANCE: 'dissonance',  // added by commit 15
} as const;
export type RunTypeValue = typeof RunType[keyof typeof RunType];

// Option B + C:
graph.enumValuesOf(RUN_TYPE_NODE);  // returns ['enum:runType.farm', ...]
RunType.FARM;                       // still the way to refer to a specific value
```

The graph returns enum-value *node ids* (`'enum:runType.farm'`); consumer
code that needs the wire value calls `graph.stringValueOf(...)` or compares
against `RunType.FARM`. This is already the pattern in
`run-type-detection.ts`. Node-identity design doesn't disturb it.

### 4.3. Mixed approaches (what combines with what?)

| Combination | Compatibility | Comment |
|---|---|---|
| **A + C** | Compatible | Constants-object values are just strings; graph accepts strings. Doesn't reduce drift. |
| **B + C** | Strongly complementary | This is the "named nodes + graph-accepts-objects" combo. Ergonomics + refactor safety. **Recommended baseline.** |
| **B + E** | Compatible | Named exports *and* a typed-key union. Belt-and-braces — gets you both "object handles for passing around" and "compile-time enforcement on strings." |
| **B + F** | Reasonable | F generates the name exports, eliminating manual maintenance. Good at scale, overkill at 150. |
| **E + F** | Natural | F generates the union. Best drift protection. See recommendation. |
| **D + anything** | Mostly incompatible | D's OOP handles conflict with C's "string or node" polymorphism; D's graph-singleton dependency complicates tests. |

### 4.4. Tooling angle — `npm run field:describe <id>`

A CLI for field inspection already features in the epic (`graph:describe`,
`graph:explain`). How does each option feed into CLI ergonomics?

- **A / E / F** — CLI takes a string argument (`npm run field:describe _runType`).
  Same shape across all three. The user types a field id; the CLI looks it up
  in the graph. No difference at the CLI surface.
- **B** — Same as above; the CLI doesn't need named exports, it needs a string
  id. Named exports help *code*, not *CLI args*.
- **D** — Same as above at the CLI; the OO handles only help in-code call sites.

**So the tooling angle doesn't discriminate between options.** What *does*
help is whether the catalog exposes a machine-readable list. Option F's
generator could emit a JSON manifest alongside the TS, which a CLI could use
for tab completion. That's a nice-to-have, not a decider.

### 4.5. AI-friendliness (explicit analysis)

| Option | Reading | Writing | Renaming |
|---|---|---|---|
| A | Good — constant reads naturally | Medium — must know constants file exists | Poor — two-file edit, agent might miss one |
| B | Good — `RUN_TYPE_NODE.id` self-describes | Good — autocomplete on named import | Excellent — TS rename propagates |
| D | Fair — hidden graph dependency | Good — autocomplete on object | Good — TS rename propagates |
| E | Excellent — typed signature; typos fail compile | Good — one file enumerates valid names | Fair — string rename via grep; compile catches misses |
| F | Excellent — generated file is flat | Excellent — autocomplete on `FIELD_IDS.` | Fair — rename + regenerate step |

**Net:** B + C and E + F score best. A is worst for renaming (silent drift).
D is worst for reading (hidden singleton). §19's declarative preference
further discounts D.

Concrete prompt: *"Add `coins_dragonBreath` and include it in the coin
breakdown chart."*
- **B + C**: one named export in `fields.nodes.ts`, five edges, zero chart
  changes (`graph.sourcesOf` already includes it). 6-line diff.
- **A**: also add `COINS_DRAGON_BREATH` to `FIELD_IDS`. Forgetting this
  breaks silently. 7-line diff with a failure mode.
- **F**: one entry + `npm run graph:generate-ids`. 5-line diff + 1 command.
  Forgetting the command means stale generated file.

---

## 5. Comparison matrix

Scored 1–5 (5 = best). Not weighted — the user picks the weights.

| | A (constants) | B (named nodes) | B + C (nodes + poly API) | D (OOP) | E (typed union) | E + F (generated union) |
|---|---|---|---|---|---|---|
| Refactor safety | 2 | 5 | 5 | 5 | 3 | 5 |
| Drift resistance | 2 | 4 | 4 | 4 | 3 | 5 |
| Consumer ergonomics | 3 | 3 | 5 | 5 | 4 | 4 |
| Declarative shape | 4 | 5 | 5 | 2 | 4 | 4 |
| AI-friendliness | 3 | 4 | 5 | 2 | 4 | 5 |
| Migration cost (lower = better shown higher) | 5 | 4 | 4 | 2 | 4 | 3 |
| Tree-shakeability | 5 | 5 | 5 | 3 | 5 | 5 |
| Scale to 150 fields | 3 | 4 | 4 | 4 | 4 | 5 |
| Tooling story | 3 | 3 | 3 | 2 | 4 | 5 |
| **Total** | 30 | 37 | 40 | 29 | 35 | 41 |

The winners cluster around **B + C** and **E + F**. Both dominate A, D, and
bare E/B. The final pick depends on whether the project values
*infrastructure you write once* (F's generator) over *infrastructure you
don't* (B + C's named exports maintained by humans).

---

## 6. Recommendation

**Adopt B + C: named `*_NODE` exports from the catalog files, plus a graph
API that accepts either a string id or a node object.**

Justification (150-word target):

The project is mid-epic with ~150 fields and a declarative "logic as data"
paradigm per architecture §19. Three things matter: drift resistance, a
low-ceremony consumer syntax that AIs can read and write, and incremental
migration without disturbing committed phases 1–3.

Option B gives us single-source-of-truth refactor safety (the `fieldNode(id)`
call *is* the canonical definition; the named export is a handle to it).
Option C removes the `.id` ceremony and keeps existing string-literal call
sites compiling through the migration. Together they require ~30 lines of
engine changes plus a mechanical transform of `fields.nodes.ts` — work that
fits naturally into commit 4.

Option F (generated file) is better at 500+ fields. At 150 it's extra
machinery for marginal gain and would delay commit 4 by a week. We can add F
later if the catalog grows, because B + C is forward-compatible with it —
the generator would just emit the same named-export shape.

Option D is explicitly ruled out by §19's declarative preference.

### Adoption plan

**Where it lands:** Commit 4 of [`EPIC-migration.md`](./EPIC-migration.md)
(`ACCEPTS_VALUE` edges + `_runType` cutover). That commit is already touching
`run-type-detection.ts`, which is the first real consumer; it's the natural
place to introduce the convention.

**Net file impact for commit 4:**

- `src/shared/domain/field-graph/field-graph.ts` — add `FieldRef` type and
  `toId()` helper; change six public method signatures from `string` to
  `FieldRef`. ~20 LOC.
- `src/shared/domain/field-graph/catalog/fields.nodes.ts` — promote the five
  internal fields (`_date`, `_time`, `_notes`, `_runType`, `_rank`) to named
  exports. Leave the ~145 game-field declarations anonymous for now. ~10 LOC.
- `src/shared/domain/run-types/run-type-detection.ts` — replace the local
  `RUN_TYPE_FIELD_ID` constant with `import { RUN_TYPE_NODE }` and pass the
  node object to graph methods. ~3 LOC changed.
- `src/shared/domain/field-graph/field-graph.test.ts` — add a test that the
  polymorphic API accepts both strings and node objects. ~15 LOC new.
- `docs/field-graph/field-graph-for-ai.md` — add a one-paragraph note under
  "critical invariants" that named-node exports are the canonical handle.
  ~10 LOC new.

**Incremental adoption after commit 4.** Each subsequent phase-2 commit
promotes only the field nodes that commit's consumer needs:

- Commit 5 (CSV export) → promotes the five internal fields — already done.
- Commit 6 (section membership) → no additional promotions; consumers use
  `graph.fieldsInSection('section:coins')`, which doesn't need a field-node
  handle.
- Commit 7 (`IS_SOURCE_OF` + breakdown deletion) → promotes
  `BATTLE_REPORT_COINS_EARNED_NODE` and `DAMAGE_DAMAGE_DEALT_NODE` (the two
  totals consumed by charts).
- Commit 15 (dissonance) → promotes `RUN_TYPE_NODE` already; no new
  promotions.

End state at epic completion: ~10–15 named-node exports covering the fields
real consumers reference. The remaining ~135 fields stay as anonymous array
entries in `FIELD_NODES` — they participate in the graph but no consumer
needs a handle to them. Scales cleanly, no 150-entry import blocks.

**Reconsider at:** if named exports cross ~40, revisit whether Option F's
generator starts to pay off. Thresholds can be noted in
[`Notes-and-findings.md`](./Notes-and-findings.md).

---

## 7. Explicit non-decisions

- **Build-time session-storage caching of the graph.** Premature at 150
  fields. Revisit only if `buildGraph()` measurements exceed ~30ms on a
  mid-range mobile. Not a node-identity concern.
- **Symbol branding (Option G).** Rejected — friction with string interop
  APIs outweighs the type-safety benefit at this scale.
- **Per-kind node types** (`Node<'Field'>` vs `Node<'Section'>` in the type
  system). Interesting but separate issue; would enable
  `FieldRef = string | Node<'Field'>` with kind-narrowing. Track as a
  follow-up in `Notes-and-findings.md`.

---

## 8. Open questions for the author

1. Is commit 4 the right landing point, or should B + C land in its own
   predecessor commit to avoid bundling two concerns? (The epic's staging
   allows either; I'd prefer bundled since commit 4 is already a vertical
   slice and the engine change is small.)
2. Naming convention for the exports — `RUN_TYPE_NODE` (clear, verbose) vs
   `RUN_TYPE_FIELD` (matches node kind) vs `fRunType` (short, less obvious).
   Recommend `*_NODE` suffix for scannability and to avoid colliding with
   local variables (`runType = …`).
3. Should `FieldRef` be kind-narrowed to `string | Node<'Field'>` now, or
   start permissive and tighten in a later commit? Recommend permissive for
   commit 4, tighten in commit 8 or 12 once kind-typing on `Node` is in
   place.
