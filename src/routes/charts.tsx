import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui'
import { CoinsPerRunChart } from '../features/data-tracking/components/coins-per-run-chart'
import { CoinsPerDayChart } from '../features/data-tracking/components/coins-per-day-chart'

export const Route = createFileRoute('/charts')({
  component: ChartsPage,
})

function ChartsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-12">
        {/* Hero Section */}
        <div className="space-y-4 text-center">
          <div className="relative">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-red-600/20 blur-lg -z-10 rounded-lg"></div>
          </div>          
        </div>

        {/* Charts Grid */}
        <div className="grid gap-8 lg:gap-12">
          <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-[1.01]">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 border-b border-slate-700/50">
              <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full shadow-lg shadow-purple-500/30"></div>
                Coins Per Run
                <span className="text-sm font-normal text-slate-400 ml-auto">Individual Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-8 w-full">
                <CoinsPerRunChart />
              </div>
            </CardContent>
          </Card>

          <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:scale-[1.01]">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 border-b border-slate-700/50">
              <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/30"></div>
                Coins Per Day
                <span className="text-sm font-normal text-slate-400 ml-auto">Daily Accumulation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-8 w-full">
                <CoinsPerDayChart />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}