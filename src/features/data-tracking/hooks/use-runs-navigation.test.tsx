import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useRunsNavigation } from './use-runs-navigation'

// Mock the navigation hook
const mockUpdateSearch = vi.fn()
vi.mock('../../navigation/hooks/use-url-search-param', () => ({
  useUrlSearchParam: () => ({
    search: { type: 'farming' },
    updateSearch: mockUpdateSearch
  })
}))

describe('useRunsNavigation', () => {
  beforeEach(() => {
    mockUpdateSearch.mockClear()
  })

  it('should return farming as default active tab', () => {
    const { result } = renderHook(() => useRunsNavigation())

    expect(result.current.activeTab).toBe('farming')
  })

  it('should update tab when setActiveTab is called', () => {
    const { result } = renderHook(() => useRunsNavigation())

    act(() => {
      result.current.setActiveTab('tournament')
    })

    expect(mockUpdateSearch).toHaveBeenCalledWith({ type: 'tournament' })
  })

  it('should handle all run tab types', () => {
    const { result } = renderHook(() => useRunsNavigation())

    const tabTypes = ['farming', 'tournament', 'milestone'] as const

    tabTypes.forEach(tabType => {
      act(() => {
        result.current.setActiveTab(tabType)
      })

      expect(mockUpdateSearch).toHaveBeenCalledWith({ type: tabType })
    })

    expect(mockUpdateSearch).toHaveBeenCalledTimes(tabTypes.length)
  })
})