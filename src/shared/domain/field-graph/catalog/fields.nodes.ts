import { fieldNode } from '../builders';

// Field nodes — one per entry in `sampleData/supportedFields.json` (the V3
// canonical schema) plus the five internal app-fields. Phase 1 of the field
// graph epic declares bare nodes only; outgoing edges (section membership,
// data type, display name, color, …) arrive in subsequent commits. See
// `docs/field-graph/EPIC-migration.md` for the phased rollout and
// `docs/field-graph/architecture/08-clarifying-the-mental-model.md` §8.1 for
// the node shape.
//
// Internal fields carry the `'internal'` tag (spec §11.1). They are `Field`
// nodes, not a separate node kind — the tag + an `IS_INTERNAL_FIELD` edge
// (declared in commit 5) together express their distinct role.
//
// Naming convention: `<SECTION>__<FIELD>_NODE` (double-underscore section/
// field separator). Internal fields preserve their leading `_`. See
// `docs/field-graph/EXPLORATION-node-identity-abc-deep-dive.md` §6 for the
// rationale. Order within a group mirrors `supportedFields.json`; the
// invariant test alongside this file asserts set equality between the
// catalog and the schema snapshot.

// ─── Internal app-fields ─────────────────────────────────────────────────
// See architecture/11-internal-app-fields.md.

export const _DATE_NODE = fieldNode('_date', { tags: ['internal'] });
export const _TIME_NODE = fieldNode('_time', { tags: ['internal'] });
export const _NOTES_NODE = fieldNode('_notes', { tags: ['internal'] });
export const _RUN_TYPE_NODE = fieldNode('_runType', { tags: ['internal'] });
export const _RANK_NODE = fieldNode('_rank', { tags: ['internal'] });

// ─── battleReport — primary run metadata ─────────────────────────────────

export const BATTLE_REPORT__BATTLE_DATE_NODE = fieldNode('battleReport_battleDate');
export const BATTLE_REPORT__CELLS_EARNED_NODE = fieldNode('battleReport_cellsEarned');
export const BATTLE_REPORT__CELLS_PER_HOUR_NODE = fieldNode('battleReport_cellsPerHour');
export const BATTLE_REPORT__COINS_EARNED_NODE = fieldNode('battleReport_coinsEarned');
export const BATTLE_REPORT__COINS_PER_HOUR_NODE = fieldNode('battleReport_coinsPerHour');
export const BATTLE_REPORT__GAME_TIME_NODE = fieldNode('battleReport_gameTime');
export const BATTLE_REPORT__KILLED_BY_NODE = fieldNode('battleReport_killedBy');
export const BATTLE_REPORT__REAL_TIME_NODE = fieldNode('battleReport_realTime');
export const BATTLE_REPORT__TIER_NODE = fieldNode('battleReport_tier');
export const BATTLE_REPORT__WAVE_NODE = fieldNode('battleReport_wave');

// ─── bonusHealthGained ───────────────────────────────────────────────────

export const BONUS_HEALTH_GAINED__FROM_DEATH_WAVE_NODE = fieldNode('bonusHealthGained_fromDeathWave');

// ─── cash ────────────────────────────────────────────────────────────────

export const CASH__CASH_EARNED_NODE = fieldNode('cash_cashEarned');
export const CASH__GOLDEN_TOWER_NODE = fieldNode('cash_goldenTower');
export const CASH__INTEREST_EARNED_NODE = fieldNode('cash_interestEarned');

// ─── coins — sources summing to battleReport_coinsEarned ─────────────────

