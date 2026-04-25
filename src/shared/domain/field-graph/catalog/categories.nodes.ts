import { categoryNode } from '../builders';

// Category nodes. Categories are the coarser UI grouping used by
// run-details — sections roll up to a single category via the
// BELONGS_TO_CATEGORY edge (cardinality `'one'`, declared in a later commit).
// The inventory here mirrors the four top-level blocks rendered in
// `src/features/game-runs/card-view/run-details/sections/`
// (battle-report, combat, economic, modules) plus `records` for the
// RECORDS_CONFIG grouping defined in `section-config.ts`.
//
// Naming: `CATEGORY_<NAME>_NODE`. See
// `docs/field-graph/EXPLORATION-node-identity-abc-deep-dive.md` §6.

export const CATEGORY_BATTLE_REPORT_NODE = categoryNode('category:battleReport');
export const CATEGORY_COMBAT_NODE = categoryNode('category:combat');
export const CATEGORY_ECONOMIC_NODE = categoryNode('category:economic');
export const CATEGORY_MODULES_NODE = categoryNode('category:modules');
export const CATEGORY_RECORDS_NODE = categoryNode('category:records');
