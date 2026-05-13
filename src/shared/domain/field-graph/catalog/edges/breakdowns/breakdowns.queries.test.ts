import { describe, expect, it } from 'vitest';
import { edge, fieldNode, FieldGraph, sectionNode } from '../../../index';
import { breakdownRateOf, breakdownTotalOf } from './breakdowns.queries';

function buildGraph(): FieldGraph {
  return new FieldGraph(
    [
      sectionNode('section:damage'),
      sectionNode('section:coins'),
      sectionNode('section:plain'),
      fieldNode('damage_damageDealt'),
      fieldNode('battleReport_coinsEarned'),
      fieldNode('battleReport_coinsPerHour'),
    ],
    [
      edge('section:damage', 'HAS_BREAKDOWN_TOTAL', 'damage_damageDealt'),
      edge('section:coins', 'HAS_BREAKDOWN_TOTAL', 'battleReport_coinsEarned'),
      edge('section:coins', 'HAS_BREAKDOWN_RATE', 'battleReport_coinsPerHour'),
    ],
  );
}

describe('breakdownTotalOf', () => {
  it('returns the denominator field id for a breakdown section', () => {
    expect(breakdownTotalOf(buildGraph(), 'section:damage')).toBe('damage_damageDealt');
    expect(breakdownTotalOf(buildGraph(), 'section:coins')).toBe('battleReport_coinsEarned');
  });

  it('returns undefined for a plain section', () => {
    expect(breakdownTotalOf(buildGraph(), 'section:plain')).toBeUndefined();
  });

  it('returns undefined for an unknown section id', () => {
    expect(breakdownTotalOf(buildGraph(), 'section:never')).toBeUndefined();
  });
});

describe('breakdownRateOf', () => {
  it('returns the per-hour rate field for sections that declare one', () => {
    expect(breakdownRateOf(buildGraph(), 'section:coins')).toBe('battleReport_coinsPerHour');
  });

  it('returns undefined for breakdown sections without a rate', () => {
    expect(breakdownRateOf(buildGraph(), 'section:damage')).toBeUndefined();
  });

  it('returns undefined for plain sections', () => {
    expect(breakdownRateOf(buildGraph(), 'section:plain')).toBeUndefined();
  });
});
