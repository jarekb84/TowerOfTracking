import { createFileRoute } from '@tanstack/react-router'
import { DataInput, RunsTable } from '../features/data-tracking'
import { ThemeSettings } from '../features/theming'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../features/ui'
import { Shield, Target, TrendingUp } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="container mx-auto py-lg space-y-lg">
      {/* Header Section */}
      <div className="text-center space-y-md">
        <div className="flex items-center justify-center gap-2 mb-md">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Tower of Tracking</h1>
          <Target className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Track and analyze your tower defense game runs. Import your stats, 
          visualize your progress, and optimize your strategy.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <DataInput />
        <ThemeSettings />
      </div>

      {/* Main Content */}
      <div className="space-y-lg">
        <RunsTable />
        
        {/* Placeholder for upcoming features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
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
                <Target className="h-5 w-5" />
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
                <Shield className="h-5 w-5" />
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
