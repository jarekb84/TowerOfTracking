/**
 * Section Configuration
 *
 * Purpose-based field groupings for run details display.
 * Fields are organized by what users want to understand, not by game export structure.
 *
 * Field names are V3 canonical (`<sectionCamel>_<labelCamel>`) — see
 * src/shared/domain/migrations/v2-to-v3-field-map.ts. Anything keyed under
 * a legacy V2 name will now fall into the uncategorized "Miscellaneous"
 * bucket because the V2 remap runs at import time.
 */

import type {
  BreakdownConfig,
  PlainFieldsConfig,
} from './types'
import {
  DAMAGE_DEALT_CATEGORY,
  COINS_EARNED_CATEGORY,
} from '@/shared/domain/fields/breakdown-sources'

// =============================================================================
// Battle Report Section
// =============================================================================

export const BATTLE_REPORT_ESSENTIAL: PlainFieldsConfig = {
  fields: [
    { fieldName: 'battleReport_tier', displayName: 'Tier' },
    { fieldName: 'battleReport_wave', displayName: 'Wave' },
    { fieldName: 'battleReport_killedBy', displayName: 'Killed By' },
    { fieldName: 'battleReport_gameTime', displayName: 'Game Time' },
    { fieldName: 'battleReport_realTime', displayName: 'Real Time' },
  ],
}

export const BATTLE_REPORT_MISCELLANEOUS: PlainFieldsConfig = {
  label: 'MISCELLANEOUS',
  fields: [
    { fieldName: 'utility_freeAttackUpgrade', displayName: 'Free Attack Upgrade' },
    { fieldName: 'utility_freeDefenseUpgrade', displayName: 'Free Defense Upgrade' },
    { fieldName: 'utility_freeUtilityUpgrade', displayName: 'Free Utility Upgrade' },
    { fieldName: 'utility_recoveryPackages', displayName: 'Recovery Packages' },
    { fieldName: 'utility_enemyAttackLevelsSkipped', displayName: 'Enemy Attack Levels Skipped' },
    { fieldName: 'utility_enemyHealthLevelsSkipped', displayName: 'Enemy Health Levels Skipped' },
    { fieldName: 'counts_wavesSkipped', displayName: 'Waves Skipped' },
    { fieldName: 'counts_deathDefy', displayName: 'Death Defy' },
    { fieldName: 'counts_secondWind', displayName: 'Second Wind' },
    { fieldName: 'counts_demonMode', displayName: 'Demon Mode' },
    { fieldName: 'counts_nuke', displayName: 'Nuke' },
    { fieldName: 'counts_hitsAbsorbedByEnergyShield', displayName: 'Hits Absorbed By Energy Shield' },
  ],
}

// =============================================================================
// Combat Section
// =============================================================================

export const DAMAGE_DEALT_CONFIG: BreakdownConfig = {
  totalField: DAMAGE_DEALT_CATEGORY.totalField!,
  label: DAMAGE_DEALT_CATEGORY.name.toUpperCase(),
  sources: DAMAGE_DEALT_CATEGORY.fields.map((f) => ({
    fieldName: f.fieldName,
    displayName: f.displayName,
    color: f.color,
  })),
}

export const DAMAGE_TAKEN_CONFIG: PlainFieldsConfig = {
  label: 'DAMAGE TAKEN',
  fields: [
    { fieldName: 'damageTaken_tower', displayName: 'Tower' },
    { fieldName: 'damageTaken_wall', displayName: 'Wall' },
    { fieldName: 'healthRegenerated_towerHealthRegen', displayName: 'Tower Health Regen' },
    { fieldName: 'healthRegenerated_wallHealthRegen', displayName: 'Wall Health Regen' },
    { fieldName: 'bonusHealthGained_fromDeathWave', displayName: 'HP From Death Wave' },
  ],
}

export const DAMAGE_BLOCKED_CONFIG: PlainFieldsConfig = {
  label: 'DAMAGE BLOCKED',
  fields: [
    { fieldName: 'damageBlocked_defense', displayName: 'Defense %' },
    { fieldName: 'damageBlocked_defenseAbsolute', displayName: 'Defense Absolute' },
    { fieldName: 'damageBlocked_chronoField', displayName: 'Chrono Field' },
    { fieldName: 'damageBlocked_chainThunder', displayName: 'Chain Thunder' },
    { fieldName: 'damageBlocked_primordialCollapse', displayName: 'Primordial Collapse' },
    { fieldName: 'damageBlocked_negativeMassProjector', displayName: 'Negative Mass Projector' },
    { fieldName: 'damageBlocked_flameBot', displayName: 'Flame Bot' },
  ],
}

