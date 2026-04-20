import { fieldNode } from '../builders';
import type { Node } from '../types';

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
// Grouped by V3 section prefix for scan-ability. Order within a group mirrors
// `supportedFields.json`; the invariant test alongside this file asserts the
// set equality so drift is caught at build time.
export const FIELD_NODES: readonly Node[] = [
  // Internal app-fields (see architecture/11-internal-app-fields.md)
  fieldNode('_date', { tags: ['internal'] }),
  fieldNode('_time', { tags: ['internal'] }),
  fieldNode('_notes', { tags: ['internal'] }),
  fieldNode('_runType', { tags: ['internal'] }),
  fieldNode('_rank', { tags: ['internal'] }),

  // battleReport — primary run metadata
  fieldNode('battleReport_battleDate'),
  fieldNode('battleReport_cellsEarned'),
  fieldNode('battleReport_cellsPerHour'),
  fieldNode('battleReport_coinsEarned'),
  fieldNode('battleReport_coinsPerHour'),
  fieldNode('battleReport_gameTime'),
  fieldNode('battleReport_killedBy'),
  fieldNode('battleReport_realTime'),
  fieldNode('battleReport_tier'),
  fieldNode('battleReport_wave'),

  // bonusHealthGained
  fieldNode('bonusHealthGained_fromDeathWave'),

  // cash
  fieldNode('cash_cashEarned'),
  fieldNode('cash_goldenTower'),
  fieldNode('cash_interestEarned'),

  // coins — sources summing to battleReport_coinsEarned
  fieldNode('coins_blackHole'),
  fieldNode('coins_bountyCoins'),
  fieldNode('coins_coinBonusUpgrade'),
  fieldNode('coins_coinsEarned'),
  fieldNode('coins_coinsFetched'),
  fieldNode('coins_coinsFromCoinBonuses'),
  fieldNode('coins_coinsWave'),
  fieldNode('coins_criticalCoin'),
  fieldNode('coins_deathWave'),
  fieldNode('coins_goldenBot'),
  fieldNode('coins_goldenCombo'),
  fieldNode('coins_goldenTower'),
  fieldNode('coins_orbs'),
  fieldNode('coins_spotlight'),
  fieldNode('coins_waveSkip'),

  // counts
  fieldNode('counts_deathDefy'),
  fieldNode('counts_demonMode'),
  fieldNode('counts_hitsAbsorbedByEnergyShield'),
  fieldNode('counts_landMinesSpawned'),
  fieldNode('counts_nuke'),
  fieldNode('counts_projectilesCount'),
  fieldNode('counts_secondWind'),
  fieldNode('counts_thunderBotStuns'),
  fieldNode('counts_wavesSkipped'),

  // currencies
  fieldNode('currencies_adGems'),
  fieldNode('currencies_armorShards'),
  fieldNode('currencies_cannonShards'),
  fieldNode('currencies_cellsEarned'),
  fieldNode('currencies_commonModules'),
  fieldNode('currencies_coreShards'),
  fieldNode('currencies_fetchGems'),
  fieldNode('currencies_gemBlocksTapped'),
  fieldNode('currencies_gems'),
  fieldNode('currencies_generatorShards'),
  fieldNode('currencies_medals'),
  fieldNode('currencies_rareModules'),
  fieldNode('currencies_rerollShardsEarned'),
  fieldNode('currencies_rerollShardsFetched'),

  // damage — sources summing to damage_damageDealt
  fieldNode('damage_attackChip'),
  fieldNode('damage_blackHole'),
  fieldNode('damage_chainLightning'),
  fieldNode('damage_damageDealt'),
  fieldNode('damage_deathRay'),
  fieldNode('damage_deathWave'),
  fieldNode('damage_electrons'),
  fieldNode('damage_flameBot'),
  fieldNode('damage_innerLandMines'),
  fieldNode('damage_landMines'),
  fieldNode('damage_orbs'),
  fieldNode('damage_poisonSwamp'),
  fieldNode('damage_projectiles'),
  fieldNode('damage_rendArmor'),
  fieldNode('damage_smartMissiles'),
  fieldNode('damage_thorns'),

  // damageBlocked
  fieldNode('damageBlocked_chainThunder'),
  fieldNode('damageBlocked_chronoField'),
  fieldNode('damageBlocked_defense'),
  fieldNode('damageBlocked_defenseAbsolute'),
  fieldNode('damageBlocked_flameBot'),
  fieldNode('damageBlocked_negativeMassProjector'),
  fieldNode('damageBlocked_primordialCollapse'),

  // damageTaken
  fieldNode('damageTaken_tower'),
  fieldNode('damageTaken_wall'),

  // enemiesDestroyedBy
  fieldNode('enemiesDestroyedBy_blackHole'),
  fieldNode('enemiesDestroyedBy_chainLightning'),
  fieldNode('enemiesDestroyedBy_deathRay'),
  fieldNode('enemiesDestroyedBy_flameBot'),
  fieldNode('enemiesDestroyedBy_innerLandMines'),
  fieldNode('enemiesDestroyedBy_landMines'),
  fieldNode('enemiesDestroyedBy_orbs'),
  fieldNode('enemiesDestroyedBy_other'),
  fieldNode('enemiesDestroyedBy_poisonSwamp'),
  fieldNode('enemiesDestroyedBy_projectiles'),
  fieldNode('enemiesDestroyedBy_smartMissiles'),
  fieldNode('enemiesDestroyedBy_thorns'),

  // enemiesHitBy
  fieldNode('enemiesHitBy_attackChip'),
  fieldNode('enemiesHitBy_blackHole'),
  fieldNode('enemiesHitBy_chainLightning'),
  fieldNode('enemiesHitBy_chronoField'),
  fieldNode('enemiesHitBy_deathRay'),
  fieldNode('enemiesHitBy_deathWave'),
  fieldNode('enemiesHitBy_flameBot'),
  fieldNode('enemiesHitBy_innerLandMines'),
  fieldNode('enemiesHitBy_landMines'),
  fieldNode('enemiesHitBy_orbitalAugment'),
  fieldNode('enemiesHitBy_orbs'),
  fieldNode('enemiesHitBy_poisonSwamp'),
  fieldNode('enemiesHitBy_projectiles'),
  fieldNode('enemiesHitBy_smartMissiles'),
  fieldNode('enemiesHitBy_thorns'),
  fieldNode('enemiesHitBy_thunderBot'),

  // healthRegenerated
  fieldNode('healthRegenerated_lifesteal'),
  fieldNode('healthRegenerated_towerHealthRegen'),
  fieldNode('healthRegenerated_wallHealthRegen'),

  // killedWithEffectActive
  fieldNode('killedWithEffectActive_amplifyBot'),
  fieldNode('killedWithEffectActive_deathPenalty'),
  fieldNode('killedWithEffectActive_deathWave'),
  fieldNode('killedWithEffectActive_goldenBot'),
  fieldNode('killedWithEffectActive_goldenTower'),
  fieldNode('killedWithEffectActive_spotlight'),

  // records
  fieldNode('records_highestCoinsMinute'),
  fieldNode('records_largestGoldenCombo'),
  fieldNode('records_largestInnerLandmineCharge'),
  fieldNode('records_largestSmartMissileStack'),
  fieldNode('records_largestWaveSkip'),
  fieldNode('records_mostCellsFromWaveSkip'),
  fieldNode('records_mostCoinsFromGoldenCombo'),
  fieldNode('records_mostCoinsFromWaveSkip'),

  // totalEnemies
  fieldNode('totalEnemies_basic'),
  fieldNode('totalEnemies_boss'),
  fieldNode('totalEnemies_commander'),
  fieldNode('totalEnemies_fast'),
  fieldNode('totalEnemies_overcharge'),
  fieldNode('totalEnemies_protector'),
  fieldNode('totalEnemies_ranged'),
  fieldNode('totalEnemies_rays'),
  fieldNode('totalEnemies_saboteur'),
  fieldNode('totalEnemies_scatters'),
  fieldNode('totalEnemies_summonedEnemies'),
  fieldNode('totalEnemies_tank'),
  fieldNode('totalEnemies_totalEnemies'),
  fieldNode('totalEnemies_vampires'),

  // utility
  fieldNode('utility_enemyAttackLevelsSkipped'),
  fieldNode('utility_enemyHealthLevelsSkipped'),
  fieldNode('utility_freeAttackUpgrade'),
  fieldNode('utility_freeDefenseUpgrade'),
  fieldNode('utility_freeUtilityUpgrade'),
  fieldNode('utility_recoveryPackages'),
];
