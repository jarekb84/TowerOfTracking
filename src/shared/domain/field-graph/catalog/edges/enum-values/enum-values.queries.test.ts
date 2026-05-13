import { describe, expect, it } from 'vitest';
import { edge, enumValueNode, fieldNode, FieldGraph } from '../../../index';
import {
  acceptedValuesFor,
  enumValueMeta,
  isAcceptedValue,
  matchAcceptedValue,
} from './enum-values.queries';

// Query behavior against a fixture graph. Production-catalog shape lives in
// `enum-values.invariants.test.ts`.

function buildRunTypeLikeGraph(): FieldGraph {
  return new FieldGraph(
    [
      fieldNode('_runType'),
      fieldNode('plainField'),
      enumValueNode('enum:farm'),
      enumValueNode('enum:tournament'),
    ],
    [
      edge('_runType', 'ACCEPTS_VALUE', 'enum:farm'),
      edge('_runType', 'ACCEPTS_VALUE', 'enum:tournament'),
      edge('enum:farm', 'HAS_STRING_VALUE', 'farm'),
      edge('enum:farm', 'HAS_DISPLAY_NAME', 'Farm'),
      edge('enum:tournament', 'HAS_STRING_VALUE', 'tournament'),
      // intentionally no HAS_DISPLAY_NAME on enum:tournament — meta should
      // omit the optional field rather than return a blank string
    ],
  );
}

describe('acceptedValuesFor', () => {
  it('returns every declared wire value', () => {
    const graph = buildRunTypeLikeGraph();
    expect([...acceptedValuesFor(graph, '_runType')].sort()).toEqual(['farm', 'tournament']);
  });

  it('returns [] for a non-enum field', () => {
    const graph = buildRunTypeLikeGraph();
    expect(acceptedValuesFor(graph, 'plainField')).toEqual([]);
  });

  it('returns [] for a missing fieldId', () => {
    const graph = buildRunTypeLikeGraph();
    expect(acceptedValuesFor(graph, 'nope')).toEqual([]);
  });
});

describe('isAcceptedValue', () => {
  it('returns true only for an exact declared wire value', () => {
    const graph = buildRunTypeLikeGraph();
    expect(isAcceptedValue(graph, '_runType', 'farm')).toBe(true);
    expect(isAcceptedValue(graph, '_runType', 'tournament')).toBe(true);
    expect(isAcceptedValue(graph, '_runType', 'milestone')).toBe(false);
  });

  it('is case-sensitive (exact match only)', () => {
    const graph = buildRunTypeLikeGraph();
    expect(isAcceptedValue(graph, '_runType', 'FARM')).toBe(false);
    expect(isAcceptedValue(graph, '_runType', 'Farm')).toBe(false);
  });

  it('returns false for empty string and non-enum / missing fieldId', () => {
    const graph = buildRunTypeLikeGraph();
    expect(isAcceptedValue(graph, '_runType', '')).toBe(false);
    expect(isAcceptedValue(graph, 'plainField', 'farm')).toBe(false);
    expect(isAcceptedValue(graph, 'nope', 'farm')).toBe(false);
  });
});

describe('matchAcceptedValue', () => {
  it('returns the wire value on match, else null', () => {
    const graph = buildRunTypeLikeGraph();
    expect(matchAcceptedValue(graph, '_runType', 'farm')).toBe('farm');
    expect(matchAcceptedValue(graph, '_runType', 'FARM')).toBeNull();
    expect(matchAcceptedValue(graph, '_runType', 'nope')).toBeNull();
    expect(matchAcceptedValue(graph, '_runType', '')).toBeNull();
    expect(matchAcceptedValue(graph, 'plainField', 'farm')).toBeNull();
    expect(matchAcceptedValue(graph, 'nope', 'farm')).toBeNull();
  });
});

describe('enumValueMeta', () => {
  it('returns id, wireValue, and displayName when declared', () => {
    const graph = buildRunTypeLikeGraph();
    expect(enumValueMeta(graph, '_runType', 'farm')).toEqual({
      id: 'enum:farm',
      wireValue: 'farm',
      displayName: 'Farm',
    });
  });

  it('omits displayName when the enum value has no HAS_DISPLAY_NAME', () => {
    const graph = buildRunTypeLikeGraph();
    const meta = enumValueMeta(graph, '_runType', 'tournament');
    expect(meta).toEqual({ id: 'enum:tournament', wireValue: 'tournament' });
    expect(meta && 'displayName' in meta).toBe(false);
  });

  it('returns null for unknown wire value / non-enum / missing fieldId', () => {
    const graph = buildRunTypeLikeGraph();
    expect(enumValueMeta(graph, '_runType', 'milestone')).toBeNull();
    expect(enumValueMeta(graph, '_runType', '')).toBeNull();
    expect(enumValueMeta(graph, 'plainField', 'farm')).toBeNull();
    expect(enumValueMeta(graph, 'nope', 'farm')).toBeNull();
  });
});
