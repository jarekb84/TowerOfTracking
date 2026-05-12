import { renamedFromEdge } from '../../../builders';
import type { Edge, Node } from '../../../types';
import * as f from '../../fields.nodes';
import { SCHEMA_V2_NODE, SCHEMA_V3_NODE } from '../../schemas.nodes';

// V2 clipboard display-form RENAMED_FROM edges.
//
// The in-game V2 clipboard export emits field labels as `Title Case With
// Spaces` (e.g. `'Battle Date'`, `'Coins From Black Hole'`). Per the Option-D
// resolver decisions, every recognized historical form of a field name is
// declared as an explicit edge — no procedural `toCamelCase` transform is
// applied at parser-boundary lookup time. This file holds the title-case
// twin for each camelCase legacy key declared in `renames.edges.ts`.
//
// Kept in a sibling file (not inlined into `renames.edges.ts`) so the
// primary edges file stays under the max-lines threshold. The aggregated
// `RENAME_EDGES` export concatenates this array onto the end.
//
// Field nodes are imported as `* as f` for the same compactness reasons as
// `renames.edges.ts`.

function rename(target: Node, legacyKey: string, atSchema: Node, reason = 'V2 clipboard display form'): Edge {
  return renamedFromEdge(target.id, {
    legacyKey,
    atSchema: atSchema.id,
    reason,
  });
}

// Note: `run_type` (snake_case) is not given a title-case form here because
// its title-case `'Run Type'` collides with `runType`'s title-case form
// (same canonical field, but `checkLegacyKeyUnique` rightly forbids any
// legacy key from being declared twice). The `runType` entry covers it.
//
// `coinsFromBlackhole` (lowercase-h spelling variant) and `taggedByDeathwave`
// (lowercase-w variant) are not given title-case forms here either — those
// are typo-fix entries, not legitimate display labels.

