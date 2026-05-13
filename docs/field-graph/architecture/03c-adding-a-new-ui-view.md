# 3c. Adding a new UI view

> Part of the Field Graph Architecture spec.
> [< Prev: 3b. Renaming a field (V28 → V29)](./03b-renaming-a-field-v28-to-v29.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3d. Discoverability — "where is `coins_goldenTower` used?" >](./03d-discoverability-where-is-coins-goldentower-used.md)

---

_Part of §3 (Evaluation). See [3a](./03a-adding-a-new-v29-field.md) for the parent intro._

Suppose a new view `tier-stats-advanced` is added that renders tier, wave, real-time, and cells-per-hour:

1. Declare the view node and its edges in `field-graph/views.ts`:
   ```typescript
   viewNode('view:tier-stats-advanced'),
   edge('battleReport_tier', 'APPEARS_IN_VIEW', 'view:tier-stats-advanced'),
   edge('battleReport_wave', 'APPEARS_IN_VIEW', 'view:tier-stats-advanced'),
   edge('battleReport_realTime', 'APPEARS_IN_VIEW', 'view:tier-stats-advanced'),
   edge('battleReport_cellsPerHour', 'APPEARS_IN_VIEW', 'view:tier-stats-advanced'),
   ```
2. The view component calls `graph.fieldsInView('view:tier-stats-advanced')` and renders. The color and display name for each field come from the graph, not from the component.

Critically, `graph.viewsThatUse('battleReport_tier')` now includes the new view without touching any field file. Discoverability grows automatically as views are added.

---

> [< Prev: 3b. Renaming a field (V28 → V29)](./03b-renaming-a-field-v28-to-v29.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3d. Discoverability — "where is `coins_goldenTower` used?" >](./03d-discoverability-where-is-coins-goldentower-used.md)
