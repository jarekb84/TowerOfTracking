/**
 * Chart Data Transform Tests
 */

import { describe, it, expect } from 'vitest'
import {
  transformToChartData,
  buildTooltipEntries,
  getBarOpacity,
  type ChartDataPoint
} from './chart-data-transforms'
import type { PeriodCoverageData, MetricCoverage, CoverageFieldName } from '../types'

describe('transformToChartData', () => {
  it('transforms period data into chart format', () => {
    const periods: PeriodCoverageData[] = [
      {
        periodKey: '2024-03-15',
        periodLabel: 'Mar 15',
        totalEnemies: 1000,
        runCount: 2,
        metrics: [
          {
            fieldName: 'taggedByDeathwave' as CoverageFieldName,
            label: 'Death Wave',
            color: '#ef4444',
            percentage: 80,
            affectedCount: 800,
            totalEnemies: 1000,
          },
          {
            fieldName: 'destroyedInSpotlight' as CoverageFieldName,
            label: 'Spotlight',
            color: '#facc15',
            percentage: 30,
            affectedCount: 300,
            totalEnemies: 1000,
          },
        ],
      },
    ]

    const result = transformToChartData(periods)

    expect(result).toHaveLength(1)
    expect(result[0].periodLabel).toBe('Mar 15')
    expect(result[0].periodKey).toBe('2024-03-15')
    expect(result[0].totalEnemies).toBe(1000)
    expect(result[0].runCount).toBe(2)
    expect(result[0].taggedByDeathwave).toBe(80)
    expect(result[0].destroyedInSpotlight).toBe(30)
  })

  it('handles multiple periods', () => {
    const periods: PeriodCoverageData[] = [
      {
        periodKey: '2024-03-15',
        periodLabel: 'Mar 15',
        totalEnemies: 1000,
        runCount: 1,
        metrics: [
          {
            fieldName: 'taggedByDeathwave' as CoverageFieldName,
            label: 'Death Wave',
            color: '#ef4444',
            percentage: 80,
            affectedCount: 800,
            totalEnemies: 1000,
          },
        ],
      },
      {
        periodKey: '2024-03-16',
        periodLabel: 'Mar 16',
        totalEnemies: 2000,
        runCount: 3,
        metrics: [
          {
            fieldName: 'taggedByDeathwave' as CoverageFieldName,
            label: 'Death Wave',
            color: '#ef4444',
            percentage: 60,
            affectedCount: 1200,
            totalEnemies: 2000,
          },
        ],
      },
    ]

    const result = transformToChartData(periods)

    expect(result).toHaveLength(2)
    expect(result[0].periodLabel).toBe('Mar 15')
    expect(result[0].taggedByDeathwave).toBe(80)
    expect(result[1].periodLabel).toBe('Mar 16')
    expect(result[1].taggedByDeathwave).toBe(60)
  })

  it('returns empty array for empty input', () => {
    const result = transformToChartData([])
    expect(result).toEqual([])
  })

  it('handles periods with no metrics', () => {
    const periods: PeriodCoverageData[] = [
      {
        periodKey: '2024-03-15',
        periodLabel: 'Mar 15',
        totalEnemies: 0,
        runCount: 0,
        metrics: [],
      },
    ]

    const result = transformToChartData(periods)

    expect(result).toHaveLength(1)
    expect(result[0].periodLabel).toBe('Mar 15')
    expect(result[0].totalEnemies).toBe(0)
    expect(result[0].runCount).toBe(0)
  })

  it('preserves all metric field names as properties', () => {
    const periods: PeriodCoverageData[] = [
      {
        periodKey: '2024-03-15',
        periodLabel: 'Mar 15',
        totalEnemies: 5000,
        runCount: 5,
        metrics: [
          {
            fieldName: 'taggedByDeathwave' as CoverageFieldName,
            label: 'Death Wave',
            color: '#ef4444',
            percentage: 75,
            affectedCount: 3750,
            totalEnemies: 5000,
          },
          {
            fieldName: 'destroyedInSpotlight' as CoverageFieldName,
            label: 'Spotlight',
            color: '#facc15',
            percentage: 40,
            affectedCount: 2000,
            totalEnemies: 5000,
          },
          {
            fieldName: 'destroyedInGoldenBot' as CoverageFieldName,
            label: 'Golden Bot',
            color: '#fbbf24',
            percentage: 25,
            affectedCount: 1250,
            totalEnemies: 5000,
          },
        ],
      },
    ]

    const result = transformToChartData(periods)
    const dataPoint = result[0] as ChartDataPoint

    expect(dataPoint.taggedByDeathwave).toBe(75)
    expect(dataPoint.destroyedInSpotlight).toBe(40)
    expect(dataPoint.destroyedInGoldenBot).toBe(25)
  })
})

