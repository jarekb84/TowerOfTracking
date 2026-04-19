# 3e. Silent-break modes

> Part of the Field Graph Architecture spec.
> [< Prev: 3d. Discoverability — "where is `coins_goldenTower` used?"](./03d-discoverability-where-is-coins-goldentower-used.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3f. File tree impact >](./03f-file-tree-impact.md)

---

_Part of §3 (Evaluation). See [3a](./03a-adding-a-new-v29-field.md) for the parent intro._

The current status quo breaks silently when a field ships to storage but no section-config file claims it, and the field falls into the "Miscellaneous" bucket unnoticed. The graph has an analogous failure mode — a field with no `BELONGS_TO_SECTION` edge — but because the graph is *declarative and typed*, invariant tests on the graph itself catch it:

```typescript
it('every Field node has exactly one BELONGS_TO_SECTION edge', () => {
  for (const field of graph.nodesOfType('Field')) {
    const sections = graph.edgesFrom(field.id, 'BELONGS_TO_SECTION');
    expect(sections, `${field.id} must belong to a section`).toHaveLength(1);
  }
});

it('every coin-source field has an IS_SOURCE_OF edge to battleReport_coinsEarned', () => {
  const coinSources = graph.edgesTo('battleReport_coinsEarned', 'IS_SOURCE_OF');
  expect(coinSources.length).toBeGreaterThan(0);
  for (const field of graph.nodesInSection('section:coins')) {
    const isSource = graph.hasEdge(field.id, 'IS_SOURCE_OF', 'battleReport_coinsEarned');
    // Allow explicit opt-out via tag
    if (!graph.hasTag(field.id, 'not-in-total')) {
      expect(isSource, `${field.id} in section:coins must be IS_SOURCE_OF coinsEarned`).toBe(true);
    }
  }
});
```

The drift isn't caught by "a new file forgot to include the new field." It's caught by "the graph's structural invariants were violated." The tests sit at the graph edge, not at every consumer pair.

---

> [< Prev: 3d. Discoverability — "where is `coins_goldenTower` used?"](./03d-discoverability-where-is-coins-goldentower-used.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 3f. File tree impact >](./03f-file-tree-impact.md)
