import { createFileRoute } from '@tanstack/react-router'
import { RunType } from '@/shared/domain/run-types/types'
import { MilestoneRunsTable } from '@/features/game-runs/table-variants/milestone-runs-table'
import { useFilteredRuns } from '@/features/game-runs/filters/use-filtered-runs'

export const Route = createFileRoute('/runs/milestone')({
  component: MilestoneRunsPage,
})

function MilestoneRunsPage() {
  const { runs, removeRun } = useFilteredRuns(RunType.MILESTONE)

  return <MilestoneRunsTable runs={runs} removeRun={removeRun} />
}
