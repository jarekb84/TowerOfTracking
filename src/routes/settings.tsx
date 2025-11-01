import { createFileRoute } from '@tanstack/react-router'
import { ThemeSettings } from '../features/theming'
import { DataSettings } from '../features/settings/data-settings/data-settings'
import { CsvImport } from '../features/data-import/csv-import/csv-import'
import { CsvExport } from '../features/data-export/csv-export/csv-export'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your application preferences and manage your data.</p>
      </div>

      <div className="space-y-8">
        {/* Theme Settings Section */}
        <section id="theme" className="scroll-mt-6">
          <h2 className="text-xl font-semibold mb-4">Theme Settings</h2>
          <div className="grid gap-6">
            <ThemeSettings />
          </div>
        </section>

        {/* Bulk Import Section */}
        <section id="import" className="scroll-mt-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Import</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Game Runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Import multiple game runs from CSV or TSV files.
              </p>
              <CsvImport />
            </CardContent>
          </Card>
        </section>

        {/* Bulk Export Section */}
        <section id="export" className="scroll-mt-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Export</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Game Runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export your game runs to CSV format for backup or analysis.
              </p>
              <CsvExport />
            </CardContent>
          </Card>
        </section>

        {/* Delete Data Section */}
        <section id="delete" className="scroll-mt-6">
          <h2 className="text-xl font-semibold mb-4">Delete Data</h2>
          <DataSettings />
        </section>
      </div>
    </div>
  )
}

