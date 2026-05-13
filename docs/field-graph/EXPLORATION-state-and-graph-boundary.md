# Exploration: State and the graph boundary — what's the graph, what's the state, and where do they meet?

> **Date:** 2026-05-13
> **Branch:** `204-v28-migration-safety`
> **Author:** prep doc for the invocation-model decision (commit 9 closeout)
> **Status:** Reference doc — no decision required; prerequisite reading for [`EXPLORATION-derivation-invocation-model.md`](./EXPLORATION-derivation-invocation-model.md).
>
> **Why this doc exists.**
> The invocation-model decision (Option 3 vs status-quo) keeps stalling on a foundational question the prior doc never grounds: *what is actually in memory at runtime, and where does the graph touch it?* The owner surfaced this directly:
>
> > "I'm a little bit more and more detached of what the actual code is doing. So we're adding this graph and this graph architecture, which defines the metadata of how to access data, right? … Help me maybe add a section that explains currently how the graph is used to actually read values out of the parsed runs. Where is that done if I'm expanding a farm runs row because I want to see April 10th, the farming row from April 12th or 10th. How does that get its data? If I chart my coins earned over the past six months, how was the graph used to get that data for the 200 runs I have that are farming runs that I have coins earned in them?"
>
> > "Like, I have like, I don't know, like 600 or 1,000 runs by now. Like, is that persistent in memory somehow, or is it each time we switch pages or render a new graph, we call methods that end up extracting the data out of local storage, and are we re-parsing it to the, I, are we re-parsing it every time? I think there's an in-memory representation of the data, but I don't, we're not using like a, like a global store like Zustan or whatever. So I'm guessing is this on React context or something, how are we keeping them in sync, that kind of thing."
>
> This doc answers those questions concretely. It's a **reference doc, not a decision doc** — there's no "pick one of these options" frame. Read it before the sibling invocation-model doc; the latter will make sense once this one has put the actual file paths, JSON shapes, and call paths under your eyes.
>
> Cross-links:
> - **Companion (decision doc):** [`EXPLORATION-derivation-invocation-model.md`](./EXPLORATION-derivation-invocation-model.md) — where `applyDerivations` belongs; consumes this doc's §3, §4, and §6 as inputs.
> - **EPIC:** [`EPIC-migration.md`](./EPIC-migration.md) — commits 9 (derivation cascade — staged but not committed at time of writing), 11 (schema lifecycle), 11b (parser-boundary resolver consolidation), 12 (APPEARS_IN_VIEW) all touch the boundary this doc maps.
> - **Standing context:** [`field-graph-for-ai.md`](./field-graph-for-ai.md) — the read-path / write-path mental model at the top is consistent with what this doc unpacks.
> - **Spec:**
>   - [`architecture/02-how-it-works.md`](./architecture/02-how-it-works.md) — the engine's mental model.
>   - [`architecture/08-clarifying-the-mental-model.md`](./architecture/08-clarifying-the-mental-model.md) — "the graph is metadata, the state holds values" framing.
>   - [`architecture/11-internal-app-fields.md`](./architecture/11-internal-app-fields.md) §11.3 — derivation as a parse-time concern.
>   - [`architecture/18-write-path.md`](./architecture/18-write-path.md) §18.4 — edit-time cascade.
> - **Prior art:**
>   - [`EXPLORATION-engine-api-shape.md`](./EXPLORATION-engine-api-shape.md) — "engine class closed for new methods" (the 5b boundary). Relevant for §6 below.
>   - [`EXPLORATION-data-type-edge-vs-property.md`](./EXPLORATION-data-type-edge-vs-property.md) — the "does this drive consumer behavior?" litmus.

---

## Human decision

N/A — reference doc, not a decision doc. (Preserved for shape consistency with sibling exploration docs.)

---

## 1. The three-phase lifecycle

A `ParsedGameRun` has three lifecycle phases. The graph touches each one differently.

### Phase 1 — Parse

Triggered by exactly two entry points:

- **App load (cold path).** On every page load, `useDataProvider()` in [`src/shared/domain/use-data.ts:50-65`](../../src/shared/domain/use-data.ts) synchronously calls `loadRunsFromStorage()`, which reads the localStorage CSV string under key `tower-tracking-csv-data` and pipes it through `parseGenericCsv()` in [`src/features/data-import/csv-import/csv-parser.ts:247`](../../src/features/data-import/csv-import/csv-parser.ts). Every row produces a `ParsedGameRun` via `parseRow()`.
- **Manual paste / bulk CSV import (warm path).** The data-input form calls `parseGameRun()` in [`src/features/analysis/shared/parsing/data-parser.ts:139`](../../src/features/analysis/shared/parsing/data-parser.ts) for a single clipboard paste. The bulk CSV importer calls `parseGenericCsv()` for a multi-row file (same function as cold load — the localStorage round-trip and the file-upload round-trip both go through it).

Both parsers run the same back-half pipeline:

```
raw input
  → input-shape detection (V28 sectioned vs V2 flat — clipboard path only)
  → per-entry createGameRunField(originalKey, rawValue, importFormat)
      (queries the graph for dataType via resolveFieldByAnyKey → dataTypeOf)
  → remapV2FieldKeys(rawFields)   // graph-driven: walks RENAMED_FROM
  → applyDerivations(remapped)    // graph-driven: walks IS_DERIVED_FROM
  → extractKeyStatsFromFields(fields)   // pluck cached props (tier, wave, coinsEarned, …)
  → ParsedGameRun { id, timestamp, fields, …cachedProps, dateValidationError? }
```

