/**
 * Tests for timeline-layout-utils.ts
 *
 * Note: This file previously tested calculatePriorBalances, getWeekCurrencyData,
 * applyIncomeProration, and calculateWeekBalance. These functions have been removed
 * as part of the architectural refactoring - balance calculations are now handled
 * entirely by the timeline calculator via weekDisplayData.
 */
import { describe, it, expect } from 'vitest'
import { formatMetricDisplay } from './timeline-layout-utils'

describe('timeline-layout-utils', () => {
  describe('formatMetricDisplay', () => {
    describe('for income', () => {
      it('should return blank for zero income', () => {
        const result = formatMetricDisplay(0, 'income')
        expect(result.displayValue).toBe('')
        expect(result.hasValue).toBe(false)
      })

      it('should indicate non-zero income has value', () => {
        const result = formatMetricDisplay(100, 'income')
        expect(result.hasValue).toBe(true)
      })

      it('should handle negative income', () => {
        const result = formatMetricDisplay(-50, 'income')
        expect(result.hasValue).toBe(true)
      })
    })

    describe('for expenditure', () => {
      it('should return dash for zero expenditure', () => {
        const result = formatMetricDisplay(0, 'expenditure')
        expect(result.displayValue).toBe('-')
        expect(result.hasValue).toBe(false)
      })

      it('should indicate non-zero expenditure has value', () => {
        const result = formatMetricDisplay(500, 'expenditure')
        expect(result.hasValue).toBe(true)
      })
    })
  })
})
