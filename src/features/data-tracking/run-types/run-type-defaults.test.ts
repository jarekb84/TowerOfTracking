import { describe, it, expect } from 'vitest'
import {
  mapUrlTypeToRunType,
  normalizeRunTypeFilter
} from './run-type-defaults'
import { RunType } from '../types/game-run.types'
import { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'

describe('mapUrlTypeToRunType', () => {
  it('should map RunType.FARM to RunType.FARM', () => {
    expect(mapUrlTypeToRunType(RunType.FARM)).toBe(RunType.FARM)
  })

  it('should map RunType.TOURNAMENT to RunType.TOURNAMENT', () => {
    expect(mapUrlTypeToRunType(RunType.TOURNAMENT)).toBe(RunType.TOURNAMENT)
  })

  it('should map RunType.MILESTONE to RunType.MILESTONE', () => {
    expect(mapUrlTypeToRunType(RunType.MILESTONE)).toBe(RunType.MILESTONE)
  })

  it('should default to RunType.FARM for undefined', () => {
    expect(mapUrlTypeToRunType(undefined)).toBe(RunType.FARM)
  })

  it('should default to RunType.FARM for invalid values', () => {
    expect(mapUrlTypeToRunType('invalid')).toBe(RunType.FARM)
    expect(mapUrlTypeToRunType('')).toBe(RunType.FARM)
    expect(mapUrlTypeToRunType('all')).toBe(RunType.FARM)
    expect(mapUrlTypeToRunType('farming')).toBe(RunType.FARM) // old 'farming' value now invalid
  })
})

describe('normalizeRunTypeFilter', () => {
  it('should convert RunType.FARM to RunType.FARM', () => {
    expect(normalizeRunTypeFilter(RunType.FARM)).toBe(RunType.FARM)
  })

  it('should convert RunType.TOURNAMENT to RunType.TOURNAMENT', () => {
    expect(normalizeRunTypeFilter(RunType.TOURNAMENT)).toBe(RunType.TOURNAMENT)
  })

  it('should convert RunType.MILESTONE to RunType.MILESTONE', () => {
    expect(normalizeRunTypeFilter(RunType.MILESTONE)).toBe(RunType.MILESTONE)
  })

  it('should convert "all" to RunType.FARM as fallback', () => {
    expect(normalizeRunTypeFilter('all')).toBe(RunType.FARM)
  })

  it('should delegate to mapUrlTypeToRunType for consistent mapping', () => {
    // Test that normalizeRunTypeFilter uses the same mapping logic as mapUrlTypeToRunType
    expect(normalizeRunTypeFilter(RunType.FARM)).toBe(mapUrlTypeToRunType(RunType.FARM))
    expect(normalizeRunTypeFilter(RunType.TOURNAMENT)).toBe(mapUrlTypeToRunType(RunType.TOURNAMENT))
    expect(normalizeRunTypeFilter(RunType.MILESTONE)).toBe(mapUrlTypeToRunType(RunType.MILESTONE))
  })

  it('should handle invalid filter values by delegating to mapUrlTypeToRunType', () => {
    // After handling 'all', invalid values are delegated to mapUrlTypeToRunType
    // which returns FARM as fallback
    expect(normalizeRunTypeFilter('invalid' as unknown as RunTypeFilter)).toBe(RunType.FARM)
  })
})
