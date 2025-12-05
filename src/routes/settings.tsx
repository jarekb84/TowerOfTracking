import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SettingsTabsNavigation } from '../features/navigation/settings-navigation/settings-tabs-navigation'

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
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

