import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { ChartTabsNavigation } from '../features/navigation/chart-navigation/chart-tabs-navigation'
import { getValidChartRoutes } from '../features/navigation/chart-navigation/chart-tabs-config'

export const Route = createFileRoute('/charts')({
  component: ChartsLayout,
  beforeLoad: ({ location }) => {
    const path = location.pathname
    const validRoutes = getValidChartRoutes()

    // Redirect /charts to /charts/coins (default chart)
    if (path === '/charts') {
      throw redirect({ to: '/charts/coins' })
    }

    // Redirect invalid chart routes to default
    if (path.startsWith('/charts/') && !validRoutes.includes(path)) {
      throw redirect({ to: '/charts/coins' })
    }
  },
})

function ChartsLayout() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Shared Tab Navigation */}
      <ChartTabsNavigation />

      {/* Child Route Content */}
      <Outlet />
    </div>
  )
}
