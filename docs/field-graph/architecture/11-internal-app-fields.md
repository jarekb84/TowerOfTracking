# 11. Internal app-fields — how the graph handles them

> Part of the Field Graph Architecture spec.
> [< Prev: 10. Pattern-enforcing test library](./10-pattern-enforcing-test-library.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 12. Extending with a new run type + sub-category (dissonance) >](./12-extending-with-a-new-run-type-and-sub-category.md)

---

Sections 1–10 treated "fields" as synonymous with "game-data keys" — things the Tower export produces like `coins_goldenTower` or `battleReport_tier`. The app has a second, smaller class of fields that behave quite differently: the five underscore-prefixed keys that live alongside game data in every `ParsedGameRun`. These are the internal app-fields:

| Name | Origin | Shape | Notes |
|------|--------|-------|-------|
| `_date` | Derived from `battleReport_battleDate` at parse time (fallback to paste timestamp) | ISO date string | CSV header `_Date`. Legacy V1 users had this as `date`. |
| `_time` | Derived from `battleReport_battleDate` at parse time | `HH:mm` string | CSV header `_Time`. Paired with `_date`. |
| `_notes` | User input via single-entry modal, or pulled from clipboard marker | string | CSV header `_Notes`. Must be CSV-escaped. |
| `_runType` | User-selected OR auto-detected from tier string (`+` suffix → tournament) | Enum: `'farm' \| 'tournament' \| 'milestone'` | CSV header `_Run Type`. |
| `_rank` | User input; **only valid when `_runType === 'tournament'`** | number-like string | CSV header `_Rank`. Cleared on run-type change. |

They are declared in `src/shared/domain/fields/internal-field-config.ts` and referenced by at least 41 files (the `RunType.*` grep in section 12.5). They participate in duplicate-detection, CSV round-trip, run-details display, and every analytics page's filter bar. They behave differently from game fields in four ways the graph has to accommodate:

1. **They are not in the V3 canonical key space.** They carry no `v3_` prefix and never will. `RENAMED_FROM` edges targeting a game export are irrelevant; their provenance is the app itself, not a version of the game.
2. **They have constrained enum values.** `_runType` is not a free-form string — it is one of three literals. `_rank` is numeric but conditional on `_runType`.
3. **Some of them are derived from other fields.** `_date` and `_time` are computed from `battleReport_battleDate`. Today that derivation is hardcoded in `src/features/analysis/shared/parsing/data-parser.ts` at the call site `deriveDateTimeFromBattleDate(battleDate)`.
4. **They have legacy V1 forms that are schema-specific, not game-version-specific.** The V1 app stored `date`, `time`, `notes`, `runType`, `rank` (no underscore); those names migrate via `LEGACY_FIELD_MIGRATIONS` in `internal-field-config.ts`. The rename is internal to the tower tracking app (its storage schema evolved) rather than driven by a Tower game version change.

The graph can express all four concerns with the existing edge taxonomy plus two targeted additions. Nothing about internal fields requires a parallel system — they fit into the graph cleanly with distinct tags and a new edge type.

### 11.1. Graph representation

**The choice: use `kind: 'Field'` nodes with a tag, plus an `IS_INTERNAL_FIELD` edge — both.**

The instinct is to introduce a new `kind: 'InternalField'` node type. I think that's wrong for this codebase. The node kind answers "what *is* this thing?" The edge answers "what *role* does it play?" An internal field is still a field — it has a display name, a data type, a section, and it appears in views — so all the existing edge machinery applies. Introducing a new kind would force every query to either branch on kind (`graph.nodesOfType('Field') + graph.nodesOfType('InternalField')`) or accept that half the existing invariants silently skip internal fields. That's worse than a tag + edge combo.

