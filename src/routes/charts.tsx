import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui'
import { CoinsPerRunChart } from '../features/data-tracking/components/coins-per-run-chart'
import { CoinsPerDayChart } from '../features/data-tracking/components/coins-per-day-chart'

export const Route = createFileRoute('/charts')({
  component: ChartsPage,
})

function ChartsPage() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Charts</h1>
        <p className="text-muted-foreground">
          Visualize your tower defense game progression over time
        </p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Coins Per Run</CardTitle>
          </CardHeader>
          <CardContent>
            <CoinsPerRunChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coins Per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <CoinsPerDayChart />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}