export const COINS__BLACK_HOLE_NODE = fieldNode('coins_blackHole');
export const COINS__BOUNTY_COINS_NODE = fieldNode('coins_bountyCoins');
export const COINS__COIN_BONUS_UPGRADE_NODE = fieldNode('coins_coinBonusUpgrade');
export const COINS__COINS_EARNED_NODE = fieldNode('coins_coinsEarned');
export const COINS__COINS_FETCHED_NODE = fieldNode('coins_coinsFetched');
export const COINS__COINS_FROM_COIN_BONUSES_NODE = fieldNode('coins_coinsFromCoinBonuses');
export const COINS__COINS_WAVE_NODE = fieldNode('coins_coinsWave');
export const COINS__CRITICAL_COIN_NODE = fieldNode('coins_criticalCoin');
export const COINS__DEATH_WAVE_NODE = fieldNode('coins_deathWave');
export const COINS__GOLDEN_BOT_NODE = fieldNode('coins_goldenBot');
export const COINS__GOLDEN_COMBO_NODE = fieldNode('coins_goldenCombo');
export const COINS__GOLDEN_TOWER_NODE = fieldNode('coins_goldenTower');
export const COINS__ORBS_NODE = fieldNode('coins_orbs');
export const COINS__SPOTLIGHT_NODE = fieldNode('coins_spotlight');
export const COINS__WAVE_SKIP_NODE = fieldNode('coins_waveSkip');

// ─── counts ──────────────────────────────────────────────────────────────

export const COUNTS__DEATH_DEFY_NODE = fieldNode('counts_deathDefy');
export const COUNTS__DEMON_MODE_NODE = fieldNode('counts_demonMode');
export const COUNTS__HITS_ABSORBED_BY_ENERGY_SHIELD_NODE = fieldNode('counts_hitsAbsorbedByEnergyShield');
export const COUNTS__LAND_MINES_SPAWNED_NODE = fieldNode('counts_landMinesSpawned');
export const COUNTS__NUKE_NODE = fieldNode('counts_nuke');
export const COUNTS__PROJECTILES_COUNT_NODE = fieldNode('counts_projectilesCount');
export const COUNTS__SECOND_WIND_NODE = fieldNode('counts_secondWind');
export const COUNTS__THUNDER_BOT_STUNS_NODE = fieldNode('counts_thunderBotStuns');
export const COUNTS__WAVES_SKIPPED_NODE = fieldNode('counts_wavesSkipped');

// ─── currencies ──────────────────────────────────────────────────────────

export const CURRENCIES__AD_GEMS_NODE = fieldNode('currencies_adGems');
export const CURRENCIES__ARMOR_SHARDS_NODE = fieldNode('currencies_armorShards');
export const CURRENCIES__CANNON_SHARDS_NODE = fieldNode('currencies_cannonShards');
export const CURRENCIES__CELLS_EARNED_NODE = fieldNode('currencies_cellsEarned');
export const CURRENCIES__COMMON_MODULES_NODE = fieldNode('currencies_commonModules');
export const CURRENCIES__CORE_SHARDS_NODE = fieldNode('currencies_coreShards');
export const CURRENCIES__FETCH_GEMS_NODE = fieldNode('currencies_fetchGems');
export const CURRENCIES__GEM_BLOCKS_TAPPED_NODE = fieldNode('currencies_gemBlocksTapped');
export const CURRENCIES__GEMS_NODE = fieldNode('currencies_gems');
export const CURRENCIES__GENERATOR_SHARDS_NODE = fieldNode('currencies_generatorShards');
export const CURRENCIES__MEDALS_NODE = fieldNode('currencies_medals');
export const CURRENCIES__RARE_MODULES_NODE = fieldNode('currencies_rareModules');
export const CURRENCIES__REROLL_SHARDS_EARNED_NODE = fieldNode('currencies_rerollShardsEarned');
export const CURRENCIES__REROLL_SHARDS_FETCHED_NODE = fieldNode('currencies_rerollShardsFetched');

// ─── damage — sources summing to damage_damageDealt ──────────────────────

