import { sectionNode } from '../builders';

// Section nodes. These mirror the V3 canonical key prefixes emitted by the
// V28 parser — `battleReport_*`, `coins_*`, `damage_*`, etc. — so that a
// field's declared section matches its storage prefix in the common case.
// See `sampleData/supportedFields.json` for the authoritative list of V3
// prefixes and `docs/field-graph/architecture/15-multi-section-membership.md`
// for multi-membership semantics (a field may belong to more than one
// section via additional BELONGS_TO_SECTION edges declared in later commits).
//
// Naming: `SECTION_<PREFIX>_NODE` (single underscore — the `SECTION_` prefix
// names the kind, the rest is the unsegmented section id). See
// `docs/field-graph/EXPLORATION-node-identity-abc-deep-dive.md` §6.

export const SECTION_BATTLE_REPORT_NODE = sectionNode('section:battleReport');
export const SECTION_BONUS_HEALTH_GAINED_NODE = sectionNode('section:bonusHealthGained');
export const SECTION_CASH_NODE = sectionNode('section:cash');
export const SECTION_COINS_NODE = sectionNode('section:coins');
export const SECTION_COUNTS_NODE = sectionNode('section:counts');
export const SECTION_CURRENCIES_NODE = sectionNode('section:currencies');
export const SECTION_DAMAGE_NODE = sectionNode('section:damage');
export const SECTION_DAMAGE_BLOCKED_NODE = sectionNode('section:damageBlocked');
export const SECTION_DAMAGE_TAKEN_NODE = sectionNode('section:damageTaken');
export const SECTION_ENEMIES_DESTROYED_BY_NODE = sectionNode('section:enemiesDestroyedBy');
export const SECTION_ENEMIES_HIT_BY_NODE = sectionNode('section:enemiesHitBy');
export const SECTION_HEALTH_REGENERATED_NODE = sectionNode('section:healthRegenerated');
export const SECTION_KILLED_WITH_EFFECT_ACTIVE_NODE = sectionNode('section:killedWithEffectActive');
export const SECTION_RECORDS_NODE = sectionNode('section:records');
export const SECTION_TOTAL_ENEMIES_NODE = sectionNode('section:totalEnemies');
export const SECTION_UTILITY_NODE = sectionNode('section:utility');
