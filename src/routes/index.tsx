import { createFileRoute } from '@tanstack/react-router'
import { DataInput, CsvImport, CsvExport, RunsTable } from '../features/data-tracking'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui'
import { TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3">
          <DataInput />
          <CsvImport />
          <CsvExport />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <RunsTable />
      </div>
    </div>
  )
}
