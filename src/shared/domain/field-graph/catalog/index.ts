import type { Node } from '../types';
import { CATEGORY_NODES } from './categories.nodes';
import { FIELD_NODES } from './fields.nodes';
import { SCHEMA_NODES } from './schemas.nodes';
import { SECTION_NODES } from './sections.nodes';
import { VIEW_NODES } from './views.nodes';

// Aggregate of every declared catalog node (Schema / Section / Category /
// View / Field). Order of concatenation is arbitrary — graph invariants
// enforce uniqueness across the whole set.
export const CATALOG_NODES: readonly Node[] = [
  ...SCHEMA_NODES,
  ...SECTION_NODES,
  ...CATEGORY_NODES,
  ...VIEW_NODES,
  ...FIELD_NODES,
];

export { SCHEMA_NODES, SECTION_NODES, CATEGORY_NODES, VIEW_NODES, FIELD_NODES };
