import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { SettingsTabsNavigation } from '../features/navigation/settings-navigation/settings-tabs-navigation'
import { getValidSettingsRoutes } from '../features/navigation/settings-navigation/settings-tabs-config'

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
  beforeLoad: ({ location }) => {
    const path = location.pathname
    const validRoutes = getValidSettingsRoutes()

    // Redirect /settings to /settings/import (default tab)
    if (path === '/settings') {
      throw redirect({ to: '/settings/import' })
    }

    // Redirect invalid settings routes to default
    if (path.startsWith('/settings/') && !validRoutes.includes(path)) {
      throw redirect({ to: '/settings/import' })
    }
  },
})

function SettingsLayout() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <SettingsTabsNavigation />

      {/* Child Route Content */}
      <Outlet />
    </div>
  )
}

