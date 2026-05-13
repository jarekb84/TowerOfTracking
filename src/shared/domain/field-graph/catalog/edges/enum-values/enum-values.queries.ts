import type { FieldGraph, FieldRef } from '../../../field-graph';

// Lower-level than `acceptedValuesFor`: returns enum-value node ids, not
// wire-value strings. Use this when you need to walk further (e.g. read the
// per-value display name or color).
export function enumValuesOf(graph: FieldGraph, field: FieldRef): readonly string[] {
  return graph.edgesFrom(field, 'ACCEPTS_VALUE').map((e) => e.to as string);
}

export function acceptedValuesFor(graph: FieldGraph, field: FieldRef): readonly string[] {
  const values: string[] = [];
  for (const enumId of enumValuesOf(graph, field)) {
    const wireValue = graph.terminalOf(enumId, 'HAS_STRING_VALUE');
    if (wireValue !== undefined) values.push(wireValue);
  }
  return values;
}

// Exact-string match. Callers needing case-insensitive or whitespace-tolerant
// matching normalize before calling.
export function isAcceptedValue(graph: FieldGraph, field: FieldRef, raw: string): boolean {
  return acceptedValuesFor(graph, field).includes(raw);
}

// Canonicalize-or-reject. Returns `raw` itself on match today; kept as a
// distinct function so future case-tolerant or alias behavior has one place
// to land.
export function matchAcceptedValue(graph: FieldGraph, field: FieldRef, raw: string): string | null {
  return isAcceptedValue(graph, field, raw) ? raw : null;
}

export interface EnumValueMeta {
  readonly id: string;
  readonly wireValue: string;
  readonly displayName?: string;
  readonly color?: string;
}

// Optional fields are omitted (not blanked) when the underlying terminal edge
// isn't declared, so consumers can use `meta?.color ?? FALLBACK` cleanly.
export function enumValueMeta(
  graph: FieldGraph,
  field: FieldRef,
  wireValue: string,
): EnumValueMeta | null {
  for (const enumId of enumValuesOf(graph, field)) {
    if (graph.terminalOf(enumId, 'HAS_STRING_VALUE') === wireValue) {
      const displayName = graph.terminalOf(enumId, 'HAS_DISPLAY_NAME');
      const color = graph.terminalOf(enumId, 'HAS_COLOR');
      return {
        id: enumId,
        wireValue,
        ...(displayName === undefined ? {} : { displayName }),
        ...(color === undefined ? {} : { color }),
      };
    }
  }
  return null;
}
