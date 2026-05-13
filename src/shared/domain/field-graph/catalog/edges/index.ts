import type { Edge } from '../../types';
import { BREAKDOWN_EDGES } from './breakdowns/breakdowns.edges';
import { DATA_TYPE_EDGES } from './data-types/data-types.edges';
import { DERIVATION_EDGES } from './derivations/derivations.edges';
import { ENUM_VALUE_EDGES } from './enum-values/enum-values.edges';
import { INTERNAL_FIELD_EDGES } from './internal-fields/internal-fields.edges';
import { MEASUREMENT_EDGES } from './measurements/measurements.edges';
import { PRESENTATION_EDGES } from './presentation/presentation.edges';
import { RENAME_EDGES } from './renames/renames.edges';
import { SECTION_EDGES } from './sections/sections.edges';
import { SOURCE_EDGES } from './sources/sources.edges';

// See `./PATTERN.md` for the per-concept directory pattern this aggregator
// rolls up.

export const CATALOG_EDGES: readonly Edge[] = [
  ...BREAKDOWN_EDGES,
  ...DATA_TYPE_EDGES,
  ...DERIVATION_EDGES,
  ...ENUM_VALUE_EDGES,
  ...INTERNAL_FIELD_EDGES,
  ...MEASUREMENT_EDGES,
  ...PRESENTATION_EDGES,
  ...RENAME_EDGES,
  ...SECTION_EDGES,
  ...SOURCE_EDGES,
];

export { BREAKDOWN_EDGES } from './breakdowns/breakdowns.edges';
export { DATA_TYPE_EDGES } from './data-types/data-types.edges';
export { DERIVATION_EDGES } from './derivations/derivations.edges';
export { ENUM_VALUE_EDGES } from './enum-values/enum-values.edges';
export { INTERNAL_FIELD_EDGES } from './internal-fields/internal-fields.edges';
export { MEASUREMENT_EDGES } from './measurements/measurements.edges';
export { PRESENTATION_EDGES } from './presentation/presentation.edges';
export { RENAME_EDGES } from './renames/renames.edges';
export { SECTION_EDGES } from './sections/sections.edges';
export { SOURCE_EDGES } from './sources/sources.edges';
