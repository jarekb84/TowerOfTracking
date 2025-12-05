/**
 * Economic Section Component
 *
 * Two-column layout showing:
 * - Left: Coins Earned breakdown with bars (includes per-hour rate)
 * - Right: Enemies Affected By breakdown, Other Earnings plain fields
 */

import type { EconomicSectionProps } from '../types'
import { SectionHeader } from './section-header'
import { BreakdownGroup } from '../breakdown/breakdown-group'
import { PlainFieldsGroup } from './plain-fields-group'

export function EconomicSection({ data }: EconomicSectionProps) {
  const hasLeftColumn = data.coinsEarned !== null
  const hasRightColumn = data.enemiesAffectedBy !== null || data.otherEarnings.items.length > 0

  if (!hasLeftColumn && !hasRightColumn) {
    return null
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Economic" subtitle="Currency earned and resource generation" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column: Coins Earned breakdown */}
        <div className="space-y-6">
          {data.coinsEarned && (
            <BreakdownGroup data={data.coinsEarned} />
          )}
        </div>

        {/* Right Column: Enemies Affected By + Other Earnings */}
        <div className="space-y-6">
          {data.enemiesAffectedBy && (
            <BreakdownGroup data={data.enemiesAffectedBy} />
          )}
          {data.otherEarnings.items.length > 0 && (
            <PlainFieldsGroup data={data.otherEarnings} />
          )}
        </div>
      </div>
    </div>
  )
}
