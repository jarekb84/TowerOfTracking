import { createFileRoute, Outlet } from '@tanstack/react-router'
import { RunsTabsNavigation } from '../features/navigation/runs-navigation/runs-tabs-navigation'

export const Route = createFileRoute('/runs')({
  component: RunsLayout,
})

function RunsLayout() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Shared Tab Navigation */}
      <RunsTabsNavigation />

      {/* Child Route Content */}
      <Outlet />
    </div>
  )
}
