import { viewNode } from '../builders';
import type { Node } from '../types';

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
export const VIEW_NODES: readonly Node[] = [
  // Run-details card sub-sections
  viewNode('view:run-details:battle-report'),
  viewNode('view:run-details:combat'),
  viewNode('view:run-details:economic'),
  viewNode('view:run-details:modules'),

  // Chart / analysis pages
  viewNode('view:charts:activity'),
  viewNode('view:charts:cells'),
  viewNode('view:charts:coins'),
  viewNode('view:charts:coverage'),
  viewNode('view:charts:deaths'),
  viewNode('view:charts:fields'),
  viewNode('view:charts:sources'),
  viewNode('view:charts:tier-stats'),
  viewNode('view:charts:tier-trends'),

  // Runs list pages (filtered by run type)
  viewNode('view:runs:farm'),
  viewNode('view:runs:tournament'),
  viewNode('view:runs:milestone'),
];
