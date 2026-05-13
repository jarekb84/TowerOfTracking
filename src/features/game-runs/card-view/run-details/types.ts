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
 * A single section rendered in run-details — either a list of plain fields
 * or a breakdown with totals + percentage bars.
 *
 * Both kinds share the `label` field, and a stable section id
 * (`section:battleReport` etc.) used for React keys.
 */
export type SectionData =
  | {
      kind: 'plain'
      sectionId: string
      label: string
      items: PlainFieldItem[]
    }
  | {
      kind: 'breakdown'
      sectionId: string
      label: string
      total: number
      totalDisplayValue: string
      perHourDisplayValue?: string
      items: BreakdownItem[]
    }

/**
 * One UI category (general / records / combat / economic) and its sections
 * in declaration order.
 */
export interface CategoryData {
  categoryId: string
  label: string
  sections: SectionData[]
}

/**
 * Complete run details data organized by category.
 */
export interface RunDetailsData {
  /** Categories in catalog declaration order. */
  categories: CategoryData[]
  /** Fields that don't belong to any catalog section. */
  uncategorized: PlainFieldsData
}

/**
 * Props for the category section component.
 */
export interface CategorySectionProps {
  data: CategoryData
}
