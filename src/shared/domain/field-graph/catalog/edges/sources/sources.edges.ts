import { edge } from '../../../builders';
import type { Edge } from '../../../types';
import * as f from '../../fields.nodes';

// `IS_SOURCE_OF` declarations: each breakdown source field sums into its
// total. Three sum-to-total breakdowns are modeled here:
//   - 14 coin sources       → battleReport_coinsEarned
//   - 16 damage sources     → damage_damageDealt
//   - 12 enemy-type sources → totalEnemies_totalEnemies
//
// Supplementary breakdowns (enemiesHitBy / enemiesDestroyedBy /
// killedWithEffectActive) use the IS_MEASURED_AGAINST edge type instead and
// live in their own concept folder at `catalog/edges/measurements/`.
//
// Display names and colors for every source field — including the
// supplementary-breakdown sources — live in
// `catalog/edges/presentation/presentation.edges.ts`.

function sourcesOfTotal(totalId: string, sourceIds: readonly string[]): readonly Edge[] {
  return sourceIds.map((sourceId) => edge(sourceId, 'IS_SOURCE_OF', totalId));
}

export const SOURCE_EDGES: readonly Edge[] = [
  ...sourcesOfTotal(f.BATTLE_REPORT__COINS_EARNED_NODE.id, [
    f.COINS__DEATH_WAVE_NODE.id,
    f.COINS__GOLDEN_TOWER_NODE.id,
    f.COINS__SPOTLIGHT_NODE.id,
    f.COINS__GOLDEN_BOT_NODE.id,
    f.COINS__COINS_FETCHED_NODE.id,
    f.COINS__BLACK_HOLE_NODE.id,
    f.COINS__COIN_BONUS_UPGRADE_NODE.id,
    f.COINS__COINS_FROM_COIN_BONUSES_NODE.id,
    f.COINS__ORBS_NODE.id,
    f.COINS__GOLDEN_COMBO_NODE.id,
    f.COINS__BOUNTY_COINS_NODE.id,
    f.COINS__CRITICAL_COIN_NODE.id,
    f.COINS__WAVE_SKIP_NODE.id,
    f.COINS__COINS_WAVE_NODE.id,
  ]),
  ...sourcesOfTotal(f.DAMAGE__DAMAGE_DEALT_NODE.id, [
    f.DAMAGE__DEATH_WAVE_NODE.id,
    f.DAMAGE__CHAIN_LIGHTNING_NODE.id,
    f.DAMAGE__THORNS_NODE.id,
    f.DAMAGE__ORBS_NODE.id,
    f.DAMAGE__FLAME_BOT_NODE.id,
    f.DAMAGE__LAND_MINES_NODE.id,
    f.DAMAGE__DEATH_RAY_NODE.id,
    f.DAMAGE__SMART_MISSILES_NODE.id,
    f.DAMAGE__INNER_LAND_MINES_NODE.id,
    f.DAMAGE__POISON_SWAMP_NODE.id,
    f.DAMAGE__BLACK_HOLE_NODE.id,
    f.DAMAGE__ELECTRONS_NODE.id,
    f.DAMAGE__PROJECTILES_NODE.id,
    f.DAMAGE__REND_ARMOR_NODE.id,
    f.DAMAGE__ATTACK_CHIP_NODE.id,
    f.HEALTH_REGENERATED__LIFESTEAL_NODE.id,
  ]),
  ...sourcesOfTotal(f.TOTAL_ENEMIES__TOTAL_ENEMIES_NODE.id, [
    f.TOTAL_ENEMIES__BASIC_NODE.id,
    f.TOTAL_ENEMIES__FAST_NODE.id,
    f.TOTAL_ENEMIES__TANK_NODE.id,
    f.TOTAL_ENEMIES__RANGED_NODE.id,
    f.TOTAL_ENEMIES__BOSS_NODE.id,
    f.TOTAL_ENEMIES__PROTECTOR_NODE.id,
    f.TOTAL_ENEMIES__VAMPIRES_NODE.id,
    f.TOTAL_ENEMIES__RAYS_NODE.id,
    f.TOTAL_ENEMIES__SCATTERS_NODE.id,
    f.TOTAL_ENEMIES__SABOTEUR_NODE.id,
    f.TOTAL_ENEMIES__COMMANDER_NODE.id,
    f.TOTAL_ENEMIES__OVERCHARGE_NODE.id,
  ]),
];
