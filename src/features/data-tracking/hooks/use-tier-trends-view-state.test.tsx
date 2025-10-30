import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTierTrendsViewState } from './use-tier-trends-view-state'
import { RunType, TrendsDuration, TrendsAggregation } from '../types/game-run.types'
import type { ParsedGameRun, TierTrendsFilters } from '../types/game-run.types'

describe('useTierTrendsViewState', () => {
  const mockFilters: TierTrendsFilters = {
    tier: 0,
    changeThresholdPercent: 0,
    duration: TrendsDuration.PER_RUN,
    quantity: 4,
    aggregationType: TrendsAggregation.AVERAGE
  }

  const mockRuns: ParsedGameRun[] = [
    {
      id: '1',
      timestamp: new Date('2024-01-15T14:30:00'),
      tier: 10,
      wave: 5881,
      coinsEarned: 1130000000000,
      cellsEarned: 45200,
      realTime: 27966,
      runType: RunType.FARM,
      fields: {}
    },
    {
      id: '2',
      timestamp: new Date('2024-01-14T12:00:00'),
      tier: 10,
      wave: 5800,
      coinsEarned: 1100000000000,
      cellsEarned: 44000,
      realTime: 27000,
      runType: RunType.FARM,
      fields: {}
    }
  ]

  it('should return no-data state when no tiers available', () => {
    const { result } = renderHook(() =>
      useTierTrendsViewState(mockRuns, mockFilters, RunType.FARM, [])
    )

    expect(result.current.type).toBe('no-data')
    expect(result.current.trendsData).toBeNull()
  })

  it('should return ready state when data is available', () => {
    const { result } = renderHook(() =>
      useTierTrendsViewState(mockRuns, mockFilters, RunType.FARM, [10])
    )

    expect(result.current.type).toBe('ready')
    expect(result.current.trendsData).not.toBeNull()
  })

  it('should return ready state with no trends when available tiers exist but no matching runs', () => {
    const { result } = renderHook(() =>
      useTierTrendsViewState([], mockFilters, RunType.FARM, [10])
    )

    // With empty runs array but available tiers, calculation still produces trendsData (with empty fieldTrends)
    // This is the actual behavior of calculateTierTrends
    expect(result.current.type).toBe('ready')
    expect(result.current.trendsData).not.toBeNull()
  })

  it('should recalculate when filters change', () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useTierTrendsViewState(mockRuns, filters, RunType.FARM, [10]),
      { initialProps: { filters: mockFilters } }
    )

    const firstResult = result.current

    const newFilters: TierTrendsFilters = {
      ...mockFilters,
      quantity: 8
    }

    rerender({ filters: newFilters })

    // Should recalculate with new filters
    expect(result.current).not.toBe(firstResult)
    expect(result.current.type).toBe('ready')
  })

  it('should recalculate when run type filter changes', () => {
    const { result, rerender } = renderHook(
      ({ runTypeFilter }) => useTierTrendsViewState(mockRuns, mockFilters, runTypeFilter, [10]),
      { initialProps: { runTypeFilter: RunType.FARM as const } }
    )

    expect(result.current.type).toBe('ready')

    rerender({ runTypeFilter: RunType.TOURNAMENT })

    // Should recalculate with new run type filter
    // Note: calculateTierTrends still returns data structure even with no matching runs
    expect(result.current.type).toBe('ready')
    expect(result.current.trendsData).not.toBeNull()
  })

  it('should recalculate when available tiers change', () => {
    const { result, rerender } = renderHook(
      ({ tiers }) => useTierTrendsViewState(mockRuns, mockFilters, RunType.FARM, tiers),
      { initialProps: { tiers: [10] } }
    )

    expect(result.current.type).toBe('ready')

    rerender({ tiers: [] })

    expect(result.current.type).toBe('no-data')
  })
})
