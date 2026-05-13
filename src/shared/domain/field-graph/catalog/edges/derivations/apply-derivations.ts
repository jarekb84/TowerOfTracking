import type { GameRunField } from '@/shared/types/game-run.types';
import type { FieldGraph } from '../../../field-graph';
import { dataTypeOf } from '../data-types/data-types.queries';
import { DERIVERS, type Deriver } from './derivations.derivers';
import { deriverNameOf, derivedFields, derivationsOf, fieldsDerivedFrom } from './derivations.queries';

// Walk every field that has at least one IS_DERIVED_FROM edge, in topological
// order. For each, look up the registered deriver, collect input values from
// the current field map, and overwrite the derived field when the deriver
// returns a value. Returning `undefined` from a deriver preserves the
// existing field (used by `runTypeFromTier` to honor an explicit `_runType`
// from import).
//
// The graph guarantees the DAG has no cycles via the invariant in
// `derivations.invariants.test.ts` — but we still detect a cycle defensively
// here and fail loud rather than infinite-loop.
export function applyDerivations(
  graph: FieldGraph,
  fields: Record<string, GameRunField>,
): Record<string, GameRunField> {
  const order = topologicallyOrderDerivations(graph, derivedFields(graph));
  return cascadeOver(graph, fields, order);
}

// Edit-time variant: cascade only fields downstream of `changedFieldId`.
// Clears each downstream field's current value before invoking the deriver
// so the cascade overrides any previously-derived (now-stale) value. This is
// the opposite of `applyDerivations`'s parse-time semantic where explicit
// fields are preserved.
export function cascadeFromInputChange(
  graph: FieldGraph,
  fields: Record<string, GameRunField>,
  changedFieldId: string,
): Record<string, GameRunField> {
  const downstream = closureDownstream(graph, changedFieldId);
  const order = topologicallyOrderDerivations(graph, downstream);

  const cleared: Record<string, GameRunField> = { ...fields };
  for (const id of order) delete cleared[id];

  return cascadeOver(graph, cleared, order);
}

function cascadeOver(
  graph: FieldGraph,
  fields: Record<string, GameRunField>,
  derivedOrder: readonly string[],
): Record<string, GameRunField> {
  if (derivedOrder.length === 0) return fields;

  const next: Record<string, GameRunField> = { ...fields };

  for (const fieldId of derivedOrder) {
    const edges = derivationsOf(graph, fieldId);
    if (edges.length === 0) continue;

    const deriverName = deriverNameOf(edges[0]);
    if (!deriverName) continue;
    const deriver: Deriver | undefined = DERIVERS[deriverName];
    if (!deriver) continue;

    const inputs: Record<string, GameRunField | undefined> = {};
    for (const e of edges) {
      if (e.to !== undefined) inputs[e.to] = next[e.to];
    }

    const derived = deriver(inputs, next[fieldId]);
    if (derived === undefined) continue;

    next[fieldId] = buildDerivedField(graph, fieldId, derived);
  }

  return next;
}

function buildDerivedField(graph: FieldGraph, fieldId: string, derived: string): GameRunField {
  return {
    value: derived,
    rawValue: derived,
    displayValue: derived,
    originalKey: fieldId,
    dataType: dataTypeOf(graph, fieldId) ?? 'string',
  };
}

// Kahn-style topological sort over IS_DERIVED_FROM dependencies. A derived
// field `A` precedes `B` when `B` derives from `A` (so `A` is fresh when `B`
// reads it). Self-loops are illegal and surface as `FieldGraphBuildError`
// from the invariant test rather than infinite recursion here.
function topologicallyOrderDerivations(
  graph: FieldGraph,
  candidates: readonly string[],
): readonly string[] {
  const set = new Set(candidates);
  const result: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(id: string): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new Error(`IS_DERIVED_FROM cycle detected at '${id}'`);
    }
    visiting.add(id);
    for (const e of derivationsOf(graph, id)) {
      if (e.to !== undefined && set.has(e.to)) visit(e.to);
    }
    visiting.delete(id);
    visited.add(id);
    result.push(id);
  }

  for (const id of candidates) visit(id);
  return result;
}

function closureDownstream(graph: FieldGraph, rootId: string): readonly string[] {
  const closure = new Set<string>();
  const stack: string[] = [rootId];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    for (const downstream of fieldsDerivedFrom(graph, id)) {
      if (!closure.has(downstream)) {
        closure.add(downstream);
        stack.push(downstream);
      }
    }
  }
  return Array.from(closure);
}
