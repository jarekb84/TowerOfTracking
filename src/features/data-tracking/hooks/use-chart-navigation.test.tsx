import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useChartNavigation, type ChartType } from './use-chart-navigation'

// Mock the navigation hook
const mockUpdateSearch = vi.fn()
let mockSearch = { chart: 'coins' as ChartType }

vi.mock('../../navigation/hooks/use-url-search-param', () => ({
  useUrlSearchParam: () => ({
    search: mockSearch,
    updateSearch: mockUpdateSearch
  })
}))

describe('useChartNavigation', () => {
  beforeEach(() => {
    mockUpdateSearch.mockClear()
    mockSearch = { chart: 'coins' as ChartType }
  })

  it('should return coins as default active chart', () => {
    const { result } = renderHook(() => useChartNavigation())

    expect(result.current.activeChart).toBe('coins')
  })

  it('should update chart when setActiveChart is called', () => {
    const { result } = renderHook(() => useChartNavigation())

    act(() => {
      result.current.setActiveChart('cells')
    })

    expect(mockUpdateSearch).toHaveBeenCalledWith({ chart: 'cells' })
  })

  it('should handle all chart types', () => {
    const { result } = renderHook(() => useChartNavigation())

    const allChartTypes: Array<{ chartType: ChartType, callCount: number }> = [
      { chartType: 'cells', callCount: 1 },
      { chartType: 'deaths', callCount: 2 },
      { chartType: 'tiers', callCount: 3 },
      { chartType: 'trends', callCount: 4 },
    ]

    // Test setting different chart types (exclude 'coins' since that's the initial state)
    allChartTypes.forEach(({ chartType, callCount }) => {
      act(() => {
        result.current.setActiveChart(chartType)
      })

      expect(mockUpdateSearch).toHaveBeenCalledWith({ chart: chartType })
      expect(mockUpdateSearch).toHaveBeenCalledTimes(callCount)
    })
  })
})