import { describe, it, expect } from 'vitest'
import {
  formatRunTypeDisplay,
  formatRunTypeFilterDisplay,
  formatDurationDisplay,
  formatPeriodSummary
} from './tier-trends-display'
import { RunType, TrendsDuration } from '@/features/data-tracking/types/game-run.types'
import type { RunTypeFilter } from '@/features/analysis/shared/run-type-filter'

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

describe('formatDurationDisplay', () => {
  describe('singular forms', () => {
    it('should format per-run duration (singular)', () => {
      expect(formatDurationDisplay(TrendsDuration.PER_RUN, 1)).toBe('Run')
    })

    it('should format daily duration (singular)', () => {
      expect(formatDurationDisplay(TrendsDuration.DAILY, 1)).toBe('Day')
    })

    it('should format weekly duration (singular)', () => {
      expect(formatDurationDisplay(TrendsDuration.WEEKLY, 1)).toBe('Week')
    })

    it('should format monthly duration (singular)', () => {
      expect(formatDurationDisplay(TrendsDuration.MONTHLY, 1)).toBe('Month')
    })

    it('should format yearly duration (singular)', () => {
      expect(formatDurationDisplay(TrendsDuration.YEARLY, 1)).toBe('Year')
    })
  })

  describe('plural forms', () => {
    it('should format per-run duration (plural)', () => {
      expect(formatDurationDisplay(TrendsDuration.PER_RUN, 4)).toBe('Runs')
    })

    it('should format daily duration (plural)', () => {
      expect(formatDurationDisplay(TrendsDuration.DAILY, 7)).toBe('Days')
    })

    it('should format weekly duration (plural)', () => {
      expect(formatDurationDisplay(TrendsDuration.WEEKLY, 2)).toBe('Weeks')
    })

    it('should format monthly duration (plural)', () => {
      expect(formatDurationDisplay(TrendsDuration.MONTHLY, 3)).toBe('Months')
    })

    it('should format yearly duration (plural)', () => {
      expect(formatDurationDisplay(TrendsDuration.YEARLY, 5)).toBe('Years')
    })
  })

  it('should return empty string for unknown duration', () => {
    expect(formatDurationDisplay('unknown' as TrendsDuration, 1)).toBe('')
  })

  it('should handle zero count as plural', () => {
    expect(formatDurationDisplay(TrendsDuration.PER_RUN, 0)).toBe('Runs')
  })
})

describe('formatPeriodSummary', () => {
  it('should format complete period summary for farm runs', () => {
    expect(formatPeriodSummary(4, TrendsDuration.PER_RUN, RunType.FARM as RunTypeFilter)).toBe(
      'Last 4 Runs - Farm Mode'
    )
  })

  it('should format complete period summary for tournament days', () => {
    expect(formatPeriodSummary(7, TrendsDuration.DAILY, RunType.TOURNAMENT as RunTypeFilter)).toBe(
      'Last 7 Days - Tournament Mode'
    )
  })

  it('should format complete period summary for milestone weeks', () => {
    expect(formatPeriodSummary(2, TrendsDuration.WEEKLY, RunType.MILESTONE as RunTypeFilter)).toBe(
      'Last 2 Weeks - Milestone Mode'
    )
  })

  it('should format complete period summary with singular duration', () => {
    expect(formatPeriodSummary(1, TrendsDuration.MONTHLY, RunType.FARM as RunTypeFilter)).toBe(
      'Last 1 Month - Farm Mode'
    )
  })

  it('should format complete period summary for yearly data', () => {
    expect(formatPeriodSummary(3, TrendsDuration.YEARLY, RunType.TOURNAMENT as RunTypeFilter)).toBe(
      'Last 3 Years - Tournament Mode'
    )
  })

  it('should format complete period summary for all runs filter', () => {
    expect(formatPeriodSummary(4, TrendsDuration.PER_RUN, 'all')).toBe(
      'Last 4 Runs - All Runs'
    )
  })
})
