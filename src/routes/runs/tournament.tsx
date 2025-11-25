import { createFileRoute } from '@tanstack/react-router'
import { RunType } from '@/shared/domain/run-types/types'
import { TournamentRunsTable } from '@/features/game-runs/table-variants/tournament-runs-table'
import { useFilteredRuns } from '@/features/game-runs/filters/use-filtered-runs'

export const Route = createFileRoute('/runs/tournament')({
  component: TournamentRunsPage,
})

function TournamentRunsPage() {
  const { runs, removeRun } = useFilteredRuns(RunType.TOURNAMENT)

  return <TournamentRunsTable runs={runs} removeRun={removeRun} />
}
