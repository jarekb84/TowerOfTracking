import { describe, expect, it } from 'vitest';
import { buildGraph } from '../build-graph';
import {
  _DATE_NODE,
  _NOTES_NODE,
  _RANK_NODE,
  _RUN_TYPE_NODE,
  _TIME_NODE,
} from './fields.nodes';

// Catalog-level invariants for IS_INTERNAL_FIELD + HAS_CSV_HEADER edges
// (commit 5). The exporter's column-ordering and per-column header come from
// the graph; drift here breaks CSV round-trips. Headers and order match the
// pre-commit-5 INTERNAL_FIELD_MAPPINGS / INTERNAL_FIELD_ORDER constants —
// preserving the wire format on disk.

describe('field-graph internal fields (commit 5)', () => {
  const graph = buildGraph();

  it('every declared internal-field node has an IS_INTERNAL_FIELD edge', () => {
    const expected = [_DATE_NODE, _TIME_NODE, _NOTES_NODE, _RUN_TYPE_NODE, _RANK_NODE];
    for (const node of expected) {
      expect(
        graph.isInternalField(node),
        `${node.id} missing IS_INTERNAL_FIELD edge`,
      ).toBe(true);
    }
  });

  it('internalFields() preserves canonical ordering for CSV export', () => {
    expect(graph.internalFields()).toEqual([
      _DATE_NODE.id,
      _TIME_NODE.id,
      _NOTES_NODE.id,
      _RUN_TYPE_NODE.id,
      _RANK_NODE.id,
    ]);
  });

  it('csvHeaderOf returns the underscore-prefixed display headers', () => {
    expect(graph.csvHeaderOf(_DATE_NODE)).toBe('_Date');
    expect(graph.csvHeaderOf(_TIME_NODE)).toBe('_Time');
    expect(graph.csvHeaderOf(_NOTES_NODE)).toBe('_Notes');
    expect(graph.csvHeaderOf(_RUN_TYPE_NODE)).toBe('_Run Type');
    expect(graph.csvHeaderOf(_RANK_NODE)).toBe('_Rank');
  });

  it('every internal field declares a CSV header', () => {
    for (const id of graph.internalFields()) {
      expect(graph.csvHeaderOf(id), `${id} missing HAS_CSV_HEADER edge`).toBeDefined();
    }
  });

  it('only the five declared internal fields carry the IS_INTERNAL_FIELD marker', () => {
    expect(graph.internalFields()).toHaveLength(5);
  });
});
