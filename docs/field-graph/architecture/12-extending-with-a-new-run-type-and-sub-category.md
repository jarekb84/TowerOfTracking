# 12. Extending with a new run type + sub-category (dissonance)

> Part of the Field Graph Architecture spec.
> [< Prev: 11. Internal app-fields — how the graph handles them](./11-internal-app-fields.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 13. Commit / PR strategy recommendation (for THIS approach) >](./13-commit-pr-strategy-recommendation.md)

---

V28 introduced **dissonance runs** — a new game mode with four sub-categories: Attack, Defense, Ultimate Weapons, and Utility. The sample data in `sampleData/v28/` contains one file per sub-category (`Dissonance_Attack_2026-04-09.txt`, etc.). Structurally each file looks identical to a normal battle report, but the mode and sub-category are distinguishing attributes.

The user wants to:
1. Add `'dissonance'` as a new value for the existing `_runType` enum.
2. Add a new internal field `_dissonanceSubCategory` with values `'attack' | 'defense' | 'ultimate-weapons' | 'utility'`.
3. Wire it through: parser (detect from filename/content), single-entry modal (sub-category selector that only appears when `_runType === 'dissonance'`), bulk import, analytics filters (new filter-dropdown that auto-hides when no dissonance runs exist), run-details display.

This is the graph approach's moment to prove the "low code churn on feature additions" claim.

### 12.1. Graph-first file-change inventory

**Files that change in the graph approach (best case):**

| File | Change | Lines |
|------|--------|-------|
| `src/shared/domain/field-graph/nodes/internal-fields.ts` | Add `_dissonanceSubCategory` node | +1 |
| `src/shared/domain/field-graph/nodes/enum-values.ts` | Add 5 enum-value nodes (1 for dissonance, 4 for sub-categories) | +5 |
| `src/shared/domain/field-graph/edges/enum-values.ts` | Add ~20 edges (ACCEPTS_VALUE, HAS_DISPLAY_NAME, HAS_COLOR, HAS_STRING_VALUE, CONDITIONAL_ON) | +20 |
| `src/shared/domain/field-graph/edges/internal-fields.ts` | Add edges for `_dissonanceSubCategory` (IS_INTERNAL_FIELD, HAS_CSV_HEADER, HAS_DATA_TYPE, HAS_DISPLAY_NAME) | +4 |
| `src/shared/domain/field-graph/derivers.ts` | Add `deriver:dissonanceSubCategoryFromFilename` function | +15 |
| `src/features/data-import/csv-import/csv-parser.ts` | Add one line that passes filename into `applyDerivations` (it already reads files generically) | +1 |
| `scripts/field-graph/import-detection-fixtures/` | Add sample filenames for unit tests | +4 |

Total: **one new internal field node + ~40 edge declarations + one deriver function**. Every declaration is data; the only real code is the 15-line deriver that peels `Dissonance_Attack_` off a filename.

**Files that do NOT change in the graph approach (because they query the graph dynamically):**

- `src/features/analysis/shared/filtering/run-type-filter.ts` — `getRunTypeDisplayLabel` reads from graph; no switch to update.
- `src/shared/domain/run-types/run-type-display.ts` — `getRunTypeColor` reads from graph; no color map update.
- `src/shared/domain/run-types/run-type-selector-options.ts` — `getOptionsForMode` reads from graph (`graph.acceptedValuesFor('_runType')`); no option array to maintain.
- `src/shared/domain/run-types/run-type-detection.ts` — `mapExplicitRunType` becomes a graph lookup (`graph.enumValueFromString('_runType', str)`); no switch.
- `src/shared/domain/run-types/run-type-defaults.ts` — same treatment for `mapUrlTypeToRunType`.
- `src/shared/domain/run-types/types.ts` — the `RunType` TypeScript enum either becomes codegen or gets one invariant test asserting it matches the graph; the actual business logic doesn't care.
- `src/features/data-import/manual-entry/data-input-form-logic.ts` and `use-data-input-form.ts` — form state queries `graph.conditionalOn(field)` to know when to clear sub-category. No explicit handling of dissonance.
- Every analytics filter component — reads the filter options from `graph.filterOptionsForView(viewId)`. Dissonance sub-category auto-appears when runs of that type exist.
- Run-details display — queries `graph.fieldsInView('view:run-details.*')`; includes `_dissonanceSubCategory` automatically if present.
- CSV exporter — reads `graph.csvHeaderOf(key)`; new field gets its header from the `HAS_CSV_HEADER` edge.
- Route tabs — read from graph; new tab isn't needed unless the user explicitly wants a `/runs/dissonance` route (see below).

