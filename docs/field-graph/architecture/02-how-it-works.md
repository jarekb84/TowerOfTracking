# 2. How it works

> Part of the Field Graph Architecture spec.
> [< Prev: 01. Abstract & motivation](./01-abstract-and-motivation.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3a. Adding a new V29 field >](./03a-adding-a-new-v29-field.md)

---

The mental model is a labeled property graph: a set of nodes of different types, connected by typed directional edges, queryable by a small API. All of this is pure TypeScript — there is no database, no runtime dependency, no separate tool. The graph is a plain object built up from declarative edge literals at module load time, indexed once, and frozen.

### Node types

Five node kinds cover the domain. Each has a stable string id and a discriminated type.

- **Field**: A game data concept like `coins_goldenTower`. The id IS the V3 canonical key.
- **Section**: A UI grouping like `Coins`, `Battle Report`, `Damage Blocked`. Ids like `section:coins`.
- **Category**: A coarser bucket like `Economic`, `Combat`, `Records`. Ids like `category:economic`.
- **View**: A UI surface that renders fields, like the run-details card or the source-analysis chart. Ids like `view:run-details.battle-report` or `view:source-analysis.coins`.
- **Schema**: A tower-tracking storage-schema revision for migration edges. Ids like `schema:v2`, `schema:v3`. (Tower *game* versions like V27/V28 are a separate axis — see §17.)

### Edge types

Every edge carries a `type` discriminant, a `from` node id, a `to` node id, and optional metadata specific to that edge type. The full taxonomy:

| Edge type | Semantics | Example |
|---|---|---|
| `BELONGS_TO_SECTION` | Field is grouped under a UI section | `coins_goldenTower` → `section:coins` |
| `BELONGS_TO_CATEGORY` | Section (or field) rolls up to a coarser category | `section:coins` → `category:economic` |
| `IS_SOURCE_OF` | Field contributes to a total | `coins_goldenTower` → `battleReport_coinsEarned` |
| `IS_DERIVED_FROM` | Field is computed from other fields | `battleReport_cellsPerHour` → {`battleReport_cellsEarned`, `battleReport_realTime`} |
| `RENAMED_FROM` | V3 field was known as V2 field in older data | `coins_goldenTower` → `coinsFromGoldenTower` (in `schema:v2`) |
| `APPEARS_IN_VIEW` | Field is rendered by this view | `battleReport_tier` → `view:run-details.battle-report` |
| `HAS_DISPLAY_NAME` | Field's default human-facing label | `coins_goldenTower` → `"Golden Tower"` |
| `HAS_COLOR` | Field's default chart color | `coins_goldenTower` → `#fbbf24` |
| `SHARES_LABEL_WITH` | Sibling fields that represent the same game concept in different taxonomies | `damage_deathWave` ↔ `coins_deathWave` |
| `PARTICIPATES_IN_COMPOSITE_KEY` | Field is part of duplicate-detection key | `battleReport_tier` → `compositeKey:primary` |
| `REPLACED_BY` | V2 concept superseded by a V3 concept with different shape | `damage` → `damage_damageDealt` |
| `INTENTIONALLY_DROPPED_IN_SCHEMA` | Field exists in older data but has no V3 analog | `coinsStolen` → `schema:v3` |
| `IS_CORRELATED_WITH` | Analytical hint; no runtime meaning, useful for UI "related fields" | `counts_wavesSkipped` ↔ `records_largestWaveSkip` |

`SHARES_LABEL_WITH` and `IS_CORRELATED_WITH` are symmetric by convention — the indexer stores them in both directions. The rest are directional.

### Shape

```
                           Section:coins
                                ^
                                | BELONGS_TO_SECTION
                                |
                   +---- Field:coins_goldenTower ----+
      HAS_COLOR    |                                 |  RENAMED_FROM (in schema:v2)
     "#fbbf24"     |                                 v
                   |                           Field:coinsFromGoldenTower
                   | IS_SOURCE_OF
                   v
         Field:battleReport_coinsEarned
                   ^
                   | IS_DERIVED_FROM (for per-hour)
                   |
         Field:battleReport_coinsPerHour
                   |
                   | APPEARS_IN_VIEW
                   v
         View:run-details.coins-earned
                   |
                   | BELONGS_TO_CATEGORY
                   v
              Category:economic
```

Every relationship the user cares about is an edge. Fields have no properties; their properties ARE edges (`HAS_DISPLAY_NAME`, `HAS_COLOR`) to string or color terminals.

### Query API

The query layer is a thin typed facade over an indexed edge table. Calls are synchronous, memoized, and return plain arrays so the results feel like hand-authored config.

```typescript
graph.sourcesOf('battleReport_coinsEarned');
// → ['coins_goldenTower', 'coins_deathWave', 'coins_spotlight', ...]

graph.sectionOf('coins_goldenTower');
// → 'section:coins'

graph.legacyKeysFor('coins_goldenTower');
// → ['coinsFromGoldenTower']  (by walking RENAMED_FROM)

graph.viewsThatUse('battleReport_tier');
// → ['view:run-details.battle-report', 'view:tier-stats-chart',
//    'view:duplicate-detection.composite-key']

graph.derivationInputs('battleReport_cellsPerHour');
// → ['battleReport_cellsEarned', 'battleReport_realTime']

graph.displayNameOf('coins_goldenTower');  // → 'Golden Tower'
graph.colorOf('coins_goldenTower');        // → '#fbbf24'

graph.query({ edgeType: 'RENAMED_FROM' });
// → every legacy-to-canonical pair, replaces V2_TO_V3_FIELD_MAP
```

---

> [< Prev: 01. Abstract & motivation](./01-abstract-and-motivation.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3a. Adding a new V29 field >](./03a-adding-a-new-v29-field.md)