export const DAMAGE__ATTACK_CHIP_NODE = fieldNode('damage_attackChip');
export const DAMAGE__BLACK_HOLE_NODE = fieldNode('damage_blackHole');
export const DAMAGE__CHAIN_LIGHTNING_NODE = fieldNode('damage_chainLightning');
export const DAMAGE__DAMAGE_DEALT_NODE = fieldNode('damage_damageDealt');
export const DAMAGE__DEATH_RAY_NODE = fieldNode('damage_deathRay');
export const DAMAGE__DEATH_WAVE_NODE = fieldNode('damage_deathWave');
export const DAMAGE__ELECTRONS_NODE = fieldNode('damage_electrons');
export const DAMAGE__FLAME_BOT_NODE = fieldNode('damage_flameBot');
export const DAMAGE__INNER_LAND_MINES_NODE = fieldNode('damage_innerLandMines');
export const DAMAGE__LAND_MINES_NODE = fieldNode('damage_landMines');
export const DAMAGE__ORBS_NODE = fieldNode('damage_orbs');
export const DAMAGE__POISON_SWAMP_NODE = fieldNode('damage_poisonSwamp');
export const DAMAGE__PROJECTILES_NODE = fieldNode('damage_projectiles');
export const DAMAGE__REND_ARMOR_NODE = fieldNode('damage_rendArmor');
export const DAMAGE__SMART_MISSILES_NODE = fieldNode('damage_smartMissiles');
export const DAMAGE__THORNS_NODE = fieldNode('damage_thorns');

// ─── damageBlocked ───────────────────────────────────────────────────────

export const DAMAGE_BLOCKED__CHAIN_THUNDER_NODE = fieldNode('damageBlocked_chainThunder');
export const DAMAGE_BLOCKED__CHRONO_FIELD_NODE = fieldNode('damageBlocked_chronoField');
export const DAMAGE_BLOCKED__DEFENSE_NODE = fieldNode('damageBlocked_defense');
export const DAMAGE_BLOCKED__DEFENSE_ABSOLUTE_NODE = fieldNode('damageBlocked_defenseAbsolute');
export const DAMAGE_BLOCKED__FLAME_BOT_NODE = fieldNode('damageBlocked_flameBot');
export const DAMAGE_BLOCKED__NEGATIVE_MASS_PROJECTOR_NODE = fieldNode('damageBlocked_negativeMassProjector');
export const DAMAGE_BLOCKED__PRIMORDIAL_COLLAPSE_NODE = fieldNode('damageBlocked_primordialCollapse');

// ─── damageTaken ─────────────────────────────────────────────────────────

export const DAMAGE_TAKEN__TOWER_NODE = fieldNode('damageTaken_tower');
export const DAMAGE_TAKEN__WALL_NODE = fieldNode('damageTaken_wall');

// ─── enemiesDestroyedBy ──────────────────────────────────────────────────

export const ENEMIES_DESTROYED_BY__BLACK_HOLE_NODE = fieldNode('enemiesDestroyedBy_blackHole');
export const ENEMIES_DESTROYED_BY__CHAIN_LIGHTNING_NODE = fieldNode('enemiesDestroyedBy_chainLightning');
export const ENEMIES_DESTROYED_BY__DEATH_RAY_NODE = fieldNode('enemiesDestroyedBy_deathRay');
export const ENEMIES_DESTROYED_BY__FLAME_BOT_NODE = fieldNode('enemiesDestroyedBy_flameBot');
export const ENEMIES_DESTROYED_BY__INNER_LAND_MINES_NODE = fieldNode('enemiesDestroyedBy_innerLandMines');
export const ENEMIES_DESTROYED_BY__LAND_MINES_NODE = fieldNode('enemiesDestroyedBy_landMines');
export const ENEMIES_DESTROYED_BY__ORBS_NODE = fieldNode('enemiesDestroyedBy_orbs');
export const ENEMIES_DESTROYED_BY__OTHER_NODE = fieldNode('enemiesDestroyedBy_other');
export const ENEMIES_DESTROYED_BY__POISON_SWAMP_NODE = fieldNode('enemiesDestroyedBy_poisonSwamp');
export const ENEMIES_DESTROYED_BY__PROJECTILES_NODE = fieldNode('enemiesDestroyedBy_projectiles');
export const ENEMIES_DESTROYED_BY__SMART_MISSILES_NODE = fieldNode('enemiesDestroyedBy_smartMissiles');
export const ENEMIES_DESTROYED_BY__THORNS_NODE = fieldNode('enemiesDestroyedBy_thorns');

