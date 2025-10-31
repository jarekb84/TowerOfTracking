import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTierStatsConfig } from './use-tier-stats-config'
import type { ParsedGameRun } from '@/features/data-tracking/types/game-run.types'
import { createGameRunField } from '@/features/data-tracking/utils/field-utils'
import { clearTierStatsConfig } from './tier-stats-persistence'

describe('useTierStatsConfig', () => {
  const createMockRun = (tier: number): ParsedGameRun => ({
    id: `run-${tier}`,
    timestamp: new Date('2024-01-01'),
    fields: {
      tier: createGameRunField('Tier', tier.toString()),
      wave: createGameRunField('Wave', '1000'),
      realTime: createGameRunField('Real Time', '2h 30m 0s'),
      coinsEarned: createGameRunField('Coins Earned', '100M'),
      cellsEarned: createGameRunField('Cells Earned', '50K'),
      shards: createGameRunField('Shards', '1000'),
      metals: createGameRunField('Metals', '500')
    },
    tier,
    wave: 1000,
    coinsEarned: 100000000,
    cellsEarned: 50000,
    realTime: 9000,
    runType: 'farm'
  })

  beforeEach(() => {
    localStorage.clear()
    clearTierStatsConfig()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should load default configuration on first use', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      expect(result.current.selectedColumns).toHaveLength(4)
      expect(result.current.configSectionCollapsed).toBe(true)
    })

    it('should preserve stored columns even when initialized with empty runs', () => {
      // First, set up a custom configuration with data
      const runsWithData = [createMockRun(5)]
      const { result: setupResult } = renderHook(() => useTierStatsConfig(runsWithData))

      act(() => {
        setupResult.current.addColumn('shards')
      })

      // Verify shards was added
      expect(setupResult.current.selectedColumns.some(col => col.fieldName === 'shards')).toBe(true)

      // Now simulate page refresh with empty runs array (data not loaded yet)
      const { result: emptyResult } = renderHook(() => useTierStatsConfig([]))

      // Should still have all columns including shards from localStorage
      expect(emptyResult.current.selectedColumns.some(col => col.fieldName === 'shards')).toBe(true)
      expect(emptyResult.current.selectedColumns).toHaveLength(5) // 4 default + shards

      // When data loads, columns should remain intact
      const { result: finalResult, rerender } = renderHook(
        ({ runs }) => useTierStatsConfig(runs),
        { initialProps: { runs: [] } }
      )

      rerender({ runs: runsWithData })

      expect(finalResult.current.selectedColumns.some(col => col.fieldName === 'shards')).toBe(true)
      expect(finalResult.current.selectedColumns).toHaveLength(5)
    })

    it('should discover available fields from runs', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      const fieldNames = result.current.availableFields.map(f => f.fieldName)
      expect(fieldNames).toContain('wave')
      expect(fieldNames).toContain('coinsEarned')
      expect(fieldNames).toContain('cellsEarned')
      expect(fieldNames).toContain('shards')
      expect(fieldNames).toContain('metals')
    })

    it('should calculate unselected fields correctly', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      const unselectedFieldNames = result.current.unselectedFields.map(f => f.fieldName)
      expect(unselectedFieldNames).toContain('shards')
      expect(unselectedFieldNames).toContain('metals')
      expect(unselectedFieldNames).not.toContain('wave')
      expect(unselectedFieldNames).not.toContain('coinsEarned')
    })
  })

  describe('addColumn', () => {
    it('should add a column to selected columns', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      const initialCount = result.current.selectedColumns.length

      act(() => {
        result.current.addColumn('shards')
      })

      expect(result.current.selectedColumns).toHaveLength(initialCount + 1)
      const added = result.current.selectedColumns.find(col => col.fieldName === 'shards')
      expect(added).toBeDefined()
      expect(added?.showHourlyRate).toBe(false)
    })

    it('should not add duplicate columns', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      act(() => {
        result.current.addColumn('wave')
      })

      const waveColumns = result.current.selectedColumns.filter(col => col.fieldName === 'wave')
      expect(waveColumns).toHaveLength(1)
    })

    it('should update unselected fields after adding', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      expect(result.current.unselectedFields.some(f => f.fieldName === 'shards')).toBe(true)

      act(() => {
        result.current.addColumn('shards')
      })

      expect(result.current.unselectedFields.some(f => f.fieldName === 'shards')).toBe(false)
    })
  })

  describe('removeColumn', () => {
    it('should remove a column from selected columns', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      const initialCount = result.current.selectedColumns.length

      act(() => {
        result.current.removeColumn('wave')
      })

      expect(result.current.selectedColumns).toHaveLength(initialCount - 1)
      expect(result.current.selectedColumns.some(col => col.fieldName === 'wave')).toBe(false)
    })

    it('should update unselected fields after removing', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      expect(result.current.unselectedFields.some(f => f.fieldName === 'wave')).toBe(false)

      act(() => {
        result.current.removeColumn('wave')
      })

      expect(result.current.unselectedFields.some(f => f.fieldName === 'wave')).toBe(true)
    })

    it('should handle removing non-existent column gracefully', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      const initialCount = result.current.selectedColumns.length

      act(() => {
        result.current.removeColumn('nonExistentField')
      })

      expect(result.current.selectedColumns).toHaveLength(initialCount)
    })
  })

  describe('toggleColumnHourlyRate', () => {
    it('should toggle hourly rate for a specific column', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      // Find coins column (default has showHourlyRate: true)
      const coinsCol = result.current.selectedColumns.find(col => col.fieldName === 'coinsEarned')
      expect(coinsCol?.showHourlyRate).toBe(true)

      act(() => {
        result.current.toggleColumnHourlyRate('coinsEarned')
      })

      const coinsColAfter = result.current.selectedColumns.find(col => col.fieldName === 'coinsEarned')
      expect(coinsColAfter?.showHourlyRate).toBe(false)

      act(() => {
        result.current.toggleColumnHourlyRate('coinsEarned')
      })

      const coinsColFinal = result.current.selectedColumns.find(col => col.fieldName === 'coinsEarned')
      expect(coinsColFinal?.showHourlyRate).toBe(true)
    })

    it('should only affect the specified column', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      const cellsInitial = result.current.selectedColumns.find(col => col.fieldName === 'cellsEarned')
      const coinsInitial = result.current.selectedColumns.find(col => col.fieldName === 'coinsEarned')

      act(() => {
        result.current.toggleColumnHourlyRate('cellsEarned')
      })

      const cellsAfter = result.current.selectedColumns.find(col => col.fieldName === 'cellsEarned')
      const coinsAfter = result.current.selectedColumns.find(col => col.fieldName === 'coinsEarned')

      expect(cellsAfter?.showHourlyRate).toBe(!cellsInitial?.showHourlyRate)
      expect(coinsAfter?.showHourlyRate).toBe(coinsInitial?.showHourlyRate)
    })
  })

  describe('toggleConfigSection', () => {
    it('should toggle config section collapsed state', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      const initial = result.current.configSectionCollapsed

      act(() => {
        result.current.toggleConfigSection()
      })

      expect(result.current.configSectionCollapsed).toBe(!initial)

      act(() => {
        result.current.toggleConfigSection()
      })

      expect(result.current.configSectionCollapsed).toBe(initial)
    })
  })

  describe('resetToDefaults', () => {
    it('should reset configuration to defaults', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      // Modify configuration
      act(() => {
        result.current.addColumn('shards')
        result.current.toggleColumnHourlyRate('coinsEarned')
        result.current.toggleConfigSection()
      })

      // Verify it changed
      expect(result.current.selectedColumns.some(col => col.fieldName === 'shards')).toBe(true)
      const coinsCol = result.current.selectedColumns.find(col => col.fieldName === 'coinsEarned')
      expect(coinsCol?.showHourlyRate).toBe(false) // Was toggled off

      // Reset
      act(() => {
        result.current.resetToDefaults()
      })

      // Verify defaults restored
      expect(result.current.selectedColumns).toHaveLength(4)
      expect(result.current.configSectionCollapsed).toBe(true)
      expect(result.current.selectedColumns.some(col => col.fieldName === 'shards')).toBe(false)
      const coinsColAfter = result.current.selectedColumns.find(col => col.fieldName === 'coinsEarned')
      expect(coinsColAfter?.showHourlyRate).toBe(true) // Back to default
    })
  })

  describe('localStorage persistence', () => {
    it('should persist configuration changes to localStorage', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      act(() => {
        result.current.addColumn('shards')
      })

      // Create new hook instance to test loading from storage
      const { result: result2 } = renderHook(() => useTierStatsConfig(runs))

      expect(result2.current.selectedColumns.some(col => col.fieldName === 'shards')).toBe(true)
    })

    it('should persist column hourly rate toggle to localStorage', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      act(() => {
        result.current.toggleColumnHourlyRate('coinsEarned')
      })

      const { result: result2 } = renderHook(() => useTierStatsConfig(runs))

      const coinsCol = result2.current.selectedColumns.find(col => col.fieldName === 'coinsEarned')
      expect(coinsCol?.showHourlyRate).toBe(false)
    })

    it('should NOT persist config section collapsed state to localStorage', () => {
      const runs = [createMockRun(5)]
      const { result } = renderHook(() => useTierStatsConfig(runs))

      // Expand the config section
      act(() => {
        result.current.toggleConfigSection()
      })

      expect(result.current.configSectionCollapsed).toBe(false)

      // Create new hook instance (simulates page reload)
      const { result: result2 } = renderHook(() => useTierStatsConfig(runs))

      // Should always load collapsed, regardless of previous state
      expect(result2.current.configSectionCollapsed).toBe(true)
    })
  })

  describe('field validation', () => {
    it('should remove invalid columns when available fields change', () => {
      const runsWithShards = [createMockRun(5)]
      const { result, rerender } = renderHook(
        ({ runs }) => useTierStatsConfig(runs),
        { initialProps: { runs: runsWithShards } }
      )

      act(() => {
        result.current.addColumn('shards')
      })

      expect(result.current.selectedColumns.some(col => col.fieldName === 'shards')).toBe(true)

      // Create runs without shards field
      const runsWithoutShards: ParsedGameRun[] = [{
        id: 'run-6',
        timestamp: new Date('2024-01-01'),
        fields: {
          tier: createGameRunField('Tier', '6'),
          wave: createGameRunField('Wave', '1000'),
          realTime: createGameRunField('Real Time', '2h 30m 0s'),
          coinsEarned: createGameRunField('Coins Earned', '100M'),
          cellsEarned: createGameRunField('Cells Earned', '50K')
        },
        tier: 6,
        wave: 1000,
        coinsEarned: 100000000,
        cellsEarned: 50000,
        realTime: 9000,
        runType: 'farm'
      }]

      rerender({ runs: runsWithoutShards })

      expect(result.current.selectedColumns.some(col => col.fieldName === 'shards')).toBe(false)
    })
  })
})
