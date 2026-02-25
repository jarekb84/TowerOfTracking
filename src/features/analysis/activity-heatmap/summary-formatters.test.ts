import { describe, expect, it, vi } from 'vitest'
import { buildSummaryEntries, buildRunTypeBreakdownEntries, formatCoveragePercent, formatTotalDuration, formatMinuteDisplay, sortSegmentsByTime } from './summary-formatters'
import type { HeatmapSegment, HeatmapSummary } from './types'

vi.mock('@/shared/formatting/run-display-formatters', () => ({
  formatDurationHoursMinutes: (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  },
}))

vi.mock('@/shared/formatting/number-scale', () => ({
  formatPercentage: (value: number, decimals: number = 1) => {
    const multiplier = Math.pow(10, decimals)
    const rounded = Math.round(value * multiplier) / multiplier
    return `${rounded}%`
  },
}))

vi.mock('@/features/analysis/shared/filtering/run-type-filter', () => ({
  getRunTypeDisplayLabel: (runType: string) => {
    const labels: Record<string, string> = {
      farm: 'Farm',
      tournament: 'Tournament',
      milestone: 'Milestone',
    }
    return labels[runType] ?? 'Unknown'
  },
}))

vi.mock('@/shared/domain/run-types/run-type-display', () => ({
  getRunTypeColor: (runType: string) => {
    const colors: Record<string, string> = {
      farm: '#10b981',
      tournament: '#f59e0b',
      milestone: '#8b5cf6',
    }
    return colors[runType] ?? '#888888'
  },
}))

function makeSummary(overrides: Partial<HeatmapSummary> = {}): HeatmapSummary {
  return {
    overallCoverage: 0.5,
    dailyCoverage: [0, 0, 0, 0, 0, 0, 0],
    activeHoursCoverage: 0.75,
    runTypeBreakdown: {},
    runTypeStats: {},
    totalActiveSeconds: 3600,
    totalIdleSeconds: 0,
    runCount: 10,
    ...overrides,
  }
}

describe('formatCoveragePercent', () => {
  it('formats 0 as "0%"', () => {
    expect(formatCoveragePercent(0)).toBe('0%')
  })

  it('formats 0.5 as "50%"', () => {
    expect(formatCoveragePercent(0.5)).toBe('50%')
  })

  it('formats 1.0 as "100%"', () => {
    expect(formatCoveragePercent(1.0)).toBe('100%')
  })

  it('rounds small values like 0.003 to "0%"', () => {
    expect(formatCoveragePercent(0.003)).toBe('0%')
  })
})

describe('formatTotalDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatTotalDuration(0)).toBe('0m')
  })

  it('formats 3600 seconds as 1 hour', () => {
    expect(formatTotalDuration(3600)).toBe('1h')
  })

  it('formats 5400 seconds as 1h 30m', () => {
    expect(formatTotalDuration(5400)).toBe('1h 30m')
  })
})

describe('buildSummaryEntries', () => {
  it('returns 4 entries when activeHours is disabled', () => {
    const summary = makeSummary()

    const entries = buildSummaryEntries(summary, false)

    expect(entries).toHaveLength(4)
    expect(entries[0].label).toBe('Overall Coverage')
    expect(entries[1].label).toBe('Total Play Time')
    expect(entries[2].label).toBe('Idle Time')
    expect(entries[3].label).toBe('Runs This Week')
  })

  it('returns 5 entries when activeHours is enabled', () => {
    const summary = makeSummary()

    const entries = buildSummaryEntries(summary, true)

    expect(entries).toHaveLength(5)
    expect(entries[4].label).toBe('Active Hours Coverage')
  })

  it('formats coverage values correctly', () => {
    const summary = makeSummary({ overallCoverage: 0.42, activeHoursCoverage: 0.88 })

    const entries = buildSummaryEntries(summary, true)

    expect(entries[0].value).toBe('42%')
    expect(entries[4].value).toBe('88%')
  })

  it('formats total play time using duration formatter', () => {
    const summary = makeSummary({ totalActiveSeconds: 5400 })

    const entries = buildSummaryEntries(summary, false)

    expect(entries[1].value).toBe('1h 30m')
  })

  it('formats idle time using duration formatter', () => {
    const summary = makeSummary({ totalIdleSeconds: 7200 })

    const entries = buildSummaryEntries(summary, false)

    expect(entries[2].label).toBe('Idle Time')
    expect(entries[2].value).toBe('2h')
  })

  it('formats run count as a string', () => {
    const summary = makeSummary({ runCount: 42 })

    const entries = buildSummaryEntries(summary, false)

    expect(entries[3].value).toBe('42')
  })
})