// ─── enemiesHitBy ────────────────────────────────────────────────────────

export const ENEMIES_HIT_BY__ATTACK_CHIP_NODE = fieldNode('enemiesHitBy_attackChip');
export const ENEMIES_HIT_BY__BLACK_HOLE_NODE = fieldNode('enemiesHitBy_blackHole');
export const ENEMIES_HIT_BY__CHAIN_LIGHTNING_NODE = fieldNode('enemiesHitBy_chainLightning');
export const ENEMIES_HIT_BY__CHRONO_FIELD_NODE = fieldNode('enemiesHitBy_chronoField');
export const ENEMIES_HIT_BY__DEATH_RAY_NODE = fieldNode('enemiesHitBy_deathRay');
export const ENEMIES_HIT_BY__DEATH_WAVE_NODE = fieldNode('enemiesHitBy_deathWave');
export const ENEMIES_HIT_BY__FLAME_BOT_NODE = fieldNode('enemiesHitBy_flameBot');
export const ENEMIES_HIT_BY__INNER_LAND_MINES_NODE = fieldNode('enemiesHitBy_innerLandMines');
export const ENEMIES_HIT_BY__LAND_MINES_NODE = fieldNode('enemiesHitBy_landMines');
export const ENEMIES_HIT_BY__ORBITAL_AUGMENT_NODE = fieldNode('enemiesHitBy_orbitalAugment');
export const ENEMIES_HIT_BY__ORBS_NODE = fieldNode('enemiesHitBy_orbs');
export const ENEMIES_HIT_BY__POISON_SWAMP_NODE = fieldNode('enemiesHitBy_poisonSwamp');
export const ENEMIES_HIT_BY__PROJECTILES_NODE = fieldNode('enemiesHitBy_projectiles');
export const ENEMIES_HIT_BY__SMART_MISSILES_NODE = fieldNode('enemiesHitBy_smartMissiles');
export const ENEMIES_HIT_BY__THORNS_NODE = fieldNode('enemiesHitBy_thorns');
export const ENEMIES_HIT_BY__THUNDER_BOT_NODE = fieldNode('enemiesHitBy_thunderBot');

// ─── healthRegenerated ───────────────────────────────────────────────────

export const HEALTH_REGENERATED__LIFESTEAL_NODE = fieldNode('healthRegenerated_lifesteal');
export const HEALTH_REGENERATED__TOWER_HEALTH_REGEN_NODE = fieldNode('healthRegenerated_towerHealthRegen');
export const HEALTH_REGENERATED__WALL_HEALTH_REGEN_NODE = fieldNode('healthRegenerated_wallHealthRegen');

// ─── killedWithEffectActive ──────────────────────────────────────────────

export const KILLED_WITH_EFFECT_ACTIVE__AMPLIFY_BOT_NODE = fieldNode('killedWithEffectActive_amplifyBot');
export const KILLED_WITH_EFFECT_ACTIVE__DEATH_PENALTY_NODE = fieldNode('killedWithEffectActive_deathPenalty');
export const KILLED_WITH_EFFECT_ACTIVE__DEATH_WAVE_NODE = fieldNode('killedWithEffectActive_deathWave');
export const KILLED_WITH_EFFECT_ACTIVE__GOLDEN_BOT_NODE = fieldNode('killedWithEffectActive_goldenBot');
export const KILLED_WITH_EFFECT_ACTIVE__GOLDEN_TOWER_NODE = fieldNode('killedWithEffectActive_goldenTower');
export const KILLED_WITH_EFFECT_ACTIVE__SPOTLIGHT_NODE = fieldNode('killedWithEffectActive_spotlight');

