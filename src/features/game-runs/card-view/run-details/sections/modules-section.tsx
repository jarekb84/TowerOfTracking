/**
 * Modules Section Component
 *
 * Two-column layout showing:
 * - Left: Shards breakdown with bars (re-roll, armor, core, cannon, engine)
 * - Right: Modules breakdown with bars (common, rare)
 */

import type { ModulesSectionProps } from '../types'
import { SectionHeader } from './section-header'
import { BreakdownGroup } from '../breakdown/breakdown-group'

export function ModulesSection({ data }: ModulesSectionProps) {
  const hasUpgradeShards = data.upgradeShards !== null
  const hasRerollShards = data.rerollShards !== null
  const hasModules = data.modules !== null

  if (!hasUpgradeShards && !hasRerollShards && !hasModules) {
    return null
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Modules" subtitle="Shards collected and modules received" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column*/}
        <div className="space-y-6">
          {data.upgradeShards && (
            <BreakdownGroup data={data.upgradeShards} />
          )}

          {data.modules && (
            <BreakdownGroup data={data.modules} />
          )}
          
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {data.rerollShards && (
            <BreakdownGroup data={data.rerollShards} />
          )}
        </div>
      </div>
    </div>
  )
}