So internal fields are `Field` nodes with:
- The tag `'internal'` (already referenced in section 10's invariants — `if (field.tags?.includes('internal')) continue`).
- An outgoing `IS_INTERNAL_FIELD` edge pointing at a new `InternalFieldSet` node, `internal:app-metadata`. This gives us a queryable collection without needing `graph.query({ tag: 'internal' })` (which is weaker because tags can be added ad-hoc; an edge to a known node is a structural contract).

Adding `IS_INTERNAL_FIELD` as a new edge type costs one line in the `Edge` discriminated union, one case in the cardinality table, and one invariant test. It's a small addition.

```typescript
// src/shared/domain/field-graph/nodes/internal-fields.ts
import { fieldNode, internalFieldSetNode } from '../builder';

export const INTERNAL_FIELD_SET = internalFieldSetNode('internal:app-metadata');

export const INTERNAL_FIELD_NODES = [
  fieldNode('_date',    ['internal']),
  fieldNode('_time',    ['internal']),
  fieldNode('_notes',   ['internal']),
  fieldNode('_runType', ['internal']),
  fieldNode('_rank',    ['internal', 'tournament-only']),
];
```

```typescript
// src/shared/domain/field-graph/edges/internal-fields.ts
export const INTERNAL_FIELD_EDGES = [
  // Membership in the internal-field set
  edge('_date',    'IS_INTERNAL_FIELD', 'internal:app-metadata'),
  edge('_time',    'IS_INTERNAL_FIELD', 'internal:app-metadata'),
  edge('_notes',   'IS_INTERNAL_FIELD', 'internal:app-metadata'),
  edge('_runType', 'IS_INTERNAL_FIELD', 'internal:app-metadata'),
  edge('_rank',    'IS_INTERNAL_FIELD', 'internal:app-metadata'),

  // CSV header overrides (edges to terminal strings, same pattern as HAS_DISPLAY_NAME)
  edge('_date',    'HAS_CSV_HEADER', '_Date'),
  edge('_time',    'HAS_CSV_HEADER', '_Time'),
  edge('_notes',   'HAS_CSV_HEADER', '_Notes'),
  edge('_runType', 'HAS_CSV_HEADER', '_Run Type'),
  edge('_rank',    'HAS_CSV_HEADER', '_Rank'),

  // Data types
  edge('_date',    'HAS_DATA_TYPE', 'date'),
  edge('_time',    'HAS_DATA_TYPE', 'string'),    // 'HH:mm' is a formatted string, not a Date
  edge('_notes',   'HAS_DATA_TYPE', 'string'),
  edge('_runType', 'HAS_DATA_TYPE', 'string'),    // constrained via HAS_VALUE_ENUM below
  edge('_rank',    'HAS_DATA_TYPE', 'number'),

  // Display names (match UI labels today)
  edge('_date',    'HAS_DISPLAY_NAME', 'Date'),
  edge('_time',    'HAS_DISPLAY_NAME', 'Time'),
  edge('_notes',   'HAS_DISPLAY_NAME', 'Notes'),
  edge('_runType', 'HAS_DISPLAY_NAME', 'Run Type'),
  edge('_rank',    'HAS_DISPLAY_NAME', 'Rank'),

  // Legacy V1 app-form names (renamed before v0.12)
  edge('_date',    'RENAMED_FROM', 'date',        { atSchema: 'schema:v2' }),
  edge('_time',    'RENAMED_FROM', 'time',        { atSchema: 'schema:v2' }),
  edge('_notes',   'RENAMED_FROM', 'notes',       { atSchema: 'schema:v2' }),
  edge('_runType', 'RENAMED_FROM', 'runType',     { atSchema: 'schema:v2' }),
  edge('_runType', 'RENAMED_FROM', 'run_type',    { atSchema: 'schema:v2' }),
  edge('_rank',    'RENAMED_FROM', 'rank',        { atSchema: 'schema:v2' }),
  edge('_rank',    'RENAMED_FROM', 'placement',   { atSchema: 'schema:v2' }),
];
```

Note two things:
- `HAS_CSV_HEADER` is a new edge type to terminal strings. It's needed because internal-field CSV headers don't follow the default rule (game fields use their V3 key or a derived capitalization; internal fields use the `_Date` / `_Run Type` form from `INTERNAL_FIELD_MAPPINGS`). Rather than special-case internal fields in the CSV exporter, we add one edge type that *every* field can use to override its CSV header. Most game fields won't declare it; internal fields will.
- `RENAMED_FROM` works fine for internal-field storage renames by pointing `atSchema` at the storage schema that introduced them (`schema:v2` here — when the internal-field underscore convention arrived). The edge type is the same as for game-field renames; what differs is which schema node the edge's `atSchema` metadata targets. The `RENAMED_FROM` substrate is agnostic to whether the rename was triggered by a Tower game version or an internal app refactor — both live in the same substrate, and both are queryable via schema-aware filters.

### 11.2. Enum-value expressiveness

`_runType` has a constrained set of legal values. Today this lives in four places:
- `RunType` TypeScript enum in `src/shared/domain/run-types/types.ts` (three members).
- `mapExplicitRunType` switch in `run-type-detection.ts` (three cases).
- `mapUrlTypeToRunType` switch in `run-type-defaults.ts` (three cases + default).
- `getRunTypeDisplayLabel` switch in `run-type-filter.ts` (three cases).

Adding a fourth value (`'dissonance'` — see section 12) requires edits to all four. This is a textbook case for the graph model.

**The choice: new node kind `EnumValue` with `HAS_VALUE_ENUM` and `ACCEPTS_VALUE` edges.**

Why not a flat `HAS_VALUE_ENUM` edge whose target is a terminal string? Because enum values themselves carry attributes — display labels ("Farm" vs "farm"), colors (green for farm, amber for tournament, purple for milestone — see `run-type-display.ts`), sub-filters (tournament-only rank field), and filter-UI membership. If the target is a terminal string, every attribute has to hang off the field node or be inferred from the string. That re-creates the same "which switch statement owns this?" problem the graph is supposed to solve.

Treating enum values as first-class nodes lets each value carry its own edges:

```typescript
// src/shared/domain/field-graph/types.ts — add a new node kind
export type NodeKind = 'Field' | 'Section' | 'Category' | 'View' | 'Schema'
                     | 'InternalFieldSet' | 'EnumValue';

// And two new edge types
export type Edge =
  // ... existing ...
  | { type: 'IS_INTERNAL_FIELD'; from: NodeId; to: NodeId }
  | { type: 'HAS_CSV_HEADER'; from: NodeId; to: string }
  | { type: 'HAS_VALUE_ENUM'; from: NodeId; to: NodeId /* EnumValue */ }
  | { type: 'ACCEPTS_VALUE'; from: NodeId /* Field */; to: NodeId /* EnumValue */ };
```

Why both `HAS_VALUE_ENUM` and `ACCEPTS_VALUE`? They serve different queries.
- `HAS_VALUE_ENUM`: points from an enum-value to... nothing new is needed here, actually. Let me collapse this — a single `ACCEPTS_VALUE` edge from `Field → EnumValue` is sufficient. An `EnumValue` node that no field accepts is a dead node, caught by the orphan check.

Revised:

```typescript
// Only one new edge type needed for enums
| { type: 'ACCEPTS_VALUE'; from: NodeId /* Field */; to: NodeId /* EnumValue */ };
```

Full representation of `_runType` with its three current values:

```typescript
// src/shared/domain/field-graph/nodes/enum-values.ts
export const RUN_TYPE_VALUES = [
  enumValueNode('enum:runType.farm'),
  enumValueNode('enum:runType.tournament'),
  enumValueNode('enum:runType.milestone'),
];

// src/shared/domain/field-graph/edges/enum-values.ts
export const ENUM_VALUE_EDGES = [
  // Field -> enum-value membership
  edge('_runType', 'ACCEPTS_VALUE', 'enum:runType.farm'),
  edge('_runType', 'ACCEPTS_VALUE', 'enum:runType.tournament'),
  edge('_runType', 'ACCEPTS_VALUE', 'enum:runType.milestone'),

  // Per-value attributes
  edge('enum:runType.farm',       'HAS_DISPLAY_NAME', 'Farm'),
  edge('enum:runType.farm',       'HAS_COLOR',        '#10b981'),   // green
  edge('enum:runType.farm',       'HAS_STRING_VALUE', 'farm'),      // wire value

  edge('enum:runType.tournament', 'HAS_DISPLAY_NAME', 'Tournament'),
  edge('enum:runType.tournament', 'HAS_COLOR',        '#f59e0b'),   // amber
  edge('enum:runType.tournament', 'HAS_STRING_VALUE', 'tournament'),

  edge('enum:runType.milestone',  'HAS_DISPLAY_NAME', 'Milestone'),
  edge('enum:runType.milestone',  'HAS_COLOR',        '#8b5cf6'),   // purple
  edge('enum:runType.milestone',  'HAS_STRING_VALUE', 'milestone'),
];
```

The in-memory JSON (analogous to section 8.1):

```json
[
  { "kind": "node", "id": "_runType", "nodeKind": "Field", "tags": ["internal"] },
  { "kind": "node", "id": "enum:runType.farm",       "nodeKind": "EnumValue" },
  { "kind": "node", "id": "enum:runType.tournament", "nodeKind": "EnumValue" },
  { "kind": "node", "id": "enum:runType.milestone",  "nodeKind": "EnumValue" },
  { "kind": "edge", "type": "ACCEPTS_VALUE",    "from": "_runType", "to": "enum:runType.farm" },
  { "kind": "edge", "type": "ACCEPTS_VALUE",    "from": "_runType", "to": "enum:runType.tournament" },
  { "kind": "edge", "type": "ACCEPTS_VALUE",    "from": "_runType", "to": "enum:runType.milestone" },
  { "kind": "edge", "type": "HAS_DISPLAY_NAME", "from": "enum:runType.farm",       "to": "Farm" },
  { "kind": "edge", "type": "HAS_COLOR",        "from": "enum:runType.farm",       "to": "#10b981" },
  { "kind": "edge", "type": "HAS_STRING_VALUE", "from": "enum:runType.farm",       "to": "farm" },
  { "kind": "edge", "type": "HAS_DISPLAY_NAME", "from": "enum:runType.tournament", "to": "Tournament" },
  { "kind": "edge", "type": "HAS_COLOR",        "from": "enum:runType.tournament", "to": "#f59e0b" },
  { "kind": "edge", "type": "HAS_STRING_VALUE", "from": "enum:runType.tournament", "to": "tournament" },
  { "kind": "edge", "type": "HAS_DISPLAY_NAME", "from": "enum:runType.milestone",  "to": "Milestone" },
  { "kind": "edge", "type": "HAS_COLOR",        "from": "enum:runType.milestone",  "to": "#8b5cf6" },
  { "kind": "edge", "type": "HAS_STRING_VALUE", "from": "enum:runType.milestone",  "to": "milestone" }
]
```

Query API additions:

```typescript
// src/shared/domain/field-graph/query.ts
acceptedValuesFor(field: NodeId): readonly NodeId[] {
  return (this.byFrom.get(field) ?? [])
    .filter((e) => e.type === 'ACCEPTS_VALUE')
    .map((e) => e.to);
}

displayLabelForValue(enumValueId: NodeId): string {
  return this.displayNameOf(enumValueId) ?? enumValueId;
}

stringValueOf(enumValueId: NodeId): string {
  return (this.byFrom.get(enumValueId) ?? [])
    .find((e) => e.type === 'HAS_STRING_VALUE')?.to as string
    ?? enumValueId;
}
```

Consumer refactor (`getRunTypeDisplayLabel` from `run-type-filter.ts`):

```typescript
// BEFORE
export function getRunTypeDisplayLabel(runType: RunTypeValue): string {
  switch (runType) {
    case RunType.TOURNAMENT: return 'Tournament';
    case RunType.FARM:       return 'Farm';
    case RunType.MILESTONE:  return 'Milestone';
    default:                 return 'Unknown';
  }
}

// AFTER
export function getRunTypeDisplayLabel(runType: RunTypeValue): string {
  const enumId = `enum:runType.${runType}`;
  return graph.displayLabelForValue(enumId);
}
```

Same for `getRunTypeColor` (from `run-type-display.ts`). Both functions become one-liners that delegate to the graph. The `RunType` TypeScript enum in `types.ts` is still useful for compile-time safety — keep it, but make it a derived constant computed from `graph.acceptedValuesFor('_runType').map(graph.stringValueOf)` in a codegen step. Or just keep the manual enum and add an invariant test that asserts the TS enum matches the graph enum. The second option is cheaper to maintain.

### 11.3. Derivation as a first-class edge

`IS_DERIVED_FROM` already exists in the taxonomy (section 2). Today it's used only as semantic metadata — section 3g shows it declared for `battleReport_coinsPerHour`, but no parser code consumes it. The internal fields `_date` and `_time` are a perfect use case for making this edge type *functionally* consumed.

Today, `src/features/analysis/shared/parsing/data-parser.ts` hardcodes the derivation:

```typescript
// current code, around line 225
if (battleDateField && validationResult.isValid) {
  const { date, time } = deriveDateTimeFromBattleDate(battleDate);
  fields._date = createInternalField('_date', date);
  fields._time = createInternalField('_time', time);
}
```

The field names `_date` / `_time` / `battleReport_battleDate` are all strings buried in the parser. If a future schema renames the source or adds a second derived field (e.g. `_dayOfWeek`), this code changes.

In the graph model, the derivation edges look like this:

```typescript
// src/shared/domain/field-graph/edges/derivations.ts
export const DERIVATION_EDGES = [
  edge('_date', 'IS_DERIVED_FROM', 'battleReport_battleDate', { deriver: 'deriver:dateFromBattleDate' }),
  edge('_time', 'IS_DERIVED_FROM', 'battleReport_battleDate', { deriver: 'deriver:timeFromBattleDate' }),
  // Existing game-field derivations (from section 3g) continue to work
  edge('battleReport_coinsPerHour', 'IS_DERIVED_FROM', 'battleReport_coinsEarned'),
  edge('battleReport_coinsPerHour', 'IS_DERIVED_FROM', 'battleReport_realTime'),
];
```

The `{ deriver: 'deriver:dateFromBattleDate' }` metadata points at a registered pure function. The registry is small:

```typescript
// src/shared/domain/field-graph/derivers.ts
export const DERIVERS: Record<string, (inputs: Record<string, GameRunField | undefined>) => string | number | undefined> = {
  'deriver:dateFromBattleDate': (inputs) => {
    const battleDate = inputs.battleReport_battleDate?.value as Date | undefined;
    return battleDate ? formatIsoDate(battleDate) : undefined;
  },
  'deriver:timeFromBattleDate': (inputs) => {
    const battleDate = inputs.battleReport_battleDate?.value as Date | undefined;
    return battleDate ? formatIsoTime(battleDate) : undefined;
  },
  'deriver:coinsPerHour': (inputs) => {
    const coins = inputs.battleReport_coinsEarned?.value as number | undefined;
    const realTime = inputs.battleReport_realTime?.value as number | undefined;
    if (coins == null || !realTime) return undefined;
    return (coins / realTime) * 3600;
  },
};
```

The parser consumes the edges generically — one function walks `IS_DERIVED_FROM` edges for every field, collects inputs, invokes the registered deriver, and writes the result. No hardcoded field names in the parser:

```typescript
// src/shared/domain/field-graph/apply-derivations.ts
import type { GameRunField } from '@/shared/types/game-run.types';
import { graph } from './index';
import { DERIVERS } from './derivers';
import { createInternalField } from '@/shared/domain/fields/field-utils';

/**
 * Walk every field that has at least one IS_DERIVED_FROM edge. For each,
 * collect its input fields from the current run's fields bag, invoke the
 * registered deriver, and write the result back. Runs topologically so a
 * field derived from another derived field sees the up-to-date value.
 */
export function applyDerivations(
  fields: Record<string, GameRunField>,
): Record<string, GameRunField> {
  const next = { ...fields };

  // Topological order: fields with no IS_DERIVED_FROM dependencies on
  // other derived fields come first. The graph already guarantees the
  // derivation DAG has no cycles (see invariant test 11.5).
  const orderedDerivedFields = graph.topologicalOrderByEdge('IS_DERIVED_FROM');

  for (const fieldId of orderedDerivedFields) {
    const derivationEdges = graph.query({ edgeType: 'IS_DERIVED_FROM', from: fieldId });
    if (derivationEdges.length === 0) continue;

    // All edges from the same `from` node use the same deriver.
    const deriverId = derivationEdges[0].deriver;
    if (!deriverId) continue;
    const deriver = DERIVERS[deriverId];
    if (!deriver) {
      console.warn(`[field-graph] no deriver registered for ${deriverId}`);
      continue;
    }

    // Collect inputs
    const inputs: Record<string, GameRunField | undefined> = {};
    for (const edge of derivationEdges) {
      inputs[edge.to] = next[edge.to];
    }

    const derived = deriver(inputs);
    if (derived !== undefined) {
      next[fieldId] = createInternalField(fieldId, String(derived));
    }
  }

  return next;
}
```

The parser's `deriveDateTimeFromBattleDate` call becomes one generic line:

```typescript
// AFTER
const fields = applyDerivations(rawFields);
// _date, _time, battleReport_coinsPerHour, battleReport_cellsPerHour all derived
```

Two downstream benefits:

1. **Adding a derived field is an edge declaration, not a parser patch.** `_dayOfWeek` derived from `battleReport_battleDate`? One edge, one entry in `DERIVERS`. No parser change.
2. **The derivation graph is inspectable.** `npm run graph:describe _date` prints the derivation inputs. `npm run graph:explain _date battleReport_battleDate` shows the edge with the deriver name. Debugging "why is `_date` empty?" becomes "which input is missing?" rather than "which file owns this?"

The same mechanism works for the existing `battleReport_coinsPerHour` case that's currently a display-time fallback. Lift it into `applyDerivations` at parse time and the per-hour fields are real fields in storage.

### 11.4. Gotchas list

Seven real gotchas about internal fields today, and how the graph makes each visible (or doesn't):

**Gotcha 1: CSV header naming is non-obvious.** `_Date` not `_date`, `_Run Type` not `_runType`. The header space-separates and capitalizes. Game fields don't follow this pattern (they export as V3 keys with game-specific capitalization). Today the override is in `INTERNAL_FIELD_MAPPINGS` in `internal-field-config.ts`; the CSV exporter special-cases internal fields by calling `isInternalField(key)` and looking up the mapping.
- **Graph visibility: HIGH.** `HAS_CSV_HEADER` edges make the override explicit. The CSV exporter does `graph.csvHeaderOf(key) ?? defaultCsvHeader(key)`. No special-casing. A reviewer reading the graph sees five `HAS_CSV_HEADER` edges, knows those fields have custom export names.

**Gotcha 2: `_rank` is tournament-only.** `handleRunTypeChange` in `use-data-input-form.ts:180` clears `rank` when the user switches away from tournament: `if (type !== RunType.TOURNAMENT) setRank('')`. This is a cross-field constraint — `_rank` is only valid when `_runType === 'tournament'`. Lose this constraint and rank persists with a non-tournament run, corrupting the data.
- **Graph visibility: HIGH.** Introduce a new edge type `CONDITIONAL_ON` (see section 12, where it's more fully explained for dissonance sub-categories):
  ```typescript
  edge('_rank', 'CONDITIONAL_ON', 'enum:runType.tournament')
  ```
  The form-state reducer queries `graph.conditionalOn('_rank')` and auto-clears `_rank` when the dependency no longer holds. One edge replaces the switch-on-run-type branch. The same edge powers the UI: "should I render the Rank input?" → `graph.isValidGiven('_rank', currentFormState)`.

**Gotcha 3: Notes must be CSV-escaped.** Users paste multi-line notes with commas, quotes, newlines. The CSV exporter has to quote-escape. Today this is inline in the exporter. The field *does* have a property that drives it ("is a user-text field"), but it's implicit.
- **Graph visibility: MEDIUM.** A `'user-text'` tag on the `_notes` node is enough. The CSV exporter checks `graph.hasTag(key, 'user-text')` to decide whether to force-quote. Discoverable but tag-based; no hard contract. Acceptable since the escaping rule is otherwise cheap and universal (escape anything that contains `,`, `"`, or `\n`).

**Gotcha 4: `_runType` detection has a two-tier fallback.** `detectRunTypeFromFields` in `run-type-detection.ts` first looks for an explicit `runType` field in the import, then falls back to tier-string pattern-matching (`/\+/.test(tierStr)`). Missing either tier reliance means the detection degrades silently.
- **Graph visibility: MEDIUM.** The graph can express the primary path (`_runType ACCEPTS_VALUE enum:runType.*`) and the detection inputs (`_runType IS_DERIVED_FROM battleReport_tier { deriver: 'deriver:runTypeFromTier' }`), but the *two-tier priority* (explicit > tier pattern) is a deriver implementation detail. The deriver function owns the priority logic. The graph advertises "this is derived from tier" but the fallback-to-explicit is inside the deriver. That's a fair split — the graph shows the dependency, the deriver owns the logic.

**Gotcha 5: Derivation timing is load-bearing.** `_date` and `_time` must be populated *before* duplicate detection runs, because duplicate detection currently falls back to `_date` when `battleReport_battleDate` is missing. If derivation runs after duplicate detection, you get false negatives.
- **Graph visibility: LOW.** The graph shows the dependencies but not the invocation order of different pipeline stages. This is a parser-architecture concern, not a field-relationship concern. The `applyDerivations` function is called at a specific point in the parser; that timing is documented in the parser's orchestration code, not in the graph. The graph's contribution: *if* the parser calls `applyDerivations` before duplicate detection, the derivation itself runs in dependency order (section 11.3's topological sort). The parser-level ordering is out of scope.

**Gotcha 6: Legacy V1 internal-field migration cannot be conflated with V2→V3 game-field rewrites.** `date` → `_date` is a storage-schema rename internal to the tower tracking app (the app adopted the underscore-prefixed internal-field convention). `coinsFromGoldenTower` → `coins_goldenTower` is a game-field rename driven by the V2→V3 storage schema bump (in response to the Tower game's V27→V28 section-izing of its export). Both use `RENAMED_FROM`. The distinguishing axis isn't a new edge type — it's which schema node the `atSchema` metadata targets, and whether the rename was driven by the *game's* version change (gameVersion tag on the schema node) or a purely internal refactor (no gameVersion tag). The V2→V3 rewriter in `remap-v2-field-keys.ts` only walks renames whose target schema was driven by a game-version change; a naive graph query that doesn't filter would conflate the two.
- **Graph visibility: HIGH once you add the filter.** Schema nodes carry a `gameVersion` payload field (e.g. `{ appVersion: '0.12.x', gameVersion: 'V28' }` for `schema:v3`, or `{ appVersion: '0.11.x' }` with no `gameVersion` for `schema:v2`'s internal-field adoption). The rewriter queries `graph.query({ edgeType: 'RENAMED_FROM', atSchemaHasGameVersion: true })` for game-driven renames; internal-field migration queries any `RENAMED_FROM`. This is a single payload field on the `Schema` node — a small cost for a large clarity win. See section 17 for the full Schema-as-node treatment.

**Gotcha 7: Duplicate-detection composite key doesn't include internal fields, but legacy runs may only have `_date` (no `battleReport_battleDate`).** Today's fallback in `generateCompositeKey` walks V2 legacy keys via `RENAMED_FROM`. Internal fields are *not* V2 game-data keys — they're app metadata. If the V2 app stored `date` but not `battleDate`, the composite-key fallback has to know to pull from `_date` (the migrated form of `date`) when `battleReport_battleDate` is absent.
- **Graph visibility: HIGH.** Add `IS_FALLBACK_FOR` edges:
  ```typescript
  edge('_date', 'IS_FALLBACK_FOR', 'battleReport_battleDate', { scope: 'compositeKey:primary' })
  ```
  The composite-key generator walks: "get `battleReport_battleDate`; if absent, walk `IS_FALLBACK_FOR` edges targeting it with matching scope and try those." This exposes a cross-cutting concern (legacy-storage fallbacks) that is currently buried in `generateCompositeKey`'s if-chain.

**Gotcha 8: `_rank` data type ambiguity.** Is it a number or a string? The type declaration says `RankValue` which is `number | ''`. Empty string means "no rank." Storage shape is a string. Display shape is a number with ordinal suffix (1st, 2nd).
- **Graph visibility: MEDIUM.** `HAS_DATA_TYPE 'number'` plus a `'nullable-empty-string'` tag captures this. The validator in section 9.5 handles the empty-string-as-null case. A more structured option is a `HAS_NULL_SENTINEL` edge to the empty string, but that might be over-engineering for one field.

### 11.5. New pattern-enforcing tests

Four invariant tests specific to internal fields, extending the style from section 10:

```typescript
// src/shared/domain/field-graph/__tests__/graph-invariants.test.ts

describe('Internal fields', () => {
  it('every internal field has IS_INTERNAL_FIELD edge to internal:app-metadata', () => {
    const missing: string[] = [];
    for (const field of graph.nodesOfType('Field')) {
      const isInternal = field.tags?.includes('internal');
      const hasEdge = graph.hasEdge(field.id, 'IS_INTERNAL_FIELD', 'internal:app-metadata');
      if (isInternal && !hasEdge) {
        missing.push(`${field.id}: tagged 'internal' but missing IS_INTERNAL_FIELD edge`);
      }
      if (!isInternal && hasEdge) {
        missing.push(`${field.id}: has IS_INTERNAL_FIELD edge but not tagged 'internal'`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('no internal field name starts with a V3 section prefix (battleReport_, coins_, damage_)', () => {
    const v3Prefixes = ['battleReport_', 'coins_', 'damage_', 'records_', 'counts_',
                        'totalEnemies_', 'killedBy_', 'killedWithEffectActive_'];
    const leaking: string[] = [];
    for (const field of graph.nodesOfType('Field')) {
      if (!field.tags?.includes('internal')) continue;
      for (const prefix of v3Prefixes) {
        if (field.id.startsWith(prefix)) {
          leaking.push(`${field.id}: internal field using V3 prefix '${prefix}'`);
        }
      }
      // Also: internal fields must start with underscore (app convention)
      if (!field.id.startsWith('_')) {
        leaking.push(`${field.id}: internal field must start with underscore`);
      }
    }
    expect(leaking, leaking.join('\n')).toEqual([]);
  });

  it('every ACCEPTS_VALUE edge target is a declared EnumValue node', () => {
    const bad: string[] = [];
    for (const edge of graph.query({ edgeType: 'ACCEPTS_VALUE' })) {
      const target = graph.getNode(edge.to);
      if (!target || target.kind !== 'EnumValue') {
        bad.push(`${edge.from} ACCEPTS_VALUE ${edge.to}: target is ${target?.kind ?? 'missing'}, expected EnumValue`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('IS_DERIVED_FROM forms a DAG (no cycles)', () => {
    const fields = graph.nodesOfType('Field').map((n) => n.id);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function visit(fieldId: string, path: string[]): void {
      if (recursionStack.has(fieldId)) {
        throw new Error(`IS_DERIVED_FROM cycle: ${[...path, fieldId].join(' -> ')}`);
      }
      if (visited.has(fieldId)) return;
      visited.add(fieldId);
      recursionStack.add(fieldId);
      for (const edge of graph.query({ edgeType: 'IS_DERIVED_FROM', from: fieldId })) {
        visit(edge.to, [...path, fieldId]);
      }
      recursionStack.delete(fieldId);
    }

    for (const field of fields) visit(field, []);
  });

  it('every EnumValue referenced by ACCEPTS_VALUE has HAS_DISPLAY_NAME and HAS_STRING_VALUE', () => {
    const incomplete: string[] = [];
    const referencedEnumValues = new Set(
      graph.query({ edgeType: 'ACCEPTS_VALUE' }).map((e) => e.to),
    );
    for (const enumId of referencedEnumValues) {
      const hasDisplay = graph.edgesFrom(enumId, 'HAS_DISPLAY_NAME').length === 1;
      const hasString = graph.edgesFrom(enumId, 'HAS_STRING_VALUE').length === 1;
      if (!hasDisplay || !hasString) {
        incomplete.push(`${enumId}: display=${hasDisplay}, stringValue=${hasString}`);
      }
    }
    expect(incomplete, incomplete.join('\n')).toEqual([]);
  });
});
```

These sit alongside the twelve from section 10 and exercise the same pattern-enforcing discipline. If a developer adds `_newInternalField` and forgets the `IS_INTERNAL_FIELD` edge, test 1 fails with a pointed message. If they typo `'enum:runtype.farm'` (lowercase), test 3 fails because the target is not a declared EnumValue. The tests are the contract.

---

> [< Prev: 10. Pattern-enforcing test library](./10-pattern-enforcing-test-library.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 12. Extending with a new run type + sub-category (dissonance) >](./12-extending-with-a-new-run-type-and-sub-category.md)
