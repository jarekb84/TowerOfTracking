import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFilteredRuns } from './use-filtered-runs'
import { RunType } from '@/shared/domain/run-types/types'
import { ParsedGameRun } from '@/shared/types/game-run.types'

// Mock the useData hook
const mockRemoveRun = vi.fn()
const mockRuns: ParsedGameRun[] = []

vi.mock('@/shared/domain/use-data', () => ({
  useData: () => ({
    runs: mockRuns,
    removeRun: mockRemoveRun,
  }),
}))

// Create mock run factory
function createMockRun(overrides: Partial<ParsedGameRun> = {}): ParsedGameRun {
  return {
    id: `run-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date('2024-01-15T14:30:00'),
    fields: {},
    tier: 11,
    wave: 1000,
    coinsEarned: 1000000,
    cellsEarned: 500,
    realTime: 3600,
    gameSpeed: 2.0,
    runType: RunType.FARM,
    ...overrides,
  }
}

describe('useFilteredRuns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRuns.length = 0
  })

  it('should return filtered runs for FARM type', () => {
    mockRuns.push(
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.TOURNAMENT }),
      createMockRun({ runType: RunType.FARM }),
    )

    const { result } = renderHook(() => useFilteredRuns(RunType.FARM))

    expect(result.current.runs).toHaveLength(2)
    expect(result.current.runs.every(run => run.runType === RunType.FARM)).toBe(true)
  })

  it('should return filtered runs for TOURNAMENT type', () => {
    mockRuns.push(
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.TOURNAMENT }),
      createMockRun({ runType: RunType.TOURNAMENT }),
    )

    const { result } = renderHook(() => useFilteredRuns(RunType.TOURNAMENT))

    expect(result.current.runs).toHaveLength(2)
    expect(result.current.runs.every(run => run.runType === RunType.TOURNAMENT)).toBe(true)
  })

  it('should return filtered runs for MILESTONE type', () => {
    mockRuns.push(
      createMockRun({ runType: RunType.MILESTONE }),
      createMockRun({ runType: RunType.FARM }),
      createMockRun({ runType: RunType.MILESTONE }),
    )

    const { result } = renderHook(() => useFilteredRuns(RunType.MILESTONE))

    expect(result.current.runs).toHaveLength(2)
    expect(result.current.runs.every(run => run.runType === RunType.MILESTONE)).toBe(true)
  })

  it('should return empty array when no runs match', () => {
    mockRuns.push(
      createMockRun({ runType: RunType.FARM }),
    )

    const { result } = renderHook(() => useFilteredRuns(RunType.TOURNAMENT))

    expect(result.current.runs).toHaveLength(0)
  })

  it('should expose removeRun function from data context', () => {
    const { result } = renderHook(() => useFilteredRuns(RunType.FARM))

    expect(result.current.removeRun).toBe(mockRemoveRun)
  })
})
