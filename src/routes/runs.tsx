import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { RunsTabsNavigation } from '../features/navigation/runs-navigation/runs-tabs-navigation'
import { getValidRunsRoutes } from '../features/navigation/runs-navigation/runs-tabs-config'

export const Route = createFileRoute('/runs')({
  component: RunsLayout,
  beforeLoad: ({ location }) => {
    const path = location.pathname
    const validRoutes = getValidRunsRoutes()

    // Redirect /runs to /runs/farm (default run type)
    if (path === '/runs') {
      throw redirect({ to: '/runs/farm' })
    }

    // Redirect invalid runs routes to default
    if (path.startsWith('/runs/') && !validRoutes.includes(path)) {
      throw redirect({ to: '/runs/farm' })
    }
  },
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
