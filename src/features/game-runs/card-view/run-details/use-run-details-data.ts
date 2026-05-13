/**
 * Run Details Data Hook
 *
 * Orchestrates the preparation of run-details data driven by the field
 * graph: categories → sections → fields (plain or breakdown).
 */

import { useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import {
  categoriesInDisplayOrder,
  fieldsInSection,
  isInternalField,
  sectionsInCategory,
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
import { deriveDisplayName } from './derive-display-name'
import { HIDDEN_FROM_RUN_DETAILS, SECTION_BREAKDOWNS } from './section-config'

const CATEGORY_LABELS: Record<string, string> = {
  'category:general': 'Battle Report',
  'category:records': 'Records',
  'category:combat': 'Combat',
  'category:economic': 'Economic',
}

function categoryLabel(categoryId: string): string {
  return CATEGORY_LABELS[categoryId] ?? deriveDisplayName(categoryId.replace('category:', ''))
}

function sectionLabel(sectionId: string): string {
  return deriveDisplayName(sectionId.replace('section:', '')).toUpperCase()
}

function buildPlainSection(
  run: ParsedGameRun,
  sectionId: string,
): SectionData | null {
  const fieldIds = fieldsInSection(sectionId).filter(
    (id) => !HIDDEN_FROM_RUN_DETAILS.has(id),
  )
  if (fieldIds.length === 0) return null

  const data = extractPlainFields(run, {
    label: sectionLabel(sectionId),
    fields: fieldIds.map((id) => ({ fieldName: id, displayName: deriveDisplayName(id) })),
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
  config: BreakdownConfig,
): SectionData | null {
  const group = calculateBreakdownGroup(run, config)
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
  const breakdown = SECTION_BREAKDOWNS[sectionId]
  if (breakdown !== undefined) {
    return buildBreakdownSection(run, sectionId, breakdown)
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
  for (const breakdownSection of Object.keys(SECTION_BREAKDOWNS)) {
    for (const source of SECTION_BREAKDOWNS[breakdownSection].sources) {
      categorized.add(source.fieldName)
    }
    const total = SECTION_BREAKDOWNS[breakdownSection].totalField
    if (total) categorized.add(total)
  }
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
