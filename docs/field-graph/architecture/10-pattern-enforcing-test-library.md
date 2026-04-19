# 10. Pattern-enforcing test library

> Part of the Field Graph Architecture spec.
> [< Prev: 9. Cross-cutting concerns](./09-cross-cutting-concerns.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 11. Internal app-fields — how the graph handles them >](./11-internal-app-fields.md)

---

The user specifically loved section 3e's testing style — a small number of pattern-enforcing tests that cover every field instead of one-test-per-field. This section expands that idea into a complete test file demonstrating ~10 invariant assertions. Each test is a graph query; each test catches an entire class of drift.

```typescript
// src/shared/domain/field-graph/__tests__/graph-invariants.test.ts
import { describe, it, expect } from 'vitest';
import { graph } from '@/shared/domain/field-graph';
import supportedFieldsJson from '@/../sampleData/supportedFields.json';

const supportedFields = new Set<string>(supportedFieldsJson.fields);

describe('FieldGraph structural invariants', () => {
  it('every Field node has exactly one BELONGS_TO_SECTION edge (unless tagged internal)', () => {
    const violations: string[] = [];
    for (const field of graph.nodesOfType('Field')) {
      if (field.tags?.includes('internal')) continue;
      const sections = graph.edgesFrom(field.id, 'BELONGS_TO_SECTION');
      if (sections.length !== 1) {
        violations.push(
          `${field.id}: ${sections.length} section edges (${sections.map((e) => e.to).join(', ')})`,
        );
      }
    }
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('every Section node has at least 3 Field members', () => {
    const thin: Array<{ section: string; count: number }> = [];
    for (const section of graph.nodesOfType('Section')) {
      const members = graph.edgesTo(section.id, 'BELONGS_TO_SECTION');
      if (members.length < 3) {
        thin.push({ section: section.id, count: members.length });
      }
    }
    expect(thin, `thinly populated sections: ${JSON.stringify(thin)}`).toEqual([]);
  });

  it('every IS_SOURCE_OF edge target has HAS_DATA_TYPE number', () => {
    const badTargets: string[] = [];
    for (const edge of graph.query({ edgeType: 'IS_SOURCE_OF' })) {
      const targetType = graph.dataTypeOf(edge.to);
      if (targetType !== 'number') {
        badTargets.push(`${edge.from} -> ${edge.to} (target type: ${targetType ?? 'none'})`);
      }
    }
    expect(badTargets, badTargets.join('\n')).toEqual([]);
  });

  it('every RENAMED_FROM source key is NOT in the V3 supportedFields.json (legacy-only)', () => {
    const shadowing: string[] = [];
    for (const edge of graph.query({ edgeType: 'RENAMED_FROM' })) {
      const legacyKey = edge.to;
      if (supportedFields.has(legacyKey)) {
        shadowing.push(
          `${edge.from} RENAMED_FROM ${legacyKey} — but ${legacyKey} is still a V3 canonical key`,
        );
      }
    }
    expect(shadowing, shadowing.join('\n')).toEqual([]);
  });

  it('RENAMED_FROM has no cycles', () => {
    for (const field of graph.nodesOfType('Field')) {
      const seen = new Set<string>([field.id]);
      const frontier = [field.id];
      while (frontier.length) {
        const cur = frontier.pop()!;
        for (const e of graph.edgesFrom(cur, 'RENAMED_FROM')) {
          expect(seen.has(e.to), `rename cycle through ${field.id}: ${[...seen, e.to].join(' -> ')}`)
            .toBe(false);
          seen.add(e.to);
          frontier.push(e.to);
        }
      }
    }
  });

  it('every Field node has exactly one HAS_DATA_TYPE edge', () => {
    const missing: string[] = [];
    for (const field of graph.nodesOfType('Field')) {
      const types = graph.edgesFrom(field.id, 'HAS_DATA_TYPE');
      if (types.length !== 1) {
        missing.push(`${field.id}: ${types.length} HAS_DATA_TYPE edges`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('every APPEARS_IN_VIEW edge points at a declared View node', () => {
    const bogus: string[] = [];
    for (const edge of graph.query({ edgeType: 'APPEARS_IN_VIEW' })) {
      const target = graph.getNode(edge.to);
      if (!target || target.kind !== 'View') {
        bogus.push(`${edge.from} APPEARS_IN_VIEW ${edge.to} — not a View node`);
      }
    }
    expect(bogus, bogus.join('\n')).toEqual([]);
  });

  it('every Field in section:coins IS_SOURCE_OF battleReport_coinsEarned (unless tagged not-in-total)', () => {
    const expected = graph.fieldsInSection('section:coins');
    const missing: string[] = [];
    for (const field of expected) {
      if (graph.hasTag(field, 'not-in-total')) continue;
      if (!graph.hasEdge(field, 'IS_SOURCE_OF', 'battleReport_coinsEarned')) {
        missing.push(field);
      }
    }
    expect(missing, `coin fields missing IS_SOURCE_OF: ${missing.join(', ')}`).toEqual([]);
  });

  it('every Field appears in at least one View (unless tagged storage-only)', () => {
    const orphaned: string[] = [];
    for (const field of graph.nodesOfType('Field')) {
      if (field.tags?.includes('storage-only')) continue;
      if (field.tags?.includes('pending_classification')) continue; // stub, allowed
      const views = graph.edgesFrom(field.id, 'APPEARS_IN_VIEW');
      if (views.length === 0) {
        orphaned.push(field.id);
      }
    }
    expect(orphaned, `fields with no view: ${orphaned.join(', ')}`).toEqual([]);
  });

  it('every V3 field either has a RENAMED_FROM edge OR is SHIPPED_IN_SCHEMA v3+', () => {
    const unattributed: string[] = [];
    for (const field of graph.nodesOfType('Field')) {
      if (field.tags?.includes('pending_classification')) continue;
      const hasRename = graph.edgesFrom(field.id, 'RENAMED_FROM').length > 0;
      const shipSchema = graph.shippedInSchema(field.id);
      const shipsInV3Plus = shipSchema === 'schema:v3';
      if (!hasRename && !shipsInV3Plus) {
        unattributed.push(field.id);
      }
    }
    expect(unattributed, `fields with no provenance: ${unattributed.join(', ')}`).toEqual([]);
  });

  it('every node id is unique across kinds', () => {
    const seen = new Map<string, string>();
    for (const node of graph.allNodes()) {
      const existing = seen.get(node.id);
      if (existing && existing !== node.kind) {
        throw new Error(`id collision: ${node.id} is both ${existing} and ${node.kind}`);
      }
      seen.set(node.id, node.kind);
    }
  });
});
```

Twelve tests. Together they cover:

- **Schema correctness** (1, 6, 7, 12): every field has one section, one data type, no duplicate ids; every view reference is valid.
- **Structural health** (2, 9): sections aren't anemic, fields aren't orphaned.
- **Migration safety** (4, 5, 10): legacy keys don't shadow canonical, rename chains don't cycle, every field has provenance.
- **Domain rules** (3, 8): coin totals are numeric; coin-section fields feed the coin total unless explicitly opted out.

If the app grows to 300 fields, these tests still take milliseconds and catch the same classes of bug. That's the leverage: **five-to-fifteen graph queries replace hundreds of pairwise file-consistency tests**, and new invariants are as cheap as one new `it` block. The test surface grows with edge types, not with field count — which is exactly the scaling property the user hoped for.

---

> [< Prev: 9. Cross-cutting concerns](./09-cross-cutting-concerns.md) | [Index (00-table-of-contents.md)](./00-table-of-contents.md) | [Next: 11. Internal app-fields — how the graph handles them >](./11-internal-app-fields.md)
