import { createFileRoute } from '@tanstack/react-router'
import { ThemeSettings } from '../features/theming'
import { DataSettings } from '../features/data-tracking'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your application preferences and manage data.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap xl:gap-6">
        <ThemeSettings />
        <DataSettings />
      </div>
    </div>
  )
}