**Files that DO change even in the graph approach (explicit opt-in cases):**

- `src/routes/runs/dissonance.tsx` — **new file**, only if the user wants a dedicated route (same as today's `farm.tsx`, `tournament.tsx`, `milestone.tsx`). This is a product decision, not a graph constraint. The graph enables not-needing-a-route; the user can still add one by mirroring an existing route file.
- `src/features/navigation/runs-navigation/runs-tabs-config.ts` — **potentially**, if the tab list is declaratively defined from a graph query (`graph.acceptedValuesFor('_runType').filter(hasRuns)`), this file doesn't change. If the tab list is still hand-authored today, one array entry is added. The graph approach pushes toward the former; until migrated, it's the latter.

Count: **~7 files touched** in the pure-graph case, **~8-9 files** if opting into a dedicated route/tab.

**Status quo file-change inventory (for contrast):**

Based on grepping `RunType\.|runType\.` and `'farm'|'tournament'|'milestone'`, the status-quo churn is:

| Concern | File count |
|---------|-----------|
| Direct `RunType` enum references | 41 files |
| Run-type string literal references | 73 files |
| Switch statements on run type | ~8 files (`run-type-filter.ts`, `run-type-display.ts`, `run-type-defaults.ts`, `run-type-detection.ts`, `run-type-selector-options.ts`, and several UI components) |
| Run-type color map | 1 file |
| Run-type label map | 1 file |
| Route tabs + tab config | 2-3 files |
| Filter components per analytics page | 6+ files (one per analytics view) |
| Parser run-type detection | 2 files |
| Form logic (tournament-only rank handling; dissonance-only sub-category handling) | 2 files |
| Tests for each of the above | ~15 test files |

Realistic churn: **~25-35 files touched** for the dissonance addition, because the run-type enum is referenced so widely that every switch, every filter component, and every test that exercises "for each run type" needs an update. The sub-category adds another dimension — most filter components that hand-code a dropdown also need the conditional "if runType is dissonance show sub-category" branch.

**Verdict.** The graph approach delivers the claim. **~7 files vs ~30 files** is a 4x reduction in churn, and — more importantly — the 7 files are *all data declarations*, not logic changes. Zero new switch statements, zero new enum cases, zero new filter dropdown components. Whether this holds in practice depends entirely on whether the existing consumers have been migrated to query the graph (section 11's migration plan). In a partially-migrated state the number is in between: new filter components query the graph, but old ones still switch on `RunType.*`. The incremental value compounds as migration progresses.

### 12.2. Concrete graph declarations

The new field node:

```typescript
// src/shared/domain/field-graph/nodes/internal-fields.ts — append
fieldNode('_dissonanceSubCategory', ['internal', 'dissonance-only']),
```

The new enum-value nodes:

```typescript
// src/shared/domain/field-graph/nodes/enum-values.ts — append
enumValueNode('enum:runType.dissonance'),

enumValueNode('enum:dissonanceSubCategory.attack'),
enumValueNode('enum:dissonanceSubCategory.defense'),
enumValueNode('enum:dissonanceSubCategory.ultimateWeapons'),
enumValueNode('enum:dissonanceSubCategory.utility'),
```

The new edges — field membership, CSV header, data type, display name, and enum acceptance:

```typescript
// src/shared/domain/field-graph/edges/internal-fields.ts — append
edge('_dissonanceSubCategory', 'IS_INTERNAL_FIELD', 'internal:app-metadata'),
edge('_dissonanceSubCategory', 'HAS_CSV_HEADER',   '_Dissonance Sub-Category'),
edge('_dissonanceSubCategory', 'HAS_DATA_TYPE',    'string'),
edge('_dissonanceSubCategory', 'HAS_DISPLAY_NAME', 'Dissonance Sub-Category'),
```

The new ACCEPTS_VALUE edges plus per-value attributes:

```typescript
// src/shared/domain/field-graph/edges/enum-values.ts — append

// _runType gains a fourth accepted value
edge('_runType', 'ACCEPTS_VALUE', 'enum:runType.dissonance'),
edge('enum:runType.dissonance', 'HAS_DISPLAY_NAME', 'Dissonance'),
edge('enum:runType.dissonance', 'HAS_COLOR',        '#ec4899'),   // pink, distinct from green/amber/purple
edge('enum:runType.dissonance', 'HAS_STRING_VALUE', 'dissonance'),

// _dissonanceSubCategory accepts four values
edge('_dissonanceSubCategory', 'ACCEPTS_VALUE', 'enum:dissonanceSubCategory.attack'),
edge('_dissonanceSubCategory', 'ACCEPTS_VALUE', 'enum:dissonanceSubCategory.defense'),
edge('_dissonanceSubCategory', 'ACCEPTS_VALUE', 'enum:dissonanceSubCategory.ultimateWeapons'),
edge('_dissonanceSubCategory', 'ACCEPTS_VALUE', 'enum:dissonanceSubCategory.utility'),

edge('enum:dissonanceSubCategory.attack',          'HAS_DISPLAY_NAME', 'Attack'),
edge('enum:dissonanceSubCategory.attack',          'HAS_COLOR',        '#ef4444'),
edge('enum:dissonanceSubCategory.attack',          'HAS_STRING_VALUE', 'attack'),

edge('enum:dissonanceSubCategory.defense',         'HAS_DISPLAY_NAME', 'Defense'),
edge('enum:dissonanceSubCategory.defense',         'HAS_COLOR',        '#3b82f6'),
edge('enum:dissonanceSubCategory.defense',         'HAS_STRING_VALUE', 'defense'),

edge('enum:dissonanceSubCategory.ultimateWeapons', 'HAS_DISPLAY_NAME', 'Ultimate Weapons'),
edge('enum:dissonanceSubCategory.ultimateWeapons', 'HAS_COLOR',        '#a855f7'),
edge('enum:dissonanceSubCategory.ultimateWeapons', 'HAS_STRING_VALUE', 'ultimate-weapons'),

edge('enum:dissonanceSubCategory.utility',         'HAS_DISPLAY_NAME', 'Utility'),
edge('enum:dissonanceSubCategory.utility',         'HAS_COLOR',        '#06b6d4'),
edge('enum:dissonanceSubCategory.utility',         'HAS_STRING_VALUE', 'utility'),
```

The **conditional-visibility** edge. This is the interesting new edge type. `_dissonanceSubCategory` is only valid when `_runType === 'dissonance'`. That constraint lives here:

```typescript
// src/shared/domain/field-graph/edges/conditional.ts
export const CONDITIONAL_EDGES = [
  // _rank is only valid when _runType is tournament (formalizes section 11.4 gotcha 2)
  edge('_rank', 'CONDITIONAL_ON', 'enum:runType.tournament'),

  // _dissonanceSubCategory is only valid when _runType is dissonance
  edge('_dissonanceSubCategory', 'CONDITIONAL_ON', 'enum:runType.dissonance'),
];
```

**New edge type in the union:**

```typescript
// src/shared/domain/field-graph/types.ts
| { type: 'CONDITIONAL_ON'; from: NodeId /* Field */; to: NodeId /* EnumValue */ }
```

Semantics:
- **At form-submit time**: if the constraint fails, the field is cleared before persistence. One generic hook replaces the scattered `if (runType !== 'tournament') setRank('')` branches.
- **At UI-render time**: the manual-entry form asks `graph.isVisibleGiven('_dissonanceSubCategory', formState)` to decide whether to render the sub-category dropdown.
- **At filter-UI time**: the analytics filter bar asks `graph.filtersApplicableToRunSet(runs)` and only shows the sub-category filter if at least one run in the data set has a dissonance run-type (and therefore the field is applicable).

One final set of edges — explicit filter-view membership. For analytics pages, the filter component asks the graph "what filters apply to view X?"

```typescript
// src/shared/domain/field-graph/edges/filter-views.ts
// Field X APPEARS_IN_FILTER view:tier-stats means: the tier-stats page shows
// a filter widget for field X. The graph is the catalog of which fields
// get filter widgets on which pages.

export const FILTER_VIEW_EDGES = [
  // _runType filter appears on every analytics page
  edge('_runType', 'APPEARS_IN_FILTER', 'view:tier-stats'),
  edge('_runType', 'APPEARS_IN_FILTER', 'view:tier-trends'),
  edge('_runType', 'APPEARS_IN_FILTER', 'view:time-series'),
  edge('_runType', 'APPEARS_IN_FILTER', 'view:source-analysis'),
  edge('_runType', 'APPEARS_IN_FILTER', 'view:deaths-radar'),
  edge('_runType', 'APPEARS_IN_FILTER', 'view:field-analytics'),
  edge('_runType', 'APPEARS_IN_FILTER', 'view:activity-heatmap'),

  // _dissonanceSubCategory filter appears on all the same pages, BUT
  // only renders when any run has _runType === 'dissonance' (via CONDITIONAL_ON
  // check at render time; see 12.4)
  edge('_dissonanceSubCategory', 'APPEARS_IN_FILTER', 'view:tier-stats'),
  edge('_dissonanceSubCategory', 'APPEARS_IN_FILTER', 'view:tier-trends'),
  edge('_dissonanceSubCategory', 'APPEARS_IN_FILTER', 'view:time-series'),
  edge('_dissonanceSubCategory', 'APPEARS_IN_FILTER', 'view:source-analysis'),
  edge('_dissonanceSubCategory', 'APPEARS_IN_FILTER', 'view:deaths-radar'),
  edge('_dissonanceSubCategory', 'APPEARS_IN_FILTER', 'view:field-analytics'),
  edge('_dissonanceSubCategory', 'APPEARS_IN_FILTER', 'view:activity-heatmap'),
];
```

Seven edges for `_runType` and seven for `_dissonanceSubCategory`. A future view addition is also one edge per filter the view should expose. This is the "add a new feature" analog of section 3c's APPEARS_IN_VIEW pattern, now specialized for filter bars.

### 12.3. Parser / detection logic

The V28 sample data has four dissonance files:
```
Dissonance_Attack_2026-04-09.txt
Dissonance_Defense_2026-04-09.txt
Dissonance_UltimateWeapons_2026-04-09.txt
Dissonance_Utility_2026-04-10.txt
```

and one `Tournament_2026-04-10.txt` file. The file content (see read output above) is otherwise identical to a farm run — same Battle Report structure, same fields. The distinguishing information is *only in the filename*.

**Primary detection — filename pattern.**

```typescript
// src/shared/domain/field-graph/derivers.ts — append

const DISSONANCE_FILENAME_RE = /^Dissonance_(Attack|Defense|UltimateWeapons|Utility)_/i;
const TOURNAMENT_FILENAME_RE = /^Tournament_/i;
const FARM_FILENAME_RE       = /^Farming_/i;

DERIVERS['deriver:runTypeFromFilename'] = (inputs) => {
  const filename = inputs.__filename?.value as string | undefined;
  if (!filename) return undefined;
  if (DISSONANCE_FILENAME_RE.test(filename)) return 'dissonance';
  if (TOURNAMENT_FILENAME_RE.test(filename)) return 'tournament';
  if (FARM_FILENAME_RE.test(filename))       return 'farm';
  return undefined;
};

DERIVERS['deriver:dissonanceSubCategoryFromFilename'] = (inputs) => {
  const filename = inputs.__filename?.value as string | undefined;
  if (!filename) return undefined;
  const m = DISSONANCE_FILENAME_RE.exec(filename);
  if (!m) return undefined;
  const raw = m[1].toLowerCase();
  if (raw === 'ultimateweapons') return 'ultimate-weapons';
  return raw;   // 'attack' | 'defense' | 'utility'
};
```

The derivation edges:

```typescript
// src/shared/domain/field-graph/edges/derivations.ts — append
edge('_runType',               'IS_DERIVED_FROM', '__filename', { deriver: 'deriver:runTypeFromFilename' }),
edge('_dissonanceSubCategory', 'IS_DERIVED_FROM', '__filename', { deriver: 'deriver:dissonanceSubCategoryFromFilename' }),

// Secondary derivation for _runType when no filename (clipboard paste, etc.)
edge('_runType', 'IS_DERIVED_FROM', 'battleReport_tier', { deriver: 'deriver:runTypeFromTier' }),
```

The special `__filename` node is a pseudo-field — a transient carrier for the filename during parsing. It's declared as a field-shaped node with a tag `'transient'` (never persisted, never displayed) and the `applyDerivations` function treats it as an input but not an output.

**Derivation priority.** `_runType` has two `IS_DERIVED_FROM` edges — one to `__filename`, one to `battleReport_tier`. The deriver contract: each deriver returns `undefined` when it can't determine a value. `applyDerivations` walks derivation candidates *in declaration order* and takes the first non-undefined result. Filename wins when present; tier-pattern is the fallback. This matches today's two-tier detection in `detectRunTypeFromFields` without hardcoding the priority in parser code.

**Content-pattern fallback.** What if the filename is something like `clipboard.txt` or the user pastes without a filename? The tier-pattern fallback (`+` in tier → tournament) still works for farm/tournament. Dissonance doesn't have a distinguishing tier pattern (all sample dissonance files show `Tier 12`, same as other modes). **That's a real detection gap.**

One option: search the clipboard content for a distinguishing substring. Dissonance runs may mention Ultimate Weapons / Utility / specific boosts in the export payload. Looking at `Dissonance_Attack_2026-04-09.txt`, I don't see obvious content distinguishing it from a farm run — the payload looks structurally identical. If the game export doesn't embed the mode/sub-category in the payload, filename is the only reliable signal.

The graph makes this failure mode explicit and *handleable*: if both derivers return undefined, the field stays unset. The form and filter UI treat unset `_runType` as "Unknown" (a synthetic sentinel enum-value). The user is prompted to select the run type manually. The clipboard-paste UX is unchanged from today for farm/tournament; dissonance clipboard pastes require manual selection, which is fine — it's a rarer mode.

**Parser integration.** The existing parser at `src/features/analysis/shared/parsing/data-parser.ts` is already generic about fields. The one change is: when parsing came from a file, pass the filename into the fields bag as `__filename`:

```typescript
// src/features/data-import/csv-import/csv-parser.ts or wherever file upload is handled
const rawFields = parseClipboardText(fileContent);
if (filename) {
  rawFields.__filename = createTransientField('__filename', filename);
}
const fields = applyDerivations(rawFields);
```

Now `applyDerivations` walks the graph's `IS_DERIVED_FROM` edges and both `_runType` and `_dissonanceSubCategory` are populated automatically. No dedicated dissonance-detection code path exists in the parser — the logic is in the two derivers and the one line that stuffs the filename into the fields bag.

### 12.4. Filter auto-discovery

The claim: adding the `_dissonanceSubCategory` field + its `APPEARS_IN_FILTER` edges means every analytics page's filter bar automatically gains a dissonance sub-category dropdown. Zero code changes to the filter components.

Today's status quo. Each analytics page has its own filter component — `source-analysis-filters.tsx`, `tier-trends-controls.tsx`, `heatmap-filters.tsx`, `coverage-report-filters.tsx`. Each of these instantiates a `<RunTypeSelector>` and hand-wires the options. Several also apply ad-hoc conditional logic (tier filter, duration filter, date range). Adding dissonance sub-category today means editing each of those components to add another selector, plus writing a new selector component, plus wiring it into every page's filter state.

**Refactored filter component — graph-driven:**

```typescript
// src/features/analysis/shared/filtering/dynamic-filter-bar.tsx
import { graph } from '@/shared/domain/field-graph';
import { EnumSelector } from '@/components/ui/enum-selector';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

interface DynamicFilterBarProps {
  viewId: string;                       // e.g. 'view:tier-stats'
  runs: ParsedGameRun[];                // the runs in scope
  filterState: Record<string, string | undefined>;
  onFilterChange: (fieldId: string, value: string | undefined) => void;
}

export function DynamicFilterBar({ viewId, runs, filterState, onFilterChange }: DynamicFilterBarProps) {
  // Query the graph for every field that has an APPEARS_IN_FILTER edge to this view
  const candidateFilters = graph.fieldsInFilter(viewId);

  // Filter out conditional filters that aren't applicable to the current run set.
  // Example: _dissonanceSubCategory has CONDITIONAL_ON enum:runType.dissonance.
  // If no run in `runs` has _runType === 'dissonance', the filter is not rendered.
  const applicableFilters = candidateFilters.filter((fieldId) =>
    graph.isFilterApplicable(fieldId, runs)
  );

  return (
    <div className="flex gap-2">
      {applicableFilters.map((fieldId) => (
        <EnumSelector
          key={fieldId}
          label={graph.displayNameOf(fieldId) ?? fieldId}
          options={graph.acceptedValuesFor(fieldId).map((ev) => ({
            value: graph.stringValueOf(ev),
            label: graph.displayLabelForValue(ev),
            color: graph.colorOf(ev),
          }))}
          value={filterState[fieldId]}
          onChange={(v) => onFilterChange(fieldId, v)}
        />
      ))}
    </div>
  );
}
```

Every analytics page now renders:

```typescript
// src/features/analysis/tier-stats/tier-stats-page.tsx
<DynamicFilterBar
  viewId="view:tier-stats"
  runs={runs}
  filterState={filterState}
  onFilterChange={handleFilterChange}
/>
```

No analytics page component changes when dissonance ships. The dissonance filter appears automatically after the user imports their first dissonance run, and disappears if all dissonance runs are later removed.

**Contrast with status quo.** Today each of `source-analysis-filters.tsx`, `heatmap-filters.tsx`, etc. contains its own `<RunTypeSelectorTabs options={[...FARM, TOURNAMENT, MILESTONE]} />` instance. Adding dissonance means opening each file and adding the option. Adding a new enum-like internal field (dissonance sub-category) means building a new selector component and importing it into each filter file. Maybe 6–10 files touched per new filter field.

With the `DynamicFilterBar` abstraction, the answer is: **zero files touched per new filter field**. The graph is the source; the UI is a projection.

**The `graph.isFilterApplicable` helper** — this is the bit that makes CONDITIONAL_ON filters hide themselves:

```typescript
// src/shared/domain/field-graph/query.ts
isFilterApplicable(fieldId: NodeId, runs: readonly ParsedGameRun[]): boolean {
  const conditions = this.query({ edgeType: 'CONDITIONAL_ON', from: fieldId });
  if (conditions.length === 0) return true;              // no condition → always applicable
  // Field is applicable if at least one run satisfies any condition
  for (const condition of conditions) {
    const requiredEnumId = condition.to;                 // e.g. 'enum:runType.dissonance'
    const requiredStringValue = this.stringValueOf(requiredEnumId);
    // Determine which field the enum-value belongs to
    const owningField = this.fieldForEnumValue(requiredEnumId);
    // Check whether any run has owningField === requiredStringValue
    const satisfied = runs.some((run) => run.fields[owningField]?.value === requiredStringValue);
    if (satisfied) return true;
  }
  return false;
}
```

The `CONDITIONAL_ON` edge is interpreted consistently in three places (form visibility, filter visibility, validation on save). A single truth, three consumers.

### 12.5. Cross-cutting ripple quantified

Concrete numbers for the dissonance addition.

**Status-quo files that reference `RunType.*` or `'farm'|'tournament'|'milestone'` string literals:**

From the greps earlier: 41 files reference `RunType.*` members directly; 73 files reference the string literals. The overlap is substantial. Let me partition them into categories of change needed for dissonance:

| Category | Example files | Count | Change required for dissonance (status quo) |
|----------|--------------|-------|--------------------------------------------|
| Enum definition | `run-types/types.ts` | 1 | Add `DISSONANCE` enum member |
| Switch on runtype | `run-type-detection.ts`, `run-type-defaults.ts`, `run-type-filter.ts`, `run-type-display.ts` | 4 | Add `case` / `if` for dissonance |
| Color/label map | `run-type-display.ts`, `run-type-selector-options.ts` | 2 | Add dissonance color & label entries |
| Routes | `routes/runs/farm.tsx`, `tournament.tsx`, `milestone.tsx` | 3 | Add `routes/runs/dissonance.tsx` (optional) |
| Tabs config | `navigation/runs-navigation/runs-tabs-config.ts` | 1 | Add dissonance tab entry |
| Form logic | `manual-entry/use-data-input-form.ts`, `data-input-form-logic.ts` | 2 | Add dissonance-only `_dissonanceSubCategory` clear logic |
| Analytics filters | `source-analysis-filters.tsx`, `tier-trends-controls.tsx`, `heatmap-filters.tsx`, `coverage-report-filters.tsx`, `deaths-radar`, `field-analytics` | ~6 | Add dissonance option to selector; add dissonance sub-category selector with conditional render |
| Filter state hooks | `use-source-analysis.ts`, `use-tier-stats`, several others | ~6 | Add `_dissonanceSubCategory` to filter state shape |
| Parser | `shared/parsing/data-parser.ts`, `csv-import/csv-parser.ts` | 2 | Filename detection + field setting |
| Run-details | `run-card-utils.ts`, `section-config.ts` | 2 | Display sub-category |
| Tests | `run-type-detection.test.ts`, `run-type-filter.test.ts`, many filter tests | ~12 | Coverage for dissonance branches |
| Storybook/navigation icons | `nav-icon.tsx`, `navigation-config.ts` | 2 | Add dissonance icon mapping |

**Total files changed: ~25-35 (realistic)**, ~100-200 lines added across the codebase for type safety, switch coverage, filter widgets, and tests.

**Graph approach:**

| File | Change |
|------|--------|
| `field-graph/nodes/internal-fields.ts` | +1 field node |
| `field-graph/nodes/enum-values.ts` | +5 enum-value nodes |
| `field-graph/edges/internal-fields.ts` | +4 edges |
| `field-graph/edges/enum-values.ts` | +20 edges |
| `field-graph/edges/conditional.ts` | +1 edge |
| `field-graph/edges/filter-views.ts` | +7 edges |
| `field-graph/edges/derivations.ts` | +3 edges |
| `field-graph/derivers.ts` | +15 lines (2 new deriver functions, 1 regex) |
| `csv-parser.ts` | +1 line (pass `__filename`) |
| Graph invariant tests | +1-2 new assertions (12.6 below) |

**Total files changed: 10** (seven declarative, three code), ~60 lines added.

**Ratio.** 25-35 vs 10 files = **~3x fewer files**. ~150 vs ~60 lines = **~2.5x fewer lines**. The bigger difference is qualitative: the graph-approach changes are all *declarations*; the status-quo changes are *logic edits spread across the codebase*, each one another opportunity to forget a case.

Caveat: these numbers assume the migration has already unified the run-type filter UI behind a graph-driven component (section 12.4's `DynamicFilterBar`). If migration is partial, the dissonance addition may still touch several legacy filter components. In a fully-migrated graph state, every *future* feature addition benefits from the leverage.

### 12.6. New pattern-enforcing tests

Four new invariant tests specific to the dissonance addition:

```typescript
// src/shared/domain/field-graph/__tests__/dissonance-wiring.test.ts
import { describe, it, expect } from 'vitest';
import { graph } from '@/shared/domain/field-graph';

describe('Dissonance run type wiring', () => {
  it('_runType accepts exactly four values including dissonance', () => {
    const values = graph.acceptedValuesFor('_runType').map((v) => graph.stringValueOf(v));
    expect(new Set(values)).toEqual(new Set(['farm', 'tournament', 'milestone', 'dissonance']));
  });

  it('_dissonanceSubCategory is conditional on _runType === dissonance', () => {
    const conditions = graph.query({
      edgeType: 'CONDITIONAL_ON',
      from: '_dissonanceSubCategory',
    });
    expect(conditions).toHaveLength(1);
    expect(conditions[0].to).toBe('enum:runType.dissonance');
  });

  it('every dissonance sub-category enum-value has display name, color, and string value', () => {
    const subCategoryField = '_dissonanceSubCategory';
    const enumValues = graph.acceptedValuesFor(subCategoryField);
    expect(enumValues).toHaveLength(4);

    for (const enumId of enumValues) {
      expect(graph.displayNameOf(enumId), `${enumId} display name`).toBeDefined();
      expect(graph.colorOf(enumId), `${enumId} color`).toBeDefined();
      expect(graph.stringValueOf(enumId), `${enumId} string value`).toBeDefined();
    }
  });

  it('filename deriver correctly extracts sub-category from each sample v28 file', () => {
    const samples = [
      { filename: 'Dissonance_Attack_2026-04-09.txt',          expected: 'attack' },
      { filename: 'Dissonance_Defense_2026-04-09.txt',         expected: 'defense' },
      { filename: 'Dissonance_UltimateWeapons_2026-04-09.txt', expected: 'ultimate-weapons' },
      { filename: 'Dissonance_Utility_2026-04-10.txt',         expected: 'utility' },
      { filename: 'Tournament_2026-04-10.txt',                 expected: undefined },
      { filename: 'Farming_2026-04-11.txt',                    expected: undefined },
    ];
    const deriver = graph.deriver('deriver:dissonanceSubCategoryFromFilename');
    for (const { filename, expected } of samples) {
      const result = deriver({ __filename: { value: filename } as any });
      expect(result, `filename '${filename}'`).toBe(expected);
    }
  });

  it('_dissonanceSubCategory has APPEARS_IN_FILTER edges to every analytics view', () => {
    const expectedViews = [
      'view:tier-stats', 'view:tier-trends', 'view:time-series',
      'view:source-analysis', 'view:deaths-radar', 'view:field-analytics',
      'view:activity-heatmap',
    ];
    const actual = graph
      .query({ edgeType: 'APPEARS_IN_FILTER', from: '_dissonanceSubCategory' })
      .map((e) => e.to)
      .sort();
    expect(actual).toEqual(expectedViews.sort());
  });
});
```

If a developer adds the enum value but forgets the color, test 3 fails with a field-specific message. If they forget the filter-view edge on one page, test 5 lists the missing entry. If they add dissonance but forget to tag `_dissonanceSubCategory` as conditional, test 2 fails. The tests are the contract; the graph-data additions fulfill the contract. No fan-out logic change is testable because there *is no fan-out logic change* — every consumer queries the graph.

---

> [< Prev: 11. Internal app-fields — how the graph handles them](./11-internal-app-fields.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 13. Commit / PR strategy recommendation (for THIS approach) >](./13-commit-pr-strategy-recommendation.md)
