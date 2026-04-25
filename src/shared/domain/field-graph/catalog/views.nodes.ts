import { viewNode } from '../builders';

// View nodes. Each View represents a concrete UI surface where fields
// render — a run-details sub-section, a chart page, a runs list. Ids are
// namespaced `view:<surface>:<slug>` to keep them unique across the catalog
// and obvious at a declaration site. Inventory sourced from:
//   - run-details sub-sections in
//     `src/features/game-runs/card-view/run-details/sections/`
//   - chart routes under `src/routes/charts/`
//   - runs routes under `src/routes/runs/`
// Edges (APPEARS_IN_VIEW / APPEARS_IN_FILTER) are declared in later
// commits — this file only declares the view nodes themselves.
//
// Naming: `VIEW_<SURFACE>__<SLUG>_NODE` (the `view:surface:slug` colon
// segments collapse to double-underscore between the variable's surface
// and slug). See `docs/field-graph/EXPLORATION-node-identity-abc-deep-dive.md`
// §6.

// Run-details card sub-sections
export const VIEW_RUN_DETAILS__BATTLE_REPORT_NODE = viewNode('view:run-details:battle-report');
export const VIEW_RUN_DETAILS__COMBAT_NODE = viewNode('view:run-details:combat');
export const VIEW_RUN_DETAILS__ECONOMIC_NODE = viewNode('view:run-details:economic');
export const VIEW_RUN_DETAILS__MODULES_NODE = viewNode('view:run-details:modules');

// Chart / analysis pages
export const VIEW_CHARTS__ACTIVITY_NODE = viewNode('view:charts:activity');
export const VIEW_CHARTS__CELLS_NODE = viewNode('view:charts:cells');
export const VIEW_CHARTS__COINS_NODE = viewNode('view:charts:coins');
export const VIEW_CHARTS__COVERAGE_NODE = viewNode('view:charts:coverage');
export const VIEW_CHARTS__DEATHS_NODE = viewNode('view:charts:deaths');
export const VIEW_CHARTS__FIELDS_NODE = viewNode('view:charts:fields');
export const VIEW_CHARTS__SOURCES_NODE = viewNode('view:charts:sources');
export const VIEW_CHARTS__TIER_STATS_NODE = viewNode('view:charts:tier-stats');
export const VIEW_CHARTS__TIER_TRENDS_NODE = viewNode('view:charts:tier-trends');

// Runs list pages (filtered by run type)
export const VIEW_RUNS__FARM_NODE = viewNode('view:runs:farm');
export const VIEW_RUNS__TOURNAMENT_NODE = viewNode('view:runs:tournament');
export const VIEW_RUNS__MILESTONE_NODE = viewNode('view:runs:milestone');