describe('buildRunTypeBreakdownEntries', () => {
  it('returns empty array when no runTypeStats', () => {
    const summary = makeSummary({ runTypeStats: {} })

    const groups = buildRunTypeBreakdownEntries(summary)

    expect(groups).toEqual([])
  })

  it('returns empty array for single run type (no breakdown needed)', () => {
    const summary = makeSummary({
      runTypeStats: {
        farm: { coverage: 0.1, activeSeconds: 3600, runCount: 5 },
      },
    })

    const groups = buildRunTypeBreakdownEntries(summary)

    expect(groups).toEqual([])
  })

  it('returns breakdown groups for multiple run types', () => {
    const summary = makeSummary({
      runTypeStats: {
        farm: { coverage: 0.05, activeSeconds: 3600, runCount: 3 },
        tournament: { coverage: 0.02, activeSeconds: 1800, runCount: 2 },
      },
    })

    const groups = buildRunTypeBreakdownEntries(summary)

    expect(groups).toHaveLength(2)

    // Sorted alphabetically by label: Farm, Tournament
    expect(groups[0].label).toBe('Farm')
    expect(groups[0].runType).toBe('farm')
    expect(groups[0].color).toBe('#10b981')
    expect(groups[0].entries).toHaveLength(3)
    expect(groups[0].entries[0]).toEqual({ label: 'Coverage', value: '5%' })
    expect(groups[0].entries[1]).toEqual({ label: 'Play Time', value: '1h' })
    expect(groups[0].entries[2]).toEqual({ label: 'Runs', value: '3' })

    expect(groups[1].label).toBe('Tournament')
    expect(groups[1].runType).toBe('tournament')
    expect(groups[1].color).toBe('#f59e0b')
    expect(groups[1].entries[0]).toEqual({ label: 'Coverage', value: '2%' })
    expect(groups[1].entries[1]).toEqual({ label: 'Play Time', value: '30m' })
    expect(groups[1].entries[2]).toEqual({ label: 'Runs', value: '2' })
  })

  it('handles three run types sorted alphabetically', () => {
    const summary = makeSummary({
      runTypeStats: {
        tournament: { coverage: 0.01, activeSeconds: 600, runCount: 1 },
        milestone: { coverage: 0.005, activeSeconds: 300, runCount: 1 },
        farm: { coverage: 0.02, activeSeconds: 1200, runCount: 2 },
      },
    })

    const groups = buildRunTypeBreakdownEntries(summary)

    expect(groups).toHaveLength(3)
    expect(groups[0].label).toBe('Farm')
    expect(groups[1].label).toBe('Milestone')
    expect(groups[2].label).toBe('Tournament')
  })
})

describe('formatMinuteDisplay', () => {
  it('formats 0 as ":00"', () => {
    expect(formatMinuteDisplay(0)).toBe(':00')
  })

  it('formats 0.5 as ":30"', () => {
    expect(formatMinuteDisplay(0.5)).toBe(':30')
  })

  it('formats 0.25 as ":15"', () => {
    expect(formatMinuteDisplay(0.25)).toBe(':15')
  })

  it('formats 0.75 as ":45"', () => {
    expect(formatMinuteDisplay(0.75)).toBe(':45')
  })

  it('clamps 1.0 to ":59" instead of ":60"', () => {
    expect(formatMinuteDisplay(1.0)).toBe(':59')
  })

  it('clamps 0.99 to ":59"', () => {
    expect(formatMinuteDisplay(0.99)).toBe(':59')
  })

  it('pads single-digit minutes with leading zero', () => {
    // 5 minutes = 5/60 ~ 0.0833
    expect(formatMinuteDisplay(5 / 60)).toBe(':05')
  })
})

describe('sortSegmentsByTime', () => {
  function makeSegment(start: number, end: number): HeatmapSegment {
    return { startFraction: start, endFraction: end, runType: 'farm', tier: 1, runId: 'r1' }
  }

  it('returns empty array for empty input', () => {
    expect(sortSegmentsByTime([])).toEqual([])
  })

  it('returns single segment unchanged', () => {
    const segments = [makeSegment(0.5, 0.75)]
    const result = sortSegmentsByTime(segments)
    expect(result).toHaveLength(1)
    expect(result[0].startFraction).toBe(0.5)
  })

  it('sorts segments by startFraction ascending', () => {
    const segments = [
      makeSegment(0.7, 0.9),
      makeSegment(0.1, 0.3),
      makeSegment(0.4, 0.6),
    ]

    const result = sortSegmentsByTime(segments)

    expect(result[0].startFraction).toBe(0.1)
    expect(result[1].startFraction).toBe(0.4)
    expect(result[2].startFraction).toBe(0.7)
  })

  it('does not mutate the original array', () => {
    const segments = [
      makeSegment(0.7, 0.9),
      makeSegment(0.1, 0.3),
    ]

    sortSegmentsByTime(segments)

    expect(segments[0].startFraction).toBe(0.7)
    expect(segments[1].startFraction).toBe(0.1)
  })
})
