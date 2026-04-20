import type { Node } from '../types';
import { CATEGORY_NODES } from './categories.nodes';
import { SCHEMA_NODES } from './schemas.nodes';
import { SECTION_NODES } from './sections.nodes';
import { VIEW_NODES } from './views.nodes';

// Aggregate of all top-level catalog nodes (Schema / Section / Category /
// View). Field nodes are declared separately in a later commit. The order
// in which kinds are concatenated is arbitrary — graph invariants enforce
// uniqueness across the whole set.
export const CATALOG_NODES: readonly Node[] = [
  ...SCHEMA_NODES,
  ...SECTION_NODES,
  ...CATEGORY_NODES,
  ...VIEW_NODES,
];

export { SCHEMA_NODES, SECTION_NODES, CATEGORY_NODES, VIEW_NODES };
