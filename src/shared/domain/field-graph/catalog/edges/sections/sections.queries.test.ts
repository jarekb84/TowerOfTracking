import { describe, expect, it } from 'vitest';
import {
  categoryNode,
  edge,
  fieldNode,
  FieldGraph,
  sectionNode,
} from '../../../index';
import {
  categoriesInDisplayOrder,
  categoryOfSection,
  fieldsInSection,
  sectionsInCategory,
  sectionsOf,
} from './sections.queries';

// Query behavior against fixture graphs.

function buildSectionGraph(): FieldGraph {
  return new FieldGraph(
    [
      categoryNode('category:general'),
      categoryNode('category:combat'),
      sectionNode('section:coins'),
      sectionNode('section:damage'),
      sectionNode('section:battleReport'),
      fieldNode('a'),
      fieldNode('b'),
      fieldNode('lonely'),
    ],
    [
      edge('a', 'BELONGS_TO_SECTION', 'section:coins'),
      edge('a', 'BELONGS_TO_SECTION', 'section:damage'),
      edge('b', 'BELONGS_TO_SECTION', 'section:coins'),
      edge('section:battleReport', 'BELONGS_TO_CATEGORY', 'category:general'),
      edge('section:damage', 'BELONGS_TO_CATEGORY', 'category:combat'),
    ],
  );
}

describe('fieldsInSection', () => {
  it('returns fields whose BELONGS_TO_SECTION points here', () => {
    const graph = buildSectionGraph();
    expect(fieldsInSection(graph, 'section:coins')).toEqual(['a', 'b']);
    expect(fieldsInSection(graph, 'section:damage')).toEqual(['a']);
  });

  it('returns [] for a section with no members', () => {
    const graph = new FieldGraph([sectionNode('section:empty')], []);
    expect(fieldsInSection(graph, 'section:empty')).toEqual([]);
  });
});

describe('sectionsOf', () => {
  it('returns every section a field belongs to (multi-section allowed)', () => {
    const graph = buildSectionGraph();
    expect(sectionsOf(graph, 'a')).toEqual(['section:coins', 'section:damage']);
    expect(sectionsOf(graph, 'b')).toEqual(['section:coins']);
  });

  it('returns [] for a field with no section membership', () => {
    const graph = buildSectionGraph();
    expect(sectionsOf(graph, 'lonely')).toEqual([]);
  });
});

describe('sectionsInCategory', () => {
  it('returns sections in declaration order within the category', () => {
    const graph = buildSectionGraph();
    expect(sectionsInCategory(graph, 'category:general')).toEqual(['section:battleReport']);
    expect(sectionsInCategory(graph, 'category:combat')).toEqual(['section:damage']);
  });

  it('returns [] for a category with no sections', () => {
    const graph = new FieldGraph([categoryNode('category:empty')], []);
    expect(sectionsInCategory(graph, 'category:empty')).toEqual([]);
  });
});

describe('categoryOfSection', () => {
  it('returns the section\'s category', () => {
    const graph = buildSectionGraph();
    expect(categoryOfSection(graph, 'section:battleReport')).toBe('category:general');
    expect(categoryOfSection(graph, 'section:damage')).toBe('category:combat');
  });

  it('returns undefined when no BELONGS_TO_CATEGORY edge exists', () => {
    const graph = buildSectionGraph();
    expect(categoryOfSection(graph, 'section:coins')).toBeUndefined();
  });
});

describe('categoriesInDisplayOrder', () => {
  it('returns Category-kind nodes in catalog declaration order', () => {
    const graph = buildSectionGraph();
    expect(categoriesInDisplayOrder(graph)).toEqual(['category:general', 'category:combat']);
  });
});
