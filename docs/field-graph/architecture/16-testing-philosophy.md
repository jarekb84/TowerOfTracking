# 16. Testing philosophy — system not configuration

> Part of the Field Graph Architecture spec.
> [< Prev: 15. Multi-section membership — confirming cardinality](./15-multi-section-membership.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 17. Schema as a first-class graph entity >](./17-schema-as-a-first-class-graph-entity.md)

---

The user was emphatic: "I don't want to have a test per entry in that array. Like I don't want to have thousands of tests. I want to have like two, three tests per edge file."

This section restates the doctrine, shows the test shape, and demonstrates how adding a new edge file adds zero tests.

### 16.1. Edge files are pure configuration

An edge file looks like this:

```typescript
// src/shared/domain/field-graph/edges/belongs-to-section.edges.ts
export const BELONGS_TO_SECTION_EDGES = [
  edge('coins_goldenTower', 'BELONGS_TO_SECTION', 'section:coins'),
  edge('coins_deathWave',   'BELONGS_TO_SECTION', 'section:coins'),
  edge('coins_blackHole',   'BELONGS_TO_SECTION', 'section:coins'),
  // ...147 more entries
];
```

There is *nothing* to unit test here. Each line is a fact — "`coins_goldenTower` belongs to `section:coins`" — and the fact is either correct or incorrect. Tests don't catch incorrect facts, human review does. What tests *do* catch is the *structural* kind of mistake: typos that produce invalid ids, edges pointing at undeclared nodes, duplicate entries, cardinality violations. Those mistakes are caught by invariants on the graph engine, not by tests on each line.

**The doctrine:** edge files have no tests of their own. Tests live against the graph engine (query correctness) and against invariants (structural health of the graph).

### 16.2. Two to three tests per edge type (not per entry)

The shape, demonstrated for the two most important edge types:

```typescript
// src/shared/domain/field-graph/__tests__/graph-invariants.test.ts

describe('BELONGS_TO_SECTION invariants', () => {
  it('every Field node has at least one BELONGS_TO_SECTION edge', () => {
    const violations: string[] = [];
    for (const field of graph.nodesOfType('Field')) {
      if (field.tags?.includes('internal')) continue;
      if (graph.edgesFrom(field.id, 'BELONGS_TO_SECTION').length === 0) {
        violations.push(field.id);
      }
    }
    expect(violations, `fields with no section: ${violations.join(', ')}`).toEqual([]);
  });

  it('every BELONGS_TO_SECTION edge target is a Section node', () => {
    const bad: string[] = [];
    for (const e of graph.query({ edgeType: 'BELONGS_TO_SECTION' })) {
      const target = graph.getNode(e.to);
      if (!target || target.kind !== 'Section') {
        bad.push(`${e.from} -> ${e.to} (target is ${target?.kind ?? 'missing'})`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

describe('RENAMED_FROM invariants', () => {
  it('no cycle in RENAMED_FROM chains', () => {
    // (implementation from §10)
  });

  it('every legacyKey payload is unique across the graph', () => {
    const seen = new Map<string, string>();
    for (const e of graph.query({ edgeType: 'RENAMED_FROM' })) {
      const key = e.payload.legacyKey;
      const prior = seen.get(key);
      if (prior && prior !== e.from) {
        throw new Error(
          `Legacy key '${key}' claimed by both '${prior}' and '${e.from}'`,
        );
      }
      seen.set(key, e.from);
    }
  });

  it('every RENAMED_FROM payload carries an atSchema id pointing at a declared Schema node', () => {
    const bad: string[] = [];
    for (const e of graph.query({ edgeType: 'RENAMED_FROM' })) {
      const schemaId = e.payload.atSchema;
      if (!schemaId) {
        bad.push(`${e.from} <- '${e.payload.legacyKey}': missing atSchema`);
        continue;
      }
      const schemaNode = graph.getNode(schemaId);
      if (!schemaNode || schemaNode.kind !== 'Schema') {
        bad.push(`${e.from} <- '${e.payload.legacyKey}': atSchema='${schemaId}' is not a Schema node`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
```

Two to three tests per edge type. Total: ~13 edge types × ~2-3 tests = ~30 invariant tests for the whole graph.

**What each test covers:**
- Shape: endpoint kinds, payload presence, payload shape.
- Uniqueness where required: legacy-key uniqueness, node-id uniqueness.
- Structural health: no cycles in rename chains, no dangling references, cardinality within bounds.

Each test is a `for` loop over `graph.query(...)`. The test count is proportional to edge-type count, not entry count.

### 16.3. The "adding a new edge file adds zero tests" promise

The user wants this property, so let me demonstrate it explicitly.

Suppose the user adds `belongs-to-section.edges.ts` and populates it with 150 entries covering every field in the app. How many new tests do they write?

**Zero.** The two tests in §16.2's `BELONGS_TO_SECTION invariants` block already cover every entry:

