import { edge } from '../../../builders';
import type { Edge, Node } from '../../../types';
import * as f from '../../fields.nodes';
import {
  CATEGORY_COMBAT_NODE,
  CATEGORY_ECONOMIC_NODE,
  CATEGORY_GENERAL_NODE,
  CATEGORY_RECORDS_NODE,
} from '../../categories.nodes';
import {
  SECTION_BATTLE_REPORT_NODE,
  SECTION_BONUS_HEALTH_GAINED_NODE,
  SECTION_CASH_NODE,
  SECTION_COINS_NODE,
  SECTION_COUNTS_NODE,
  SECTION_CURRENCIES_NODE,
  SECTION_DAMAGE_BLOCKED_NODE,
  SECTION_DAMAGE_NODE,
  SECTION_DAMAGE_TAKEN_NODE,
  SECTION_ENEMIES_DESTROYED_BY_NODE,
  SECTION_ENEMIES_HIT_BY_NODE,
  SECTION_HEALTH_REGENERATED_NODE,
  SECTION_KILLED_WITH_EFFECT_ACTIVE_NODE,
  SECTION_RECORDS_NODE,
  SECTION_TOTAL_ENEMIES_NODE,
  SECTION_UTILITY_NODE,
} from '../../sections.nodes';

// `HAS_DISPLAY_NAME` + `HAS_COLOR` for every Field, Section, and Category
// that renders in the UI. Cross-source-kind edges live here so consumers
// have one query (`displayNameOf` / `colorOf`) regardless of node kind.
//
// HAS_DISPLAY_NAME coverage:
//   - every Field node (~150) — explicit override when curated; otherwise
//     a Title-Cased default derived from the V3 canonical id suffix.
//   - every Section node (16) — display names match the breakdown-section
//     labels used in run-details (uppercased at the consumer for plain
//     section headers and breakdown headers alike).
//   - every Category node (4).
//
// HAS_COLOR coverage:
//   - the 77 breakdown source fields (genuine + supplementary). Other
//     fields don't render with color in any view today.
//
// `presentation.invariants.test.ts` enforces universal HAS_DISPLAY_NAME on
// Fields, Sections, and Categories.

interface CuratedPresentation {
  readonly displayName: string
  readonly color?: string
}

