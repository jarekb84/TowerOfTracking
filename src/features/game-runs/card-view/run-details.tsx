/**
 * Run Details Component
 *
 * Displays detailed statistics for a single game run.
 * Organized by purpose (what users want to understand) rather than source (where data came from).
 */

import type { ParsedGameRun, RunTypeValue } from '@/shared/types/game-run.types'
import { EditableUserFields } from '../editing/editable-user-fields'
import { useData } from '@/shared/domain/use-data'
import {
  createUpdatedNotesFields,
  createUpdatedRunTypeFields,
  createUpdatedRankFields,
  extractNotesValue,
  extractRunTypeValue,
  extractRankValue,
  type RankValue,
} from '../editing/field-update-logic'
import { useRunDetailsData } from './run-details/use-run-details-data'
import { BattleReportSection } from './run-details/sections/battle-report-section'
import { CombatSection } from './run-details/sections/combat-section'
import { EconomicSection } from './run-details/sections/economic-section'
import { ModulesSection } from './run-details/sections/modules-section'
import { PlainFieldsGroup } from './run-details/sections/plain-fields-group'
import { SectionHeader } from './run-details/sections/section-header'

interface RunDetailsProps {
  run: ParsedGameRun
}

export function RunDetails({ run }: RunDetailsProps) {
  const { updateRun } = useData()
  const data = useRunDetailsData(run)

  const handleUserFieldsUpdate = (newNotes: string, newRunType: RunTypeValue, newRank: RankValue) => {
    let updatedFields = { ...run.fields }

    // Apply notes update if changed
    if (newNotes !== extractNotesValue(run.fields)) {
      updatedFields = createUpdatedNotesFields(updatedFields, newNotes)
    }

    // Apply run type update if changed
    const currentRunType = extractRunTypeValue(run)
    if (newRunType !== currentRunType) {
      updatedFields = createUpdatedRunTypeFields(updatedFields, newRunType)
    }

    // Apply rank update if changed
    const currentRank = extractRankValue(run.fields)
    if (newRank !== currentRank) {
      updatedFields = createUpdatedRankFields(updatedFields, newRank)
    }

    // Single update with all changes
    updateRun(run.id, {
      fields: updatedFields,
      runType: newRunType,
    })
  }

  const notes = extractNotesValue(run.fields)
  const runType = extractRunTypeValue(run)
  const rank = extractRankValue(run.fields)

  return (
    <div className="space-y-6">
      {/* User-editable fields (notes, run type, rank) */}
      <EditableUserFields
        notes={notes}
        runType={runType}
        rank={rank}
        onSave={handleUserFieldsUpdate}
      />

      {/* Battle Report (essential run identity) */}
      <BattleReportSection data={data.battleReport} />

      {/* Combat (damage dealt/taken, enemies destroyed) */}
      <CombatSection data={data.combat} />

      {/* Economic (coins earned, other earnings) */}
      <EconomicSection data={data.economic} />

      {/* Modules (shards, modules) */}
      <ModulesSection data={data.modules} />

      {/* Uncategorized fields (fallback for new/unknown fields) */}
      {data.uncategorized.items.length > 0 && (
        <div className="space-y-4">
          <SectionHeader title="Miscellaneous" />
          <PlainFieldsGroup data={data.uncategorized} />
        </div>
      )}
    </div>
  )
}
