/**
 * Y-Axis Calculation Tests
 */

import { describe, it, expect } from 'vitest'
import { calculateYAxisMax } from './chart-data-transforms'
import type { PeriodCoverageData, CoverageFieldName } from '../types'

describe('calculateYAxisMax', () => {
  const createPeriod = (maxPercentage: number): PeriodCoverageData => ({
    periodKey: '2024-03-15',
    periodLabel: 'Mar 15',
    totalEnemies: 1000,
    runCount: 1,
    metrics: [
      {
        fieldName: 'taggedByDeathwave' as CoverageFieldName,
        label: 'Death Wave',
        color: '#ef4444',
        percentage: maxPercentage,
        affectedCount: maxPercentage * 10,
        totalEnemies: 1000,
      },
    ],
  })

  it('returns 100 when useRelativeAxis is false', () => {
    const periods = [createPeriod(40)]
    expect(calculateYAxisMax(periods, false)).toBe(100)
  })

  it('returns 100 for empty periods', () => {
    expect(calculateYAxisMax([], true)).toBe(100)
  })

  it('rounds up to nearest 25%', () => {
    expect(calculateYAxisMax([createPeriod(10)], true)).toBe(25)
    expect(calculateYAxisMax([createPeriod(26)], true)).toBe(50)
    expect(calculateYAxisMax([createPeriod(51)], true)).toBe(75)
    expect(calculateYAxisMax([createPeriod(76)], true)).toBe(100)
  })

  it('returns minimum of 25%', () => {
    expect(calculateYAxisMax([createPeriod(1)], true)).toBe(25)
    expect(calculateYAxisMax([createPeriod(5)], true)).toBe(25)
  })

  it('caps at 100%', () => {
    expect(calculateYAxisMax([createPeriod(100)], true)).toBe(100)
    expect(calculateYAxisMax([createPeriod(150)], true)).toBe(100)
  })

  it('finds max across multiple periods and metrics', () => {
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
            percentage: 30,
            affectedCount: 300,
            totalEnemies: 1000,
          },
          {
            fieldName: 'destroyedInSpotlight' as CoverageFieldName,
            label: 'Spotlight',
            color: '#facc15',
            percentage: 45,
            affectedCount: 450,
            totalEnemies: 1000,
          },
        ],
      },
      {
        periodKey: '2024-03-16',
        periodLabel: 'Mar 16',
        totalEnemies: 2000,
        runCount: 2,
        metrics: [
          {
            fieldName: 'taggedByDeathwave' as CoverageFieldName,
            label: 'Death Wave',
            color: '#ef4444',
            percentage: 60,
            affectedCount: 1200,
            totalEnemies: 2000,
          },
          {
            fieldName: 'destroyedInSpotlight' as CoverageFieldName,
            label: 'Spotlight',
            color: '#facc15',
            percentage: 20,
            affectedCount: 400,
            totalEnemies: 2000,
          },
        ],
      },
    ]

    // Max is 60, rounds up to 75
    expect(calculateYAxisMax(periods, true)).toBe(75)
  })
})
