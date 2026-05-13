import { renamedFromEdge } from '../../../builders';
import type { Edge, Node } from '../../../types';
import * as f from '../../fields.nodes';
import { SCHEMA_V2_NODE, SCHEMA_V3_NODE } from '../../schemas.nodes';
import { V2_DISPLAY_FORM_RENAMES } from './renames.v2-display-forms.edges';

// RENAMED_FROM edges. Each declaration says: "this canonical Field node was
// historically known by this legacy key, as of this storage schema."
//
// Two waves of historical renames live here:
//
//   1. Internal app-fields (atSchema = schema:v2): the V1 → V2 storage rename
//      where the app adopted the underscore-prefixed convention for its
//      metadata fields (`date` → `_date`, `runType` → `_runType`, ...). This
//      is an app-refactor-driven rename — schema:v2 carries no `gameVersion`
//      payload, so consumers can distinguish it from game-driven renames.
//
//   2. Game fields (atSchema = schema:v3): the V2 → V3 storage rename where
//      the app section-prefixed every game field to disambiguate the V28
//      sectionized export (`tier` → `battleReport_tier`, `blackHole` →
//      `damage_blackHole`, ...). This is game-version-driven — schema:v3
//      carries `gameVersion: 'V28'`.
//
// In addition, every recognized historical form of a field name is declared
// as an explicit edge — including the `Title Case With Spaces` clipboard
// display labels emitted by the in-game V2 paste flow. Those title-case
// twins live in the sibling `renames.v2-display-forms.edges.ts` file
// (split out to keep this primary edges file under the max-lines threshold)
// and are concatenated onto the end of `RENAME_EDGES`.
//
// The graph engine builds a legacy-key reverse index from these payloads at
// load time. Parser-boundary lookups call `resolveFieldByAnyKey(rawKey)` and
// the engine resolves direct hits + reverse-index hits to a single canonical
// Node. Build-time invariants enforce that every legacy key is unique across
// all fields and that no legacy key collides with a declared node id.
//
// Field nodes are imported as `* as f` to keep this large declaration file
// under the project's max-lines threshold. The cost is one extra `f.` prefix
// per row; the win is a single import line vs ~140 named imports.

function rename(target: Node, legacyKey: string, atSchema: Node, reason?: string): Edge {
  return renamedFromEdge(target.id, {
    legacyKey,
    atSchema: atSchema.id,
    ...(reason ? { reason } : {}),
  });
}

// V1 → V2 internal-field renames (app-refactor; schema:v2 has no gameVersion).
const INTERNAL_FIELD_RENAMES_V1_TO_V2: readonly Edge[] = [
  rename(f._DATE_NODE,     'date',      SCHEMA_V2_NODE),
  rename(f._TIME_NODE,     'time',      SCHEMA_V2_NODE),
  rename(f._NOTES_NODE,    'notes',     SCHEMA_V2_NODE),
  rename(f._RUN_TYPE_NODE, 'runType',   SCHEMA_V2_NODE),
  rename(f._RUN_TYPE_NODE, 'run_type',  SCHEMA_V2_NODE, 'snake_case spelling variant'),
  rename(f._RANK_NODE,     'rank',      SCHEMA_V2_NODE),
  rename(f._RANK_NODE,     'placement', SCHEMA_V2_NODE, 'V1 alternate label'),
];

