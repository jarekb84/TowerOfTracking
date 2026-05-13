# 18. Write path — forms, updates, user edits

> Part of the Field Graph Architecture spec.
> [< Prev: 17. Schema as a first-class graph entity](./17-schema-as-a-first-class-graph-entity.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 19. "Logic as data" — mental model and AI-usability guide >](./19-logic-as-data-and-ai-usability-guide.md)

---

Sections 1–13 focused on READ — parse, aggregate, display. But the app has substantial UPDATE flows: editing notes in run-details, editing the rank in the farm-runs table, selecting run type (and dissonance sub-category) in the single-entry add modal, editing arbitrary fields in-place. These writes go through hooks in `src/features/data-import/manual-entry/use-data-input-form.ts`, `src/features/game-runs/editing/field-update-logic.ts`, and `src/features/game-runs/editing/rank-field-logic.ts`.

This section shows how the graph accommodates writes. The pattern is the mirror image of reads: canonical keys internally, validation driven by edges, derivations cascaded on change.

### 18.1. Updates target canonical keys only

At the parser boundary, raw/legacy keys get resolved to canonical. Once inside app state (`ParsedGameRun.fields`), every key is canonical. Write paths take this as given — form inputs target canonical keys, edit handlers pass canonical keys to mutation functions.

```typescript
// Form state, after §15-17 integration
type FormState = {
  fieldValues: Record<string, unknown>;  // keys: canonical, e.g. 'battleReport_tier', '_runType'
};

// Form input wiring (single-entry modal)
<input value={formState.fieldValues.battleReport_tier ?? ''}
       onChange={(e) => updateField('battleReport_tier', e.target.value)} />

// No resolveFieldByAnyKey call in write paths. Never. The form knows canonical keys
// because it was generated from graph queries (see §18.3 for form composition).
```

The `resolveFieldByAnyKey` boundary is read-only: it exists to accept raw keys from storage/CSV/clipboard. Forms and in-table edits never call it. This keeps `ParsedGameRun.fields`'s "every key is canonical" invariant clean.

### 18.2. Validation via graph edges

Every edit passes through a validator that queries the graph. The validator knows nothing about specific fields — it walks the edges that happen to exist and applies the constraints they declare.

```typescript
// src/shared/domain/field-graph/validate-field-update.ts
import { graph } from './index';

export class ValidationError extends Error {
  constructor(public readonly fieldKey: string, message: string) {
    super(message);
  }
}

export function validateFieldUpdate(
  fieldKey: string,
  newValue: unknown,
  formContext: Record<string, unknown>,
): unknown {
  const field = graph.getField(fieldKey);
  if (!field) {
    throw new ValidationError(fieldKey, `unknown field '${fieldKey}'`);
  }

  // Enum constraint check via ACCEPTS_VALUE edges (§11.2)
  const acceptedValues = graph.acceptedValuesFor(fieldKey);
  if (acceptedValues.length > 0) {
    const stringValue = String(newValue);
    const match = acceptedValues
      .map((ev) => graph.stringValueOf(ev))
      .find((v) => v === stringValue);
    if (!match) {
      throw new ValidationError(
        fieldKey,
        `invalid value '${stringValue}' for ${fieldKey}. Allowed: ${acceptedValues.map(graph.stringValueOf).join(', ')}`,
      );
    }
  }

  // Required-in check via IS_REQUIRED_IN edges (§9.6 introduced these)
  if ((newValue === '' || newValue == null) && graph.isRequiredIn(fieldKey, 'manual-entry')) {
    throw new ValidationError(fieldKey, `${graph.displayNameOf(fieldKey) ?? fieldKey} is required`);
  }

  // Conditional-visibility check via CONDITIONAL_ON edges (§12.2)
  //   e.g. _rank is only valid when _runType === 'tournament'
  const conditions = graph.conditionalOn(fieldKey);
  if (conditions.length > 0) {
    const satisfied = conditions.some((requiredEnumId) => {
      const owningField = graph.fieldForEnumValue(requiredEnumId);
      const requiredValue = graph.stringValueOf(requiredEnumId);
      return formContext[owningField] === requiredValue;
    });
    if (!satisfied && newValue !== '' && newValue != null) {
      throw new ValidationError(
        fieldKey,
        `${fieldKey} is only valid when one of its conditions holds`,
      );
    }
  }

  // Type coercion via HAS_DATA_TYPE edge (§9.5)
  return graph.coerceValue(fieldKey, newValue);
}
```

