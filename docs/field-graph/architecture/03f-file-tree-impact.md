# 3f. File tree impact

> Part of the Field Graph Architecture spec.
> [< Prev: 3e. Silent-break modes](./03e-silent-break-modes.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3g. Concrete code samples >](./03g-concrete-code-samples.md)

---

_Part of §3 (Evaluation). See [3a](./03a-adding-a-new-v29-field.md) for the parent intro._

```
src/shared/domain/field-graph/
  index.ts                     // exports the built, frozen graph + query API
  types.ts                     // node and edge discriminated unions
  builder.ts                   // build / index / memoize
  query.ts                     // the graph.query API
  nodes/
    fields.ts                  // all Field nodes, grouped by section
    sections.ts                // Section + Category nodes
    views.ts                   // View nodes
    schemas.ts                 // Schema nodes (tower-tracking storage schemas)
  edges/
    belongs-to-section.ts      // all BELONGS_TO_SECTION edges
    is-source-of.ts            // all IS_SOURCE_OF edges (replaces COIN_FIELDS array)
    is-derived-from.ts         // all IS_DERIVED_FROM edges
    renamed-from.ts            // replaces V2_TO_V3_FIELD_MAP
    appears-in-view.ts         // replaces section-config.ts membership lists
    display.ts                 // HAS_DISPLAY_NAME + HAS_COLOR edges
    correlations.ts            // SHARES_LABEL_WITH + IS_CORRELATED_WITH
    composite-keys.ts          // PARTICIPATES_IN_COMPOSITE_KEY
    versioning.ts              // REPLACED_BY + INTENTIONALLY_DROPPED_IN_SCHEMA
  __tests__/
    graph-invariants.test.ts   // structural invariants
    query-api.test.ts          // query API correctness
```

The existing `breakdown-sources/coin-sources.ts`, `breakdown-sources/damage-sources.ts`, `migrations/v2-to-v3-field-map.ts`, and `section-config.ts` do not disappear immediately — they become *derived views* over the graph. Each re-exports the same shape it always did, built at module load via `graph.sourcesOf(...)` / `graph.query(...)`. Consumers are untouched. Once the new declarations are the source of truth, the old files can be deleted.

---

> [< Prev: 3e. Silent-break modes](./03e-silent-break-modes.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3g. Concrete code samples >](./03g-concrete-code-samples.md)
