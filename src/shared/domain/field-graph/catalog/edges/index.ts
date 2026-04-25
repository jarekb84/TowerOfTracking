import type { Edge } from '../../types';
import { ENUM_VALUE_EDGES } from './enum-values/enum-values.edges';
import { INTERNAL_FIELD_EDGES } from './internal-fields/internal-fields.edges';

// See `./PATTERN.md` for the per-concept directory pattern this aggregator
// rolls up.

export const CATALOG_EDGES: readonly Edge[] = [
  ...ENUM_VALUE_EDGES,
  ...INTERNAL_FIELD_EDGES,
];

export { ENUM_VALUE_EDGES } from './enum-values/enum-values.edges';
export { INTERNAL_FIELD_EDGES } from './internal-fields/internal-fields.edges';
