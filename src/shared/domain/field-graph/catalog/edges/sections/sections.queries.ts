import type { FieldGraph, FieldRef } from '../../../field-graph';

export function fieldsInSection(graph: FieldGraph, section: FieldRef): readonly string[] {
  return graph.edgesTo(section, 'BELONGS_TO_SECTION').map((e) => e.from);
}

// Multi-section is allowed (a field can belong to several sections).
export function sectionsOf(graph: FieldGraph, field: FieldRef): readonly string[] {
  return graph.edgesFrom(field, 'BELONGS_TO_SECTION').map((e) => e.to as string);
}
