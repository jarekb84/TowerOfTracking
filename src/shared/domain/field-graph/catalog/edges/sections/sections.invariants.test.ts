import { describe, expect, it } from 'vitest';
import {
  appGraph,
  categoriesInDisplayOrder,
  categoryOfSection,
  fieldsInSection,
  isInternalField,
  sectionsInCategory,
  sectionsOf,
} from '../../../index';

// Production-catalog shape for BELONGS_TO_SECTION + BELONGS_TO_CATEGORY.
// Query mechanics are tested in `sections.queries.test.ts`.

describe('sections catalog invariants', () => {
  it('every game field has at least one BELONGS_TO_SECTION edge', () => {
    const missing: string[] = [];
    for (const field of appGraph().nodesOfKind('Field')) {
      if (isInternalField(field)) continue;
      if (sectionsOf(field).length === 0) {
        missing.push(field.id);
      }
    }
    expect(missing, `fields without a section: ${missing.join(', ')}`).toEqual([]);
  });

  it('every section that belongs to a category is reachable from that category', () => {
    for (const sectionNode of appGraph().nodesOfKind('Section')) {
      const category = categoryOfSection(sectionNode);
      if (category === undefined) continue;
      expect(sectionsInCategory(category), `section ${sectionNode.id} missing from sectionsInCategory(${category})`)
        .toContain(sectionNode.id);
    }
  });

  it('every section declared in the catalog belongs to exactly one category', () => {
    const orphaned: string[] = [];
    for (const sectionNode of appGraph().nodesOfKind('Section')) {
      if (categoryOfSection(sectionNode) === undefined) {
        orphaned.push(sectionNode.id);
      }
    }
    expect(orphaned, `sections without a category: ${orphaned.join(', ')}`).toEqual([]);
  });

  it('categoriesInDisplayOrder lists every declared Category', () => {
    const declared = appGraph().nodesOfKind('Category').map((n) => n.id);
    expect(categoriesInDisplayOrder()).toEqual(declared);
  });

  it('every field returned by fieldsInSection is a Field node', () => {
    for (const sectionNode of appGraph().nodesOfKind('Section')) {
      for (const fieldId of fieldsInSection(sectionNode)) {
        expect(appGraph().getField(fieldId), `${fieldId} is not a Field node`).not.toBeNull();
      }
    }
  });

  it('internal fields are excluded from section membership', () => {
    for (const field of appGraph().nodesOfKind('Field')) {
      if (!isInternalField(field)) continue;
      expect(sectionsOf(field), `${field.id} is internal but has section membership`).toEqual([]);
    }
  });
});