- "every Field node has at least one BELONGS_TO_SECTION edge" — iterates every Field node. If any of the 150 new fields lacks an edge, this test names it.
- "every BELONGS_TO_SECTION edge target is a Section node" — iterates every edge. If any of the 150 new entries points at a typo or undeclared section, this test names it.

No per-entry test exists and none is added. The two invariant tests *already cover* the entire file, regardless of whether it has 10 entries or 10,000.

Same for IS_SOURCE_OF — two tests cover the whole file:

```typescript
describe('IS_SOURCE_OF invariants', () => {
  it('every IS_SOURCE_OF target has HAS_DATA_TYPE number', () => { /* §10 */ });
  it('every IS_SOURCE_OF source-field BELONGS_TO_SECTION that contains the target', () => { /* ... */ });
});
```

Same for HAS_DATA_TYPE, HAS_COLOR, HAS_DISPLAY_NAME, APPEARS_IN_VIEW, RENAMED_FROM, and so on. Thirteen edge types, each with two to three invariants, thirty-ish tests total.

### 16.4. The "test the system" philosophy

Beyond invariant tests, the graph engine itself needs unit tests. These are tests of *query behavior*, not of configuration.

```typescript
// src/shared/domain/field-graph/__tests__/query-api.test.ts

describe('graph.resolveFieldByAnyKey', () => {
  it('returns the canonical node for a direct-hit canonical key', () => {
    const seeded = buildTestGraph([
      fieldNode('damage_blackHole'),
      edge('damage_blackHole', 'BELONGS_TO_SECTION', 'section:damage'),
    ]);
    expect(seeded.resolveFieldByAnyKey('damage_blackHole')?.id).toBe('damage_blackHole');
  });

  it('returns the canonical node for a legacy key via RENAMED_FROM reverse index', () => {
    const seeded = buildTestGraph([
      fieldNode('damage_blackHole'),
      renameEdge('damage_blackHole', { legacyKey: 'blackHole', atSchema: 'schema:v3' }),
    ]);
    expect(seeded.resolveFieldByAnyKey('blackHole')?.id).toBe('damage_blackHole');
  });

  it('returns null for an unknown key', () => {
    const seeded = buildTestGraph([fieldNode('damage_blackHole')]);
    expect(seeded.resolveFieldByAnyKey('unknown_key')).toBeNull();
  });
});

describe('graph.sourcesOf', () => {
  it('returns all Field nodes with IS_SOURCE_OF edges to the given target', () => {
    const seeded = buildTestGraph([
      fieldNode('coins_goldenTower'),
      fieldNode('coins_deathWave'),
      fieldNode('battleReport_coinsEarned'),
      edge('coins_goldenTower', 'IS_SOURCE_OF', 'battleReport_coinsEarned'),
      edge('coins_deathWave',   'IS_SOURCE_OF', 'battleReport_coinsEarned'),
    ]);
    expect(seeded.sourcesOf('battleReport_coinsEarned').sort())
      .toEqual(['coins_deathWave', 'coins_goldenTower']);
  });
});

describe('graph.renderOverride', () => {
  it('returns the override payload when present', () => {
    const seeded = buildTestGraph([
      fieldNode('battleReport_cellsEarned'),
      edge('battleReport_cellsEarned', 'BELONGS_TO_SECTION', 'section:currencies'),
      renderOverrideEdge('battleReport_cellsEarned', 'section:currencies', { displayName: 'Cells' }),
    ]);
    expect(seeded.renderOverride('battleReport_cellsEarned', 'section:currencies')?.displayName)
      .toBe('Cells');
  });

  it('falls back to default when no override exists for the section', () => {
    const seeded = buildTestGraph([fieldNode('battleReport_cellsEarned')]);
    expect(seeded.renderOverride('battleReport_cellsEarned', 'section:battleReport')).toBeNull();
  });
});
```

Each test seeds a small graph (5-10 nodes and edges), calls one query, asserts. The test does *not* touch the production graph; it builds a miniature one. This decouples query correctness from config correctness.

**Coverage targets:**

- ~100% for the graph engine (`FieldGraph` class, its query methods, its builder).
- ~100% for invariant tests (each edge type has its block).
- Zero for edge-data files. They are configuration, not code.

**Total estimate: ~40 tests for the entire graph engine.** Twelve-ish query-behavior tests, twenty-eight-ish invariant tests, regardless of whether the app has 50 fields or 500 fields.

The leverage is real: the test count grows with *edge-type count* (which grows slowly, maybe 1-2 per year), not with *entry count* (which grows with every field addition). Over five years, entry count will 5x; test count will barely move.

---

> [< Prev: 15. Multi-section membership — confirming cardinality](./15-multi-section-membership.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 17. Schema as a first-class graph entity >](./17-schema-as-a-first-class-graph-entity.md)