Output shape — what every consumer sees from this point forward:

```typescript
interface ParsedGameRun {
  id: string;                    // crypto.randomUUID()
  timestamp: Date;               // from battleDate / customTimestamp fallback
  fields: Record<string, GameRunField>;  // canonical V3 keys → field objects
  readonly tier: number;         // cached: extracted at parse, never recomputed
  readonly wave: number;
  readonly coinsEarned: number;
  readonly cellsEarned: number;
  readonly realTime: number;
  readonly runType: RunTypeValue;
  dateValidationError?: BattleDateValidationError;
}
```

The graph is **consulted during parse** (data-type lookup, V2-key remap, derivation cascade) but **its references don't survive into the output**. A `ParsedGameRun` is a plain JSON-serializable object — no graph handles, no edge-walk callbacks, no proxy objects. Once parsed, it's free of the graph until the next edit.

### Phase 2 — Runtime

Once parsed, runs live in React state (specifically, `useState<ParsedGameRun[]>` inside the data provider — see §2 below). They stay in memory for the lifetime of the page session. **They are not re-parsed when the user navigates between charts, opens a row, or re-renders a list.** When the localStorage save fires (debounced 300ms after a state change), the in-memory state gets serialized back to CSV; the inverse is not true (no read-after-write from storage during a session).

Consumers in Phase 2 hit two surfaces:

- **`run.fields[fieldId].value`** — direct property access. Sub-microsecond. Used by every chart's aggregation hot loop.
- **`graph.<query>(fieldId)`** — graph metadata lookup. Sub-microsecond (Map lookup against pre-built indexes). Used to discover *which* fields to read, not what values they have.

