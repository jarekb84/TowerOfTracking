/**
 * Category Section Component
 *
 * Renders one run-details category (general / records / combat / economic)
 * as a header plus the category's sections — either plain field lists or
 * breakdown groups depending on each section's kind.
 */

import type { CategorySectionProps, SectionData } from '../types'
import { SectionHeader } from './section-header'
import { PlainFieldsGroup } from './plain-fields-group'
import { BreakdownGroup } from '../breakdown/breakdown-group'

function SectionRenderer({ section }: { section: SectionData }) {
  if (section.kind === 'plain') {
    return (
      <PlainFieldsGroup
        data={{
          label: section.label,
          items: section.items,
        }}
      />
    )
  }
  return (
    <BreakdownGroup
      data={{
        label: section.label,
        total: section.total,
        totalDisplayValue: section.totalDisplayValue,
        perHourDisplayValue: section.perHourDisplayValue,
        items: section.items,
      }}
    />
  )
}

export function CategorySection({ data }: CategorySectionProps) {
  if (data.sections.length === 0) return null

  return (
    <div className="space-y-4">
      <SectionHeader title={data.label} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {data.sections.map((section) => (
          <SectionRenderer key={section.sectionId} section={section} />
        ))}
      </div>
    </div>
  )
}
