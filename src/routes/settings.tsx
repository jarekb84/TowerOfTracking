import { createFileRoute } from '@tanstack/react-router'
import { ThemeSettings } from '../features/theming'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Theme, display mode, spacing, and more.</p>
      </div>

      <div className="flex flex-wrap gap-6">
        <ThemeSettings />
      </div>
    </div>
  )
}

