import { describe, expect, it } from 'vitest';
import { edge, enumValueNode, fieldNode, FieldGraph } from '../../../index';
import { colorOf, displayNameOf } from './presentation.queries';

// Both edge types accept either Field or EnumValue source nodes; the fixture
// covers both kinds.

function buildPresentationGraph(): FieldGraph {
  return new FieldGraph(
    [
      fieldNode('myField'),
      enumValueNode('enum:farm'),
      enumValueNode('enum:bare'),
    ],
    [
      edge('myField', 'HAS_DISPLAY_NAME', 'My Field'),
      edge('myField', 'HAS_COLOR', '#abcdef'),
      edge('enum:farm', 'HAS_DISPLAY_NAME', 'Farm'),
      edge('enum:farm', 'HAS_COLOR', '#10b981'),
      // enum:bare intentionally has no presentation edges — query should
      // return undefined cleanly.
    ],
  );
}

describe('displayNameOf', () => {
  it('returns the display name for a Field source', () => {
    expect(displayNameOf(buildPresentationGraph(), 'myField')).toBe('My Field');
  });

  it('returns the display name for an EnumValue source', () => {
    expect(displayNameOf(buildPresentationGraph(), 'enum:farm')).toBe('Farm');
  });

  it('returns undefined when no HAS_DISPLAY_NAME edge exists', () => {
    expect(displayNameOf(buildPresentationGraph(), 'enum:bare')).toBeUndefined();
  });

  it('returns undefined for an unknown id', () => {
    expect(displayNameOf(buildPresentationGraph(), 'never')).toBeUndefined();
  });
});

describe('colorOf', () => {
  it('returns the color for a Field source', () => {
    expect(colorOf(buildPresentationGraph(), 'myField')).toBe('#abcdef');
  });

  it('returns the color for an EnumValue source', () => {
    expect(colorOf(buildPresentationGraph(), 'enum:farm')).toBe('#10b981');
  });

  it('returns undefined when no HAS_COLOR edge exists', () => {
    expect(colorOf(buildPresentationGraph(), 'enum:bare')).toBeUndefined();
  });
});
