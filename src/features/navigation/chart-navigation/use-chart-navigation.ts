import { useUrlSearchParam } from './use-url-search-param'
import { useEffect, useState } from 'react'

export type ChartType = 'coins' | 'cells' | 'deaths' | 'tiers' | 'trends' | 'fields' | 'totals'

interface ChartSearchParams extends Record<string, unknown> {
  chart?: ChartType
}

/**
 * Hook for managing chart tab navigation via URL parameters
 */
export function useChartNavigation() {
  const { search, updateSearch } = useUrlSearchParam<ChartSearchParams>(
    '/charts',
    { chart: 'coins' }
  )
  
  // Initialize with URL parameter or default
  const initialChart = search.chart || 'coins'
  const [activeChart, setActiveChartState] = useState<ChartType>(initialChart)
  
  // Sync with URL parameters whenever they change
  useEffect(() => {
    const chartFromUrl = search.chart || 'coins'
    if (chartFromUrl !== activeChart) {
      setActiveChartState(chartFromUrl)
    }
  }, [search.chart, activeChart])

  const setActiveChart = (chart: ChartType) => {
    if (chart !== activeChart) {
      setActiveChartState(chart)
      updateSearch({ chart })
    }
  }

  return {
    activeChart,
    setActiveChart
  }
}