// V2 → V3 game-field renames (V28 sectionizing; schema:v3 has gameVersion='V28').
const GAME_FIELD_RENAMES_V2_TO_V3: readonly Edge[] = [
  // ─── battleReport ─────────────────────────────────────────────────────
  rename(f.BATTLE_REPORT__BATTLE_DATE_NODE,    'battleDate',    SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__TIER_NODE,           'tier',          SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__WAVE_NODE,           'wave',          SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__KILLED_BY_NODE,      'killedBy',      SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__GAME_TIME_NODE,      'gameTime',      SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__REAL_TIME_NODE,      'realTime',      SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__COINS_EARNED_NODE,   'coinsEarned',   SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__COINS_PER_HOUR_NODE, 'coinsPerHour',  SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__CELLS_EARNED_NODE,   'cellsEarned',   SCHEMA_V3_NODE),
  rename(f.BATTLE_REPORT__CELLS_PER_HOUR_NODE, 'cellsPerHour',  SCHEMA_V3_NODE),
  // ─── currencies ───────────────────────────────────────────────────────
  rename(f.CURRENCIES__AD_GEMS_NODE,               'adGems',              SCHEMA_V3_NODE),
  rename(f.CURRENCIES__ARMOR_SHARDS_NODE,          'armorShards',         SCHEMA_V3_NODE),
  rename(f.CURRENCIES__CANNON_SHARDS_NODE,         'cannonShards',        SCHEMA_V3_NODE),
  rename(f.CURRENCIES__COMMON_MODULES_NODE,        'commonModules',       SCHEMA_V3_NODE),
  rename(f.CURRENCIES__CORE_SHARDS_NODE,           'coreShards',          SCHEMA_V3_NODE),
  rename(f.CURRENCIES__FETCH_GEMS_NODE,            'fetchGems',           SCHEMA_V3_NODE),
  rename(f.CURRENCIES__GEM_BLOCKS_TAPPED_NODE,     'gemBlocksTapped',     SCHEMA_V3_NODE),
  rename(f.CURRENCIES__GEMS_NODE,                  'gems',                SCHEMA_V3_NODE),
  rename(f.CURRENCIES__GENERATOR_SHARDS_NODE,      'generatorShards',     SCHEMA_V3_NODE),
  rename(f.CURRENCIES__MEDALS_NODE,                'medals',              SCHEMA_V3_NODE),
  rename(f.CURRENCIES__RARE_MODULES_NODE,          'rareModules',         SCHEMA_V3_NODE),
  rename(f.CURRENCIES__REROLL_SHARDS_EARNED_NODE,  'rerollShards',        SCHEMA_V3_NODE, 'V2 pre-v27 legacy; later split into earned/fetched'),
  rename(f.CURRENCIES__REROLL_SHARDS_EARNED_NODE,  'rerollShardsEarned',  SCHEMA_V3_NODE),
  rename(f.CURRENCIES__REROLL_SHARDS_FETCHED_NODE, 'rerollShardsFetched', SCHEMA_V3_NODE),
  // ─── cash ─────────────────────────────────────────────────────────────
  rename(f.CASH__CASH_EARNED_NODE,     'cashEarned',          SCHEMA_V3_NODE),
  rename(f.CASH__GOLDEN_TOWER_NODE,    'cashFromGoldenTower', SCHEMA_V3_NODE),
  rename(f.CASH__INTEREST_EARNED_NODE, 'interestEarned',      SCHEMA_V3_NODE),
  // ─── coins ────────────────────────────────────────────────────────────
  rename(f.COINS__BOUNTY_COINS_NODE,           'bountyCoins',          SCHEMA_V3_NODE),
  rename(f.COINS__COIN_BONUS_UPGRADE_NODE,     'coinBonusUpgrade',     SCHEMA_V3_NODE),
  rename(f.COINS__COIN_BONUS_UPGRADE_NODE,     'coinsFromCoinUpgrade', SCHEMA_V3_NODE, 'legacy alias'),
  rename(f.COINS__COINS_FROM_COIN_BONUSES_NODE,'coinsFromCoinBonuses', SCHEMA_V3_NODE),
  rename(f.COINS__COINS_WAVE_NODE,             'coinsWave',            SCHEMA_V3_NODE),
  rename(f.COINS__COINS_FETCHED_NODE,          'coinsFetched',         SCHEMA_V3_NODE),
  rename(f.COINS__BLACK_HOLE_NODE,             'coinsFromBlackHole',   SCHEMA_V3_NODE),
  rename(f.COINS__BLACK_HOLE_NODE,             'coinsFromBlackhole',   SCHEMA_V3_NODE, 'lowercase-h spelling variant'),
  rename(f.COINS__DEATH_WAVE_NODE,             'coinsFromDeathWave',   SCHEMA_V3_NODE),
  rename(f.COINS__GOLDEN_TOWER_NODE,           'coinsFromGoldenTower', SCHEMA_V3_NODE),
  rename(f.COINS__ORBS_NODE,                   'coinsFromOrb',         SCHEMA_V3_NODE, 'singular legacy spelling'),
  rename(f.COINS__ORBS_NODE,                   'coinsFromOrbs',        SCHEMA_V3_NODE),
  rename(f.COINS__SPOTLIGHT_NODE,              'coinsFromSpotlight',   SCHEMA_V3_NODE),
  rename(f.COINS__CRITICAL_COIN_NODE,          'criticalCoin',         SCHEMA_V3_NODE),
  rename(f.COINS__GOLDEN_BOT_NODE,             'goldenBotCoinsEarned', SCHEMA_V3_NODE),
  rename(f.COINS__GOLDEN_COMBO_NODE,           'goldenCombo',          SCHEMA_V3_NODE),
  rename(f.COINS__WAVE_SKIP_NODE,              'waveSkip',             SCHEMA_V3_NODE),
  // ─── damage ───────────────────────────────────────────────────────────
  rename(f.DAMAGE__DAMAGE_DEALT_NODE,    'damage',                SCHEMA_V3_NODE, 'legacy alias; same metric as damageDealt'),
  rename(f.DAMAGE__DAMAGE_DEALT_NODE,    'damageDealt',           SCHEMA_V3_NODE),
  rename(f.DAMAGE__PROJECTILES_NODE,     'projectilesDamage',     SCHEMA_V3_NODE),
  rename(f.DAMAGE__REND_ARMOR_NODE,      'rendArmorDamage',       SCHEMA_V3_NODE),
  rename(f.DAMAGE__REND_ARMOR_NODE,      'rendArmor',             SCHEMA_V3_NODE, 'V2 bare; V28 has no enemiesHitBy_rendArmor'),
  rename(f.DAMAGE__DEATH_RAY_NODE,       'deathRayDamage',        SCHEMA_V3_NODE),
  rename(f.DAMAGE__THORNS_NODE,          'thornDamage',           SCHEMA_V3_NODE),
  rename(f.DAMAGE__ORBS_NODE,            'orbDamage',             SCHEMA_V3_NODE),
  rename(f.DAMAGE__LAND_MINES_NODE,      'landMineDamage',        SCHEMA_V3_NODE),
  rename(f.DAMAGE__INNER_LAND_MINES_NODE,'innerLandMineDamage',   SCHEMA_V3_NODE),
  rename(f.DAMAGE__CHAIN_LIGHTNING_NODE, 'chainLightningDamage',  SCHEMA_V3_NODE),
  rename(f.DAMAGE__SMART_MISSILES_NODE,  'smartMissileDamage',    SCHEMA_V3_NODE),
  rename(f.DAMAGE__BLACK_HOLE_NODE,      'blackHoleDamage',       SCHEMA_V3_NODE),
  rename(f.DAMAGE__POISON_SWAMP_NODE,    'swampDamage',           SCHEMA_V3_NODE),
  rename(f.DAMAGE__ELECTRONS_NODE,       'electronsDamage',       SCHEMA_V3_NODE),
  rename(f.DAMAGE__ELECTRONS_NODE,       'electrons',             SCHEMA_V3_NODE, 'V2 bare; V28 has no enemiesHitBy_electrons'),
  rename(f.DAMAGE__FLAME_BOT_NODE,       'flameBotDamage',        SCHEMA_V3_NODE),
  rename(f.DAMAGE__DEATH_WAVE_NODE,      'deathWaveDamage',       SCHEMA_V3_NODE),
  // ─── damageBlocked ────────────────────────────────────────────────────
  rename(f.DAMAGE_BLOCKED__DEFENSE_NODE,                 'defense',               SCHEMA_V3_NODE),
  rename(f.DAMAGE_BLOCKED__DEFENSE_ABSOLUTE_NODE,        'defenseAbsolute',       SCHEMA_V3_NODE),
  rename(f.DAMAGE_BLOCKED__CHRONO_FIELD_NODE,            'chronoField',           SCHEMA_V3_NODE),
  rename(f.DAMAGE_BLOCKED__CHAIN_THUNDER_NODE,           'chainThunder',          SCHEMA_V3_NODE),
  rename(f.DAMAGE_BLOCKED__PRIMORDIAL_COLLAPSE_NODE,     'primordialCollapse',    SCHEMA_V3_NODE),
  rename(f.DAMAGE_BLOCKED__NEGATIVE_MASS_PROJECTOR_NODE, 'negativeMassProjector', SCHEMA_V3_NODE),
  // ─── damageTaken ──────────────────────────────────────────────────────
  rename(f.DAMAGE_TAKEN__TOWER_NODE, 'tower',           SCHEMA_V3_NODE),
  rename(f.DAMAGE_TAKEN__WALL_NODE,  'wall',            SCHEMA_V3_NODE),
  rename(f.DAMAGE_TAKEN__WALL_NODE,  'damageTakenWall', SCHEMA_V3_NODE, 'legacy alias'),
  // ─── healthRegenerated ────────────────────────────────────────────────
  rename(f.HEALTH_REGENERATED__LIFESTEAL_NODE,          'lifesteal',         SCHEMA_V3_NODE),
  rename(f.HEALTH_REGENERATED__TOWER_HEALTH_REGEN_NODE, 'towerHealthRegen',  SCHEMA_V3_NODE),
  rename(f.HEALTH_REGENERATED__WALL_HEALTH_REGEN_NODE,  'wallHealthRegen',   SCHEMA_V3_NODE),
  // ─── bonusHealthGained ────────────────────────────────────────────────
  rename(f.BONUS_HEALTH_GAINED__FROM_DEATH_WAVE_NODE, 'fromDeathWave',   SCHEMA_V3_NODE),
  rename(f.BONUS_HEALTH_GAINED__FROM_DEATH_WAVE_NODE, 'hpFromDeathWave', SCHEMA_V3_NODE, 'duplicate legacy name'),
  // ─── enemiesHitBy ─────────────────────────────────────────────────────
  rename(f.ENEMIES_HIT_BY__ATTACK_CHIP_NODE,      'attackChip',       SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__BLACK_HOLE_NODE,       'blackHole',        SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__CHAIN_LIGHTNING_NODE,  'chainLightning',   SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__DEATH_RAY_NODE,        'deathRay',         SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__DEATH_WAVE_NODE,       'deathWave',        SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__FLAME_BOT_NODE,        'flameBot',         SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__INNER_LAND_MINES_NODE, 'innerLandMines',   SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__LAND_MINES_NODE,       'landMines',        SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__ORBITAL_AUGMENT_NODE,  'orbitalAugment',   SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__ORBS_NODE,             'orbs',             SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__ORBS_NODE,             'enemiesHitByOrbs', SCHEMA_V3_NODE, 'duplicate legacy spelling'),
  rename(f.ENEMIES_HIT_BY__ORBS_NODE,             'orbHits',          SCHEMA_V3_NODE, 'duplicate legacy spelling'),
  rename(f.ENEMIES_HIT_BY__POISON_SWAMP_NODE,     'poisonSwamp',      SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__PROJECTILES_NODE,      'projectiles',      SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__SMART_MISSILES_NODE,   'smartMissiles',    SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__THORNS_NODE,           'thorns',           SCHEMA_V3_NODE),
  rename(f.ENEMIES_HIT_BY__THUNDER_BOT_NODE,      'thunderBot',       SCHEMA_V3_NODE),
  // ─── enemiesDestroyedBy ───────────────────────────────────────────────
  rename(f.ENEMIES_DESTROYED_BY__DEATH_RAY_NODE,  'destroyedByDeathRay', SCHEMA_V3_NODE),
  rename(f.ENEMIES_DESTROYED_BY__LAND_MINES_NODE, 'destroyedByLandMine', SCHEMA_V3_NODE),
  rename(f.ENEMIES_DESTROYED_BY__ORBS_NODE,       'destroyedByOrbs',     SCHEMA_V3_NODE),
  rename(f.ENEMIES_DESTROYED_BY__THORNS_NODE,     'destroyedByThorns',   SCHEMA_V3_NODE),
  rename(f.ENEMIES_DESTROYED_BY__OTHER_NODE,      'other',               SCHEMA_V3_NODE),
  // ─── killedWithEffectActive ───────────────────────────────────────────
  rename(f.KILLED_WITH_EFFECT_ACTIVE__AMPLIFY_BOT_NODE,   'amplifyBot',           SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__DEATH_PENALTY_NODE, 'deathPenalty',         SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__DEATH_WAVE_NODE,    'taggedByDeathWave',    SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__DEATH_WAVE_NODE,    'taggedByDeathwave',    SCHEMA_V3_NODE, 'lowercase-w variant'),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__GOLDEN_BOT_NODE,    'goldenBot',            SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__GOLDEN_BOT_NODE,    'destroyedInGoldenBot', SCHEMA_V3_NODE, 'legacy alt name'),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__GOLDEN_TOWER_NODE,  'goldenTower',          SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__SPOTLIGHT_NODE,     'spotlight',            SCHEMA_V3_NODE),
  rename(f.KILLED_WITH_EFFECT_ACTIVE__SPOTLIGHT_NODE,     'destroyedInSpotlight', SCHEMA_V3_NODE, 'legacy alt name'),
  // ─── counts ───────────────────────────────────────────────────────────
  rename(f.COUNTS__DEATH_DEFY_NODE,                    'deathDefy',                  SCHEMA_V3_NODE),
  rename(f.COUNTS__DEMON_MODE_NODE,                    'demonMode',                  SCHEMA_V3_NODE),
  rename(f.COUNTS__HITS_ABSORBED_BY_ENERGY_SHIELD_NODE,'hitsAbsorbedByEnergyShield', SCHEMA_V3_NODE),
  rename(f.COUNTS__LAND_MINES_SPAWNED_NODE,            'landMinesSpawned',           SCHEMA_V3_NODE),
  rename(f.COUNTS__NUKE_NODE,                          'nuke',                       SCHEMA_V3_NODE),
  rename(f.COUNTS__PROJECTILES_COUNT_NODE,             'projectilesCount',           SCHEMA_V3_NODE),
  rename(f.COUNTS__SECOND_WIND_NODE,                   'secondWind',                 SCHEMA_V3_NODE),
  rename(f.COUNTS__THUNDER_BOT_STUNS_NODE,             'thunderBotStuns',            SCHEMA_V3_NODE),
  rename(f.COUNTS__WAVES_SKIPPED_NODE,                 'wavesSkipped',               SCHEMA_V3_NODE),
  // ─── utility ──────────────────────────────────────────────────────────
  rename(f.UTILITY__ENEMY_ATTACK_LEVELS_SKIPPED_NODE,'enemyAttackLevelsSkipped',  SCHEMA_V3_NODE),
  rename(f.UTILITY__ENEMY_HEALTH_LEVELS_SKIPPED_NODE,'enemyHealthLevelsSkipped',  SCHEMA_V3_NODE),
  rename(f.UTILITY__FREE_ATTACK_UPGRADE_NODE,        'freeAttackUpgrade',         SCHEMA_V3_NODE),
  rename(f.UTILITY__FREE_DEFENSE_UPGRADE_NODE,       'freeDefenseUpgrade',        SCHEMA_V3_NODE),
  rename(f.UTILITY__FREE_UTILITY_UPGRADE_NODE,       'freeUtilityUpgrade',        SCHEMA_V3_NODE),
  rename(f.UTILITY__RECOVERY_PACKAGES_NODE,          'recoveryPackages',          SCHEMA_V3_NODE),
  // ─── records ──────────────────────────────────────────────────────────
  rename(f.RECORDS__HIGHEST_COINS_MINUTE_NODE,         'highestCoinsMinute',         SCHEMA_V3_NODE),
  rename(f.RECORDS__LARGEST_GOLDEN_COMBO_NODE,         'largestGoldenCombo',         SCHEMA_V3_NODE),
  rename(f.RECORDS__LARGEST_INNER_LANDMINE_CHARGE_NODE,'largestInnerLandmineCharge', SCHEMA_V3_NODE),
  rename(f.RECORDS__LARGEST_SMART_MISSILE_STACK_NODE,  'largestSmartMissileStack',   SCHEMA_V3_NODE),
  rename(f.RECORDS__LARGEST_WAVE_SKIP_NODE,            'largestWaveSkip',            SCHEMA_V3_NODE),
  rename(f.RECORDS__MOST_CELLS_FROM_WAVE_SKIP_NODE,    'mostCellsFromWaveSkip',      SCHEMA_V3_NODE),
  rename(f.RECORDS__MOST_COINS_FROM_GOLDEN_COMBO_NODE, 'mostCoinsFromGoldenCombo',   SCHEMA_V3_NODE),
  rename(f.RECORDS__MOST_COINS_FROM_WAVE_SKIP_NODE,    'mostCoinsFromWaveSkip',      SCHEMA_V3_NODE),
  // ─── totalEnemies ─────────────────────────────────────────────────────
  rename(f.TOTAL_ENEMIES__BASIC_NODE,            'basic',           SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__BOSS_NODE,             'boss',            SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__COMMANDER_NODE,        'commander',       SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__COMMANDER_NODE,        'commanders',      SCHEMA_V3_NODE, 'plural legacy spelling'),
  rename(f.TOTAL_ENEMIES__FAST_NODE,             'fast',            SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__OVERCHARGE_NODE,       'overcharge',      SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__OVERCHARGE_NODE,       'overcharges',     SCHEMA_V3_NODE, 'plural legacy spelling'),
  rename(f.TOTAL_ENEMIES__PROTECTOR_NODE,        'protector',       SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__RANGED_NODE,           'ranged',          SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__RAYS_NODE,             'rays',            SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__SABOTEUR_NODE,         'saboteur',        SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__SABOTEUR_NODE,         'saboteurs',       SCHEMA_V3_NODE, 'plural legacy spelling'),
  rename(f.TOTAL_ENEMIES__SCATTERS_NODE,         'scatters',        SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__SUMMONED_ENEMIES_NODE, 'summonedEnemies', SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__TANK_NODE,             'tank',            SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__TOTAL_ENEMIES_NODE,    'totalEnemies',    SCHEMA_V3_NODE),
  rename(f.TOTAL_ENEMIES__VAMPIRES_NODE,         'vampires',        SCHEMA_V3_NODE),
];

export const RENAME_EDGES: readonly Edge[] = [
  ...INTERNAL_FIELD_RENAMES_V1_TO_V2,
  ...GAME_FIELD_RENAMES_V2_TO_V3,
  ...V2_DISPLAY_FORM_RENAMES,
];
