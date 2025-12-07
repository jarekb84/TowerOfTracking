/**
 * Section Configuration
 *
 * Purpose-based field groupings for run details display.
 * Fields are organized by what users want to understand, not by game export structure.
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
    { fieldName: 'tier', displayName: 'Tier' },
    { fieldName: 'wave', displayName: 'Wave' },    
    { fieldName: 'killedBy', displayName: 'Killed By' },
    { fieldName: 'gameTime', displayName: 'Game Time' },    
    { fieldName: 'realTime', displayName: 'Real Time' },
  ],
}

export const BATTLE_REPORT_MISCELLANEOUS: PlainFieldsConfig = {
  label: 'MISCELLANEOUS',
  fields: [
    { fieldName: 'freeAttackUpgrade', displayName: 'Free Attack Upgrade' },    
    { fieldName: 'freeDefenseUpgrade', displayName: 'Free Defense Upgrade' },    
    { fieldName: 'freeUtilityUpgrade', displayName: 'Free Utility Upgrade' },
    { fieldName: 'recoveryPackages', displayName: 'Recovery Packages' },
    { fieldName: 'wavesSkipped', displayName: 'Waves Skipped' },
    { fieldName: 'deathDefy', displayName: 'Death Defy' },
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
    { fieldName: 'damageTaken', displayName: 'Total' },
    { fieldName: 'damageTakenWall', displayName: 'Wall' },
    { fieldName: 'damageTakenWhileBerserked', displayName: 'While Berserked' },
  ],
}

export const COMBAT_MISC_CONFIG: PlainFieldsConfig = {
  label: 'MISCELLANEOUS',
  fields: [
    { fieldName: 'projectilesCount', displayName: 'Projectiles Count' },
    { fieldName: 'landMinesSpawned', displayName: 'Land Mines Spawned' },
    { fieldName: 'thunderBotStuns', displayName: 'Thunder Bot Stuns' },
    { fieldName: 'hpFromDeathWave', displayName: 'HP From Death Wave' },
    { fieldName: 'damageGainFromBerserk', displayName: 'Damage Gain From Berserk' },
    { fieldName: 'totalElites', displayName: 'Total Elites' },
  ],
}

export const ENEMIES_DESTROYED_CONFIG: BreakdownConfig = {
  totalField: 'totalEnemies',
  label: 'ENEMIES DESTROYED',
  sources: [
    { fieldName: 'basic', displayName: 'Basic', color: '#94a3b8' },
    { fieldName: 'fast', displayName: 'Fast', color: '#38bdf8' },
    { fieldName: 'tank', displayName: 'Tank', color: '#84cc16' },
    { fieldName: 'ranged', displayName: 'Ranged', color: '#f97316' },
    { fieldName: 'boss', displayName: 'Boss', color: '#ef4444' },
    { fieldName: 'protector', displayName: 'Protector', color: '#8b5cf6' },    
    { fieldName: 'vampires', displayName: 'Vampires', color: '#dc2626' },
    { fieldName: 'rays', displayName: 'Rays', color: '#facc15' },
    { fieldName: 'scatters', displayName: 'Scatters', color: '#fb923c' },
    { fieldName: 'saboteur', displayName: 'Saboteur', color: '#6366f1' },
    { fieldName: 'commander', displayName: 'Commander', color: '#d97706' },
    { fieldName: 'overcharge', displayName: 'Overcharge', color: '#38bdf8' },
  ],
}

export const DESTROYED_BY_CONFIG: BreakdownConfig = {
  totalField: 'totalEnemies',
  label: 'ENEMIES KILLED (OR HIT) BY',
  skipDiscrepancy: true, // Sources are supplementary hit counts, not a breakdown of totalEnemies
  sources: [
    { fieldName: 'enemiesHitByOrbs', displayName: 'Orb Hits', color: '#f87171' },
    { fieldName: 'destroyedByOrbs', displayName: 'Orbs', color: '#f87171' },
    { fieldName: 'destroyedByThorns', displayName: 'Thorns', color: '#22d3ee' },
    { fieldName: 'destroyedByDeathRay', displayName: 'Death Ray', color: '#ff5722' },
    { fieldName: 'destroyedByLandMine', displayName: 'Land Mine', color: '#9333ea' },
  ],
}

export const ENEMIES_AFFECTED_BY_CONFIG: BreakdownConfig = {
  totalField: 'totalEnemies',
  label: 'ENEMIES AFFECTED BY',
  skipDiscrepancy: true, // Sources are supplementary effects, not a breakdown of totalEnemies
  sources: [
    { fieldName: 'destroyedInSpotlight', displayName: 'Spotlight', color: '#e2e8f0' },
    { fieldName: 'taggedByDeathwave', displayName: 'Deathwave', color: '#ef4444' },
    { fieldName: 'destroyedInGoldenBot', displayName: 'Golden Bot', color: '#fbbf24' },
    { fieldName: 'summonedEnemies', displayName: 'Guardian Summoned Enemies', color: '#a855f7' },
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
    { fieldName: 'cashEarned', displayName: 'Cash' },
    { fieldName: 'interestEarned', displayName: 'Interest' },
    { fieldName: 'cashFromGoldenTower', displayName: 'Golden Tower (Cash)'},
    { fieldName: 'medals', displayName: 'Guardian Medals' },
    { fieldName: 'gems', displayName: 'Guardian Gems' },    
    { fieldName: 'gemBlocksTapped', displayName: 'Gem Blocks Tapped'},    
    { fieldName: 'cellsEarned', displayName: 'Cells' },    
  ],
}

// =============================================================================
// Modules Section
// =============================================================================

export const UPGRADE_SHARDS_CONFIG: BreakdownConfig = {
  totalField: null, // Computed sum
  label: 'UPGRADE SHARDS',
  sources: [
    { fieldName: 'armorShards', displayName: 'Armor', color: '#64748b' },
    { fieldName: 'coreShards', displayName: 'Core', color: '#f59e0b' },
    { fieldName: 'cannonShards', displayName: 'Cannon', color: '#ef4444' },
    { fieldName: 'generatorShards', displayName: 'Generator', color: '#22c55e' },
  ],
}

export const REROLL_SHARDS_CONFIG: BreakdownConfig = {
  totalField: null, // Computed sum
  label: 'REROLL SHARDS',
  sources: [
    { fieldName: 'rerollShardsEarned', displayName: 'Earned', color: '#94a3b8' }, 
    { fieldName: 'rerollShards', displayName: 'from Guardian', color: '#94a3b8' },    
  ],
}

export const MODULES_CONFIG: BreakdownConfig = {
  totalField: null, // Computed sum
  label: 'MODULES',
  sources: [
    { fieldName: 'commonModules', displayName: 'Common', color: '#94a3b8' },
    { fieldName: 'rareModules', displayName: 'Rare', color: '#3b82f6' },
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
  'battleDate',
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
  COMBAT_MISC_CONFIG,
  ENEMIES_DESTROYED_CONFIG,
  DESTROYED_BY_CONFIG,
  ENEMIES_AFFECTED_BY_CONFIG,
  COINS_EARNED_CONFIG,
  OTHER_EARNINGS_CONFIG,
  UPGRADE_SHARDS_CONFIG,
  REROLL_SHARDS_CONFIG,
  MODULES_CONFIG,
])

// NOTE: Any field NOT in the configs above will appear in the "Miscellaneous" section.
// This is intentional - it ensures new/unknown game fields are always visible.
// If you want to hide a field completely, add it to SKIP_FIELDS instead.
