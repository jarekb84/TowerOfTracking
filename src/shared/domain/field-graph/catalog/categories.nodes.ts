import { categoryNode } from '../builders';

// Category nodes — the top-level UI groupings in run-details. Each Section
// belongs to exactly one Category via a `BELONGS_TO_CATEGORY` edge declared
// in `catalog/edges/sections/sections.edges.ts`.
//
// Inventory captured 2026-05-12 per the commit-6 architectural decision
// (sections align with V3 storage prefixes; categories aggregate sections
// for run-details rendering):
//   - general:  battleReport, counts, utility
//   - combat:   damage, damageTaken, damageBlocked, bonusHealthGained,
//               healthRegenerated, enemiesHitBy, killedWithEffectActive,
//               totalEnemies, enemiesDestroyedBy
//   - economic: coins, cash, currencies
//   - records:  records
//
// The pre-commit-6 `category:battleReport` was renamed to `category:general`
// to reflect that it now also covers `section:counts` and `section:utility`.
// The pre-commit-6 `category:modules` was retired — module / shard fields
// live in `section:currencies` and render under `category:economic`.
//
// Naming: `CATEGORY_<NAME>_NODE`.

export const CATEGORY_GENERAL_NODE = categoryNode('category:general');
export const CATEGORY_RECORDS_NODE = categoryNode('category:records');
export const CATEGORY_COMBAT_NODE = categoryNode('category:combat');
export const CATEGORY_ECONOMIC_NODE = categoryNode('category:economic');
