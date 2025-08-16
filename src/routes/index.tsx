import { createFileRoute } from '@tanstack/react-router'
import { DataInput, RunsTable } from '../features/data-tracking'
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
        <DataInput />
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <RunsTable />
        
        {/* Placeholder for upcoming features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Charts
              </CardTitle>
              <CardDescription>
                Visualizations coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Timeline charts for coins, cells, and performance metrics
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>
                Tier analysis coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aggregated statistics and performance analysis by tier
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Export
              </CardTitle>
              <CardDescription>
                Data export coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Export your data to various formats for further analysis
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
