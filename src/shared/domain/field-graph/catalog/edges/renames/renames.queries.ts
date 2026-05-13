import type { FieldGraph, FieldRef } from '../../../field-graph';
import type { RenamedFromPayload } from '../../../types';

export interface RenameRecord {
  readonly legacyKey: string;
  readonly atSchema: string;
  readonly reason?: string;
}

// All RENAMED_FROM payloads attached to a field, in declaration order. Useful
// for `graph.describe`-style introspection — surfaces the full historical
// rename chain for a single canonical field.
export function renamesOf(graph: FieldGraph, field: FieldRef): readonly RenameRecord[] {
  return graph
    .edgesFrom(field, 'RENAMED_FROM')
    .map((e) => e.payload as RenamedFromPayload | undefined)
    .filter((p): p is RenamedFromPayload => Boolean(p))
    .map((p) => ({
      legacyKey: p.legacyKey,
      atSchema: p.atSchema,
      ...(p.reason ? { reason: p.reason } : {}),
    }));
}

// Just the legacy keys this canonical field has historically been known by.
// Convenience over `renamesOf(...).map(r => r.legacyKey)`.
export function legacyKeysOf(graph: FieldGraph, field: FieldRef): readonly string[] {
  return renamesOf(graph, field).map((r) => r.legacyKey);
}
