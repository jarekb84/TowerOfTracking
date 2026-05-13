/**
 * Run Details Component
 *
 * Displays detailed statistics for a single game run. Sections, ordering,
 * and category membership are all sourced from the field graph
 * (`@/shared/domain/field-graph`).
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
import { CategorySection } from './run-details/sections/category-section'
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

    if (newNotes !== extractNotesValue(run.fields)) {
      updatedFields = createUpdatedNotesFields(updatedFields, newNotes)
    }

    const currentRunType = extractRunTypeValue(run)
    if (newRunType !== currentRunType) {
      updatedFields = createUpdatedRunTypeFields(updatedFields, newRunType)
    }

    const currentRank = extractRankValue(run.fields)
    if (newRank !== currentRank) {
      updatedFields = createUpdatedRankFields(updatedFields, newRank)
    }

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
      <EditableUserFields
        notes={notes}
        runType={runType}
        rank={rank}
        onSave={handleUserFieldsUpdate}
      />

      {data.categories.map((category) => (
        <CategorySection key={category.categoryId} data={category} />
      ))}

      {data.uncategorized.items.length > 0 && (
        <div className="space-y-4">
          <SectionHeader title="Unmapped Fields" />
          <PlainFieldsGroup data={data.uncategorized} />
        </div>
      )}
    </div>
  )
}
