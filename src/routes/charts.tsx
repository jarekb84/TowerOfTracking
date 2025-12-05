import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ChartTabsNavigation } from '../features/navigation/chart-navigation/chart-tabs-navigation'

export const Route = createFileRoute('/charts')({
  component: ChartsLayout,
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
