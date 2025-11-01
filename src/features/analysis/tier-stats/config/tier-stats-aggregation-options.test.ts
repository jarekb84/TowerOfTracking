import { describe, it, expect } from 'vitest'
import {
  getAggregationOptions,
  getAggregationLabel,
  getAggregationTooltip
} from './tier-stats-aggregation-options'
import { TierStatsAggregation } from '../types'

describe('getAggregationOptions', () => {
  it('should return all 5 aggregation options', () => {
    const options = getAggregationOptions()
    expect(options).toHaveLength(5)
  })

  it('should include all aggregation types', () => {
    const options = getAggregationOptions()
    const values = options.map(opt => opt.value)

    expect(values).toContain(TierStatsAggregation.MAX)
    expect(values).toContain(TierStatsAggregation.P99)
    expect(values).toContain(TierStatsAggregation.P90)
    expect(values).toContain(TierStatsAggregation.P75)
    expect(values).toContain(TierStatsAggregation.P50)
  })

  it('should have labels for all options', () => {
    const options = getAggregationOptions()
    options.forEach(option => {
      expect(option.label).toBeTruthy()
      expect(typeof option.label).toBe('string')
      expect(option.label.length).toBeGreaterThan(0)
    })
  })

  it('should have tooltips for all options', () => {
    const options = getAggregationOptions()
    options.forEach(option => {
      expect(option.tooltip).toBeTruthy()
      expect(typeof option.tooltip).toBe('string')
      expect(option.tooltip.length).toBeGreaterThan(0)
    })
  })

  it('should have educational tooltip content', () => {
    const options = getAggregationOptions()

    // Check that tooltips contain educational language
    const maxOption = options.find(opt => opt.value === TierStatsAggregation.MAX)
    expect(maxOption?.tooltip).toContain('highest')

    const p99Option = options.find(opt => opt.value === TierStatsAggregation.P99)
    expect(p99Option?.tooltip).toContain('outliers')

    const p50Option = options.find(opt => opt.value === TierStatsAggregation.P50)
    expect(p50Option?.tooltip).toContain('middle')
  })
})

describe('getAggregationLabel', () => {
  it('should return correct label for MAX', () => {
    expect(getAggregationLabel(TierStatsAggregation.MAX)).toBe('Maximum')
  })

  it('should return correct label for P99', () => {
    expect(getAggregationLabel(TierStatsAggregation.P99)).toBe('P99')
  })

  it('should return correct label for P90', () => {
    expect(getAggregationLabel(TierStatsAggregation.P90)).toBe('P90')
  })

  it('should return correct label for P75', () => {
    expect(getAggregationLabel(TierStatsAggregation.P75)).toBe('P75')
  })

  it('should return correct label for P50', () => {
    expect(getAggregationLabel(TierStatsAggregation.P50)).toBe('P50 (Median)')
  })

  it('should return default label for unknown aggregation type', () => {
    expect(getAggregationLabel('unknown' as TierStatsAggregation)).toBe('Maximum')
  })
})

describe('getAggregationTooltip', () => {
  it('should return tooltip for MAX', () => {
    const tooltip = getAggregationTooltip(TierStatsAggregation.MAX)
    expect(tooltip).toBeTruthy()
    expect(tooltip.length).toBeGreaterThan(0)
  })

  it('should return tooltip for P99', () => {
    const tooltip = getAggregationTooltip(TierStatsAggregation.P99)
    expect(tooltip).toBeTruthy()
    expect(tooltip).toContain('outliers')
  })

  it('should return tooltip for P90', () => {
    const tooltip = getAggregationTooltip(TierStatsAggregation.P90)
    expect(tooltip).toBeTruthy()
    expect(tooltip.length).toBeGreaterThan(0)
  })

  it('should return tooltip for P75', () => {
    const tooltip = getAggregationTooltip(TierStatsAggregation.P75)
    expect(tooltip).toBeTruthy()
    expect(tooltip.length).toBeGreaterThan(0)
  })

  it('should return tooltip for P50', () => {
    const tooltip = getAggregationTooltip(TierStatsAggregation.P50)
    expect(tooltip).toBeTruthy()
    expect(tooltip).toContain('middle')
  })

  it('should return empty string for unknown aggregation type', () => {
    expect(getAggregationTooltip('unknown' as TierStatsAggregation)).toBe('')
  })
})
