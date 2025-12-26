import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFieldSelector } from './use-field-selector'
import type { ParsedGameRun } from '@/shared/types/game-run.types'

describe('useFieldSelector', () => {
  it('should initialize with default field "rerollShardsEarned"', () => {
    const runs: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
      runType: 'farm',
      fields: {}
    }]

    const { result } = renderHook(() => useFieldSelector(runs))

    expect(result.current.selectedField).toBe('rerollShardsEarned')
  })

  it('should extract available fields from runs', () => {
    const runs: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
      runType: 'farm',
      fields: {
        damageDealt: {
          value: 100000,
          rawValue: '100K',
          displayValue: '100.00K',
          originalKey: 'Damage Dealt',
          dataType: 'number'
        }
      }
    }]

    const { result } = renderHook(() => useFieldSelector(runs))

    expect(result.current.availableFields.length).toBeGreaterThan(0)
    expect(result.current.availableFields.some(f => f.value === 'tier')).toBe(true)
    expect(result.current.availableFields.some(f => f.value === 'wave')).toBe(true)
    expect(result.current.availableFields.some(f => f.value === 'coinsEarned')).toBe(true)
    expect(result.current.availableFields.some(f => f.value === 'cellsEarned')).toBe(true)
    expect(result.current.availableFields.some(f => f.value === 'realTime')).toBe(true)
    expect(result.current.availableFields.some(f => f.value === 'damageDealt')).toBe(true)
  })

  it('should format field labels properly', () => {
    const runs: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
      runType: 'farm',
      fields: {}
    }]

    const { result } = renderHook(() => useFieldSelector(runs))

    const coinsField = result.current.availableFields.find(f => f.value === 'coinsEarned')
    expect(coinsField?.label).toBe('Coins Earned')

    const cellsField = result.current.availableFields.find(f => f.value === 'cellsEarned')
    expect(cellsField?.label).toBe('Cells Earned')

    const realTimeField = result.current.availableFields.find(f => f.value === 'realTime')
    expect(realTimeField?.label).toBe('Real Time')
  })

  it('should sort fields alphabetically by label', () => {
    const runs: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
      runType: 'farm',
      fields: {}
    }]

    const { result } = renderHook(() => useFieldSelector(runs))

    const labels = result.current.availableFields.map(f => f.label)
    const sortedLabels = [...labels].sort()
    expect(labels).toEqual(sortedLabels)
  })

  it('should update selected field when setSelectedField is called', () => {
    const runs: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
      runType: 'farm',
      fields: {}
    }]

    const { result } = renderHook(() => useFieldSelector(runs))

    expect(result.current.selectedField).toBe('rerollShardsEarned')

    act(() => {
      result.current.setSelectedField('wave')
    })

    expect(result.current.selectedField).toBe('wave')
  })

  it('should indicate loading state when runs array is empty', () => {
    const { result } = renderHook(() => useFieldSelector([]))

    expect(result.current.isLoading).toBe(true)
  })

  it('should not be loading when runs are present', () => {
    const runs: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
      runType: 'farm',
      fields: {}
    }]

    const { result } = renderHook(() => useFieldSelector(runs))

    expect(result.current.isLoading).toBe(false)
  })

  it('should include data types for fields', () => {
    const runs: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
      runType: 'farm',
      fields: {
        waveDuration: {
          value: 120,
          rawValue: '2m',
          displayValue: '2m 0s',
          originalKey: 'Wave Duration',
          dataType: 'duration'
        }
      }
    }]

    const { result } = renderHook(() => useFieldSelector(runs))

    const realTimeField = result.current.availableFields.find(f => f.value === 'realTime')
    expect(realTimeField?.dataType).toBe('number')

    const waveDurationField = result.current.availableFields.find(f => f.value === 'waveDuration')
    expect(waveDurationField?.dataType).toBe('duration')
  })

  it('should update available fields when runs change', () => {
    const initialRuns: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
      runType: 'farm',
      fields: {}
    }]

    const { result, rerender } = renderHook(
      ({ runs }) => useFieldSelector(runs),
      { initialProps: { runs: initialRuns } }
    )

    const initialFieldCount = result.current.availableFields.length

    const updatedRuns: ParsedGameRun[] = [{
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      gameSpeed: 2.0,
      runType: 'farm',
      fields: {
        damageDealt: {
          value: 100000,
          rawValue: '100K',
          displayValue: '100.00K',
          originalKey: 'Damage Dealt',
          dataType: 'number'
        },
        enemiesDefeated: {
          value: 500,
          rawValue: '500',
          displayValue: '500',
          originalKey: 'Enemies Defeated',
          dataType: 'number'
        }
      }
    }]

    rerender({ runs: updatedRuns })

    expect(result.current.availableFields.length).toBeGreaterThan(initialFieldCount)
    expect(result.current.availableFields.some(f => f.value === 'damageDealt')).toBe(true)
    expect(result.current.availableFields.some(f => f.value === 'enemiesDefeated')).toBe(true)
  })
})
