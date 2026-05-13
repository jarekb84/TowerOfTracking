# 3b. Renaming a field (V28 → V29)

> Part of the Field Graph Architecture spec.
> [< Prev: 3a. Adding a new V29 field](./03a-adding-a-new-v29-field.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3c. Adding a new UI view >](./03c-adding-a-new-ui-view.md)

---

_Part of §3 (Evaluation). See [3a](./03a-adding-a-new-v29-field.md) for the parent intro._

The game renames `coins_spotlight` to `coins_spotlightBeam`:

1. Rename the node declaration:
   ```typescript
   fieldNode('coins_spotlightBeam'),
   edge('coins_spotlightBeam', 'HAS_DISPLAY_NAME', 'Spotlight Beam'),
   edge('coins_spotlightBeam', 'RENAMED_FROM', 'coins_spotlight', { atSchema: 'schema:v4' }),
   ```
2. The old field node becomes a *ghost node* that only exists as the target of a `RENAMED_FROM` edge. Import-time migration walks `RENAMED_FROM` edges to map old keys to new. The chart, section config, and color palette resolve by new key.
3. `graph.legacyKeysFor('coins_spotlightBeam')` returns `['coins_spotlight']`. If a second rename happens later, the chain is walked transitively.

The rename history is first-class data. A dev tool `npm run graph:rename-history coins_spotlightBeam` prints the full chain without anyone hand-maintaining a changelog.

---

> [< Prev: 3a. Adding a new V29 field](./03a-adding-a-new-v29-field.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3c. Adding a new UI view >](./03c-adding-a-new-ui-view.md)
