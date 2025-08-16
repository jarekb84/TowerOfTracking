import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../../components/ui'
import { useData } from '../hooks/use-data'
import { prepareCoinsPerRunData, formatLargeNumber, generateYAxisTicks } from '../utils/chart-data'

const chartConfig = {
  coins: {
    label: 'Coins Earned',
    color: 'hsl(var(--chart-1))',
  },
}

export function CoinsPerRunChart() {
  const { runs } = useData()
  
  const chartData = prepareCoinsPerRunData(runs)
  
  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No data available. Import some game runs to see the chart.
      </div>
    )
  }

  const maxValue = Math.max(...chartData.map(d => d.value))
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
            formatter={(value) => [formatLargeNumber(Number(value)), 'Coins Earned']}
          />} 
        />
        <Area
          type="stepAfter"
          dataKey="value"
          stroke="var(--color-coins)"
          fill="var(--color-coins)"
          fillOpacity={0.6}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}