export const COMBAT_MISC_CONFIG: PlainFieldsConfig = {
  label: 'COUNTS',
  fields: [
    { fieldName: 'counts_projectilesCount', displayName: 'Projectiles Count' },
    { fieldName: 'counts_landMinesSpawned', displayName: 'Land Mines Spawned' },
    { fieldName: 'counts_thunderBotStuns', displayName: 'Thunder Bot Stuns' },
  ],
}

export const ENEMIES_DESTROYED_CONFIG: BreakdownConfig = {
  totalField: 'totalEnemies_totalEnemies',
  label: 'ENEMIES DESTROYED',
  sources: [
    { fieldName: 'totalEnemies_basic', displayName: 'Basic', color: '#94a3b8' },
    { fieldName: 'totalEnemies_fast', displayName: 'Fast', color: '#38bdf8' },
    { fieldName: 'totalEnemies_tank', displayName: 'Tank', color: '#84cc16' },
    { fieldName: 'totalEnemies_ranged', displayName: 'Ranged', color: '#f97316' },
    { fieldName: 'totalEnemies_boss', displayName: 'Boss', color: '#ef4444' },
    { fieldName: 'totalEnemies_protector', displayName: 'Protector', color: '#8b5cf6' },
    { fieldName: 'totalEnemies_vampires', displayName: 'Vampires', color: '#dc2626' },
    { fieldName: 'totalEnemies_rays', displayName: 'Rays', color: '#facc15' },
    { fieldName: 'totalEnemies_scatters', displayName: 'Scatters', color: '#fb923c' },
    { fieldName: 'totalEnemies_saboteur', displayName: 'Saboteur', color: '#6366f1' },
    { fieldName: 'totalEnemies_commander', displayName: 'Commander', color: '#d97706' },
    { fieldName: 'totalEnemies_overcharge', displayName: 'Overcharge', color: '#38bdf8' },
  ],
}

export const ENEMIES_HIT_BY_CONFIG: BreakdownConfig = {
  totalField: 'totalEnemies_totalEnemies',
  label: 'ENEMIES HIT BY',
  skipDiscrepancy: true,
  sources: [
    { fieldName: 'enemiesHitBy_projectiles', displayName: 'Projectiles', color: '#f59e0b' },
    { fieldName: 'enemiesHitBy_thorns', displayName: 'Thorns', color: '#22d3ee' },
    { fieldName: 'enemiesHitBy_orbs', displayName: 'Orbs', color: '#f87171' },
    { fieldName: 'enemiesHitBy_deathRay', displayName: 'Death Ray', color: '#ff5722' },
    { fieldName: 'enemiesHitBy_chainLightning', displayName: 'Chain Lightning', color: '#3b82f6' },
    { fieldName: 'enemiesHitBy_smartMissiles', displayName: 'Smart Missiles', color: '#64748b' },
    { fieldName: 'enemiesHitBy_innerLandMines', displayName: 'Inner Land Mines', color: '#7c3aed' },
    { fieldName: 'enemiesHitBy_poisonSwamp', displayName: 'Poison Swamp', color: '#22c55e' },
    { fieldName: 'enemiesHitBy_deathWave', displayName: 'Death Wave', color: '#ef4444' },
    { fieldName: 'enemiesHitBy_blackHole', displayName: 'Black Hole', color: '#475569' },
    { fieldName: 'enemiesHitBy_flameBot', displayName: 'Flame Bot', color: '#fbbf24' },
    { fieldName: 'enemiesHitBy_attackChip', displayName: 'Attack Chip', color: '#d946ef' },
    { fieldName: 'enemiesHitBy_landMines', displayName: 'Land Mines', color: '#9333ea' },
    { fieldName: 'enemiesHitBy_chronoField', displayName: 'Chrono Field', color: '#0ea5e9' },
    { fieldName: 'enemiesHitBy_orbitalAugment', displayName: 'Orbital Augment', color: '#a3e635' },
    { fieldName: 'enemiesHitBy_thunderBot', displayName: 'Thunder Bot', color: '#eab308' },
  ],
}