One function, called from every write path. It knows about no specific field — every constraint is a graph query. Adding a new field constraint is adding an edge; the validator picks it up automatically.

**Consumer refactor:**

Today's `use-data-input-form.ts` has this cluster of manual validations:

```typescript
// BEFORE — scattered in data-input-form-logic.ts, use-data-input-form.ts, rank-field-logic.ts
if (selectedRunType === RunType.TOURNAMENT && !rank) {
  throw new Error('Rank required for tournament runs');
}
if (!isValidRank(rank)) {
  throw new Error('Rank must be a positive number or empty');
}
if (selectedRunType !== RunType.TOURNAMENT && rank) {
  // this is the tournament-only constraint
  rank = '';  // auto-clear
}
```

With the graph:

```typescript
// AFTER — one validator, all constraints from edges
const coerced = validateFieldUpdate('_rank', rank, {
  _runType: selectedRunType,
});
// Throws ValidationError if invalid; returns coerced value if valid
// Tournament-only constraint comes from CONDITIONAL_ON edge
// Positive-number constraint comes from HAS_DATA_TYPE number + number coercion
```

Three validation branches collapse into one. Adding a new field constraint — say, "notes must be under 500 characters" — becomes adding a `HAS_MAX_LENGTH` edge, not patching the validator.

### 18.3. Conditional visibility via CONDITIONAL_ON

`_rank` only renders when `_runType === 'tournament'`. `_dissonanceSubCategory` only renders when `_runType === 'dissonance'`. These are the same CONDITIONAL_ON edges introduced in §12.2, now driving the *render* side in addition to the *validation* side.

Form component:

```typescript
// src/features/data-import/manual-entry/single-entry-form.tsx
import { graph } from '@/shared/domain/field-graph';

function SingleEntryForm({ formState, updateField }: Props) {
  const visibleInternalFields = graph.conditionallyVisibleFields(formState);
  // → ['_date', '_time', '_notes', '_runType', ...and '_rank' or '_dissonanceSubCategory' when applicable]

  return (
    <form>
      {visibleInternalFields.map((fieldKey) => (
        <FormInput key={fieldKey}
                   fieldKey={fieldKey}
                   value={formState.fieldValues[fieldKey]}
                   onChange={(v) => updateField(fieldKey, v)} />
      ))}
    </form>
  );
}
```

`graph.conditionallyVisibleFields(formState)` walks every internal field node, checks its CONDITIONAL_ON edges, and returns the set of fields whose conditions the current form state satisfies:

```typescript
// src/shared/domain/field-graph/query.ts
conditionallyVisibleFields(formState: Record<string, unknown>): readonly NodeId[] {
  const visible: NodeId[] = [];
  for (const field of this.nodesOfType('Field')) {
    if (!field.tags?.includes('internal')) continue;

    const conditions = this.conditionalOn(field.id);
    if (conditions.length === 0) {
      visible.push(field.id);   // unconditional
      continue;
    }

    const satisfied = conditions.some((requiredEnumId) => {
      const owningField = this.fieldForEnumValue(requiredEnumId);
      const requiredStringValue = this.stringValueOf(requiredEnumId);
      return formState[owningField] === requiredStringValue;
    });

    if (satisfied) visible.push(field.id);
  }
  return visible;
}
```

No hardcoded `if (runType === 'tournament') showRank()` in the form. The form reads the visibility set from the graph. Adding a new conditionally-visible field (a V30 game mode that introduces `_newModeSubCategory`) is a CONDITIONAL_ON edge declaration, not a form patch.

### 18.4. Updates propagate through derivations

Section 11.3 introduced IS_DERIVED_FROM edges and `applyDerivations`. At parse time, `applyDerivations` runs once to populate `_date`, `_time`, `battleReport_coinsPerHour`, etc. At edit time, the same logic has to re-run for any field whose inputs changed.

