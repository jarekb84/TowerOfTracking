import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { CsvImport } from '../../features/data-import/csv-import/csv-import'
import { CsvExport } from '../../features/data-export/csv-export/csv-export'
import { DataSettings } from '../../features/settings/data-settings/data-settings'

export const Route = createFileRoute('/settings/data-management')({
  component: DataManagementPage,
})

function DataManagementPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Data Management</h1>
        <p className="text-sm text-muted-foreground">Import, export, and manage your game run data.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Bulk Import */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bulk Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Import multiple game runs from CSV or TSV files.
            </p>
            <CsvImport />
          </CardContent>
        </Card>

        {/* Bulk Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bulk Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your game runs to CSV format for backup or analysis.
            </p>
            <CsvExport />
          </CardContent>
        </Card>

        {/* Data Settings */}
        <DataSettings />
      </div>
    </div>
  )
}