import { categoryNode } from '../builders';
import type { Node } from '../types';

// Category nodes. Categories are the coarser UI grouping used by
// run-details — sections roll up to a single category via the
// BELONGS_TO_CATEGORY edge (cardinality `'one'`, declared in a later commit).
// The inventory here mirrors the four top-level blocks rendered in
// `src/features/game-runs/card-view/run-details/sections/`
// (battle-report, combat, economic, modules) plus `records` for the
// RECORDS_CONFIG grouping defined in `section-config.ts`.
export const CATEGORY_NODES: readonly Node[] = [
  categoryNode('category:battleReport'),
  categoryNode('category:combat'),
  categoryNode('category:economic'),
  categoryNode('category:modules'),
  categoryNode('category:records'),
];