describe('buildTooltipEntries', () => {
  const createMetric = (
    fieldName: CoverageFieldName,
    label: string,
    percentage: number,
    affectedCount: number
  ): MetricCoverage => ({
    fieldName,
    label,
    color: '#ef4444',
    percentage,
    affectedCount,
    totalEnemies: 1000,
  })

  it('sorts metrics by percentage descending', () => {
    const metrics: MetricCoverage[] = [
      createMetric('destroyedInSpotlight', 'Spotlight', 30, 300),
      createMetric('taggedByDeathwave', 'Death Wave', 80, 800),
      createMetric('destroyedInGoldenBot', 'Golden Bot', 50, 500),
    ]

    const result = buildTooltipEntries(metrics)

    expect(result[0].percentage).toBe(80)
    expect(result[1].percentage).toBe(50)
    expect(result[2].percentage).toBe(30)
  })

  it('maps all properties correctly', () => {
    const metrics: MetricCoverage[] = [
      createMetric('taggedByDeathwave', 'Death Wave', 75, 750),
    ]

    const result = buildTooltipEntries(metrics)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      label: 'Death Wave',
      color: '#ef4444',
      affectedCount: 750,
      percentage: 75,
      fieldName: 'taggedByDeathwave',
    })
  })

  it('returns empty array for empty input', () => {
    expect(buildTooltipEntries([])).toEqual([])
  })

  it('does not mutate original array', () => {
    const metrics: MetricCoverage[] = [
      createMetric('destroyedInSpotlight', 'Spotlight', 30, 300),
      createMetric('taggedByDeathwave', 'Death Wave', 80, 800),
    ]
    const originalOrder = metrics.map(m => m.fieldName)

    buildTooltipEntries(metrics)

    expect(metrics.map(m => m.fieldName)).toEqual(originalOrder)
  })
})

// Note: calculateYAxisMax tests are in y-axis-calculations.test.ts

describe('getBarOpacity', () => {
  describe('fill type', () => {
    it('returns 0.9 when no metric is highlighted', () => {
      expect(getBarOpacity(null, 'taggedByDeathwave', 'fill')).toBe(0.9)
    })

    it('returns 0.9 when metric matches highlighted metric', () => {
      expect(getBarOpacity('taggedByDeathwave', 'taggedByDeathwave', 'fill')).toBe(0.9)
    })

    it('returns 0.25 when metric does not match highlighted metric', () => {
      expect(getBarOpacity('destroyedInSpotlight', 'taggedByDeathwave', 'fill')).toBe(0.25)
    })
  })

  describe('stroke type', () => {
    it('returns 0.7 when no metric is highlighted', () => {
      expect(getBarOpacity(null, 'taggedByDeathwave', 'stroke')).toBe(0.7)
    })

    it('returns 0.85 when metric matches highlighted metric', () => {
      expect(getBarOpacity('taggedByDeathwave', 'taggedByDeathwave', 'stroke')).toBe(0.85)
    })

    it('returns 0.25 when metric does not match highlighted metric', () => {
      expect(getBarOpacity('destroyedInSpotlight', 'taggedByDeathwave', 'stroke')).toBe(0.25)
    })
  })
})
