import type { Edge } from '../../types';
import { DATA_TYPE_EDGES } from './data-types/data-types.edges';
import { ENUM_VALUE_EDGES } from './enum-values/enum-values.edges';
import { INTERNAL_FIELD_EDGES } from './internal-fields/internal-fields.edges';

// See `./PATTERN.md` for the per-concept directory pattern this aggregator
// rolls up.

export const CATALOG_EDGES: readonly Edge[] = [
  ...DATA_TYPE_EDGES,
  ...ENUM_VALUE_EDGES,
  ...INTERNAL_FIELD_EDGES,
];

export { DATA_TYPE_EDGES } from './data-types/data-types.edges';
export { ENUM_VALUE_EDGES } from './enum-values/enum-values.edges';
export { INTERNAL_FIELD_EDGES } from './internal-fields/internal-fields.edges';
