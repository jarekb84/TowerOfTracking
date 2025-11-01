import { createFileRoute } from '@tanstack/react-router'
import { TabbedRunsTable } from '../features/game-runs/table/tabbed-runs-table'
import { RunTypeValue } from '@/shared/domain/run-types/types'

interface RunsSearchParams {
  type?: RunTypeValue
}

export const Route = createFileRoute('/runs')({
  component: RunsPage,
  validateSearch: (search): RunsSearchParams => {
    return {
      type: search.type as RunTypeValue | undefined,
    }
  },
})

function RunsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Main Content */}
      <TabbedRunsTable />
    </div>
  )
}