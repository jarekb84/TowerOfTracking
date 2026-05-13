# 3a. Adding a new V29 field

> Part of the Field Graph Architecture spec.
> [< Prev: 02. How it works](./02-how-it-works.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3b. Renaming a field (V28 → V29) >](./03b-renaming-a-field-v28-to-v29.md)

---

_Section 3 (Evaluation) is split into sub-sections 3a–3i; each is a concrete scenario measuring the graph approach against the status quo._

Adding `coins_dragonBreath` (a new coin source in a hypothetical V29):

1. Open `field-graph/coins.ts`. Add one field-node declaration and its edges:
   ```typescript
   fieldNode('coins_dragonBreath'),
   edge('coins_dragonBreath', 'HAS_DISPLAY_NAME', 'Dragon Breath'),
   edge('coins_dragonBreath', 'HAS_COLOR', '#7dd3fc'),
   edge('coins_dragonBreath', 'BELONGS_TO_SECTION', 'section:coins'),
   edge('coins_dragonBreath', 'IS_SOURCE_OF', 'battleReport_coinsEarned'),
   ```
2. Nothing else. `COIN_FIELDS` is the result of `graph.sourcesOf('battleReport_coinsEarned')`, so the breakdown chart, source analysis, run-details coins section, and color palette all pick the field up on next render. An invariant test (see 3e) catches the missing `APPEARS_IN_VIEW` edges for any view that wants explicit opt-in rather than source-derived membership.

No other file is touched. Compare this to the status quo, where the same change requires edits in `supportedFields.json`, `coin-sources.ts`, and verification in `section-config.ts`, `v2-to-v3-field-map.ts`, and the source-analysis color mapper.

---

> [< Prev: 02. How it works](./02-how-it-works.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3b. Renaming a field (V28 → V29) >](./03b-renaming-a-field-v28-to-v29.md)