Concrete example: the user edits `battleReport_battleDate` in the run-details card. That edit is canonical — no question which key it targets — but `_date` and `_time` are derived from it. Today, the edit handler has to know that fact and manually update them. With the graph, the dependency is discoverable.

```typescript
// src/shared/domain/field-graph/apply-cascade.ts
import { graph } from './index';
import { DERIVERS } from './derivers';
import type { GameRunFields } from '@/shared/types/game-run.types';

/**
 * Applies a single-field update, then cascades to every derived field whose
 * input changed. Returns the updated field map.
 *
 * Example: editing battleReport_battleDate cascades to _date and _time
 * (both have IS_DERIVED_FROM edges pointing at battleReport_battleDate).
 */
export function applyUpdate(
  fields: GameRunFields,
  fieldKey: string,
  newValue: unknown,
): GameRunFields {
  const updated = {
    ...fields,
    [fieldKey]: { ...fields[fieldKey], value: newValue, rawValue: newValue, displayValue: String(newValue) },
  };

  // Find every field derived FROM fieldKey — walk IS_DERIVED_FROM edges in reverse
  const derivedDownstream = graph.fieldsDerivedFrom(fieldKey);

  // Topological order: if A derives from B and B derives from fieldKey,
  // update B first then A. The graph guarantees the derivation DAG has no cycles.
  const orderedDerived = graph.topologicallySortDerivations(derivedDownstream);

  for (const derivedKey of orderedDerived) {
    const derivationEdges = graph.query({ edgeType: 'IS_DERIVED_FROM', from: derivedKey });
    const deriverId = derivationEdges[0]?.payload?.deriver;
    if (!deriverId) continue;
    const deriver = DERIVERS[deriverId];
    if (!deriver) continue;

    // Collect inputs from the UPDATED map (so cascaded changes see fresh values)
    const inputs: Record<string, unknown> = {};
    for (const e of derivationEdges) {
      inputs[e.to] = updated[e.to]?.value;
    }

    const derivedValue = deriver(inputs);
    if (derivedValue !== undefined) {
      updated[derivedKey] = {
        ...updated[derivedKey],
        value: derivedValue,
        rawValue: derivedValue,
        displayValue: String(derivedValue),
      };
    }
  }

  return updated;
}
```

