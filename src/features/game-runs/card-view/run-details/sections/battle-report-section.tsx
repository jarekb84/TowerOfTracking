/**
 * Battle Report Section Component
 *
 * Displays the essential run identity fields at the top of run details.
 * Includes: tier, wave, game time, real time, killed by, and miscellaneous fields.
 */

import type { BattleReportSectionProps } from '../types'
import { SectionHeader } from './section-header'
import { PlainFieldsGroup } from './plain-fields-group'

export function BattleReportSection({ data }: BattleReportSectionProps) {
  const hasEssential = data.essential.items.length > 0
  const hasMiscellaneous = data.miscellaneous.items.length > 0

  if (!hasEssential && !hasMiscellaneous) {
    return null
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Battle Report" subtitle="Essential run identity and progression" />

      <div className="space-y-6">
        {/* Essential run identity fields */}
        {hasEssential && (
          <PlainFieldsGroup data={data.essential} />
        )}

        {/* Miscellaneous fields (waves skipped, recovery, free upgrades) */}
        {hasMiscellaneous && (
          <PlainFieldsGroup data={data.miscellaneous} />
        )}
      </div>
    </div>
  )
}