export const ENEMIES_DESTROYED_BY_CONFIG: BreakdownConfig = {
  totalField: 'totalEnemies_totalEnemies',
  label: 'ENEMIES DESTROYED BY',
  skipDiscrepancy: true,
  sources: [
    { fieldName: 'enemiesDestroyedBy_orbs', displayName: 'Orbs', color: '#f87171' },
    { fieldName: 'enemiesDestroyedBy_thorns', displayName: 'Thorns', color: '#22d3ee' },
    { fieldName: 'enemiesDestroyedBy_deathRay', displayName: 'Death Ray', color: '#ff5722' },
    { fieldName: 'enemiesDestroyedBy_landMines', displayName: 'Land Mines', color: '#9333ea' },
    { fieldName: 'enemiesDestroyedBy_innerLandMines', displayName: 'Inner Land Mines', color: '#7c3aed' },
    { fieldName: 'enemiesDestroyedBy_blackHole', displayName: 'Black Hole', color: '#475569' },
    { fieldName: 'enemiesDestroyedBy_chainLightning', displayName: 'Chain Lightning', color: '#3b82f6' },
    { fieldName: 'enemiesDestroyedBy_flameBot', displayName: 'Flame Bot', color: '#fbbf24' },
    { fieldName: 'enemiesDestroyedBy_poisonSwamp', displayName: 'Poison Swamp', color: '#22c55e' },
    { fieldName: 'enemiesDestroyedBy_projectiles', displayName: 'Projectiles', color: '#f59e0b' },
    { fieldName: 'enemiesDestroyedBy_smartMissiles', displayName: 'Smart Missiles', color: '#64748b' },
    { fieldName: 'enemiesDestroyedBy_other', displayName: 'Other', color: '#a1a1aa' },
  ],
}

/**
 * Backward-compatible alias for the hook and combat-section component
 * (`combat.destroyedBy`). Points at the V3 `ENEMIES_HIT_BY_CONFIG`, which is
 * the closest analogue of the old mixed hit/destroyed grouping. The
 * separate `ENEMIES_DESTROYED_BY_CONFIG` is available for a UI follow-up
 * that wants to show destruction sources distinctly.
 */
export const DESTROYED_BY_CONFIG = ENEMIES_HIT_BY_CONFIG

export const ENEMIES_AFFECTED_BY_CONFIG: BreakdownConfig = {
  totalField: 'totalEnemies_totalEnemies',
  label: 'KILLED WITH EFFECT ACTIVE',
  skipDiscrepancy: true,
  sources: [
    { fieldName: 'killedWithEffectActive_spotlight', displayName: 'Spotlight', color: '#e2e8f0' },
    { fieldName: 'killedWithEffectActive_deathWave', displayName: 'Death Wave', color: '#ef4444' },
    { fieldName: 'killedWithEffectActive_goldenBot', displayName: 'Golden Bot', color: '#fbbf24' },
    { fieldName: 'killedWithEffectActive_goldenTower', displayName: 'Golden Tower', color: '#facc15' },
    { fieldName: 'killedWithEffectActive_amplifyBot', displayName: 'Amplify Bot', color: '#a855f7' },
    { fieldName: 'killedWithEffectActive_deathPenalty', displayName: 'Death Penalty', color: '#be123c' },
    { fieldName: 'totalEnemies_summonedEnemies', displayName: 'Summoned Enemies', color: '#9333ea' },
  ],
}


// =============================================================================
// Records Section
// =============================================================================

export const RECORDS_CONFIG: PlainFieldsConfig = {
  label: 'RECORDS',
  fields: [
    { fieldName: 'records_highestCoinsMinute', displayName: 'Highest Coins / Minute' },
    { fieldName: 'records_largestWaveSkip', displayName: 'Largest Wave Skip' },
    { fieldName: 'records_mostCoinsFromWaveSkip', displayName: 'Most Coins From Wave Skip' },
    { fieldName: 'records_mostCellsFromWaveSkip', displayName: 'Most Cells From Wave Skip' },
    { fieldName: 'records_largestGoldenCombo', displayName: 'Largest Golden Combo' },
    { fieldName: 'records_mostCoinsFromGoldenCombo', displayName: 'Most Coins From Golden Combo' },
    { fieldName: 'records_largestSmartMissileStack', displayName: 'Largest Smart Missile Stack' },
    { fieldName: 'records_largestInnerLandmineCharge', displayName: 'Largest Inner Landmine Charge' },
  ],
}

// =============================================================================
// Economic Section
// =============================================================================

export const COINS_EARNED_CONFIG: BreakdownConfig = {
  totalField: COINS_EARNED_CATEGORY.totalField!,
  label: COINS_EARNED_CATEGORY.name.toUpperCase(),
  perHourField: COINS_EARNED_CATEGORY.perHourField,
  sources: COINS_EARNED_CATEGORY.fields.map((f) => ({
    fieldName: f.fieldName,
    displayName: f.displayName,
    color: f.color,
  })),
}

