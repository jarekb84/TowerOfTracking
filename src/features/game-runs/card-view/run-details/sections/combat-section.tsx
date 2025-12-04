/**
 * Combat Section Component
 *
 * Two-column layout showing:
 * - Left: Damage Dealt breakdown with bars, Damage Taken plain fields
 * - Right: Enemies Destroyed breakdown with bars, Destroyed By breakdown with bars
 */

import type { CombatSectionProps, BreakdownGroupData, PlainFieldsData } from '../types'
import { SectionHeader } from './section-header'
import { BreakdownGroup } from '../breakdown/breakdown-group'
import { PlainFieldsGroup } from './plain-fields-group'

/** Left column: Damage dealt, damage taken, and combat misc */
function DamageColumn({ data }: CombatSectionProps) {
  return (
    <div className="space-y-6">
      {data.damageDealt && <BreakdownGroup data={data.damageDealt} />}
      {data.damageTaken.items.length > 0 && <PlainFieldsGroup data={data.damageTaken} />}
      {data.combatMisc.items.length > 0 && <PlainFieldsGroup data={data.combatMisc} />}
    </div>
  )
}

/** Right column: Enemies destroyed and killed/hit by */
function EnemiesColumn({ data }: CombatSectionProps) {
  return (
    <div className="space-y-6">
      {data.enemiesDestroyed && <BreakdownGroup data={data.enemiesDestroyed} />}
      {data.destroyedBy && <BreakdownGroup data={data.destroyedBy} />}
    </div>
  )
}

/** Check if plain fields data has any items to display */
function hasPlainItems(data: PlainFieldsData): boolean {
  return data.items.length > 0
}

/** Check if breakdown data exists */
function hasBreakdown(data: BreakdownGroupData | null): boolean {
  return data !== null
}

export function CombatSection({ data }: CombatSectionProps) {
  const hasLeftColumn = hasBreakdown(data.damageDealt) || hasPlainItems(data.damageTaken)
  const hasRightColumn = hasBreakdown(data.enemiesDestroyed) || hasBreakdown(data.destroyedBy)

  if (!hasLeftColumn && !hasRightColumn) {
    return null
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Combat" subtitle="Damage output, damage received, and destruction sources" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <DamageColumn data={data} />
        <EnemiesColumn data={data} />
      </div>
    </div>
  )
}
