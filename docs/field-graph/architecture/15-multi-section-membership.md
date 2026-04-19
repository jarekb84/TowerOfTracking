# 15. Multi-section membership — confirming cardinality

> Part of the Field Graph Architecture spec.
> [< Prev: 14. Key lookup and renames — the conceptual model](./14-key-lookup-and-renames.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 16. Testing philosophy — system not configuration >](./16-testing-philosophy.md)

---

Section 8.4 introduced an `EDGE_CARDINALITY` table. The entry for `BELONGS_TO_SECTION` was `'many'`. This section confirms that cardinality choice, shows why multi-section fields are a feature (not a bug), and introduces a per-section render override so a field can look different in each section it appears in.

### 15.1. Cardinality: BELONGS_TO_SECTION is many

Restating the table entry:

```typescript
export const EDGE_CARDINALITY: Record<EdgeType, 'one' | 'many' | 'at-least-one'> = {
  // ...
  BELONGS_TO_SECTION: 'many',
  // ...
};
```

A field can belong to more than one section. The invariant test is "at least one" (every field must belong to *some* section), not "exactly one." Section 10's test intentionally uses `.toHaveLength(1)` as a *soft* constraint that can be opt-out; the hard constraint is "at least one non-zero."

**A real multi-section example.** `battleReport_cellsEarned` is a summary field in the Battle Report section — that's where it's displayed prominently in run-details. But it's *also* a currency in the Currencies grouping (alongside `battleReport_coinsEarned`), which is a cross-cutting view that unifies all the in-game currencies for source-analysis purposes.

Today, this double-membership is implicit: the run-details config lists it under Battle Report, and the source-analysis config also references it. Two files both claim it, coordinated by hand.

In the graph:

```typescript
// src/shared/domain/field-graph/edges/belongs-to-section.ts
edge('battleReport_cellsEarned', 'BELONGS_TO_SECTION', 'section:battleReport'),
edge('battleReport_cellsEarned', 'BELONGS_TO_SECTION', 'section:currencies'),
```

Two edges. Same field. The graph query `graph.sectionsOf('battleReport_cellsEarned')` returns `['section:battleReport', 'section:currencies']`. The consumer that renders the Battle Report section asks `graph.fieldsInSection('section:battleReport')` and sees `battleReport_cellsEarned`. The consumer that renders the Currencies grouping asks `graph.fieldsInSection('section:currencies')` and sees the *same* `battleReport_cellsEarned`. One declaration, two uses.

The `graph.sectionOf` (singular) convenience method from §3g still works for the common case — it returns the first section in declaration order. But any code that cares about multi-membership uses `sectionsOf` (plural).

### 15.2. Per-section render override

The user was explicit about wanting this: "how I rendered that field in that section, look at the field data. Maybe there's another relationship that says how I render node in this section."

Concrete scenario: `battleReport_cellsEarned` in the Battle Report section should render as "Cells Earned" — the full label, because it sits next to "Coins Earned" and "Real Time" and needs to match that style. In the Currencies section it should render as just "Cells" — short label, because it's in a compact currency strip.

The default display name can't express "different in each section." Introduce a refinement edge that overrides per section:

```typescript
// src/shared/domain/field-graph/edges/render-overrides.ts

edge({
  kind: 'RENDERS_AS_IN_SECTION',
  from: 'battleReport_cellsEarned',
  to: 'section:currencies',
  payload: {
    displayName: 'Cells',
    color: '#e0f2fe',     // lighter shade for the currency strip context
    hideIfZero: true,     // in the currencies strip, hide rows with no activity
  },
}),
```

The payload carries the override attributes. If the override is absent for a given section, the default attributes on the field node apply.

The consumer code that uses this override:

```typescript
// Render one field in a specific section
function renderFieldInSection(fieldKey: string, sectionId: string) {
  const override = graph.renderOverride(fieldKey, sectionId);
  const displayName = override?.displayName ?? graph.defaultDisplay(fieldKey);
  const color = override?.color ?? graph.colorOf(fieldKey);
  const hideIfZero = override?.hideIfZero ?? false;
  // ...
}
```

The graph's `renderOverride(fieldKey, sectionId)` query:

```typescript
renderOverride(fieldKey: NodeId, sectionId: NodeId): RenderOverride | null {
  const edge = (this.byFrom.get(fieldKey) ?? [])
    .find((e) => e.kind === 'RENDERS_AS_IN_SECTION' && e.to === sectionId);
  return edge?.payload ?? null;
}
```

One query, cacheable, memoizable, indexed by the `(fieldKey, sectionId)` pair.

**Why this is a separate edge type, not inline on the BELONGS_TO_SECTION edge.**

Putting the override payload directly on `BELONGS_TO_SECTION` would work for the common case. Two reasons to separate:

1. **BELONGS_TO_SECTION is a membership declaration.** It says "this field is a member of this section." That's the structural truth. Overrides are *display* truth. Mixing them conflates structure with style.
2. **You might want overrides for non-section contexts later.** `RENDERS_AS_IN_VIEW section:tier-stats`, `RENDERS_AS_IN_FILTER view:heatmap`. A unified `RENDERS_AS_IN_<context>` edge family stays clean; a payload fused into `BELONGS_TO_SECTION` would force `APPEARS_IN_VIEW` to invent its own parallel mechanism.

The separation keeps structural edges lean and makes overrides an opt-in refinement pattern.

### 15.3. Query changes

`graph.fieldsInSection(sectionId)` already returns every field with a BELONGS_TO_SECTION edge pointing at that section — no uniqueness requirement, no change needed. Multi-section fields appear in each section's result list.

New queries for multi-membership:

```typescript
// All sections a field belongs to, in declaration order
graph.sectionsOf(fieldKey: NodeId): readonly NodeId[];

// Per-section display override, or null for default
graph.renderOverride(fieldKey: NodeId, sectionId: NodeId): RenderOverride | null;

// Convenience: does this field appear in multiple sections?
graph.isMultiSection(fieldKey: NodeId): boolean;
```

Existing single-section queries keep working:

```typescript
// Returns the first (or only) section — unchanged from §3g
graph.sectionOf(fieldKey: NodeId): NodeId | undefined;
```

**Single-section is the common case.** Of the ~150 fields in the app, probably ~140 belong to exactly one section. The other ~10 are summary fields (cells, coins, tier, wave) that show up in multiple contexts. The graph handles both identically; the consumer chooses singular or plural based on its needs.

**Invariant tests don't change.** The section-10 test "every Field node has at least one BELONGS_TO_SECTION edge" still holds. The tightening test "exactly one" becomes a per-tag opt-in — only fields tagged `single-section` assert exactly-one. Fields without the tag can have many.

The upshot: multi-section membership is a built-in feature, not a special case. The graph's edge cardinality table says `many`, the queries expose both singular and plural forms, render overrides give per-context customization, and the invariants degrade gracefully.

---

> [< Prev: 14. Key lookup and renames — the conceptual model](./14-key-lookup-and-renames.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 16. Testing philosophy — system not configuration >](./16-testing-philosophy.md)
