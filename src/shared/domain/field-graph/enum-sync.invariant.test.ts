import { describe, expect, it } from 'vitest';
import { appGraph } from './app-graph';
import { _RUN_TYPE_NODE } from './catalog/fields.nodes';
import { RUN_TYPE_VALUES } from '../run-types/types';

// Enum wire-value declarations live in two places by design:
//   - TS side: `as const` tuple + union type (authoritative).
//   - Graph side: catalog files derive their ACCEPTS_VALUE edges from the
//     TS array.
//
// The invariant: for any Field with ACCEPTS_VALUE edges, the set of wire
// values must equal its authoritative TS-side `as const` array. Same template
// applies to future enum-typed fields (e.g. `_dissonanceSubCategory` in
// commit 15).

describe('enum graph <-> TS source-of-truth sync', () => {
  it('_runType ACCEPTS_VALUE edges match RUN_TYPE_VALUES exactly', () => {
    const graph = appGraph();
    const fromGraph = [...graph.acceptedValuesFor(_RUN_TYPE_NODE)].sort();
    const fromTs = [...RUN_TYPE_VALUES].sort();
    expect(fromGraph).toEqual(fromTs);
  });
});
