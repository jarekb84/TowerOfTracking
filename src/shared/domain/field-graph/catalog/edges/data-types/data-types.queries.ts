import type { FieldGraph, FieldRef } from '../../../field-graph';
import { isDataType, type DataType } from './data-types.constants';

// Returns the field's declared data type. `undefined` when no IS_OF_TYPE
// edge exists for this id (i.e. an undeclared / passthrough field at the
// parser boundary — see `EXPLORATION-data-type-edge-vs-property.md` §2.6),
// or when the declared terminal isn't a known DataType literal.
export function dataTypeOf(graph: FieldGraph, field: FieldRef): DataType | undefined {
  const value = graph.terminalOf(field, 'IS_OF_TYPE');
  return value !== undefined && isDataType(value) ? value : undefined;
}