`graph.fieldsDerivedFrom('battleReport_battleDate')` returns `['_date', '_time']`. The updater walks them in topological order (trivial since they don't derive from each other), runs each deriver with current inputs, writes the derived value back.

The edit handler becomes a one-liner:

```typescript
// BEFORE — in field-update-logic.ts
function updateBattleDate(run: ParsedGameRun, newDate: string): ParsedGameRun {
  const updatedFields = { ...run.fields };
  updatedFields.battleReport_battleDate = { ...updatedFields.battleReport_battleDate, value: newDate };
  // Manually cascade _date and _time. IF we remember to.
  const { date, time } = deriveDateTimeFromBattleDate(new Date(newDate));
  updatedFields._date = { ...updatedFields._date, value: date };
  updatedFields._time = { ...updatedFields._time, value: time };
  return { ...run, fields: updatedFields };
}

// AFTER — the cascade is graph-driven
function updateBattleDate(run: ParsedGameRun, newDate: string): ParsedGameRun {
  return { ...run, fields: applyUpdate(run.fields, 'battleReport_battleDate', newDate) };
}
```

Three fields get correctly updated with one call. If a future schema adds `_dayOfWeek` derived from `battleReport_battleDate`, this code doesn't change — only the edge declaration does.

### 18.5. Optimistic write then validate — the rank edit case

The real-world field-update function in `field-update-logic.ts` handles both the notes case (simple string write) and the rank case (write + auto-clear on run-type change). Here's the rank case rewired to use the graph.

**Today:**

```typescript
// src/features/game-runs/editing/field-update-logic.ts — today
export function createUpdatedRunTypeFields(
  currentFields: Record<string, GameRunField>,
  newRunType: RunTypeValue,
): Record<string, GameRunField> {
  const runTypeField = currentFields._runType || { originalKey: '_runType', dataType: 'string' };
  // Hardcoded: switch to non-tournament clears rank (separate call site)
  return {
    ...currentFields,
    _runType: { ...runTypeField, value: newRunType, rawValue: newRunType, displayValue: newRunType },
  };
}

// Caller in use-data-input-form.ts
const handleRunTypeChange = (type: RunTypeValue): void => {
  setSelectedRunType(type);
  if (type !== RunType.TOURNAMENT) {
    setRank('');          // auto-clear hardcoded here
  }
};
```

Two places know about the tournament/rank constraint: the hook's onChange handler (which clears rank), and validation at save time (which rejects a rank with non-tournament).

**With the graph:**

```typescript
// src/features/game-runs/editing/field-update-logic.ts — graph-driven
import { applyUpdate, autoClearNewlyInvalidFields } from '@/shared/domain/field-graph/apply-cascade';

export function createUpdatedRunTypeFields(
  currentFields: Record<string, GameRunField>,
  newRunType: RunTypeValue,
): Record<string, GameRunField> {
  // Step 1: apply the user's change (canonically)
  let next = applyUpdate(currentFields, '_runType', newRunType);

  // Step 2: any field with a CONDITIONAL_ON edge whose condition is now unsatisfied
  //         gets auto-cleared. This is where _rank gets cleared on non-tournament,
  //         and _dissonanceSubCategory gets cleared on non-dissonance, all from edges.
  next = autoClearNewlyInvalidFields(next);

  return next;
}
```

`autoClearNewlyInvalidFields` walks every field with a CONDITIONAL_ON edge, re-evaluates the condition against the new field map, and clears any field whose condition is no longer satisfied:

```typescript
// src/shared/domain/field-graph/apply-cascade.ts
export function autoClearNewlyInvalidFields(fields: GameRunFields): GameRunFields {
  const next = { ...fields };
  const formContext: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(next)) {
    formContext[k] = v?.value;
  }

  for (const field of graph.nodesOfType('Field')) {
    const conditions = graph.conditionalOn(field.id);
    if (conditions.length === 0) continue;

    const satisfied = conditions.some((requiredEnumId) => {
      const owningField = graph.fieldForEnumValue(requiredEnumId);
      const requiredValue = graph.stringValueOf(requiredEnumId);
      return formContext[owningField] === requiredValue;
    });

    if (!satisfied && next[field.id]?.value !== undefined && next[field.id]?.value !== '') {
      next[field.id] = { ...next[field.id], value: '', rawValue: '', displayValue: '' };
    }
  }

  return next;
}
```

**Code shrinkage.** The before version had:
- Specific if-branch for tournament/rank in the hook (`if (type !== RunType.TOURNAMENT) setRank('')`)
- Specific clear for rank in the form reducer
- Specific validation for rank-required-on-tournament in `prepareRunForSave`
- Specific test for "clearing rank when switching away from tournament"

The after version has:
- One CONDITIONAL_ON edge declaration (data, not code)
- One `autoClearNewlyInvalidFields` function (reused by every future conditional field)
- One generic validator that handles every field's constraints
- Tests that live on the graph engine (test the engine, not each case)

Concrete LOC delta: roughly -40 lines of scattered logic, +25 lines of reusable cascade machinery, +2 lines of edge declaration per conditional field. Net: smaller AND more capable — because the next conditional field (V30 mode sub-category) costs 2 lines instead of 40.

**Bonus: the single-entry modal's run-type dropdown stays completely dumb.**

```typescript
<RunTypeSelector options={graph.enumOptionsFor('_runType')} value={selectedRunType} onChange={handleRunTypeChange} />
```

No enum member list, no switch statements, no conditional show/hide — all of that is graph-driven. The dropdown is a thin presentation shell. The hook is thin orchestration. The logic is edges plus one cascade helper.

---

> [< Prev: 17. Schema as a first-class graph entity](./17-schema-as-a-first-class-graph-entity.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 19. "Logic as data" — mental model and AI-usability guide >](./19-logic-as-data-and-ai-usability-guide.md)
