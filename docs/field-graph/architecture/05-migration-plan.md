# 5. Migration plan

> Part of the Field Graph Architecture spec.
> [< Prev: 4. Combinations](./04-combinations.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 8. Clarifying the mental model >](./08-clarifying-the-mental-model.md)

---

This approach has a high ceiling but does not require a big-bang migration. The path:

**Step 1 — Express ONE relationship as edges.**
Pick `IS_SOURCE_OF coinsEarned`. Author the ~14 edges. Build a minimal `FieldGraph` class with one query method: `sourcesOf(totalField)`. Nothing else moves.

**Step 2 — Replace the consumer.**
Rewrite `COIN_FIELDS` as a derived array from `graph.sourcesOf('battleReport_coinsEarned')`. The hand-authored display name and color still live in the existing file, looked up from the graph via an interim map. Downstream consumers (run-details, source-analysis) are untouched because the array shape is preserved. Ship this. Measure nothing has regressed.

**Step 3 — Migrate display names and colors.**
Add `HAS_DISPLAY_NAME` and `HAS_COLOR` edges for the coin fields. The consumer's lookup map is replaced by `graph.displayNameOf` / `graph.colorOf`. Commit.

**Step 4 — Add the first structural invariant test.**
"Every field in section:coins is IS_SOURCE_OF battleReport_coinsEarned unless tagged `not-in-total`." Watch CI for drift.

**Step 5 — Migrate the V2→V3 rename map.**
Author `RENAMED_FROM` edges for coins fields. Rewrite `V2_TO_V3_FIELD_MAP` as a derived object over the RENAMED_FROM edge query. Verify the migration runtime still produces identical output for all sample data. This is the highest-value migration because it brings rename history into the same file as the field — reviewers see it in one place.

**Step 6 — Expand to damage, then to the remaining sections.**
Follow the same pattern for `damage_damageDealt` sources, then `totalEnemies_totalEnemies` sources. At this point `COIN_FIELDS`, `DAMAGE_FIELDS`, and the enemy breakdowns in `section-config.ts` are all derived.

**Step 7 — Migrate views.**
Add `View` nodes and `APPEARS_IN_VIEW` edges for each view in `section-config.ts`. The view configs become derived. Invariant: every view renders at least one field; every Field node appears in at least one view OR has a `not-in-ui` tag.

**Step 8 — Add the visualization command.**
`npm run graph:viz <filter>` prints a Mermaid diagram. Add to CI as an artifact so PRs that change edges produce a visual diff.

**Step 9 — Delete the original files.**
Once every consumer reads from the graph, delete `coin-sources.ts`, `damage-sources.ts`, and the `v2-to-v3-field-map.ts` hand-authored body (keep the file, re-export from graph). The edges in `field-graph/edges/*.ts` are now the sole source of truth.

Each step is a single PR, each step is independently revertible, and each step ships value on its own. If at any point the team decides the ceiling isn't worth the cost, the partially-migrated state is a perfectly valid end point — some relationships are in the graph, others remain in their legacy files, and both coexist. That "graceful stop" property is important: the graph is not a commitment to migrate everything, only a commitment to migrate the relationships that hurt.

---

> [< Prev: 4. Combinations](./04-combinations.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 8. Clarifying the mental model >](./08-clarifying-the-mental-model.md)
