# 4. Combinations

> Part of the Field Graph Architecture spec.
> [< Prev: 3i. When this wins / loses](./03i-when-this-wins-loses.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 5. Migration plan >](./05-migration-plan.md)

---

### Graph + Algorithmic derivation (approach 6)

The graph captures what you *can't* derive. Display names that match `capitalize(camelSplit(fieldKey.after('_')))` don't need an explicit `HAS_DISPLAY_NAME` edge — the derivation function produces `"Golden Tower"` from `coins_goldenTower`. Only fields with exceptions (e.g., `"Guardian Fetched"` for `coins_coinsFetched`) need an edge. The graph shrinks by half. The invariant test becomes: "if a field has no `HAS_DISPLAY_NAME` edge, the derivation function produces a human-readable label; if it does, the edge wins." This is likely the best real-world combination: derive the easy cases, use graph edges for the exceptions and the relationships that can't be derived at all.

### Graph + Trait/Tag (approach 8)

Tags are *flat* edges to a special node type — effectively `edge(field, 'HAS_TAG', 'tag:coin-source')`. The graph generalizes the tag system: where tag systems can only answer "does X have tag Y," graphs can answer "is X connected to Y via any path." For this app, most questions are one-hop, so tags cover them. The graph is the escape hatch when tags are insufficient — e.g., `IS_DERIVED_FROM` carries operand order that a tag can't express. The realistic hybrid: use tags for flat capability questions ("is this a coin source?"), use graph edges for structured relationships ("which fields feed this total?").

### Graph + Invariant tests (approach 1)

Invariants become edge-existence assertions on the graph rather than file-pair assertions. Instead of "every key in supportedFields.json must appear in COIN_FIELDS or excludes," the test is "every Field node in section:coins has an IS_SOURCE_OF edge to battleReport_coinsEarned unless tagged `not-in-total`." The test surface shrinks because the graph's structure encodes most contracts implicitly. Invariants that survive are the ones about *graph shape*: no dangling edges, exactly-one-of constraints, connectivity.

---

> [< Prev: 3i. When this wins / loses](./03i-when-this-wins-loses.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 5. Migration plan >](./05-migration-plan.md)
