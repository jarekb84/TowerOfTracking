/**
 * Run Details Data Hook
 *
 * Orchestrates the preparation of run-details data driven by the field
 * graph. Categories → sections → fields (plain or breakdown). Every facet
 * — section ordering, breakdown denominators, source lists, display names,
 * colors — comes from the graph.
 *
 * Breakdown source resolution:
 *   - Genuine sum-to-total breakdowns use `sourcesOf(totalField)` and run
 *     discrepancy detection.
 *   - Supplementary same-denominator breakdowns use the intersection of
 *     `fieldsMeasuredAgainst(totalField)` with `fieldsInSection(sectionId)`
 *     and skip discrepancy detection (sources don't sum to the denominator).
 */

import { useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import {
  breakdownRateOf,
  breakdownTotalOf,
  categoriesInDisplayOrder,
  colorOf,
  displayNameOf,
  fieldsInSection,
  fieldsMeasuredAgainst,
  isInternalField,
  sectionsInCategory,
  sourcesOf,
} from '@/shared/domain/field-graph'
import type {
  BreakdownConfig,
  CategoryData,
  PlainFieldsData,
  RunDetailsData,
  SectionData,
} from './types'
import {
  calculateBreakdownGroup,
  extractPlainFields,
} from './breakdown/breakdown-calculations'

const DEFAULT_BREAKDOWN_COLOR = '#a1a1aa'

// `battleReport_battleDate` is rendered in the run card header, so it's
// suppressed from the section listing to avoid duplicate display. Per-view
// visibility like this becomes an APPEARS_IN_VIEW exclusion in commit 12.
const HIDDEN_FROM_RUN_DETAILS: ReadonlySet<string> = new Set(['battleReport_battleDate'])

function categoryLabel(categoryId: string): string {
  return displayNameOf(categoryId) ?? categoryId
}

function sectionLabel(sectionId: string): string {
  return (displayNameOf(sectionId) ?? sectionId).toUpperCase()
}

function fieldDisplayName(fieldId: string): string {
  return displayNameOf(fieldId) ?? fieldId
}

function fieldColor(fieldId: string): string {
  return colorOf(fieldId) ?? DEFAULT_BREAKDOWN_COLOR
}

/**
 * Resolve a section's breakdown source list.
 *
 * Genuine breakdown: a section that contains at least one IS_SOURCE_OF of
 * the denominator. Returns ALL direct sources in catalog declaration order
 * — cross-section sources are intentional (e.g. `healthRegenerated_lifesteal`
 * contributes to `damage_damageDealt`).
 *
 * Supplementary breakdown: no field in the section is a direct source of
 * the denominator. Returns the section's fields that are IS_MEASURED_AGAINST
 * the denominator, in BELONGS_TO_SECTION declaration order.
 */
function resolveBreakdownSources(sectionId: string, totalField: string): {
  readonly sourceIds: readonly string[]
  readonly isSupplementary: boolean
} {
  const sectionFieldSet = new Set(fieldsInSection(sectionId))
  const directSources = sourcesOf(totalField)
  const isGenuine = directSources.some((id) => sectionFieldSet.has(id))
  if (isGenuine) {
    return { sourceIds: directSources, isSupplementary: false }
  }
  const measuredSet = new Set(fieldsMeasuredAgainst(totalField))
  const supplementarySources = fieldsInSection(sectionId).filter((id) => measuredSet.has(id))
  return { sourceIds: supplementarySources, isSupplementary: true }
}

function buildBreakdownConfig(sectionId: string, totalField: string): BreakdownConfig {
  const { sourceIds, isSupplementary } = resolveBreakdownSources(sectionId, totalField)
  return {
    totalField,
    label: sectionLabel(sectionId),
    perHourField: breakdownRateOf(sectionId),
    skipDiscrepancy: isSupplementary,
    sources: sourceIds.map((id) => ({
      fieldName: id,
      displayName: fieldDisplayName(id),
      color: fieldColor(id),
    })),
  }
}

function buildPlainSection(
  run: ParsedGameRun,
  sectionId: string,
): SectionData | null {
  const breakdownTotal = breakdownTotalOf(sectionId)
  const fieldIds = fieldsInSection(sectionId).filter((id) => {
    if (HIDDEN_FROM_RUN_DETAILS.has(id)) return false
    if (breakdownTotal !== undefined && id === breakdownTotal) return false
    return true
  })
  if (fieldIds.length === 0) return null

  const data = extractPlainFields(run, {
    label: sectionLabel(sectionId),
    fields: fieldIds.map((id) => ({ fieldName: id, displayName: fieldDisplayName(id) })),
  })
  if (data.items.length === 0) return null

  return {
    kind: 'plain',
    sectionId,
    label: data.label ?? sectionLabel(sectionId),
    items: data.items,
  }
}

function buildBreakdownSection(
  run: ParsedGameRun,
  sectionId: string,
  totalField: string,
): SectionData | null {
  const group = calculateBreakdownGroup(run, buildBreakdownConfig(sectionId, totalField))
  if (group === null) return null
  return {
    kind: 'breakdown',
    sectionId,
    label: group.label,
    total: group.total,
    totalDisplayValue: group.totalDisplayValue,
    perHourDisplayValue: group.perHourDisplayValue,
    items: group.items,
  }
}

function buildSection(run: ParsedGameRun, sectionId: string): SectionData | null {
  const totalField = breakdownTotalOf(sectionId)
  if (totalField !== undefined) {
    return buildBreakdownSection(run, sectionId, totalField)
  }
  return buildPlainSection(run, sectionId)
}

function buildCategory(run: ParsedGameRun, categoryId: string): CategoryData {
  const sections: SectionData[] = []
  for (const sectionId of sectionsInCategory(categoryId)) {
    const section = buildSection(run, sectionId)
    if (section !== null) sections.push(section)
  }
  return {
    categoryId,
    label: categoryLabel(categoryId),
    sections,
  }
}

function buildUncategorized(run: ParsedGameRun): PlainFieldsData {
  const categorized = new Set<string>()
  for (const categoryId of categoriesInDisplayOrder()) {
    for (const sectionId of sectionsInCategory(categoryId)) {
      for (const fieldId of fieldsInSection(sectionId)) {
        categorized.add(fieldId)
      }
    }
  }

  const items = Object.entries(run.fields)
    .filter(([fieldName, field]) => {
      if (categorized.has(fieldName)) return false
      if (HIDDEN_FROM_RUN_DETAILS.has(fieldName)) return false
      if (isInternalField(fieldName)) return false
      return !!field
    })
    .map(([fieldName, field]) => ({
      fieldName,
      displayName: field.originalKey,
      displayValue: field.displayValue,
    }))

  return {
    label: 'UNMAPPED FIELDS',
    items,
  }
}

/**
 * Hook that prepares all run details data for display.
 * Memoized to avoid recalculation on every render.
 */
export function useRunDetailsData(run: ParsedGameRun): RunDetailsData {
  return useMemo(() => {
    const categories = categoriesInDisplayOrder().map((id) => buildCategory(run, id))
    const uncategorized = buildUncategorized(run)
    return { categories, uncategorized }
  }, [run])
}
