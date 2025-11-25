import { createFileRoute } from '@tanstack/react-router'
import { RunType } from '@/shared/domain/run-types/types'
import { FarmingRunsTable } from '@/features/game-runs/table-variants/farming-runs-table'
import { useFilteredRuns } from '@/features/game-runs/filters/use-filtered-runs'

export const Route = createFileRoute('/runs/farm')({
  component: FarmRunsPage,
})

function FarmRunsPage() {
  const { runs, removeRun } = useFilteredRuns(RunType.FARM)

  return <FarmingRunsTable runs={runs} removeRun={removeRun} />
}
