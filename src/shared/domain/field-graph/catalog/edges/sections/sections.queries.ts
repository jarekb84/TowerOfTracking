import type { FieldGraph, FieldRef } from '../../../field-graph';

export function fieldsInSection(graph: FieldGraph, section: FieldRef): readonly string[] {
  return graph.edgesTo(section, 'BELONGS_TO_SECTION').map((e) => e.from);
}

// Multi-section is allowed (a field can belong to several sections).
export function sectionsOf(graph: FieldGraph, field: FieldRef): readonly string[] {
  return graph.edgesFrom(field, 'BELONGS_TO_SECTION').map((e) => e.to as string);
}

// Sections in declaration order — the order they appear in the catalog's
// BELONGS_TO_CATEGORY edge list within `category`. Drives run-details
// section ordering within a category.
export function sectionsInCategory(graph: FieldGraph, category: FieldRef): readonly string[] {
  return graph.edgesTo(category, 'BELONGS_TO_CATEGORY').map((e) => e.from);
}

// Returns the single category this section belongs to, or undefined if no
// BELONGS_TO_CATEGORY edge exists.
export function categoryOfSection(graph: FieldGraph, section: FieldRef): string | undefined {
  const edges = graph.edgesFrom(section, 'BELONGS_TO_CATEGORY');
  return edges.length > 0 ? (edges[0].to as string) : undefined;
}

// Category nodes in declaration order — derived from the catalog's
// Category-kind node ordering, which mirrors `categories.nodes.ts`.
export function categoriesInDisplayOrder(graph: FieldGraph): readonly string[] {
  return graph.nodesOfKind('Category').map((n) => n.id);
}
