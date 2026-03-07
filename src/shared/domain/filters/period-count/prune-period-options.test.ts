import { describe, it, expect } from 'vitest'
import { pruneCountOptions } from './prune-period-options'

describe('pruneCountOptions', () => {
  it('should return empty array when dataPeriodCount is 0', () => {
    expect(pruneCountOptions([3, 6, 9, 12], 0)).toEqual([])
  })

  it('should include options up to count plus N+1 bucket', () => {
    // PRD example: 4 months, monthly options [3,6,9,12] -> [3, 6]
    expect(pruneCountOptions([3, 6, 9, 12], 4)).toEqual([3, 6])
  })

  it('should handle weekly options with 9 periods', () => {
    // PRD example: 9 weeks -> [5, 10]
    expect(pruneCountOptions([5, 10, 15, 20, 25, 30], 9)).toEqual([5, 10])
  })

  it('should handle weekly options with 11 periods', () => {
    // PRD example: 11 weeks -> [5, 10, 15]
    expect(pruneCountOptions([5, 10, 15, 20, 25, 30], 11)).toEqual([5, 10, 15])
  })

  it('should include N+1 bucket when exactly on boundary', () => {
    // PRD example: exactly 10 -> [5, 10, 15]
    expect(pruneCountOptions([5, 10, 15, 20, 25, 30], 10)).toEqual([5, 10, 15])
  })

  it('should include all options when data exceeds all', () => {
    // PRD example: 26 weeks -> [5, 10, 15, 20, 25, 30]
    expect(pruneCountOptions([5, 10, 15, 20, 25, 30], 26)).toEqual([5, 10, 15, 20, 25, 30])
  })

  it('should return smallest option when count is less than all options', () => {
    // dataPeriodCount=1, options start at 3 -> [3] (N+1 bucket)
    expect(pruneCountOptions([3, 6, 9, 12], 1)).toEqual([3])
  })

  it('should return smallest option when count is very small', () => {
    expect(pruneCountOptions([5, 10, 15, 20, 25, 30], 2)).toEqual([5])
  })

  it('should handle empty options array', () => {
    expect(pruneCountOptions([], 5)).toEqual([])
  })

  it('should handle single option', () => {
    expect(pruneCountOptions([10], 5)).toEqual([10])
    expect(pruneCountOptions([10], 15)).toEqual([10])
  })

  it('should include all options when count equals last option', () => {
    expect(pruneCountOptions([3, 6, 9, 12], 12)).toEqual([3, 6, 9, 12])
  })

  it('should include all options when count exceeds last option', () => {
    expect(pruneCountOptions([3, 6, 9, 12], 100)).toEqual([3, 6, 9, 12])
  })
})
