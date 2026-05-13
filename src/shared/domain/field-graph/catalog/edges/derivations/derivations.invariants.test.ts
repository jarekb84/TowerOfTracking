import { describe, expect, it } from 'vitest';
import { appGraph } from '../../../app-graph';
import { DERIVERS } from './derivations.derivers';
import { deriverNameOf, derivedFields, derivationsOf } from './derivations.queries';

// Production-catalog shape for IS_DERIVED_FROM. Verifies every declared
// derivation can actually be invoked (the deriver-name payload resolves to a
// registered function) and that the DAG has no cycles.

describe('derivations catalog invariants', () => {
  it('every IS_DERIVED_FROM edge carries a deriver-name resolving to a registered function', () => {
    const broken: string[] = [];
    for (const e of appGraph().edgesOfType('IS_DERIVED_FROM')) {
      const name = deriverNameOf(e);
      if (!name) {
        broken.push(`${e.from} ← ${e.to}: missing 'deriver' payload`);
        continue;
      }
      if (!(name in DERIVERS)) {
        broken.push(`${e.from} ← ${e.to}: deriver '${name}' not in DERIVERS registry`);
      }
    }
    expect(broken, broken.join('\n')).toEqual([]);
  });

  it('every IS_DERIVED_FROM edge targets a declared Field node', () => {
    const dangling: string[] = [];
    for (const e of appGraph().edgesOfType('IS_DERIVED_FROM')) {
      if (e.to === undefined) {
        dangling.push(`${e.from}: missing 'to'`);
        continue;
      }
      const target = appGraph().getField(e.to);
      if (!target) dangling.push(`${e.from} ← ${e.to}: target is not a declared Field`);
    }
    expect(dangling, dangling.join('\n')).toEqual([]);
  });

  it('IS_DERIVED_FROM forms a DAG (no cycles, no self-loops)', () => {
    const graph = appGraph();
    const visiting = new Set<string>();
    const visited = new Set<string>();

    function visit(id: string, path: string[]): void {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`IS_DERIVED_FROM cycle: ${[...path, id].join(' -> ')}`);
      }
      visiting.add(id);
      for (const e of derivationsOf(graph, id)) {
        if (e.to !== undefined) visit(e.to, [...path, id]);
      }
      visiting.delete(id);
      visited.add(id);
    }

    for (const id of derivedFields(graph)) visit(id, []);
  });
});
