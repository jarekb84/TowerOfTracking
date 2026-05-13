import { describe, expect, it } from 'vitest';
import {
  appGraph,
  breakdownRateOf,
  breakdownTotalOf,
  fieldsInSection,
  fieldsMeasuredAgainst,
  sourcesOf,
} from '../../../index';

// Production-catalog shape for the section-level breakdown rendering edges.
//   - `HAS_BREAKDOWN_TOTAL` (Section → Field): every breakdown section
//     declares its denominator.
//   - `HAS_BREAKDOWN_RATE` (Section → Field): optional rate field.
//   - Companion invariant: every breakdown section actually has fields to
//     render — either via IS_SOURCE_OF (genuine) or via IS_MEASURED_AGAINST
//     restricted to the section's membership (supplementary).

describe('breakdowns catalog invariants', () => {
  it('every HAS_BREAKDOWN_TOTAL edge points at a Field', () => {
    for (const edge of appGraph().edgesOfType('HAS_BREAKDOWN_TOTAL')) {
      expect(
        appGraph().getField(edge.to as string),
        `HAS_BREAKDOWN_TOTAL target '${edge.to}' is not a Field`,
      ).not.toBeNull();
    }
  });

  it('every HAS_BREAKDOWN_RATE edge points at a Field', () => {
    for (const edge of appGraph().edgesOfType('HAS_BREAKDOWN_RATE')) {
      expect(
        appGraph().getField(edge.to as string),
        `HAS_BREAKDOWN_RATE target '${edge.to}' is not a Field`,
      ).not.toBeNull();
    }
  });

  it('a section with HAS_BREAKDOWN_RATE also has HAS_BREAKDOWN_TOTAL', () => {
    for (const edge of appGraph().edgesOfType('HAS_BREAKDOWN_RATE')) {
      expect(
        breakdownTotalOf(edge.from),
        `section '${edge.from}' has HAS_BREAKDOWN_RATE but no HAS_BREAKDOWN_TOTAL`,
      ).toBeDefined();
    }
  });

  it('every breakdown section has at least one renderable source field', () => {
    const empty: string[] = [];
    for (const edge of appGraph().edgesOfType('HAS_BREAKDOWN_TOTAL')) {
      const sectionId = edge.from;
      const totalField = edge.to as string;
      const sectionFieldSet = new Set(fieldsInSection(sectionId));
      const directSources = sourcesOf(totalField).filter((id) => sectionFieldSet.has(id));
      if (directSources.length > 0) continue;
      const measured = fieldsInSection(sectionId).filter((id) =>
        fieldsMeasuredAgainst(totalField).includes(id),
      );
      if (measured.length === 0) empty.push(`${sectionId} → ${totalField}`);
    }
    expect(
      empty,
      `breakdown sections with no source fields (neither IS_SOURCE_OF nor IS_MEASURED_AGAINST in-section):\n${empty.join('\n')}`,
    ).toEqual([]);
  });

  it('breakdownRateOf returns undefined for sections without a rate edge', () => {
    // Spot-check: section:damage has a total but no rate.
    expect(breakdownRateOf('section:damage')).toBeUndefined();
  });
});
