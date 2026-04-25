import { describe, expect, it } from 'vitest';
import { acceptedValuesFor, colorOf, displayNameOf, enumValuesOf, enumValueMeta, matchAcceptedValue } from '../../../index';
import { _RUN_TYPE_NODE } from '../../fields.nodes';
import { RUN_TYPE_VALUES } from '../../../../run-types/types';

// Production-catalog shape for ACCEPTS_VALUE + per-enum-value presentation.
// Cross-checks the graph against the TS source-of-truth (`RUN_TYPE_VALUES`).
// Query mechanics are tested in `enum-values.queries.test.ts`.

describe('enum-values catalog invariants', () => {
  it('_runType ACCEPTS_VALUE wire values match RUN_TYPE_VALUES', () => {
    expect(new Set(acceptedValuesFor(_RUN_TYPE_NODE))).toEqual(new Set(RUN_TYPE_VALUES));
  });

  it('every declared _runType enum value has a display name and color', () => {
    const missingMetadata = enumValuesOf(_RUN_TYPE_NODE).filter((enumId) => {
      return !displayNameOf(enumId) || !colorOf(enumId);
    });
    expect(missingMetadata).toEqual([]);
  });

  it('enumValueMeta returns the full metadata for every declared wire value', () => {
    for (const wireValue of RUN_TYPE_VALUES) {
      const meta = enumValueMeta(_RUN_TYPE_NODE, wireValue);
      expect(meta, `enum-value '${wireValue}' missing meta`).not.toBeNull();
      expect(meta?.wireValue).toBe(wireValue);
      expect(meta?.displayName).toBeDefined();
      expect(meta?.color).toBeDefined();
    }
  });

  it('matchAcceptedValue accepts every declared value and rejects unknowns', () => {
    for (const wireValue of RUN_TYPE_VALUES) {
      expect(matchAcceptedValue(_RUN_TYPE_NODE, wireValue)).toBe(wireValue);
    }
    expect(matchAcceptedValue(_RUN_TYPE_NODE, 'dissonance')).toBeNull();
    expect(matchAcceptedValue(_RUN_TYPE_NODE, '')).toBeNull();
  });
});
