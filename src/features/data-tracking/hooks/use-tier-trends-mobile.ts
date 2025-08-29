import { useMemo } from 'react'
import { formatMobileColumnHeader, shouldUseCompactLayout, groupColumnsForMobile } from '../utils/tier-trends-mobile'
import type { FieldTrendData, ComparisonColumn } from '../types/game-run.types'

interface MobileCardData {
  useCompact: boolean
  leftColumns: ComparisonColumn[]
  rightColumns: ComparisonColumn[]
  columnData: Array<{
    column: ComparisonColumn
    value: number
    headerInfo: { display: string; abbreviated: boolean }
  }>
}

/**
 * Hook for processing tier trends data for mobile card display
 * Handles layout decisions and data transformation for mobile rendering
 */
export function useTierTrendsMobile(
  trend: FieldTrendData,
  comparisonColumns: ComparisonColumn[]
): MobileCardData {
  return useMemo(() => {
    const useCompact = shouldUseCompactLayout()
    const { left, right } = groupColumnsForMobile(comparisonColumns)
    
    const columnData = comparisonColumns.map(column => ({
      column,
      value: column.values[trend.fieldName] || 0,
      headerInfo: formatMobileColumnHeader(column.header)
    }))

    return {
      useCompact,
      leftColumns: left,
      rightColumns: right,
      columnData
    }
  }, [trend.fieldName, comparisonColumns])
}