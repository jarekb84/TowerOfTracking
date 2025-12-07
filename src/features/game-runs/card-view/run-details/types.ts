/**
 * Run Details Types
 *
 * Type definitions for the purpose-based run details display.
 * Supports percentage breakdowns with visual bars.
 */


/**
 * Configuration for a single breakdown source field
 */
interface BreakdownSourceConfig {
  /** camelCase field name in run.fields */
  fieldName: string
  /** Display name (overrides original field name) */
  displayName: string
  /** Hex color for the bar visualization */
  color: string
}

/**
 * Configuration for a breakdown group (e.g., Damage Dealt, Coins Earned)
 */
export interface BreakdownConfig {
  /** Field containing the total, or null for computed sum */
  totalField: string | null
  /** Section header label */
  label: string
  /** Optional per-hour rate field */
  perHourField?: string
  /** Source fields that break down the total */
  sources: BreakdownSourceConfig[]
  /**
   * Skip discrepancy detection for this group.
   * Use when sources are supplementary data that don't sum to the total.
   * Example: "Enemies Affected By" - the sources aren't meant to add up to totalEnemies.
   */
  skipDiscrepancy?: boolean
}

/**
 * Configuration for a plain field (no percentage bar)
 */
interface PlainFieldConfig {
  /** camelCase field name in run.fields */
  fieldName: string
  /** Display name (overrides original field name) */
  displayName?: string
}

/**
 * Configuration for a group of plain fields
 */
export interface PlainFieldsConfig {
  /** Optional group label (e.g., "MISCELLANEOUS") */
  label?: string
  /** Fields in this group */
  fields: PlainFieldConfig[]
}

/**
 * A single item in a breakdown (computed from config + run data)
 */
export interface BreakdownItem {
  /** camelCase field name */
  fieldName: string
  /** Display name */
  displayName: string
  /** Hex color for bar */
  color: string
  /** Numeric value */
  value: number
  /** Percentage of total (0-100) */
  percentage: number
  /** Formatted display value (e.g., "1.5B") */
  displayValue: string
  /** True if this is a discrepancy entry (Unknown/Overage) */
  isDiscrepancy?: boolean
  /** Type of discrepancy if isDiscrepancy is true */
  discrepancyType?: 'unknown' | 'overage'
}

/**
 * Complete data for a breakdown group
 */
export interface BreakdownGroupData {
  /** Section header label */
  label: string
  /** Total numeric value */
  total: number
  /** Formatted total (e.g., "892M") */
  totalDisplayValue: string
  /** Optional per-hour rate formatted (e.g., "20.1M") */
  perHourDisplayValue?: string
  /** Breakdown items sorted by percentage descending */
  items: BreakdownItem[]
}

/**
 * A single plain field (computed from config + run data)
 */
export interface PlainFieldItem {
  /** camelCase field name */
  fieldName: string
  /** Display name */
  displayName: string
  /** Formatted display value */
  displayValue: string
}

/**
 * Complete data for a plain fields group
 */
export interface PlainFieldsData {
  /** Optional group label */
  label?: string
  /** Fields with values */
  items: PlainFieldItem[]
}

/**
 * Complete run details data organized by purpose-based sections
 */
export interface RunDetailsData {
  /** Battle Report section (top) */
  battleReport: {
    essential: PlainFieldsData
    miscellaneous: PlainFieldsData
  }
  /** Combat section (two-column) */
  combat: {
    damageDealt: BreakdownGroupData | null
    damageTaken: PlainFieldsData
    combatMisc: PlainFieldsData
    enemiesDestroyed: BreakdownGroupData | null
    destroyedBy: BreakdownGroupData | null
  }
  /** Economic section (two-column) */
  economic: {
    coinsEarned: BreakdownGroupData | null
    enemiesAffectedBy: BreakdownGroupData | null
    otherEarnings: PlainFieldsData
  }
  /** Modules section (two-column) */
  modules: {
    rerollShards: BreakdownGroupData | null
    upgradeShards: BreakdownGroupData | null
    modules: BreakdownGroupData | null
  }
  /** Any fields not explicitly categorized */
  uncategorized: PlainFieldsData
}

/**
 * Props for section components
 */
export interface BattleReportSectionProps {
  data: RunDetailsData['battleReport']
}

export interface CombatSectionProps {
  data: RunDetailsData['combat']
}

export interface EconomicSectionProps {
  data: RunDetailsData['economic']
}

export interface ModulesSectionProps {
  data: RunDetailsData['modules']
}
