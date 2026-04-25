import { describe, expect, it } from 'vitest';
import { edge, fieldNode, FieldGraph, sectionNode } from '../../../index';
import { fieldsInSection, sectionsOf } from './sections.queries';

// Query behavior against fixture graphs.

function buildSectionGraph(): FieldGraph {
  return new FieldGraph(
    [
      sectionNode('section:coins'),
      sectionNode('section:damage'),
      fieldNode('a'),
      fieldNode('b'),
      fieldNode('lonely'),
    ],
    [
      edge('a', 'BELONGS_TO_SECTION', 'section:coins'),
      edge('a', 'BELONGS_TO_SECTION', 'section:damage'),
      edge('b', 'BELONGS_TO_SECTION', 'section:coins'),
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
