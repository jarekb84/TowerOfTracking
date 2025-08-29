import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/simple-tabs'
import { DeathsRadarChart, TierStatsTable, TimeSeriesChart, TierTrendsAnalysis } from '../features/data-tracking'

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

        {/* Analytics Tabs */}
        <Tabs defaultValue="coins" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-5 w-[1000px] bg-slate-800/50 border border-slate-700/50 p-1">
              <TabsTrigger 
                value="coins" 
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-100 data-[state=active]:border-purple-500/50"
              >
                💰 Coins Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="cells" 
                className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-100 data-[state=active]:border-pink-500/50"
              >
                🔬 Cells Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="deaths" 
                className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-100 data-[state=active]:border-red-500/50"
              >
                💀 Deaths Analysis
              </TabsTrigger>
              <TabsTrigger 
                value="tiers" 
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-100 data-[state=active]:border-blue-500/50"
              >
                🏆 Tier Stats
              </TabsTrigger>
              <TabsTrigger 
                value="trends" 
                className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-100 data-[state=active]:border-orange-500/50"
              >
                📈 Tier Trends
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="coins" className="space-y-8 lg:space-y-12">
            <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:scale-[1.01]">
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 border-b border-slate-700/50">
                <CardTitle className="text-xl font-medium text-slate-100">💰 Coins Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-8 w-full">
                  <TimeSeriesChart 
                    metric="coins"
                    title="Coins Earned"
                    subtitle="Track your coin earnings from farming runs over different time periods"
                    defaultPeriod="hourly"
                    showFarmingOnly={true}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cells" className="space-y-8 lg:space-y-12">
            <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-pink-500/10 transition-all duration-300 hover:scale-[1.01]">
              <CardHeader className="bg-gradient-to-r from-pink-500/10 via-transparent to-pink-500/10 border-b border-slate-700/50">
                <CardTitle className="text-xl font-medium text-slate-100">🔬 Cells Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-8 w-full">
                  <TimeSeriesChart 
                    metric="cells"
                    title="Cells Earned"
                    subtitle="Track your cell earnings from farming runs over different time periods"
                    defaultPeriod="hourly"
                    showFarmingOnly={true}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deaths" className="space-y-8 lg:space-y-12">
            <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-red-500/10 transition-all duration-300 hover:scale-[1.01]">
              <CardHeader className="bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 border-b border-slate-700/50">
                <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-lg shadow-red-500/30"></div>
                  Death Causes by Tier
                  <span className="text-sm font-normal text-slate-400 ml-auto">Spider/Radar Analysis</span>
                </CardTitle>
                <p className="text-slate-400 text-sm mt-2">
                  Analyze what${`'`}s killing you across different tiers. Toggle tiers on/off to compare death patterns.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-8 w-full">
                  <DeathsRadarChart />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiers" className="space-y-8 lg:space-y-12">
            <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-[1.01]">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 border-b border-slate-700/50">
                <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-500/30"></div>
                  Tier Performance Statistics
                  <span className="text-sm font-normal text-slate-400 ml-auto">Maximum Values per Tier</span>
                </CardTitle>
                <p className="text-slate-400 text-sm mt-2">
                  See your best performance metrics for each tier. Shows maximum wave, duration, coins, cells, and hourly rates achieved.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-8 w-full">
                  <TierStatsTable />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-8 lg:space-y-12">
            <Card className="chart-container overflow-hidden border-slate-700/50 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 hover:scale-[1.01]">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 border-b border-slate-700/50">
                <CardTitle className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-lg shadow-orange-500/30"></div>
                  Statistical Trends Analysis
                  <span className="text-sm font-normal text-slate-400 ml-auto">Recent Run Comparison</span>
                </CardTitle>
                <p className="text-slate-400 text-sm mt-2">
                  Compare statistical changes across your recent farming runs for the same tier. Identify performance improvements and upgrade impacts.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-0 md:p-8 w-full">
                  <TierTrendsAnalysis />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}