export const V2_DISPLAY_FORM_RENAMES: readonly Edge[] = [
  // ─── internal fields ──────────────────────────────────────────────────
  rename(f._DATE_NODE,     'Date',      SCHEMA_V2_NODE),
  rename(f._TIME_NODE,     'Time',      SCHEMA_V2_NODE),
  rename(f._NOTES_NODE,    'Notes',     SCHEMA_V2_NODE),
  rename(f._RUN_TYPE_NODE, 'Run Type',  SCHEMA_V2_NODE),
  rename(f._RANK_NODE,     'Rank',      SCHEMA_V2_NODE),
  rename(f._RANK_NODE,     'Placement', SCHEMA_V2_NODE),
  // ─── battleReport ─────────────────────────────────────────────────────
  rename(f.BATTLE_REPORT__BATTLE_DATE_NODE,    'Battle Date',    SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__TIER_NODE,           'Tier',           SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__WAVE_NODE,           'Wave',           SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__KILLED_BY_NODE,      'Killed By',      SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__GAME_TIME_NODE,      'Game Time',      SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__REAL_TIME_NODE,      'Real Time',      SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__COINS_EARNED_NODE,   'Coins Earned',   SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__COINS_PER_HOUR_NODE, 'Coins Per Hour', SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__CELLS_EARNED_NODE,   'Cells Earned',   SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__CELLS_PER_HOUR_NODE, 'Cells Per Hour', SCHEMA_V3_NODE),
  // ─── currencies ───────────────────────────────────────────────────────
  rename(f.CURRENCIES__AD_GEMS_NODE,               'Ad Gems',              SCHEMA_V3_NODE),
  rename(f.CURRENCIES__ARMOR_SHARDS_NODE,          'Armor Shards',         SCHEMA_V3_NODE),
  rename(f.CURRENCIES__CANNON_SHARDS_NODE,         'Cannon Shards',        SCHEMA_V3_NODE),
  rename(f.CURRENCIES__COMMON_MODULES_NODE,        'Common Modules',       SCHEMA_V3_NODE),
  rename(f.CURRENCIES__CORE_SHARDS_NODE,           'Core Shards',          SCHEMA_V3_NODE),
  rename(f.CURRENCIES__FETCH_GEMS_NODE,            'Fetch Gems',           SCHEMA_V3_NODE),
  rename(f.CURRENCIES__GEM_BLOCKS_TAPPED_NODE,     'Gem Blocks Tapped',    SCHEMA_V3_NODE),
  rename(f.CURRENCIES__GEMS_NODE,                  'Gems',                 SCHEMA_V3_NODE),
  rename(f.CURRENCIES__GENERATOR_SHARDS_NODE,      'Generator Shards',     SCHEMA_V3_NODE),
  rename(f.CURRENCIES__MEDALS_NODE,                'Medals',               SCHEMA_V3_NODE),
  rename(f.CURRENCIES__RARE_MODULES_NODE,          'Rare Modules',         SCHEMA_V3_NODE),
  rename(f.CURRENCIES__REROLL_SHARDS_EARNED_NODE,  'Reroll Shards',        SCHEMA_V3_NODE),
  rename(f.CURRENCIES__REROLL_SHARDS_EARNED_NODE,  'Reroll Shards Earned', SCHEMA_V3_NODE),
  rename(f.CURRENCIES__REROLL_SHARDS_FETCHED_NODE, 'Reroll Shards Fetched',SCHEMA_V3_NODE),
  // ─── cash ─────────────────────────────────────────────────────────────
  rename(f.CASH__CASH_EARNED_NODE,     'Cash Earned',            SCHEMA_V3_NODE),
  rename(f.CASH__GOLDEN_TOWER_NODE,    'Cash From Golden Tower', SCHEMA_V3_NODE),
  rename(f.CASH__INTEREST_EARNED_NODE, 'Interest Earned',        SCHEMA_V3_NODE),
  // ─── coins ────────────────────────────────────────────────────────────
  rename(f.COINS__BOUNTY_COINS_NODE,            'Bounty Coins',           SCHEMA_V3_NODE),
  rename(f.COINS__COIN_BONUS_UPGRADE_NODE,      'Coin Bonus Upgrade',     SCHEMA_V3_NODE),
  rename(f.COINS__COIN_BONUS_UPGRADE_NODE,      'Coins From Coin Upgrade',SCHEMA_V3_NODE),
  rename(f.COINS__COINS_FROM_COIN_BONUSES_NODE, 'Coins From Coin Bonuses',SCHEMA_V3_NODE),
  rename(f.COINS__COINS_WAVE_NODE,              'Coins Wave',             SCHEMA_V3_NODE),
  rename(f.COINS__COINS_FETCHED_NODE,           'Coins Fetched',          SCHEMA_V3_NODE),
  rename(f.COINS__BLACK_HOLE_NODE,              'Coins From Black Hole',  SCHEMA_V3_NODE),
  rename(f.COINS__DEATH_WAVE_NODE,              'Coins From Death Wave',  SCHEMA_V3_NODE),
  rename(f.COINS__GOLDEN_TOWER_NODE,            'Coins From Golden Tower',SCHEMA_V3_NODE),
  rename(f.COINS__ORBS_NODE,                    'Coins From Orb',         SCHEMA_V3_NODE),
  rename(f.COINS__ORBS_NODE,                    'Coins From Orbs',        SCHEMA_V3_NODE),
  rename(f.COINS__SPOTLIGHT_NODE,               'Coins From Spotlight',   SCHEMA_V3_NODE),
  rename(f.COINS__CRITICAL_COIN_NODE,           'Critical Coin',          SCHEMA_V3_NODE),
  rename(f.COINS__GOLDEN_BOT_NODE,              'Golden Bot Coins Earned',SCHEMA_V3_NODE),
  rename(f.COINS__GOLDEN_COMBO_NODE,            'Golden Combo',           SCHEMA_V3_NODE),
  rename(f.COINS__WAVE_SKIP_NODE,               'Wave Skip',              SCHEMA_V3_NODE),
  // ─── damage ───────────────────────────────────────────────────────────
  rename(f.DAMAGE__DAMAGE_DEALT_NODE,    'Damage',                SCHEMA_V3_NODE),
  rename(f.DAMAGE__DAMAGE_DEALT_NODE,    'Damage Dealt',          SCHEMA_V3_NODE),
  rename(f.DAMAGE__PROJECTILES_NODE,     'Projectiles Damage',    SCHEMA_V3_NODE),
  rename(f.DAMAGE__REND_ARMOR_NODE,      'Rend Armor Damage',     SCHEMA_V3_NODE),
  rename(f.DAMAGE__REND_ARMOR_NODE,      'Rend Armor',            SCHEMA_V3_NODE),
  rename(f.DAMAGE__DEATH_RAY_NODE,       'Death Ray Damage',      SCHEMA_V3_NODE),
  rename(f.DAMAGE__THORNS_NODE,          'Thorn Damage',          SCHEMA_V3_NODE),
  rename(f.DAMAGE__ORBS_NODE,            'Orb Damage',            SCHEMA_V3_NODE),
  rename(f.DAMAGE__LAND_MINES_NODE,      'Land Mine Damage',      SCHEMA_V3_NODE),
  rename(f.DAMAGE__INNER_LAND_MINES_NODE,'Inner Land Mine Damage',SCHEMA_V3_NODE),
  rename(f.DAMAGE__CHAIN_LIGHTNING_NODE, 'Chain Lightning Damage',SCHEMA_V3_NODE),
  rename(f.DAMAGE__SMART_MISSILES_NODE,  'Smart Missile Damage',  SCHEMA_V3_NODE),
  rename(f.DAMAGE__BLACK_HOLE_NODE,      'Black Hole Damage',     SCHEMA_V3_NODE),
  rename(f.DAMAGE__POISON_SWAMP_NODE,    'Swamp Damage',          SCHEMA_V3_NODE),
  rename(f.DAMAGE__ELECTRONS_NODE,       'Electrons Damage',      SCHEMA_V3_NODE),
  rename(f.DAMAGE__ELECTRONS_NODE,       'Electrons',             SCHEMA_V3_NODE),
  rename(f.DAMAGE__FLAME_BOT_NODE,       'Flame Bot Damage',      SCHEMA_V3_NODE),
  rename(f.DAMAGE__DEATH_WAVE_NODE,      'Death Wave Damage',     SCHEMA_V3_NODE),
  // ─── damageBlocked ────────────────────────────────────────────────────
  rename(f.DAMAGE_BLOCKED__DEFENSE_NODE,                 'Defense',                SCHEMA_V3_NODE),
  rename(f.DAMAGE_BLOCKED__DEFENSE_ABSOLUTE_NODE,        'Defense Absolute',       SCHEMA_V3_NODE),
  rename(f.DAMAGE_BLOCKED__CHRONO_FIELD_NODE,            'Chrono Field',           SCHEMA_V3_NODE),
  rename(f.DAMAGE_BLOCKED__CHAIN_THUNDER_NODE,           'Chain Thunder',          SCHEMA_V3_NODE),
  rename(f.DAMAGE_BLOCKED__PRIMORDIAL_COLLAPSE_NODE,     'Primordial Collapse',    SCHEMA_V3_NODE),
  rename(f.DAMAGE_BLOCKED__NEGATIVE_MASS_PROJECTOR_NODE, 'Negative Mass Projector',SCHEMA_V3_NODE),
  // ─── damageTaken ──────────────────────────────────────────────────────
  rename(f.DAMAGE_TAKEN__TOWER_NODE, 'Tower',             SCHEMA_V3_NODE),
  rename(f.DAMAGE_TAKEN__WALL_NODE,  'Wall',              SCHEMA_V3_NODE),
  rename(f.DAMAGE_TAKEN__WALL_NODE,  'Damage Taken Wall', SCHEMA_V3_NODE),
  // ─── healthRegenerated ────────────────────────────────────────────────
  rename(f.HEALTH_REGENERATED__LIFESTEAL_NODE,          'Lifesteal',         SCHEMA_V3_NODE),
  rename(f.HEALTH_REGENERATED__TOWER_HEALTH_REGEN_NODE, 'Tower Health Regen',SCHEMA_V3_NODE),
  rename(f.HEALTH_REGENERATED__WALL_HEALTH_REGEN_NODE,  'Wall Health Regen', SCHEMA_V3_NODE),
  // ─── bonusHealthGained ────────────────────────────────────────────────
  rename(f.BONUS_HEALTH_GAINED__FROM_DEATH_WAVE_NODE, 'From Death Wave',   SCHEMA_V3_NODE),
  rename(f.BONUS_HEALTH_GAINED__FROM_DEATH_WAVE_NODE, 'Hp From Death Wave',SCHEMA_V3_NODE),
  // ─── enemiesHitBy ─────────────────────────────────────────────────────
  rename(f.ENEMIES_HIT_BY__ATTACK_CHIP_NODE,      'Attack Chip',        SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__BLACK_HOLE_NODE,       'Black Hole',         SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__CHAIN_LIGHTNING_NODE,  'Chain Lightning',    SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__DEATH_RAY_NODE,        'Death Ray',          SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__DEATH_WAVE_NODE,       'Death Wave',         SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__FLAME_BOT_NODE,        'Flame Bot',          SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__INNER_LAND_MINES_NODE, 'Inner Land Mines',   SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__LAND_MINES_NODE,       'Land Mines',         SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__ORBITAL_AUGMENT_NODE,  'Orbital Augment',    SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__ORBS_NODE,             'Orbs',               SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__ORBS_NODE,             'Enemies Hit By Orbs',SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__ORBS_NODE,             'Orb Hits',           SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__POISON_SWAMP_NODE,     'Poison Swamp',       SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__PROJECTILES_NODE,      'Projectiles',        SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__SMART_MISSILES_NODE,   'Smart Missiles',     SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__THORNS_NODE,           'Thorns',             SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__THUNDER_BOT_NODE,      'Thunder Bot',        SCHEMA_V3_NODE),
  // ─── enemiesDestroyedBy ───────────────────────────────────────────────
  rename(f.ENEMIES_DESTROYED_BY__DEATH_RAY_NODE,  'Destroyed By Death Ray', SCHEMA_V3_NODE),
  rename(f.ENEMIES_DESTROYED_BY__LAND_MINES_NODE, 'Destroyed By Land Mine', SCHEMA_V3_NODE),
  rename(f.ENEMIES_DESTROYED_BY__ORBS_NODE,       'Destroyed By Orbs',      SCHEMA_V3_NODE),
  rename(f.ENEMIES_DESTROYED_BY__THORNS_NODE,     'Destroyed By Thorns',    SCHEMA_V3_NODE),
  rename(f.ENEMIES_DESTROYED_BY__OTHER_NODE,      'Other',                  SCHEMA_V3_NODE),
  // ─── killedWithEffectActive ───────────────────────────────────────────
  rename(f.KILLED_WITH_EFFECT_ACTIVE__AMPLIFY_BOT_NODE,   'Amplify Bot',           SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__DEATH_PENALTY_NODE, 'Death Penalty',         SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__DEATH_WAVE_NODE,    'Tagged By Death Wave',  SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__GOLDEN_BOT_NODE,    'Golden Bot',            SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__GOLDEN_BOT_NODE,    'Destroyed In Golden Bot',SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__GOLDEN_TOWER_NODE,  'Golden Tower',          SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__SPOTLIGHT_NODE,     'Spotlight',             SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__SPOTLIGHT_NODE,     'Destroyed In Spotlight',SCHEMA_V3_NODE),
  // ─── counts ───────────────────────────────────────────────────────────
  rename(f.COUNTS__DEATH_DEFY_NODE,                    'Death Defy',                  SCHEMA_V3_NODE),
  rename(f.COUNTS__DEMON_MODE_NODE,                    'Demon Mode',                  SCHEMA_V3_NODE),
  rename(f.COUNTS__HITS_ABSORBED_BY_ENERGY_SHIELD_NODE,'Hits Absorbed By Energy Shield',SCHEMA_V3_NODE),
  rename(f.COUNTS__LAND_MINES_SPAWNED_NODE,            'Land Mines Spawned',          SCHEMA_V3_NODE),
  rename(f.COUNTS__NUKE_NODE,                          'Nuke',                        SCHEMA_V3_NODE),
  rename(f.COUNTS__PROJECTILES_COUNT_NODE,             'Projectiles Count',           SCHEMA_V3_NODE),
  rename(f.COUNTS__SECOND_WIND_NODE,                   'Second Wind',                 SCHEMA_V3_NODE),
  rename(f.COUNTS__THUNDER_BOT_STUNS_NODE,             'Thunder Bot Stuns',           SCHEMA_V3_NODE),
  rename(f.COUNTS__WAVES_SKIPPED_NODE,                 'Waves Skipped',               SCHEMA_V3_NODE),
  // ─── utility ──────────────────────────────────────────────────────────
  rename(f.UTILITY__ENEMY_ATTACK_LEVELS_SKIPPED_NODE,'Enemy Attack Levels Skipped',SCHEMA_V3_NODE),
  rename(f.UTILITY__ENEMY_HEALTH_LEVELS_SKIPPED_NODE,'Enemy Health Levels Skipped',SCHEMA_V3_NODE),
  rename(f.UTILITY__FREE_ATTACK_UPGRADE_NODE,        'Free Attack Upgrade',        SCHEMA_V3_NODE),
  rename(f.UTILITY__FREE_DEFENSE_UPGRADE_NODE,       'Free Defense Upgrade',       SCHEMA_V3_NODE),
  rename(f.UTILITY__FREE_UTILITY_UPGRADE_NODE,       'Free Utility Upgrade',       SCHEMA_V3_NODE),
  rename(f.UTILITY__RECOVERY_PACKAGES_NODE,          'Recovery Packages',          SCHEMA_V3_NODE),
  // ─── records ──────────────────────────────────────────────────────────
  rename(f.RECORDS__HIGHEST_COINS_MINUTE_NODE,         'Highest Coins Minute',         SCHEMA_V3_NODE),
  rename(f.RECORDS__LARGEST_GOLDEN_COMBO_NODE,         'Largest Golden Combo',         SCHEMA_V3_NODE),
  rename(f.RECORDS__LARGEST_INNER_LANDMINE_CHARGE_NODE,'Largest Inner Landmine Charge',SCHEMA_V3_NODE),
  rename(f.RECORDS__LARGEST_SMART_MISSILE_STACK_NODE,  'Largest Smart Missile Stack',  SCHEMA_V3_NODE),
  rename(f.RECORDS__LARGEST_WAVE_SKIP_NODE,            'Largest Wave Skip',            SCHEMA_V3_NODE),
  rename(f.RECORDS__MOST_CELLS_FROM_WAVE_SKIP_NODE,    'Most Cells From Wave Skip',    SCHEMA_V3_NODE),
  rename(f.RECORDS__MOST_COINS_FROM_GOLDEN_COMBO_NODE, 'Most Coins From Golden Combo', SCHEMA_V3_NODE),
  rename(f.RECORDS__MOST_COINS_FROM_WAVE_SKIP_NODE,    'Most Coins From Wave Skip',    SCHEMA_V3_NODE),
  // ─── totalEnemies ─────────────────────────────────────────────────────
  rename(f.TOTAL_ENEMIES__BASIC_NODE,            'Basic',           SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__BOSS_NODE,             'Boss',            SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__COMMANDER_NODE,        'Commander',       SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__COMMANDER_NODE,        'Commanders',      SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__FAST_NODE,             'Fast',            SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__OVERCHARGE_NODE,       'Overcharge',      SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__OVERCHARGE_NODE,       'Overcharges',     SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__PROTECTOR_NODE,        'Protector',       SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__RANGED_NODE,           'Ranged',          SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__RAYS_NODE,             'Rays',            SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__SABOTEUR_NODE,         'Saboteur',        SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__SABOTEUR_NODE,         'Saboteurs',       SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__SCATTERS_NODE,         'Scatters',        SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__SUMMONED_ENEMIES_NODE, 'Summoned Enemies',SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__TANK_NODE,             'Tank',            SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__TOTAL_ENEMIES_NODE,    'Total Enemies',   SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__VAMPIRES_NODE,         'Vampires',        SCHEMA_V3_NODE),
];
