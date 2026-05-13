import { edge } from '../../../builders';
import type { Edge } from '../../../types';
import * as f from '../../fields.nodes';

// `IS_MEASURED_AGAINST` declarations: each supplementary-breakdown field
// names its reference yardstick (the denominator for percentage rendering).
// Unlike `IS_SOURCE_OF` these sources do NOT sum to the target — they
// overlap on the underlying domain. A single enemy can be hit by orbs AND
// thorns AND chain lightning, so summing `enemiesHitBy_*` exceeds
// `totalEnemies_totalEnemies`. The relationship is still structural: each
// field's magnitude is interpreted relative to its anchor.
//
// Three supplementary breakdowns, all anchored to `totalEnemies_totalEnemies`:
//   - 16 enemiesHitBy_* fields (per-weapon hit counts; enemies overlap)
//   - 12 enemiesDestroyedBy_* fields (per-weapon kill counts; an `_other`
//     bucket lets the breakdown intentionally not sum exactly)
//   -  6 killedWithEffectActive_* fields (effects can co-occur on the same
//     enemy) + `totalEnemies_summonedEnemies` (cross-section field that
//     also has `BELONGS_TO_SECTION section:killedWithEffectActive`)

function measuredAgainst(targetId: string, sourceIds: readonly string[]): readonly Edge[] {
  return sourceIds.map((sourceId) => edge(sourceId, 'IS_MEASURED_AGAINST', targetId));
}

export const MEASUREMENT_EDGES: readonly Edge[] = [
  ...measuredAgainst(f.TOTAL_ENEMIES__TOTAL_ENEMIES_NODE.id, [
    // enemiesHitBy supplementary breakdown
    f.ENEMIES_HIT_BY__PROJECTILES_NODE.id,
    f.ENEMIES_HIT_BY__THORNS_NODE.id,
    f.ENEMIES_HIT_BY__ORBS_NODE.id,
    f.ENEMIES_HIT_BY__DEATH_RAY_NODE.id,
    f.ENEMIES_HIT_BY__CHAIN_LIGHTNING_NODE.id,
    f.ENEMIES_HIT_BY__SMART_MISSILES_NODE.id,
    f.ENEMIES_HIT_BY__INNER_LAND_MINES_NODE.id,
    f.ENEMIES_HIT_BY__POISON_SWAMP_NODE.id,
    f.ENEMIES_HIT_BY__DEATH_WAVE_NODE.id,
    f.ENEMIES_HIT_BY__BLACK_HOLE_NODE.id,
    f.ENEMIES_HIT_BY__FLAME_BOT_NODE.id,
    f.ENEMIES_HIT_BY__ATTACK_CHIP_NODE.id,
    f.ENEMIES_HIT_BY__LAND_MINES_NODE.id,
    f.ENEMIES_HIT_BY__CHRONO_FIELD_NODE.id,
    f.ENEMIES_HIT_BY__ORBITAL_AUGMENT_NODE.id,
    f.ENEMIES_HIT_BY__THUNDER_BOT_NODE.id,
    // enemiesDestroyedBy supplementary breakdown
    f.ENEMIES_DESTROYED_BY__ORBS_NODE.id,
    f.ENEMIES_DESTROYED_BY__THORNS_NODE.id,
    f.ENEMIES_DESTROYED_BY__DEATH_RAY_NODE.id,
    f.ENEMIES_DESTROYED_BY__LAND_MINES_NODE.id,
    f.ENEMIES_DESTROYED_BY__INNER_LAND_MINES_NODE.id,
    f.ENEMIES_DESTROYED_BY__BLACK_HOLE_NODE.id,
    f.ENEMIES_DESTROYED_BY__CHAIN_LIGHTNING_NODE.id,
    f.ENEMIES_DESTROYED_BY__FLAME_BOT_NODE.id,
    f.ENEMIES_DESTROYED_BY__POISON_SWAMP_NODE.id,
    f.ENEMIES_DESTROYED_BY__PROJECTILES_NODE.id,
    f.ENEMIES_DESTROYED_BY__SMART_MISSILES_NODE.id,
    f.ENEMIES_DESTROYED_BY__OTHER_NODE.id,
    // killedWithEffectActive supplementary breakdown
    f.KILLED_WITH_EFFECT_ACTIVE__SPOTLIGHT_NODE.id,
    f.KILLED_WITH_EFFECT_ACTIVE__DEATH_WAVE_NODE.id,
    f.KILLED_WITH_EFFECT_ACTIVE__GOLDEN_BOT_NODE.id,
    f.KILLED_WITH_EFFECT_ACTIVE__GOLDEN_TOWER_NODE.id,
    f.KILLED_WITH_EFFECT_ACTIVE__AMPLIFY_BOT_NODE.id,
    f.KILLED_WITH_EFFECT_ACTIVE__DEATH_PENALTY_NODE.id,
    // Cross-section: also rendered as part of the killedWithEffectActive
    // breakdown despite belonging to section:totalEnemies (multi-section
    // membership in `../sections/sections.belongs-to-section.edges.ts`).
    f.TOTAL_ENEMIES__SUMMONED_ENEMIES_NODE.id,
  ]),
];