export const OTHER_EARNINGS_CONFIG: PlainFieldsConfig = {
  label: 'OTHER EARNINGS',
  fields: [
    { fieldName: 'cash_cashEarned', displayName: 'Cash' },
    { fieldName: 'cash_interestEarned', displayName: 'Interest' },
    { fieldName: 'cash_goldenTower', displayName: 'Golden Tower (Cash)' },
    { fieldName: 'currencies_medals', displayName: 'Guardian Medals' },
    { fieldName: 'currencies_gems', displayName: 'Guardian Gems' },
    { fieldName: 'currencies_adGems', displayName: 'Ad Gems' },
    { fieldName: 'currencies_fetchGems', displayName: 'Fetch Gems' },
    { fieldName: 'currencies_gemBlocksTapped', displayName: 'Gem Blocks Tapped' },
    { fieldName: 'battleReport_cellsEarned', displayName: 'Cells' },
    { fieldName: 'battleReport_cellsPerHour', displayName: 'Cells / Hour' },
  ],
}

// =============================================================================
// Modules Section
// =============================================================================

export const UPGRADE_SHARDS_CONFIG: BreakdownConfig = {
  totalField: null,
  label: 'UPGRADE SHARDS',
  sources: [
    { fieldName: 'currencies_armorShards', displayName: 'Armor', color: '#64748b' },
    { fieldName: 'currencies_coreShards', displayName: 'Core', color: '#f59e0b' },
    { fieldName: 'currencies_cannonShards', displayName: 'Cannon', color: '#ef4444' },
    { fieldName: 'currencies_generatorShards', displayName: 'Generator', color: '#22c55e' },
  ],
}

export const REROLL_SHARDS_CONFIG: BreakdownConfig = {
  totalField: null,
  label: 'REROLL SHARDS',
  sources: [
    { fieldName: 'currencies_rerollShardsEarned', displayName: 'Earned', color: '#94a3b8' },
    { fieldName: 'currencies_rerollShardsFetched', displayName: 'Fetched', color: '#64748b' },
  ],
}

export const MODULES_CONFIG: BreakdownConfig = {
  totalField: null,
  label: 'MODULES',
  sources: [
    { fieldName: 'currencies_commonModules', displayName: 'Common', color: '#94a3b8' },
    { fieldName: 'currencies_rareModules', displayName: 'Rare', color: '#3b82f6' },
  ],
}

// =============================================================================
// Fields to Skip (internal app fields, handled elsewhere)
// =============================================================================

export const SKIP_FIELDS = new Set([
  '_date',
  '_time',
  '_runType',
  '_notes',
  '_rank',
  'battleReport_battleDate',
])

// =============================================================================
// All Categorized Fields (for uncategorized field detection)
// =============================================================================

function collectFieldNames(configs: (BreakdownConfig | PlainFieldsConfig)[]): Set<string> {
  const fields = new Set<string>()

  for (const config of configs) {
    if ('sources' in config) {
      // BreakdownConfig
      if (config.totalField) {
        fields.add(config.totalField)
      }
      if (config.perHourField) {
        fields.add(config.perHourField)
      }
      for (const source of config.sources) {
        fields.add(source.fieldName)
      }
    } else {
      // PlainFieldsConfig
      for (const field of config.fields) {
        fields.add(field.fieldName)
      }
    }
  }

  return fields
}

export const CATEGORIZED_FIELDS = collectFieldNames([
  BATTLE_REPORT_ESSENTIAL,
  BATTLE_REPORT_MISCELLANEOUS,
  DAMAGE_DEALT_CONFIG,
  DAMAGE_TAKEN_CONFIG,
  DAMAGE_BLOCKED_CONFIG,
  COMBAT_MISC_CONFIG,
  ENEMIES_DESTROYED_CONFIG,
  ENEMIES_HIT_BY_CONFIG,
  ENEMIES_DESTROYED_BY_CONFIG,
  ENEMIES_AFFECTED_BY_CONFIG,
  RECORDS_CONFIG,
  COINS_EARNED_CONFIG,
  OTHER_EARNINGS_CONFIG,
  UPGRADE_SHARDS_CONFIG,
  REROLL_SHARDS_CONFIG,
  MODULES_CONFIG,
])

// NOTE: Any field NOT in the configs above will appear in the "Miscellaneous" section.
// This is intentional - it ensures new/unknown game fields are always visible.
// If you want to hide a field completely, add it to SKIP_FIELDS instead.
