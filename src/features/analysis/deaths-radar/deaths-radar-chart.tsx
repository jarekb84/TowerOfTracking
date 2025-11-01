import { useState, useMemo } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../../components/ui'
import { Button } from '../../../components/ui'
import { useData } from '../../data-tracking/hooks/use-data'
import { prepareKilledByData, prepareRadarChartData } from './radar-calculations'
import { RunTypeFilter } from '@/features/analysis/shared/run-type-filter'
import { RunTypeSelector } from '../../data-tracking/components/run-type-selector'

// Colors for different tiers
const tierColors = [
  '#8b5cf6', // Purple
  '#06d6a0', // Mint Green  
  '#f72585', // Hot Pink
  '#ffbe0b', // Golden Yellow
  '#3a86ff', // Electric Blue
  '#fb8500', // Orange
  '#219ebc', // Blue
  '#023047', // Dark Blue
  '#ffb3c6', // Light Pink
  '#8ecae6', // Light Blue
]

const chartConfig = {
  deaths: {
    label: 'Death Analysis',
  },
}

export function DeathsRadarChart() {
  const { runs } = useData()
  const [runTypeFilter, setRunTypeFilter] = useState<RunTypeFilter>('all')
  
  // Process the data
  const tierKilledByData = useMemo(() => prepareKilledByData(runs, runTypeFilter), [runs, runTypeFilter])
  const availableTiers = useMemo(() => 
    tierKilledByData.map(data => data.tier).sort((a, b) => b - a), // Sort highest tier first
    [tierKilledByData]
  )
  
  // State for which tiers to show - default to highest 3 tiers
  const [visibleTiers, setVisibleTiers] = useState<Set<number>>(
    new Set(availableTiers.slice(0, 3)) // Show highest 3 tiers by default
  )
  
  // Calculate dynamic max value for radar chart
  const maxPercentage = useMemo(() => {
    const filteredTierData = tierKilledByData.filter(data => visibleTiers.has(data.tier))
    const allPercentages = filteredTierData.flatMap(tier => 
      tier.killedByStats.map(stat => stat.percentage)
    )
    const maxValue = Math.max(...allPercentages, 0)
    
    // Round up to next value cleanly divisible by 4
    // This ensures we have nice increments for the 4 grid lines
    const increment = Math.ceil(maxValue / 4) 
    return increment * 4
  }, [tierKilledByData, visibleTiers])

  // Prepare radar chart data
  const radarData = useMemo(() => {
    const filteredTierData = tierKilledByData.filter(data => visibleTiers.has(data.tier))
    return prepareRadarChartData(filteredTierData)
  }, [tierKilledByData, visibleTiers])

  if (tierKilledByData.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center text-muted-foreground">
        No death data available. Import some game runs to see the analysis.
      </div>
    )
  }

  const toggleTier = (tier: number) => {
    setVisibleTiers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tier)) {
        newSet.delete(tier)
      } else {
        newSet.add(tier)
      }
      return newSet
    })
  }

  const toggleAll = () => {
    if (visibleTiers.size === availableTiers.length) {
      setVisibleTiers(new Set())
    } else {
      setVisibleTiers(new Set(availableTiers))
    }
  }

  return (
    <div className="space-y-6">
      {/* Run Type Selector */}
      <div className="flex justify-center">
        <RunTypeSelector 
          selectedType={runTypeFilter}
          onTypeChange={setRunTypeFilter}
        />
      </div>
      
      {/* Tier Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Tier Visibility</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {visibleTiers.size === availableTiers.length ? 'Hide All' : 'Show All'}
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {availableTiers.map((tier, index) => {
            const isVisible = visibleTiers.has(tier)
            const color = tierColors[index % tierColors.length]
            
            return (
              <Button
                key={tier}
                variant={isVisible ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTier(tier)}
                className={`border transition-all ${
                  isVisible 
                    ? `bg-opacity-20 border-opacity-50 text-slate-100` 
                    : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                }`}
                style={{
                  backgroundColor: isVisible ? `${color}33` : undefined,
                  borderColor: isVisible ? `${color}80` : undefined,
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: color }}
                />
                Tier {tier}
                <span className="ml-2 text-xs opacity-75">
                  ({tierKilledByData.find(d => d.tier === tier)?.totalDeaths || 0} deaths)
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Radar Chart */}
      <ChartContainer config={chartConfig} className="h-[600px] w-full">
        <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
          <PolarGrid 
            stroke="#475569" 
            strokeOpacity={0.3}
            radialLines={true}
          />
          <PolarAngleAxis 
            dataKey="killedBy" 
            tick={{ fontSize: 14, fill: '#e2e8f0', fontWeight: 'bold' }}
            className="text-sm font-bold"
          />
          <PolarRadiusAxis 
            domain={[0, maxPercentage]} 
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickFormatter={(value) => `${value}%`}
          />
          <ChartTooltip 
            content={<ChartTooltipContent 
              formatter={(value, name) => {
                const tierMatch = name?.toString().match(/tier(\d+)/)
                const tierNumber = tierMatch ? tierMatch[1] : name
                return [`${Number(value).toFixed(1)}%`, `Tier ${tierNumber}`]
              }}
              labelFormatter={(label) => `Killed by: ${label}`}
              className="bg-slate-800/95 border-slate-600 backdrop-blur-sm"
            />} 
          />
          
          {/* Render a Radar for each visible tier */}
          {availableTiers.map((tier, index) => {
            if (!visibleTiers.has(tier)) return null
            
            const color = tierColors[index % tierColors.length]
            
            return (
              <Radar
                key={tier}
                name={`tier${tier}`}
                dataKey={`tier${tier}`}
                stroke={color}
                fill={color}
                fillOpacity={0.1}
                strokeWidth={2}
                dot={{ fill: color, strokeWidth: 0, r: 4 }}
              />
            )
          })}
        </RadarChart>
      </ChartContainer>
    </div>
  )
}