// Title-Cased default derived from the canonical id's section-prefix suffix.
// `battleReport_tier` → 'Tier'; `coins_goldenTower` → 'Golden Tower'. Used
// for every Field that doesn't have an explicit entry in `CURATED_FIELDS`.
function defaultFieldDisplayName(fieldId: string): string {
  const underscoreIndex = fieldId.indexOf('_')
  const suffix = underscoreIndex >= 0 ? fieldId.slice(underscoreIndex + 1) : fieldId
  return suffix
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

// Curated display names + colors for the 77 breakdown source fields.
// Colors are migrated from the pre-graph `breakdown-sources/coin-sources.ts`,
// `damage-sources.ts`, and the per-breakdown source lists in run-details
// `section-config.ts`. Fields without an entry use the Title-Cased default
// and have no HAS_COLOR edge.
const CURATED_FIELDS = new Map<string, CuratedPresentation>([
  // ── coin sources → battleReport_coinsEarned ─────────────────────────
  [f.COINS__DEATH_WAVE_NODE.id, { displayName: 'Death Wave', color: '#ef4444' }],
  [f.COINS__GOLDEN_TOWER_NODE.id, { displayName: 'Golden Tower', color: '#fbbf24' }],
  [f.COINS__SPOTLIGHT_NODE.id, { displayName: 'Spotlight', color: '#e2e8f0' }],
  [f.COINS__GOLDEN_BOT_NODE.id, { displayName: 'Golden Bot', color: '#fbbf24' }],
  [f.COINS__COINS_FETCHED_NODE.id, { displayName: 'Guardian Fetched', color: '#7c3aed' }],
  [f.COINS__BLACK_HOLE_NODE.id, { displayName: 'Black Hole', color: '#475569' }],
  [f.COINS__COIN_BONUS_UPGRADE_NODE.id, { displayName: 'Coin Bonus Upgrade', color: '#f59e0b' }],
  [f.COINS__COINS_FROM_COIN_BONUSES_NODE.id, { displayName: 'Coin Bonuses', color: '#fb923c' }],
  [f.COINS__ORBS_NODE.id, { displayName: 'Orbs', color: '#fda4af' }],
  [f.COINS__GOLDEN_COMBO_NODE.id, { displayName: 'Golden Combo', color: '#eab308' }],
  [f.COINS__BOUNTY_COINS_NODE.id, { displayName: 'Bounty Coins', color: '#facc15' }],
  [f.COINS__CRITICAL_COIN_NODE.id, { displayName: 'Critical Coin', color: '#f97316' }],
  [f.COINS__WAVE_SKIP_NODE.id, { displayName: 'Wave Skip', color: '#84cc16' }],
  [f.COINS__COINS_WAVE_NODE.id, { displayName: 'Coins / Wave', color: '#a3e635' }],

  // ── damage sources → damage_damageDealt ─────────────────────────────
  [f.DAMAGE__DEATH_WAVE_NODE.id, { displayName: 'Death Wave', color: '#ef4444' }],
  [f.DAMAGE__CHAIN_LIGHTNING_NODE.id, { displayName: 'Chain Lightning', color: '#3b82f6' }],
  [f.DAMAGE__THORNS_NODE.id, { displayName: 'Thorns', color: '#22d3ee' }],
  [f.DAMAGE__ORBS_NODE.id, { displayName: 'Orbs', color: '#f87171' }],
  [f.DAMAGE__FLAME_BOT_NODE.id, { displayName: 'Flame Bot', color: '#fbbf24' }],
  [f.DAMAGE__LAND_MINES_NODE.id, { displayName: 'Land Mines', color: '#9333ea' }],
  [f.DAMAGE__DEATH_RAY_NODE.id, { displayName: 'Death Ray', color: '#ff5722' }],
  [f.DAMAGE__SMART_MISSILES_NODE.id, { displayName: 'Smart Missiles', color: '#64748b' }],
  [f.DAMAGE__INNER_LAND_MINES_NODE.id, { displayName: 'Inner Land Mines', color: '#7c3aed' }],
  [f.DAMAGE__POISON_SWAMP_NODE.id, { displayName: 'Poison Swamp', color: '#22c55e' }],
  [f.DAMAGE__BLACK_HOLE_NODE.id, { displayName: 'Black Hole', color: '#475569' }],
  [f.DAMAGE__ELECTRONS_NODE.id, { displayName: 'Electrons', color: '#06b6d4' }],
  [f.DAMAGE__PROJECTILES_NODE.id, { displayName: 'Projectiles', color: '#f59e0b' }],
  [f.DAMAGE__REND_ARMOR_NODE.id, { displayName: 'Rend Armor', color: '#dc2626' }],
  [f.DAMAGE__ATTACK_CHIP_NODE.id, { displayName: 'Attack Chip', color: '#d946ef' }],
  [f.HEALTH_REGENERATED__LIFESTEAL_NODE.id, { displayName: 'Lifesteal', color: '#f43f5e' }],

  // ── totalEnemies sources → totalEnemies_totalEnemies ────────────────
  [f.TOTAL_ENEMIES__BASIC_NODE.id, { displayName: 'Basic', color: '#94a3b8' }],
  [f.TOTAL_ENEMIES__FAST_NODE.id, { displayName: 'Fast', color: '#38bdf8' }],
  [f.TOTAL_ENEMIES__TANK_NODE.id, { displayName: 'Tank', color: '#84cc16' }],
  [f.TOTAL_ENEMIES__RANGED_NODE.id, { displayName: 'Ranged', color: '#f97316' }],
  [f.TOTAL_ENEMIES__BOSS_NODE.id, { displayName: 'Boss', color: '#ef4444' }],
  [f.TOTAL_ENEMIES__PROTECTOR_NODE.id, { displayName: 'Protector', color: '#8b5cf6' }],
  [f.TOTAL_ENEMIES__VAMPIRES_NODE.id, { displayName: 'Vampires', color: '#dc2626' }],
  [f.TOTAL_ENEMIES__RAYS_NODE.id, { displayName: 'Rays', color: '#facc15' }],
  [f.TOTAL_ENEMIES__SCATTERS_NODE.id, { displayName: 'Scatters', color: '#fb923c' }],
  [f.TOTAL_ENEMIES__SABOTEUR_NODE.id, { displayName: 'Saboteur', color: '#6366f1' }],
  [f.TOTAL_ENEMIES__COMMANDER_NODE.id, { displayName: 'Commander', color: '#d97706' }],
  [f.TOTAL_ENEMIES__OVERCHARGE_NODE.id, { displayName: 'Overcharge', color: '#38bdf8' }],
  // Appears in the killedWithEffectActive supplementary breakdown.
  [f.TOTAL_ENEMIES__SUMMONED_ENEMIES_NODE.id, { displayName: 'Summoned Enemies', color: '#9333ea' }],

  // ── enemiesHitBy sources (supplementary breakdown) ──────────────────
  [f.ENEMIES_HIT_BY__PROJECTILES_NODE.id, { displayName: 'Projectiles', color: '#f59e0b' }],
  [f.ENEMIES_HIT_BY__THORNS_NODE.id, { displayName: 'Thorns', color: '#22d3ee' }],
  [f.ENEMIES_HIT_BY__ORBS_NODE.id, { displayName: 'Orbs', color: '#f87171' }],
  [f.ENEMIES_HIT_BY__DEATH_RAY_NODE.id, { displayName: 'Death Ray', color: '#ff5722' }],
  [f.ENEMIES_HIT_BY__CHAIN_LIGHTNING_NODE.id, { displayName: 'Chain Lightning', color: '#3b82f6' }],
  [f.ENEMIES_HIT_BY__SMART_MISSILES_NODE.id, { displayName: 'Smart Missiles', color: '#64748b' }],
  [f.ENEMIES_HIT_BY__INNER_LAND_MINES_NODE.id, { displayName: 'Inner Land Mines', color: '#7c3aed' }],
  [f.ENEMIES_HIT_BY__POISON_SWAMP_NODE.id, { displayName: 'Poison Swamp', color: '#22c55e' }],
  [f.ENEMIES_HIT_BY__DEATH_WAVE_NODE.id, { displayName: 'Death Wave', color: '#ef4444' }],
  [f.ENEMIES_HIT_BY__BLACK_HOLE_NODE.id, { displayName: 'Black Hole', color: '#475569' }],
  [f.ENEMIES_HIT_BY__FLAME_BOT_NODE.id, { displayName: 'Flame Bot', color: '#fbbf24' }],
  [f.ENEMIES_HIT_BY__ATTACK_CHIP_NODE.id, { displayName: 'Attack Chip', color: '#d946ef' }],
  [f.ENEMIES_HIT_BY__LAND_MINES_NODE.id, { displayName: 'Land Mines', color: '#9333ea' }],
  [f.ENEMIES_HIT_BY__CHRONO_FIELD_NODE.id, { displayName: 'Chrono Field', color: '#0ea5e9' }],
  [f.ENEMIES_HIT_BY__ORBITAL_AUGMENT_NODE.id, { displayName: 'Orbital Augment', color: '#a3e635' }],
  [f.ENEMIES_HIT_BY__THUNDER_BOT_NODE.id, { displayName: 'Thunder Bot', color: '#eab308' }],

  // ── enemiesDestroyedBy sources (supplementary breakdown) ────────────
  [f.ENEMIES_DESTROYED_BY__ORBS_NODE.id, { displayName: 'Orbs', color: '#f87171' }],
  [f.ENEMIES_DESTROYED_BY__THORNS_NODE.id, { displayName: 'Thorns', color: '#22d3ee' }],
  [f.ENEMIES_DESTROYED_BY__DEATH_RAY_NODE.id, { displayName: 'Death Ray', color: '#ff5722' }],
  [f.ENEMIES_DESTROYED_BY__LAND_MINES_NODE.id, { displayName: 'Land Mines', color: '#9333ea' }],
  [f.ENEMIES_DESTROYED_BY__INNER_LAND_MINES_NODE.id, { displayName: 'Inner Land Mines', color: '#7c3aed' }],
  [f.ENEMIES_DESTROYED_BY__BLACK_HOLE_NODE.id, { displayName: 'Black Hole', color: '#475569' }],
  [f.ENEMIES_DESTROYED_BY__CHAIN_LIGHTNING_NODE.id, { displayName: 'Chain Lightning', color: '#3b82f6' }],
  [f.ENEMIES_DESTROYED_BY__FLAME_BOT_NODE.id, { displayName: 'Flame Bot', color: '#fbbf24' }],
  [f.ENEMIES_DESTROYED_BY__POISON_SWAMP_NODE.id, { displayName: 'Poison Swamp', color: '#22c55e' }],
  [f.ENEMIES_DESTROYED_BY__PROJECTILES_NODE.id, { displayName: 'Projectiles', color: '#f59e0b' }],
  [f.ENEMIES_DESTROYED_BY__SMART_MISSILES_NODE.id, { displayName: 'Smart Missiles', color: '#64748b' }],
  [f.ENEMIES_DESTROYED_BY__OTHER_NODE.id, { displayName: 'Other', color: '#a1a1aa' }],

  // ── killedWithEffectActive sources (supplementary breakdown) ────────
  [f.KILLED_WITH_EFFECT_ACTIVE__SPOTLIGHT_NODE.id, { displayName: 'Spotlight', color: '#e2e8f0' }],
  [f.KILLED_WITH_EFFECT_ACTIVE__DEATH_WAVE_NODE.id, { displayName: 'Death Wave', color: '#ef4444' }],
  [f.KILLED_WITH_EFFECT_ACTIVE__GOLDEN_BOT_NODE.id, { displayName: 'Golden Bot', color: '#fbbf24' }],
  [f.KILLED_WITH_EFFECT_ACTIVE__GOLDEN_TOWER_NODE.id, { displayName: 'Golden Tower', color: '#facc15' }],
  [f.KILLED_WITH_EFFECT_ACTIVE__AMPLIFY_BOT_NODE.id, { displayName: 'Amplify Bot', color: '#a855f7' }],
  [f.KILLED_WITH_EFFECT_ACTIVE__DEATH_PENALTY_NODE.id, { displayName: 'Death Penalty', color: '#be123c' }],

  // ── curated non-breakdown field names that the default helper doesn't
  // get quite right (display label that pre-dated camelCase canonical id) ──
  [f.BATTLE_REPORT__KILLED_BY_NODE.id, { displayName: 'Killed By' }],
  [f.BATTLE_REPORT__BATTLE_DATE_NODE.id, { displayName: 'Battle Date' }],
  [f.BATTLE_REPORT__GAME_TIME_NODE.id, { displayName: 'Game Time' }],
  [f.BATTLE_REPORT__REAL_TIME_NODE.id, { displayName: 'Real Time' }],
  [f.BATTLE_REPORT__COINS_EARNED_NODE.id, { displayName: 'Coins Earned' }],
  [f.BATTLE_REPORT__COINS_PER_HOUR_NODE.id, { displayName: 'Coins / Hour' }],
  [f.BATTLE_REPORT__CELLS_EARNED_NODE.id, { displayName: 'Cells Earned' }],
  [f.BATTLE_REPORT__CELLS_PER_HOUR_NODE.id, { displayName: 'Cells / Hour' }],
  [f.DAMAGE__DAMAGE_DEALT_NODE.id, { displayName: 'Damage Dealt' }],
  [f.TOTAL_ENEMIES__TOTAL_ENEMIES_NODE.id, { displayName: 'Total Enemies' }],
  [f.CURRENCIES__CELLS_EARNED_NODE.id, { displayName: 'Cells Earned' }],
  [f.CURRENCIES__MEDALS_NODE.id, { displayName: 'Guardian Medals' }],
  [f.CURRENCIES__GEMS_NODE.id, { displayName: 'Gems' }],
  [f.CURRENCIES__AD_GEMS_NODE.id, { displayName: 'Ad Gems' }],
  [f.CURRENCIES__FETCH_GEMS_NODE.id, { displayName: 'Fetch Gems' }],
  [f.CURRENCIES__GEM_BLOCKS_TAPPED_NODE.id, { displayName: 'Gem Blocks Tapped' }],
  [f.CASH__CASH_EARNED_NODE.id, { displayName: 'Cash Earned' }],
  [f.CASH__INTEREST_EARNED_NODE.id, { displayName: 'Interest Earned' }],
  [f.CASH__GOLDEN_TOWER_NODE.id, { displayName: 'Golden Tower (Cash)' }],
])

const ALL_FIELD_NODES: readonly Node[] = Object.values(f).filter(
  (v): v is Node =>
    typeof v === 'object' && v !== null && 'id' in v && 'kind' in v,
)

const FIELD_HAS_DISPLAY_NAME_EDGES: readonly Edge[] = ALL_FIELD_NODES.map((node) => {
  const curated = CURATED_FIELDS.get(node.id)
  return edge(node.id, 'HAS_DISPLAY_NAME', curated?.displayName ?? defaultFieldDisplayName(node.id))
})

const FIELD_HAS_COLOR_EDGES: readonly Edge[] = ALL_FIELD_NODES.flatMap((node) => {
  const curated = CURATED_FIELDS.get(node.id)
  return curated?.color ? [edge(node.id, 'HAS_COLOR', curated.color)] : []
})

// Section display names. Uppercased at the consumer for run-details
// section/breakdown headers. The labels chosen here match the pre-commit-6
// curated breakdown labels (e.g. `section:damage` → 'Damage Dealt' so
// uppercase yields the historical 'DAMAGE DEALT').
const SECTION_DISPLAY_NAMES: ReadonlyArray<readonly [Node, string]> = [
  [SECTION_BATTLE_REPORT_NODE, 'Battle Report'],
  [SECTION_BONUS_HEALTH_GAINED_NODE, 'Bonus Health Gained'],
  [SECTION_CASH_NODE, 'Cash'],
  [SECTION_COINS_NODE, 'Coins Earned'],
  [SECTION_COUNTS_NODE, 'Counts'],
  [SECTION_CURRENCIES_NODE, 'Currencies'],
  [SECTION_DAMAGE_NODE, 'Damage Dealt'],
  [SECTION_DAMAGE_BLOCKED_NODE, 'Damage Blocked'],
  [SECTION_DAMAGE_TAKEN_NODE, 'Damage Taken'],
  [SECTION_ENEMIES_DESTROYED_BY_NODE, 'Enemies Destroyed By'],
  [SECTION_ENEMIES_HIT_BY_NODE, 'Enemies Hit By'],
  [SECTION_HEALTH_REGENERATED_NODE, 'Health Regenerated'],
  [SECTION_KILLED_WITH_EFFECT_ACTIVE_NODE, 'Killed With Effect Active'],
  [SECTION_RECORDS_NODE, 'Records'],
  [SECTION_TOTAL_ENEMIES_NODE, 'Enemies Destroyed'],
  [SECTION_UTILITY_NODE, 'Utility'],
]

const SECTION_HAS_DISPLAY_NAME_EDGES: readonly Edge[] = SECTION_DISPLAY_NAMES.map(
  ([node, name]) => edge(node.id, 'HAS_DISPLAY_NAME', name),
)

// Category display names. `category:general` is rendered as 'Battle Report'
// in run-details — kept for continuity with the pre-graph CATEGORY_LABELS map.
const CATEGORY_DISPLAY_NAMES: ReadonlyArray<readonly [Node, string]> = [
  [CATEGORY_GENERAL_NODE, 'Battle Report'],
  [CATEGORY_RECORDS_NODE, 'Records'],
  [CATEGORY_COMBAT_NODE, 'Combat'],
  [CATEGORY_ECONOMIC_NODE, 'Economic'],
]

const CATEGORY_HAS_DISPLAY_NAME_EDGES: readonly Edge[] = CATEGORY_DISPLAY_NAMES.map(
  ([node, name]) => edge(node.id, 'HAS_DISPLAY_NAME', name),
)

export const PRESENTATION_EDGES: readonly Edge[] = [
  ...FIELD_HAS_DISPLAY_NAME_EDGES,
  ...FIELD_HAS_COLOR_EDGES,
  ...SECTION_HAS_DISPLAY_NAME_EDGES,
  ...CATEGORY_HAS_DISPLAY_NAME_EDGES,
]
