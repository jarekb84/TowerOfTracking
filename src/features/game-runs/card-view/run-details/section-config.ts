/**
 * Section Breakdown Configs
 *
 * Per-section breakdown definitions — total field + colored sources for the
 * percentage-bar visualizations rendered in run-details.
 *
 * TRANSITIONAL — these configs survive until commit 7, which lands the
 * `IS_SOURCE_OF` + `HAS_COLOR` + `HAS_DISPLAY_NAME` edges on field nodes.
 * After commit 7, breakdowns are derived from the graph:
 *   sourcesOf(totalField) -> [{ fieldName, displayName, color }, ...]
 * and this file is deleted entirely.
 *
 * Keys are V3 section ids (`section:damage`, …) — the graph-aligned section
 * that a breakdown renders under. Sections without a key here render as
 * plain field lists.
 */

import {
  COINS_EARNED_CATEGORY,
  DAMAGE_DEALT_CATEGORY,
} from '@/shared/domain/fields/breakdown-sources'
import type { BreakdownConfig } from './types'

const DAMAGE_DEALT: BreakdownConfig = {
  totalField: DAMAGE_DEALT_CATEGORY.totalField!,
  label: DAMAGE_DEALT_CATEGORY.name.toUpperCase(),
  sources: DAMAGE_DEALT_CATEGORY.fields.map((f) => ({
    fieldName: f.fieldName,
    displayName: f.displayName,
    color: f.color,
  })),
}

const COINS_EARNED: BreakdownConfig = {
  totalField: COINS_EARNED_CATEGORY.totalField!,
  label: COINS_EARNED_CATEGORY.name.toUpperCase(),
  perHourField: COINS_EARNED_CATEGORY.perHourField,
  sources: COINS_EARNED_CATEGORY.fields.map((f) => ({
    fieldName: f.fieldName,
    displayName: f.displayName,
    color: f.color,
  })),
}

const ENEMIES_DESTROYED: BreakdownConfig = {
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

const ENEMIES_HIT_BY: BreakdownConfig = {
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

const ENEMIES_DESTROYED_BY: BreakdownConfig = {
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

const ENEMIES_AFFECTED_BY: BreakdownConfig = {
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

/**
 * Section id -> breakdown config. Sections without a key render as plain
 * field lists driven by graph queries.
 */
export const SECTION_BREAKDOWNS: Readonly<Record<string, BreakdownConfig>> = {
  'section:damage': DAMAGE_DEALT,
  'section:coins': COINS_EARNED,
  'section:totalEnemies': ENEMIES_DESTROYED,
  'section:enemiesHitBy': ENEMIES_HIT_BY,
  'section:enemiesDestroyedBy': ENEMIES_DESTROYED_BY,
  'section:killedWithEffectActive': ENEMIES_AFFECTED_BY,
}

/**
 * Fields hidden from run-details rendering even though they belong to a
 * declared section. Today this is only `battleReport_battleDate`, which is
 * already rendered in the run card's header — duplicating it inside the
 * Battle Report section would be noisy. Internal app-fields (`_date`,
 * `_time`, `_notes`, `_runType`, `_rank`) are excluded structurally via
 * `isInternalField()` and don't need an entry here.
 */
export const HIDDEN_FROM_RUN_DETAILS: ReadonlySet<string> = new Set([
  'battleReport_battleDate',
])
