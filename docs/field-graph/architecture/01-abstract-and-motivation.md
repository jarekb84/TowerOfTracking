# 1. Abstract & motivation

> Part of the Field Graph Architecture spec.
> — | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 02. How it works >](./02-how-it-works.md)

---

Every other approach in this exploration treats a field as a *record with properties* — a row with columns like `displayName`, `color`, `section`. That model implicitly assumes the pain is "fields have attributes that live in the wrong files." But the pain the user actually described is different: "I almost need like a graph over relationships if that makes sense... there's like hierarchy and relationship and they might not be overlapping concepts." The insight underneath that statement is that *the relationships between fields are the thing that drifts*, not the fields themselves. `coins_goldenTower` has a stable meaning. What doesn't stay consistent is that it *is a source of* `battleReport_coinsEarned`, *belongs to* the Coins section, *was renamed from* `coinsFromGoldenTower`, *shares a label with* `damage_goldenTower` under different taxonomies, and *appears in* the run-details, source-analysis, and tier-stats views. Each of those is an edge. Each is currently encoded as a property on the wrong side of the relationship, hand-maintained in a different file.

The relationship-graph approach promotes relationships to first-class citizens. Fields, sections, categories, views, and schema versions become **nodes**. Every statement that currently lives as "a property on field X pointing at Y" becomes a **typed directional edge** in a graph. Instead of `COIN_FIELDS` being a hand-authored array that has to agree with `supportedFields.json`, the array is the *result of a graph query*: "give me every field node with an `IS_SOURCE_OF` edge to `battleReport_coinsEarned`." Instead of `v2-to-v3-field-map.ts` being a flat dictionary that has to agree with `supportedFields.json`, it is a set of `RENAMED_FROM` edges. Instead of the run-details section config being a hand-authored grouping that has to agree with the source-analysis color palette, it is a `BELONGS_TO_SECTION` edge plus a `HAS_COLOR` edge. One declaration, queried many ways. The migration, the rename history, the view membership, the source-of-total relationship — all live in the same substrate, all reachable from a single query API.

This is the highest-ceiling, highest-setup-cost option in this exploration. It wins decisively when relationships dominate the problem. It is unambiguous overkill if the relationships are actually simple and the current drift is cosmetic.

---

> — | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 02. How it works >](./02-how-it-works.md)
