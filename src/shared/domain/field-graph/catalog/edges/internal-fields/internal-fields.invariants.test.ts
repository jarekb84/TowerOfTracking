import { describe, expect, it } from 'vitest';
import { csvHeaderOf, internalFields, isInternalField } from '../../../index';
import {
  _DATE_NODE,
  _NOTES_NODE,
  _RANK_NODE,
  _RUN_TYPE_NODE,
  _TIME_NODE,
} from '../../fields.nodes';

// Production-catalog shape for IS_INTERNAL_FIELD + HAS_CSV_HEADER. Drift
// here breaks CSV round-trips on the wire format. Query mechanics are tested
// in `internal-fields.queries.test.ts`.

describe('internal-fields catalog invariants', () => {
  it('every declared internal-field node has an IS_INTERNAL_FIELD edge', () => {
    const expected = [_DATE_NODE, _TIME_NODE, _NOTES_NODE, _RUN_TYPE_NODE, _RANK_NODE];
    for (const node of expected) {
      expect(isInternalField(node), `${node.id} missing IS_INTERNAL_FIELD edge`).toBe(true);
    }
  });

  it('internalFields() preserves canonical ordering for CSV export', () => {
    expect(internalFields()).toEqual([
      _DATE_NODE.id,
      _TIME_NODE.id,
      _NOTES_NODE.id,
      _RUN_TYPE_NODE.id,
      _RANK_NODE.id,
    ]);
  });

  it('csvHeaderOf returns the underscore-prefixed display headers', () => {
    expect(csvHeaderOf(_DATE_NODE)).toBe('_Date');
    expect(csvHeaderOf(_TIME_NODE)).toBe('_Time');
    expect(csvHeaderOf(_NOTES_NODE)).toBe('_Notes');
    expect(csvHeaderOf(_RUN_TYPE_NODE)).toBe('_Run Type');
    expect(csvHeaderOf(_RANK_NODE)).toBe('_Rank');
  });

  it('every internal field declares a CSV header', () => {
    for (const id of internalFields()) {
      expect(csvHeaderOf(id), `${id} missing HAS_CSV_HEADER edge`).toBeDefined();
    }
  });

  it('only the five declared internal fields carry the IS_INTERNAL_FIELD marker', () => {
    expect(internalFields()).toHaveLength(5);
  });
});
