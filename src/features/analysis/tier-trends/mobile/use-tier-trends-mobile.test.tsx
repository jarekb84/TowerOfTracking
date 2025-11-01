import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTierTrendsMobile } from './use-tier-trends-mobile'
import type { FieldTrendData, ComparisonColumn } from '@/shared/types/game-run.types'

describe('useTierTrendsMobile', () => {
  const mockTrend: FieldTrendData = {
    fieldName: 'coins',
    displayName: 'Total Coins',
    dataType: 'number',
    values: [100, 120, 150, 140],
    change: {
      direction: 'up',
      percent: 15.5,
      absolute: 1000
    },
    trendType: 'upward',
    significance: 'high'
  }

  it('should not use compact layout (always single column)', () => {
    const columns: ComparisonColumn[] = Array(6).fill(null).map((_, i) => ({
      header: `Column ${i}`,
      values: { coins: i * 100 }
    }))

    const { result } = renderHook(() => useTierTrendsMobile(mockTrend, columns))

    expect(result.current.useCompact).toBe(false)
    expect(result.current.leftColumns).toHaveLength(3)
    expect(result.current.rightColumns).toHaveLength(3)
  })

  it('should not use compact layout even for per-run data', () => {
    const columns: ComparisonColumn[] = [
      { header: 'T10-5969 8hr 10min 8/28 4:23pm', values: { coins: 1000 } },
      { header: 'T10-6031 8hr 5min 8/28 7:06am', values: { coins: 1200 } }
    ]

    const { result } = renderHook(() => useTierTrendsMobile(mockTrend, columns))

    expect(result.current.useCompact).toBe(false)
  })

  it('should not use compact layout for simple data', () => {
    const columns: ComparisonColumn[] = [
      { header: '8/28', values: { coins: 1000 } },
      { header: '8/27', values: { coins: 1200 } },
      { header: '8/26', values: { coins: 800 } }
    ]

    const { result } = renderHook(() => useTierTrendsMobile(mockTrend, columns))

    expect(result.current.useCompact).toBe(false)
  })

  it('should process column data correctly', () => {
    const columns: ComparisonColumn[] = [
      { header: '8/28', values: { coins: 1000, cells: 50 } },
      { header: '8/27', values: { coins: 1200, cells: 60 } }
    ]

    const { result } = renderHook(() => useTierTrendsMobile(mockTrend, columns))

    expect(result.current.columnData).toHaveLength(2)
    expect(result.current.columnData[0].value).toBe(1000)
    expect(result.current.columnData[1].value).toBe(1200)
    expect(result.current.columnData[0].headerInfo.display).toBe('8/28')
  })

  it('should handle missing field values', () => {
    const columns: ComparisonColumn[] = [
      { header: '8/28', values: { otherField: 1000 } },
      { header: '8/27', values: { coins: 1200 } }
    ]

    const { result } = renderHook(() => useTierTrendsMobile(mockTrend, columns))

    expect(result.current.columnData[0].value).toBe(0)  // Missing coins field
    expect(result.current.columnData[1].value).toBe(1200)  // Has coins field
  })

  it('should memoize results when inputs unchanged', () => {
    const columns: ComparisonColumn[] = [
      { header: '8/28', values: { coins: 1000 } }
    ]

    const { result, rerender } = renderHook(() => useTierTrendsMobile(mockTrend, columns))
    const firstResult = result.current

    rerender()
    const secondResult = result.current

    expect(firstResult).toBe(secondResult)
  })
})