import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, defs, linearGradient, stop } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../../components/ui'
import { useData } from '../hooks/use-data'
import { prepareCoinsPerDayData, formatLargeNumber, generateYAxisTicks } from '../utils/chart-data'

const chartConfig = {
  totalCoins: {
    label: 'Total Coins',
    color: 'var(--color-chart-2)',
  },
}

export function CoinsPerDayChart() {
  const { runs } = useData()
  
  const chartData = prepareCoinsPerDayData(runs)
  
  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No data available. Import some game runs to see the chart.
      </div>
    )
  }

  const maxValue = Math.max(...chartData.map(d => d.totalCoins))
  const yAxisTicks = generateYAxisTicks(maxValue)

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} width="100%">
        <defs>
          <linearGradient id="coinsPerDayGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          interval="preserveStartEnd"
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickFormatter={formatLargeNumber}
          ticks={yAxisTicks}
          domain={[0, 'dataMax']}
        />
        <ChartTooltip 
          content={<ChartTooltipContent 
            formatter={(value, name) => {
              if (name === 'totalCoins') {
                return [formatLargeNumber(Number(value)), 'Total Coins']
              }
              return [value, name]
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                const data = payload[0].payload
                return `${label} (${data.runCount} runs)`
              }
              return label
            }}
            className="bg-slate-800/95 border-slate-600 backdrop-blur-sm"
          />} 
        />
        <Area
          type="monotone"
          dataKey="totalCoins"
          stroke="var(--color-chart-2)"
          fill="url(#coinsPerDayGradient)"
          strokeWidth={3}
          dot={{ fill: 'var(--color-chart-2)', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, stroke: 'var(--color-chart-2)', strokeWidth: 2, fill: '#0f172a' }}
        />
      </AreaChart>
    </ChartContainer>
  )
}