The graph is consulted *per render at metadata level* (which fields exist? what's their display name?) and *not* on the value-extraction hot path. See §4 for two worked walkthroughs.

### Phase 3 — Export / persist

The data provider has a 300ms-debounced effect ([`use-data.ts:234-261`](../../src/shared/domain/use-data.ts)) that calls `saveRunsToStorage(runs)` after any state mutation. That function chains through `runsToStorageCsv()` → `exportToCsv()` → CSV string → `localStorage.setItem(STORAGE_KEY, csvData)` ([`csv-persistence.ts:17-78`](../../src/features/data-import/csv-import/csv-persistence.ts)).

`exportToCsv` queries the graph for `internalFields()` (which fields go first in column order) and `csvHeaderOf(fieldId)` (what string to write in the header row). Beyond that, the values that go into each cell come from `run.fields[fieldId].rawValue` or `displayValue` — **not** re-derived from a `GameRunField.value` at export time. Whatever was true post-parse is what gets persisted, character-for-character.

This is load-bearing for the invocation-model decision: derived values (`_date`, `_time`, `_runType`) **persist** through the CSV round-trip because they're written into `run.fields` at parse time and the exporter writes whatever's there. A "lazy on read" model (the invocation-model doc's Option 2) would break this round-trip without a `hydrateBeforeExport` step.

---

## 2. State persistence and React-side shape

### Where the runs live

There is **one** React context that holds run state for the entire app: `DataContext` in [`src/shared/domain/use-data.ts:38`](../../src/shared/domain/use-data.ts). The provider is [`src/shared/domain/data-provider.tsx`](../../src/shared/domain/data-provider.tsx), mounted near the root of the route tree (see `src/router.tsx`).

There is **no** Zustand, Redux, Jotai, or other global store. The owner's intuition was right:

> "we're not using like a global store like Zustan or whatever. So I'm guessing is this on React context or something."

Yes — React context, with `useState` inside the provider's hook. The shape:

```typescript
// inside useDataProvider() in use-data.ts:67-69
const [runs, setRuns] = useState<ParsedGameRun[]>(initialData.runs);
const [compositeKeys, setCompositeKeys] = useState<Set<string>>(initialData.compositeKeys);
```

`initialData` is computed synchronously inside an IIFE during the first render of the provider:

```typescript
// use-data.ts:50-65 (paraphrased to fit one block)
const initialData = (() => {
  if (typeof window === 'undefined') {
    return { runs: [], compositeKeys: new Set<string>() };
  }
  try {
    const loadedRuns = loadRunsFromStorage();   // localStorage → ParsedGameRun[]
    return {
      runs: loadedRuns,
      compositeKeys: generateCompositeKeysSet(loadedRuns),
    };
  } catch (error) {
    console.error('[Data Loading] Failed to load runs from storage:', error);
    return { runs: [], compositeKeys: new Set<string>() };
  }
})();
```

That IIFE runs **once per provider mount**. Since the provider is mounted at the route-tree root, it runs **once per browser tab** — not once per page. Navigating from `/charts/tier-trends` to `/charts/coverage` does **not** re-mount the provider; it stays alive, and the `runs` array stays in memory.

### Re-parsing? No

The owner asked:

> "is that persistent in memory somehow, or is it each time we switch pages or render a new graph, we call methods that end up extracting the data out of local storage, and are we re-parsing it to the, I, are we re-parsing it every time?"

**Not re-parsed.** Parsing happens exactly once per tab session at provider mount. After that, consumers across all pages (`useData().runs`) share the same array reference — until a mutation (add/remove/edit) replaces it via `setRuns`. The localStorage round-trip is **write-only** during a session: state mutations get debounced and written; nothing reads from storage between mutations.

(Exception: a fresh tab opened in a different window will load independently from localStorage, but two tabs don't share an in-memory state and don't sync.)

### How mutations propagate

Every mutator (`addRun`, `updateRun`, `removeRun`, `overwriteRun`, `clearAllRuns`, `addRuns`) takes the same shape: it calls `setRuns(prev => …)` to produce a new `ParsedGameRun[]`. The debounced save-effect at [`use-data.ts:234-261`](../../src/shared/domain/use-data.ts) watches `runs` and re-fires `saveRunsToStorage(runs)` 300ms after the last change.

The compositeKeys `Set` is a parallel state that gets updated *in lockstep* with `runs` inside each mutator — same React state machinery, same provider, separate `useState`. (One small smell: composite-key updates happen via nested `setCompositeKeys` calls inside `setRuns` callbacks. Out of scope for this doc.)

### What a single `ParsedGameRun` looks like in memory

For a sample farm run from the cold-load path (input: [`sampleData/farmingRun_2025-08-16.txt`](../../sampleData/farmingRun_2025-08-16.txt)), the in-memory shape after parse + derivations is approximately:

```json
{
  "id": "c4a8b9e2-7f3d-4c1a-9e84-3b2c1f5d6a7e",
  "timestamp": "2025-08-16T19:30:00.000Z",
  "fields": {
    "battleReport_gameTime": {
      "value": 134691,
      "rawValue": "1d 13h 24m 51s",
      "displayValue": "1d 13h 24m 51s",
      "originalKey": "Game Time",
      "dataType": "duration"
    },
    "battleReport_realTime": {
      "value": 27966,
      "rawValue": "7h 46m 6s",
      "displayValue": "7h 46m 6s",
      "originalKey": "Real Time",
      "dataType": "duration"
    },
    "battleReport_tier": {
      "value": 10,
      "rawValue": "10",
      "displayValue": "10",
      "originalKey": "Tier",
      "dataType": "tier"
    },
    "battleReport_wave": {
      "value": 5881,
      "rawValue": "5881",
      "displayValue": "5881",
      "originalKey": "Wave",
      "dataType": "number"
    },
    "battleReport_killedBy": {
      "value": "Ranged",
      "rawValue": "Ranged",
      "displayValue": "Ranged",
      "originalKey": "Killed By",
      "dataType": "string"
    },
    "battleReport_coinsEarned": {
      "value": 1.13e12,
      "rawValue": "1.13T",
      "displayValue": "1.13T",
      "originalKey": "Coins Earned",
      "dataType": "number"
    },
    "battleReport_cellsEarned": {
      "value": 47890,
      "rawValue": "47.89K",
      "displayValue": "47.89K",
      "originalKey": "Cells Earned",
      "dataType": "number"
    },
    "battleReport_battleDate": {
      "value": "2025-08-16T19:30:00.000Z",
      "rawValue": "2025-08-16T19:30:00.000Z",
      "displayValue": "2025-08-16T19:30:00.000Z",
      "originalKey": "battleReport_battleDate",
      "dataType": "date"
    },
    "_date": {
      "value": "8/16/2025",
      "rawValue": "8/16/2025",
      "displayValue": "8/16/2025",
      "originalKey": "_date",
      "dataType": "date"
    },
    "_time": {
      "value": "7:30:00 PM",
      "rawValue": "7:30:00 PM",
      "displayValue": "7:30:00 PM",
      "originalKey": "_time",
      "dataType": "string"
    },
    "_runType": {
      "value": "farm",
      "rawValue": "farm",
      "displayValue": "farm",
      "originalKey": "_runType",
      "dataType": "string"
    },
    "_notes": {
      "value": "Good wave RNG, ran out of time",
      "rawValue": "Good wave RNG, ran out of time",
      "displayValue": "Good wave RNG, ran out of time",
      "originalKey": "_notes",
      "dataType": "string"
    }
  },
  "tier": 10,
  "wave": 5881,
  "coinsEarned": 1.13e12,
  "cellsEarned": 47890,
  "realTime": 27966,
  "runType": "farm"
}
```

Three notable shapes in this snapshot:

1. **`fields` carries ~50-150 entries per run** in practice — every game stat (`battleReport_*`), every category breakdown (`damage_*`, `coins_*`, `cells_*`, `deaths_*`, …), and every internal field (`_date`, `_time`, `_runType`, `_notes`, `_rank` when present).
2. **Derived fields (`_date`, `_time`, `_runType`) live alongside their inputs.** They were populated by `applyDerivations` during parse; from the consumer's perspective they're indistinguishable from input fields. This is what the invocation-model doc's "where do derived values live?" question is asking about.
3. **Cached props (`tier`, `wave`, `coinsEarned`, …) are duplicated.** `run.coinsEarned === run.fields.battleReport_coinsEarned.value`. The duplication is intentional — cached props give consumers a numeric primitive without a `.fields[id].value as number` cast and let TS infer the type. The cost: any update path that changes the underlying field must keep the cached prop in sync (or vice versa). The data-context `updateRun` mutator does this via spread (`{ ...run, ...updates }`); consumers that mutate `fields` directly without going through `updateRun` would drift.

---

## 3. Where the graph is used at runtime today

Grep `from '@/shared/domain/field-graph'` across `src/`. At time of writing (post-commit-9 staged), there are **16 production files** that import directly from the field-graph barrel. Grouped:

### Read-path consumers (metadata-only)

| File | Imports | Purpose |
|---|---|---|
| [`use-run-details-data.ts`](../../src/features/game-runs/card-view/run-details/use-run-details-data.ts) | `breakdownRateOf`, `breakdownTotalOf`, `categoriesInDisplayOrder`, `colorOf`, `displayNameOf`, `fieldsInSection`, `fieldsMeasuredAgainst`, `isInternalField`, `sectionsInCategory`, `sourcesOf` | Drive run-details panel: which sections, in what order, with which fields. |
| [`csv-exporter.ts`](../../src/features/data-export/csv-export/csv-exporter.ts) | `csvHeaderOf`, `internalFields` | Determine column order + header strings for CSV writes. |
| [`source-analysis/category-config.ts`](../../src/features/analysis/source-analysis/category-config.ts) | `colorOf`, `displayNameOf`, `fieldsInSection`, `sourcesOf` | Build the source-analysis category list from graph queries. |
| [`run-type-filter.ts`](../../src/features/analysis/shared/filtering/run-type-filter.ts) | `enumValueMeta` | Read run-type display name / color from the enum-value metadata. |
| [`tier-stats-config-utils.ts`](../../src/features/analysis/tier-stats/config/tier-stats-config-utils.ts) | (graph queries — TBD by grep) | Column visibility / ordering for tier-stats table. |

The defining characteristic: **none of these read `run.fields[id].value` from the graph.** They use the graph to ask metadata questions ("which fields belong to the `damage` section?", "what's the display name for `battleReport_coinsEarned`?") and then read the values directly from the `ParsedGameRun` they were handed.

### Write-path consumers (parse-time + edit-time)

| File | Imports | Purpose |
|---|---|---|
| [`data-parser.ts`](../../src/features/analysis/shared/parsing/data-parser.ts) | `applyDerivations` | Clipboard paste pipeline; runs cascade once per run. |
| [`csv-parser.ts`](../../src/features/data-import/csv-import/csv-parser.ts) | `applyDerivations` | Bulk CSV import; runs cascade once per row. |
| [`field-utils.ts`](../../src/features/analysis/shared/parsing/field-utils.ts) | `dataTypeOf`, `resolveFieldByAnyKey`, `type DataType` | Per-field parsing dispatch (`createGameRunField`). |
| [`date-issue-detection.ts`](../../src/shared/formatting/date-issue-detection.ts) | `cascadeFromInputChange` | Edit-time cascade after `applyDateFix` materializes a battleDate. |
| [`data-input-form-logic.ts`](../../src/features/data-import/manual-entry/data-input-form-logic.ts) | (transitively via `applyDateFix`) | `prepareRunForSave` triggers cascade via `applyDateFix` indirection. |
| [`run-type-detection.ts`](../../src/shared/domain/run-types/run-type-detection.ts) | `applyDerivations` | Post-parse run-type detection; calls cascade defensively to ensure `_runType` is populated. |
| [`remap-v2-field-keys.ts`](../../src/shared/domain/migrations/remap-v2-field-keys.ts) | `resolveFieldByAnyKey` | V2 → V3 key remap during parse. |
| [`v2-to-v3-migrator.ts`](../../src/shared/domain/migrations/v2-to-v3-migrator.ts) | `resolveFieldByAnyKey` | Bulk migration adapter. |
| [`csv-field-mapping.ts`](../../src/features/data-import/csv-import/csv-field-mapping.ts) | `resolveFieldByAnyKey` | CSV header → canonical key during import. |

The defining characteristic: these are **parse-time and edit-time** call sites. They run when a `ParsedGameRun` is being constructed or mutated, **not** when it's being read for display. The invocation-model doc focuses on this group.

### Catalog-internal (test / invariant)

| File | Purpose |
|---|---|
| `*.invariants.test.ts` files (one per edge concept) | Assert catalog shape (every internal field has a CSV header, etc.). |
| `field-graph.test.ts` | Engine primitives test. |
| `enum-sync.invariant.test.ts` | Enum-value sync invariant. |

Not consumer code, doesn't affect runtime cost. Listed for completeness.

### Summary

**16 production files import the graph.** Of those, **5 are read-path metadata consumers**, **9 are write-path** (parse / edit / migrate), and **2 are types-only** (`game-run.types.ts` imports `type DataType`; `run-type-detection.ts` is the borderline case — uses cascade defensively at runtime).

The graph touches a handful of well-defined surfaces. It is **not** sprinkled across the codebase. The "if every consumer needs the canonical value of a field has to run the cascade first, the graph has only delivered deriver declarations — not derived values" framing in the invocation-model doc isn't quite right at the file level — it's right at the *call-site* level (within parsers, there's a named cascade call), but those call sites are inside a small handful of files, not strewn across UI code.

---

## 4. Concrete read-path walkthroughs

The owner asked for two worked examples. Here they are.

### Walkthrough A — Expand a farm runs row (e.g. April 10th)

User clicks the chevron on a row in the runs table. The runs table is rendered by [`src/features/game-runs/card-view/`](../../src/features/game-runs/card-view) components; expanding a row reveals `<RunDetails run={run} />`.

Call path:

1. **Component reads run from props.** [`run-details.tsx:30`](../../src/features/game-runs/card-view/run-details.tsx) — `function RunDetails({ run }: RunDetailsProps)`. The `run` is a `ParsedGameRun` already in memory (came from `useData().runs.find(r => r.id === ...)` upstream in the table component).

2. **Hook computes the section/category tree.** [`run-details.tsx:32`](../../src/features/game-runs/card-view/run-details.tsx) — `const data = useRunDetailsData(run)`. The hook is [`use-run-details-data.ts:206-212`](../../src/features/game-runs/card-view/run-details/use-run-details-data.ts):

   ```typescript
   export function useRunDetailsData(run: ParsedGameRun): RunDetailsData {
     return useMemo(() => {
       const categories = categoriesInDisplayOrder().map((id) => buildCategory(run, id));
       const uncategorized = buildUncategorized(run);
       return { categories, uncategorized };
     }, [run]);
   }
   ```

3. **`categoriesInDisplayOrder()` is a graph query.** It returns the list of category ids (`['battleReport', 'damage', 'utility', …]`) in declaration order. Sub-microsecond — pre-built index lookup.

4. **`buildCategory(run, categoryId)` walks sections.** Inside it, [`use-run-details-data.ts:161`](../../src/features/game-runs/card-view/run-details/use-run-details-data.ts):

   ```typescript
   for (const sectionId of sectionsInCategory(categoryId)) {
     const section = buildSection(run, sectionId);
     if (section !== null) sections.push(section);
   }
   ```

   `sectionsInCategory(categoryId)` — graph query. Returns section ids in declaration order.

5. **`buildSection(run, sectionId)` queries the graph for section shape.** For a plain (non-breakdown) section, [`use-run-details-data.ts:108-132`](../../src/features/game-runs/card-view/run-details/use-run-details-data.ts):

   ```typescript
   const fieldIds = fieldsInSection(sectionId).filter((id) => {
     if (HIDDEN_FROM_RUN_DETAILS.has(id)) return false;
     if (breakdownTotal !== undefined && id === breakdownTotal) return false;
     return true;
   });
   if (fieldIds.length === 0) return null;

   const data = extractPlainFields(run, {
     label: sectionLabel(sectionId),
     fields: fieldIds.map((id) => ({ fieldName: id, displayName: fieldDisplayName(id) })),
   });
   ```

   Graph calls here: `fieldsInSection(sectionId)`, `sectionLabel(sectionId)` (which is `displayNameOf(sectionId).toUpperCase()`), `fieldDisplayName(fieldId)` (`displayNameOf(fieldId)`). All Map-lookups; sub-microsecond each.

6. **`extractPlainFields(run, { fields: […] })` reads values.** This pulls the actual numeric / string values out of the run. The implementation lives in [`run-details/breakdown/breakdown-calculations.ts`](../../src/features/game-runs/card-view/run-details/breakdown/breakdown-calculations.ts) (not shown — same shape as `extractFieldValue` below). For each field id in the list, it does:

   ```typescript
   const field = run.fields[fieldId];   // direct object access
   return {
     fieldName: fieldId,
     displayName,
     displayValue: field?.displayValue ?? '',
   };
   ```

   **No graph call.** The `run.fields[fieldId]` lookup is a `Record<string, GameRunField>` access — a single hash lookup. The `displayValue` was computed at parse time and stored on the field. Render-time cost: ~nanoseconds per field, ~50 fields per section, ~10 sections — well under a millisecond total.

7. **JSX renders.** Each section maps to `<SectionRow fieldName={...} displayValue={...} />`. The graph has been consulted exactly **once per section + once per field for display-name + once for category structure** during this render. The values came straight from `run.fields[id].displayValue`.

The pattern: **graph queries answer "what's the structure?", state access answers "what's the value?"**. The graph is consulted at metadata frequency (sections × fields, one-time-per-render); values come from O(1) property access.

### Walkthrough B — Chart "coins earned" over the past 6 months for ~200 farming runs

User opens `/charts/fields` and selects "Coins Earned". A time-series chart with daily/weekly/monthly periods renders.

Call path:

1. **Component reads runs.** [`time-series-chart.tsx:3`](../../src/features/analysis/time-series/time-series-chart.tsx) (or wherever the parent reads `useData().runs`). The full `runs: ParsedGameRun[]` array (could be 1000+ entries) is in scope.

2. **Filter to farm.** Upstream (in the route component or a parent), `filterRunsByType(runs, RunType.FARM)` returns the farm subset (~600 of 1000). This walks `runs.filter(r => r.runType === 'farm')` — a cached-prop read, no graph call. ~microseconds.

3. **Hook prepares chart data.** `useTimeSeriesChartData(filteredRuns, 'coinsEarned', defaultPeriod, pageScope)` in [`use-time-series-chart-data.ts:43`](../../src/features/analysis/time-series/use-time-series-chart-data.ts):

   ```typescript
   const baseChartData = useMemo(() => {
     return prepareTimeSeriesData(filteredRuns, selectedPeriod, metric);
   }, [filteredRuns, selectedPeriod, metric]);
   ```

4. **`prepareTimeSeriesData(runs, 'monthly', 'coinsEarned')` dispatches to the period-specific function.** [`chart-data.ts:22-43`](../../src/features/analysis/time-series/chart-data.ts) — `Duration.MONTHLY → prepareFieldPerMonthData(runs, 'coinsEarned')`.

5. **`prepareFieldPerMonthData` aggregates.** Inside [`field-aggregation.ts:82-95`](../../src/features/analysis/time-series/field-aggregation.ts) (sampling the daily path; monthly is structurally identical):

   ```typescript
   dailyGroups.forEach((dayRuns) => {
     const total = dayRuns.reduce((sum, run) => {
       const value = extractFieldValue(run, fieldKey);
       return sum + (value ?? 0);
     }, 0);
     const timestamp = startOfDay(dayRuns[0].timestamp);
     dailyData.push({ date: formatDisplayMonthDay(timestamp), value: total, timestamp });
   });
   ```

6. **`extractFieldValue(run, 'coinsEarned')` is the hot loop.** Implementation in [`field-extraction.ts:8-30`](../../src/features/analysis/time-series/field-extraction.ts):

   ```typescript
   export function extractFieldValue(run: ParsedGameRun, fieldKey: string): number | undefined {
     // Check cached properties first (tier, wave, coinsEarned, cellsEarned, realTime)
     if (fieldKey in run) {
       const value = (run as unknown as Record<string, unknown>)[fieldKey];
       return typeof value === 'number' ? value : undefined;
     }
     // Check dynamic fields
     const field = run.fields[fieldKey];
     if (!field) return undefined;
     if (field.dataType === 'number') {
       return typeof field.value === 'number' ? field.value : parseFloat(String(field.value));
     }
     if (field.dataType === 'duration') {
       return typeof field.value === 'number' ? field.value : undefined;
     }
     return undefined;
   }
   ```

   For `fieldKey === 'coinsEarned'`, the first branch hits — `'coinsEarned' in run` is true, returns `run.coinsEarned` directly. **No graph call.** No `run.fields` lookup. Just a property read on the `ParsedGameRun`.

   For a less-common field like `'battleReport_lifesteal'`, the second branch hits — `run.fields['battleReport_lifesteal']?.value` (also no graph call; a Map lookup on `Record<string, GameRunField>`).

7. **Aggregation runs over 600 runs.** ~600 calls to `extractFieldValue`, each one O(1). Total time: well under a millisecond on a modern machine. Followed by group-by-month (Map insertions) and a sort — also sub-millisecond at this N.

8. **JSX renders the chart.** Recharts consumes the `ChartDataPoint[]` and renders SVG.

**The graph is not consulted anywhere on this path.** Not at the filter step (cached `run.runType`), not at the extraction step (cached `run.coinsEarned`), not at the aggregation step (`startOfMonth(timestamp)` is a date-fns call), not at the render step. The chart is value-pure: state in, SVG out, zero graph queries.

This is the **key insight** for the invocation-model decision. The performance-of-graph-calls concern that the prior version of the invocation-model doc rebutted (quoting the owner's *"do you want to apply derivation on runtime every single time you're accessing a field?"*) is correct on substance: the cascade does NOT run per access. It runs once at parse. After that, charts read `run.coinsEarned` and never see the graph.

---

## 5. Where the graph is NOT used (and probably shouldn't be)

A short list, both for grounding and because the invocation-model doc's recommendation depends on each being true.

- **Direct cached-property access.** `run.tier`, `run.coinsEarned`, `run.realTime`, `run.runType`, `run.timestamp` — these don't go through the graph today and shouldn't. They're cached for hot-loop access.
- **Run filtering by date / tier / run-type.** All three filter dimensions read cached props (`run.timestamp`, `run.tier`, `run.runType`). No graph involvement.
- **Chart aggregations.** As §4 walkthrough B showed — the graph is consulted at most for *metric selection* (which fields can the user chart?), not for value extraction.
- **Table cell rendering.** Tier-stats cells, run-details cells: `field.displayValue` is computed at parse and cached. No graph call at render time.
- **Sort comparators.** Sort by tier, wave, date, coins: pure cached-prop comparisons.
- **Date formatting / number formatting.** Locale-aware shared utilities in `src/shared/formatting/`. Not graph-coupled.

The graph is also **not** stored in localStorage, IndexedDB, or any persistent store. It's rebuilt deterministically at app load from the static catalog declarations. The `appGraph()` singleton hydrates lazily on first call (see [`app-graph.ts`](../../src/shared/domain/field-graph/app-graph.ts)) and stays in memory for the tab session.

This bears repeating because it's central to the value-vs-metadata distinction: **the graph is app-scoped (the same for every user, every run, every session). The state is user-scoped (one user's local imports). They never need to be persisted together; they live at different scopes.**

The owner partially articulated this themselves:

> "the graph is really metadata, it's how do you access the data that you have right. It's not the values of the data itself, it's references to properties or how you want to transform the values."

That's the accurate framing. The graph carries catalog-level facts (which fields exist, what their data types are, which sections they belong to, what V2 names they used to have, what they derive from). The state carries per-run values. The boundary lives at the `ParsedGameRun.fields[fieldId].value` access.

---

## 6. The parser's current purpose (and what could move to the graph)

The owner asked this directly:

> "What is the purpose of the parser? Right now, it has many functions that feel like, at first glance, they should belong to the graph. … But what, if I say that shouldn't be the parser, what is the parser's purpose, right? And that's where things get a little bit tricky."

This section itemizes what each parser does and decides — for each responsibility — whether it (a) stays with the parser, (b) is a candidate to move into a graph-orchestrated `hydrateRun` (the invocation-model doc's Option 3), or (c) is genuinely ambiguous.

The two parsers are [`data-parser.ts:parseGameRun`](../../src/features/analysis/shared/parsing/data-parser.ts) (clipboard paste) and [`csv-parser.ts:parseGenericCsv`/`parseRow`](../../src/features/data-import/csv-import/csv-parser.ts) (bulk CSV). They share most of the back half of the pipeline.

### `data-parser.ts:parseGameRun` — itemized

| # | Responsibility | Lines | (a) parser / (b) graph / (c) ambiguous |
|---|---|---|---|
| 1 | Decide whether input is V28 sectioned or V2 flat (`looksLikeV28SectionedInput`) | 155 | (c) ambiguous — input-format detection. The fact that V28 exports differ structurally is a graph-versioning fact (a schema concern). But the *detection* (looking for `→` arrows + section headers in a string) is text-shape detection, not a graph query. **Lean parser.** |
| 2 | Parse V28 sectioned text → `{key, label, value}[]` (`parseV28SectionedEntries`) | 160 | (a) parser. This is "raw text → key/value triples." Pure text processing. |
| 3 | Parse V2 tab-delimited text → `Record<string, string>` (`parseTabDelimitedData`) | 164 | (a) parser. Same — text processing. |
| 4 | Per-entry `createGameRunField(originalKey, rawValue, importFormat)` | 161, 167 | (c) ambiguous — but the *internals* of this call (data-type dispatch, parsing strategy per type) are already graph-driven. The wrapping orchestration is parser-ish. **Lean parser-orchestrates, graph-provides-strategy.** |
| 5 | `remapV2FieldKeys(rawFields)` (graph-driven RENAMED_FROM walk) | 174 | (b) graph — already is. Lives in `migrations/`, queries `resolveFieldByAnyKey`. Could move into a `hydrateRun` orchestration. |
| 6 | Battle-date validation + timestamp resolution (`validateBattleDate`, fallback to `customTimestamp ?? new Date()`) | 177-194 | (c) ambiguous — the *validation* (format checks, future-date warnings) is locale-aware logic. The *fallback hierarchy* (battleDate > customTimestamp > now) is a parser-policy choice. Could go either way. **Lean parser** for the fallback policy; the validation could become a graph-attached deriver (`HAS_VALIDATOR` edge) but that's a bigger conversation. |
| 7 | `applyDerivations(remapped)` (graph-driven cascade) | 196 | (b) graph — already is. The named call site is what the invocation-model doc is about. |
| 8 | `extractKeyStatsFromFields(fields)` (extracts cached props `tier`, `wave`, `coinsEarned`, …) | 198 | (c) ambiguous — knows about specific field ids (`battleReport_tier`, `battleReport_wave`, etc.). Could be reformulated as "for every cached-prop slot on `ParsedGameRun`, look up the value from a known field id" — a graph-driven shape would be `cachedPropsOf(run)`. **Lean candidate-for-graph** if commit 11/11b lands a `HAS_CACHED_PROP_AS` edge or similar. |
| 9 | Construct the final `ParsedGameRun` object (id, timestamp, fields, …cachedProps) | 200-206 | (a) parser. Object construction with parser-policy decisions (id generation, timestamp resolution). |

### `csv-parser.ts:parseGenericCsv` + `parseRow` — itemized

| # | Responsibility | Lines | (a) parser / (b) graph / (c) ambiguous |
|---|---|---|---|
| 1 | Split CSV input into lines, detect delimiter, parse header row | 220-237 | (a) parser. CSV-shape parsing. |
| 2 | `buildColumnToFieldMap(headers)` — map column index → camelCase canonical field name | 61-87 | (c) ambiguous — already in part graph-driven (V3 prefix detection, `_`-prefix detection). The `toCamelCase` fallback is the part commit 11b is consolidating into the graph (per the locked D-α resolver shape). **Mostly going to the graph already** (commit 11b). |
| 3 | `findBattleDateColumnIndex(columnToFieldMap)` | 90-97 | (a) parser. Knows about a specific column being load-bearing. |
| 4 | `createFieldMappingReport(headers, supportedFields)` (warn about unknown columns) | 260 | (c) ambiguous. The "is this a known field?" check is a graph query (`resolveFieldByAnyKey(header) !== null`); the "build a structured report for the UI" is parser policy. |
| 5 | For each row: per-cell `createGameRunField` (same as data-parser #4) | 186 | Same as data-parser #4. |
| 6 | `remapV2FieldKeys(rawFields)` (same as data-parser #5) | 193 | Same as data-parser #5. (b) graph. |
| 7 | `applyDerivations(remapped)` (same as data-parser #7) | 195 | Same as data-parser #7. (b) graph. |
| 8 | `processBattleDateField(fields, context)` — validate, emit warnings, check fixability via `_date`/`_time` | 144-173 | (c) ambiguous. Validation = parser-ish today; fixability detection (consult `_date`/`_time` to see if they could derive a battleDate) is graph-aware-already (it consults `tryDeriveFromInternalFields` which knows about the `_date`/`_time` shape). |
| 9 | `parseTimestampFromFields(fields)` | 202 | (c) ambiguous. Reads battle-date / `_date`/`_time` from fields; the "which fields to consult, in what order" is a parser-policy choice, but the deriver-graph already encodes that the `_date`/`_time` chain is derivable from battleDate. **Lean parser** but could be a graph query. |
| 10 | `extractKeyStatsFromFields(fields)` | 203 | Same as data-parser #8. (c) ambiguous → graph candidate. |

### Distillation

**The parser's irreducible responsibilities** (the things that genuinely don't belong on the graph):

1. **Input-shape detection.** Is this CSV? Tab-delimited clipboard? V28 sectioned? Comma-delimited file? This is a question about *text*, not about *fields*.
2. **Raw text → key-value extraction.** Splitting on delimiters, handling quoted values, normalizing whitespace. CSV-protocol concerns.
3. **Per-entry orchestration**: walking the key-value pairs and constructing field objects via the graph-provided strategy.
4. **Top-level policy decisions**: timestamp fallback hierarchy, id generation, error reporting shape, field-mapping report.

**The parser's currently-orchestrated-but-genuinely-graph-concerns** (the things the owner is right to be uneasy about):

1. **V2 → V3 key remap** (`remapV2FieldKeys`). Already graph-driven; the parser just calls it once. Could move into a `hydrateRun` and the parser never names it.
2. **Derivation cascade** (`applyDerivations`). Already graph-driven; the named call site is the smell. Same answer.
3. **Cached-prop extraction** (`extractKeyStatsFromFields`). Today the parser knows the canonical field ids. Could be inverted: the graph knows which fields back which cached props (via a new edge or via reading existing IS_OF_TYPE / IS_INTERNAL_FIELD declarations).

**The genuinely ambiguous middle**:

1. **Battle-date validation.** Date-format-aware, locale-aware, returns structured errors. Today the parser owns this; under the graph-as-validator framing it could be a `HAS_VALIDATOR` edge. But the call shape isn't trivial (validation needs locale settings, format hints, and a result type the parser uses). **Probably stays parser-ish for now** but is a candidate for a future "graph-attached validators" pass.
2. **Date issue detection (`detectDateIssue`, `applyDateFix`).** Same shape; lives in the parser-adjacent `date-issue-detection.ts`. Currently consults the graph (`cascadeFromInputChange`); could be more thoroughly graph-driven.
3. **`createFieldMappingReport`** (CSV-import warning machinery). Parser-policy, but the underlying "is this a known field?" check is a graph query.

### Consolidating the two parsers

The owner also asked:

> "we have a couple parsers, right? The CSV parser and the Gameron parser, so. And right now, I think there's separate limitations. … Is there any options to consolidate them and also move things that belong to the graph into the graph?"

Looking at the two functions side by side, the structural overlap is the back half of the pipeline:

```
remapV2FieldKeys → applyDerivations → extractKeyStatsFromFields → construct ParsedGameRun
```

is identical between `parseGameRun` (clipboard) and `parseRow` (CSV row). The front half differs:

- Clipboard: detect V28 vs V2, parse tab-delimited or sectioned text, iterate entries.
- CSV: split lines, detect delimiter, build column-to-field-name map, iterate rows.

**Could they consolidate?** The shared back-half *can* be a `hydrateRun(rawFields, context)` function — that's exactly what the invocation-model doc's Option 3 proposes. The front-half differences would remain in two thin shells (`parseGameRun` for clipboard input shape, `parseRow` for CSV row shape). That's not a "consolidate into one function" outcome — it's "share the spine, keep the input adapters separate." Probably the right shape.

There's a second consolidation worth considering: **the post-row `processBattleDateField` machinery in `csv-parser.ts` is bulk-import-specific.** It builds the `DateValidationWarning` shape, which the bulk import surfaces to the user. The clipboard path doesn't need that — a single bad date raises an exception. Different UX surfaces, different error shapes. **Should not consolidate** that part.

### What the owner's three category guesses get right

The owner's prior framing:

> "the V28 versus V2, whatever, that detection belongs in, like, either the schema edges or the rename from edges or whatever. That definitely, I'd say, belongs in a graph as an edge or a field. Parsing tab delimited data or, or whatever. Some things like, you know, that, that I can maybe see. But, like, battle date specific validation, like, that, I, I'd want to, I don't know if that belongs in the parser or it's more of a field specific relationship."

Mapped to the table above:

- "V28 vs V2 detection" — owner says graph. **Doc says parser, with a graph-versioning thread.** The detection itself is text-shape detection (looking for arrows + tabs in a string). What V28 *means* — which fields exist, what data types they have — is fully graph-driven already. The detection step is "is this input shape A or shape B," not "which schema version is this." A future "schema lifecycle" edge (commit 11) might surface a `detectInputShape(rawText) → SchemaRef` query, but it's a thin wrapper over the text-shape check.
- "Tab-delimited parsing" — owner says maybe parser. **Doc agrees: parser.**
- "battleDate-specific validation" — owner says ambiguous. **Doc agrees: ambiguous, leaning parser today, with a future `HAS_VALIDATOR` edge as the eventual home.**

The owner's instincts are aligned with the doc's distillation. The disagreement on V28-detection is small and resolvable: it's "where does the input-shape branch live" (parser today, parser tomorrow) vs "which schema does this represent" (a different question, graph-driven).

---

## 7. Open questions feeding into the invocation-model doc

This doc is a reference; the sibling decision doc consumes it. The specific feeds:

1. **§3-§5 establish that the graph is consulted at metadata frequency, not value-extraction frequency.** That removes the performance concern from the invocation-model debate. Option 2 (lazy / cached) was the only option whose existence was grounded in that concern. Confirmed: that concern doesn't exist at current scale.

2. **§4 establishes that read-path consumers never name the cascade or run derivations.** That means the leak the owner reacted to lives entirely in **write-path** code (parsers + edit handlers + form code). The invocation-model doc should treat read-path call sites as non-issues.

3. **§6 establishes that the parser's *irreducible* responsibilities are narrow** (input-shape detection, text-→-key-value extraction, top-level orchestration) and that several currently-parser-owned steps (remap, cascade, cached-prop extraction) are already graph-driven *internally* — the parser just orchestrates the named calls. This makes Option 3's "graph hydrates" framing more concrete: it's not "move parsing into the graph," it's "move the orchestration of the graph-driven steps into a graph-owned function and let the parser hand it raw key-value pairs."

4. **§6's edit-time treatment is incomplete.** This doc covered the parse path thoroughly. The edit path (run-details inline edits, `applyDateFix`, `prepareRunForSave`) deserves the same itemization. The invocation-model doc owns that breakdown; this doc deliberately stops at parse-time to keep the scope tight.

5. **The "graph as value-hydration layer" boundary** that the owner partly articulated (*"the graph is really metadata, it's how do you access the data that you have"*) — this doc confirms the as-shipped architecture matches that framing. The invocation-model doc's Option 3 proposes a graph-hosted *orchestrator* (a function that knows how to hydrate a run from raw input). That orchestrator queries graph metadata; it doesn't own per-run values. The boundary stays — the orchestration crosses it briefly during construction.

Read the invocation-model doc next; with this doc in hand, the options' tradeoffs should be concrete instead of abstract.
