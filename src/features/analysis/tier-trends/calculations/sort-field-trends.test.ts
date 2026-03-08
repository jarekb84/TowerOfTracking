import { describe, it, expect } from 'vitest'
import { sortFieldTrends, getNextSortState } from './sort-field-trends'
import type { FieldTrendData } from '../types'

function makeTrend(displayName: string, changePercent: number): FieldTrendData {
  return {
    fieldName: displayName.toLowerCase(),
    displayName,
    dataType: 'number',
    values: [1, 2],
    change: { absolute: 1, percent: changePercent, direction: 'up' },
    trendType: 'linear',
  } as FieldTrendData
}

describe('sortFieldTrends', () => {
  const trends = [
    makeTrend('Coins', 50),
    makeTrend('Alpha', 10),
    makeTrend('Beta', 30),
  ]

  it('sorts by fieldName ascending', () => {
    const sorted = sortFieldTrends(trends, 'fieldName', 'asc')
    expect(sorted.map(t => t.displayName)).toEqual(['Alpha', 'Beta', 'Coins'])
  })

  it('sorts by fieldName descending', () => {
    const sorted = sortFieldTrends(trends, 'fieldName', 'desc')
    expect(sorted.map(t => t.displayName)).toEqual(['Coins', 'Beta', 'Alpha'])
  })

  it('sorts by change ascending (absolute value)', () => {
    const sorted = sortFieldTrends(trends, 'change', 'asc')
    expect(sorted.map(t => t.change.percent)).toEqual([10, 30, 50])
  })

  it('sorts by change descending (absolute value)', () => {
    const sorted = sortFieldTrends(trends, 'change', 'desc')
    expect(sorted.map(t => t.change.percent)).toEqual([50, 30, 10])
  })

  it('uses absolute value for negative changes', () => {
    const mixed = [
      makeTrend('A', -40),
      makeTrend('B', 20),
      makeTrend('C', -60),
    ]
    const sorted = sortFieldTrends(mixed, 'change', 'desc')
    expect(sorted.map(t => t.change.percent)).toEqual([-60, -40, 20])
  })

  it('does not mutate the original array', () => {
    const original = [...trends]
    sortFieldTrends(trends, 'fieldName', 'asc')
    expect(trends).toEqual(original)
  })
})

describe('getNextSortState', () => {
  it('toggles direction when clicking same field (asc to desc)', () => {
    expect(getNextSortState('change', 'change', 'asc')).toEqual({
      sortField: 'change',
      sortDirection: 'desc',
    })
  })

  it('toggles direction when clicking same field (desc to asc)', () => {
    expect(getNextSortState('change', 'change', 'desc')).toEqual({
      sortField: 'change',
      sortDirection: 'asc',
    })
  })

  it('defaults to desc when clicking a different field', () => {
    expect(getNextSortState('fieldName', 'change', 'asc')).toEqual({
      sortField: 'fieldName',
      sortDirection: 'desc',
    })
  })
})
