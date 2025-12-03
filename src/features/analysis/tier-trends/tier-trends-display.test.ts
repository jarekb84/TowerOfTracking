import { describe, it, expect } from 'vitest'
import {
  formatRunTypeDisplay,
  formatRunTypeFilterDisplay
} from './tier-trends-display'
import { RunType } from '@/shared/domain/run-types/types'
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter'

describe('formatRunTypeDisplay', () => {
  it('should format farm run type', () => {
    expect(formatRunTypeDisplay(RunType.FARM)).toBe('Farm')
  })

  it('should format tournament run type', () => {
    expect(formatRunTypeDisplay(RunType.TOURNAMENT)).toBe('Tournament')
  })

  it('should format milestone run type', () => {
    expect(formatRunTypeDisplay(RunType.MILESTONE)).toBe('Milestone')
  })

  it('should return empty string for undefined', () => {
    expect(formatRunTypeDisplay(undefined)).toBe('')
  })

  it('should return empty string for unknown run type', () => {
    expect(formatRunTypeDisplay('unknown' as RunType)).toBe('')
  })
})

describe('formatRunTypeFilterDisplay', () => {
  it('should format farm run type filter', () => {
    expect(formatRunTypeFilterDisplay(RunType.FARM as RunTypeFilter)).toBe('farm')
  })

  it('should format tournament run type filter', () => {
    expect(formatRunTypeFilterDisplay(RunType.TOURNAMENT as RunTypeFilter)).toBe('tournament')
  })

  it('should format milestone run type filter', () => {
    expect(formatRunTypeFilterDisplay(RunType.MILESTONE as RunTypeFilter)).toBe('milestone')
  })

  it('should format all run type filter', () => {
    expect(formatRunTypeFilterDisplay('all')).toBe('all')
  })
})
