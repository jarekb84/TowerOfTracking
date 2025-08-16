import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../../components/ui'
import { useData } from '../hooks/use-data'
import { prepareCoinsPerDayData, formatLargeNumber, generateYAxisTicks } from '../utils/chart-data'

const chartConfig = {
  totalCoins: {
    label: 'Total Coins',
    color: 'hsl(var(--chart-2))',
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
    <ChartContainer config={chartConfig} className="h-[400px]">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
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
          />} 
        />
        <Area
          type="stepAfter"
          dataKey="totalCoins"
          stroke="var(--color-totalCoins)"
          fill="var(--color-totalCoins)"
          fillOpacity={0.6}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}