// ─── records ─────────────────────────────────────────────────────────────

export const RECORDS__HIGHEST_COINS_MINUTE_NODE = fieldNode('records_highestCoinsMinute');
export const RECORDS__LARGEST_GOLDEN_COMBO_NODE = fieldNode('records_largestGoldenCombo');
export const RECORDS__LARGEST_INNER_LANDMINE_CHARGE_NODE = fieldNode('records_largestInnerLandmineCharge');
export const RECORDS__LARGEST_SMART_MISSILE_STACK_NODE = fieldNode('records_largestSmartMissileStack');
export const RECORDS__LARGEST_WAVE_SKIP_NODE = fieldNode('records_largestWaveSkip');
export const RECORDS__MOST_CELLS_FROM_WAVE_SKIP_NODE = fieldNode('records_mostCellsFromWaveSkip');
export const RECORDS__MOST_COINS_FROM_GOLDEN_COMBO_NODE = fieldNode('records_mostCoinsFromGoldenCombo');
export const RECORDS__MOST_COINS_FROM_WAVE_SKIP_NODE = fieldNode('records_mostCoinsFromWaveSkip');

// ─── totalEnemies ────────────────────────────────────────────────────────

export const TOTAL_ENEMIES__BASIC_NODE = fieldNode('totalEnemies_basic');
export const TOTAL_ENEMIES__BOSS_NODE = fieldNode('totalEnemies_boss');
export const TOTAL_ENEMIES__COMMANDER_NODE = fieldNode('totalEnemies_commander');
export const TOTAL_ENEMIES__FAST_NODE = fieldNode('totalEnemies_fast');
export const TOTAL_ENEMIES__OVERCHARGE_NODE = fieldNode('totalEnemies_overcharge');
export const TOTAL_ENEMIES__PROTECTOR_NODE = fieldNode('totalEnemies_protector');
export const TOTAL_ENEMIES__RANGED_NODE = fieldNode('totalEnemies_ranged');
export const TOTAL_ENEMIES__RAYS_NODE = fieldNode('totalEnemies_rays');
export const TOTAL_ENEMIES__SABOTEUR_NODE = fieldNode('totalEnemies_saboteur');
export const TOTAL_ENEMIES__SCATTERS_NODE = fieldNode('totalEnemies_scatters');
export const TOTAL_ENEMIES__SUMMONED_ENEMIES_NODE = fieldNode('totalEnemies_summonedEnemies');
export const TOTAL_ENEMIES__TANK_NODE = fieldNode('totalEnemies_tank');
export const TOTAL_ENEMIES__TOTAL_ENEMIES_NODE = fieldNode('totalEnemies_totalEnemies');
export const TOTAL_ENEMIES__VAMPIRES_NODE = fieldNode('totalEnemies_vampires');

// ─── utility ─────────────────────────────────────────────────────────────

export const UTILITY__ENEMY_ATTACK_LEVELS_SKIPPED_NODE = fieldNode('utility_enemyAttackLevelsSkipped');
export const UTILITY__ENEMY_HEALTH_LEVELS_SKIPPED_NODE = fieldNode('utility_enemyHealthLevelsSkipped');
export const UTILITY__FREE_ATTACK_UPGRADE_NODE = fieldNode('utility_freeAttackUpgrade');
export const UTILITY__FREE_DEFENSE_UPGRADE_NODE = fieldNode('utility_freeDefenseUpgrade');
export const UTILITY__FREE_UTILITY_UPGRADE_NODE = fieldNode('utility_freeUtilityUpgrade');
export const UTILITY__RECOVERY_PACKAGES_NODE = fieldNode('utility_recoveryPackages');
