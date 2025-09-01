import { createFileRoute } from '@tanstack/react-router'
import { TabbedRunsTable } from '../features/data-tracking'

interface RunsSearchParams {
  type?: 'farming' | 'tournament' | 'milestone'
}

export const Route = createFileRoute('/runs')({
  component: RunsPage,
  validateSearch: (search): RunsSearchParams => {
    return {
      type: search.type as 'farming' | 'tournament' | 'milestone' | undefined,
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