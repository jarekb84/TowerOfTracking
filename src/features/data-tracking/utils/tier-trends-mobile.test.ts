import { describe, it, expect } from 'vitest'
import { 
  formatMobileColumnHeader, 
  shouldUseCompactLayout,
  groupColumnsForMobile 
} from './tier-trends-mobile'
import type { ComparisonColumn } from '../types/game-run.types'

describe('tier-trends-mobile', () => {
  describe('formatMobileColumnHeader', () => {
    it('should format per-run headers correctly', () => {
      const multiLineHeader = 'T10 5,969\n8hr 43min\n8/28 4:23pm'
      const result = formatMobileColumnHeader(multiLineHeader)
      
      expect(result.display).toBe('8/28 T10 5,969 8hr')
      expect(result.abbreviated).toBe(false)
    })

    it('should keep daily headers unchanged', () => {
      const result = formatMobileColumnHeader('8/28')
      
      expect(result.display).toBe('8/28')
      expect(result.abbreviated).toBe(false)
    })

    it('should abbreviate weekly headers', () => {
      const result = formatMobileColumnHeader('Week of 8/24')
      
      expect(result.display).toBe('W 8/24')
      expect(result.abbreviated).toBe(true)
    })

    it('should abbreviate long month names', () => {
      const result = formatMobileColumnHeader('August')
      
      expect(result.display).toBe('Aug')
      expect(result.abbreviated).toBe(true)
    })

    it('should keep short month names unchanged', () => {
      const result = formatMobileColumnHeader('Aug')
      
      expect(result.display).toBe('Aug')
      expect(result.abbreviated).toBe(false)
    })

    it('should truncate very long headers', () => {
      const result = formatMobileColumnHeader('Very Long Header That Should Be Truncated')
      
      expect(result.display).toBe('Very Long ...')
      expect(result.abbreviated).toBe(true)
    })
  })

  describe('shouldUseCompactLayout', () => {
    it('should not use compact layout (always single column for comparison)', () => {
      const columns: ComparisonColumn[] = Array(6).fill(null).map((_, i) => ({
        header: `Column ${i}`,
        values: {}
      }))
      
      expect(shouldUseCompactLayout(columns)).toBe(false)
    })

    it('should not use compact layout even for per-run data', () => {
      const columns: ComparisonColumn[] = [
        { header: 'T10-5969 8hr 10min 8/28 4:23pm', values: {} },
        { header: 'T10-6031 8hr 5min 8/28 7:06am', values: {} }
      ]
      
      expect(shouldUseCompactLayout(columns)).toBe(false)
    })

    it('should not use compact layout for few columns with short headers', () => {
      const columns: ComparisonColumn[] = [
        { header: '8/28', values: {} },
        { header: '8/27', values: {} },
        { header: '8/26', values: {} }
      ]
      
      expect(shouldUseCompactLayout(columns)).toBe(false)
    })
  })

  describe('groupColumnsForMobile', () => {
    it('should split columns evenly', () => {
      const columns: ComparisonColumn[] = [
        { header: 'Col1', values: {} },
        { header: 'Col2', values: {} },
        { header: 'Col3', values: {} },
        { header: 'Col4', values: {} }
      ]
      
      const result = groupColumnsForMobile(columns)
      
      expect(result.left).toHaveLength(2)
      expect(result.right).toHaveLength(2)
      expect(result.left[0].header).toBe('Col1')
      expect(result.right[0].header).toBe('Col3')
    })

    it('should handle odd numbers by giving extra to left side', () => {
      const columns: ComparisonColumn[] = [
        { header: 'Col1', values: {} },
        { header: 'Col2', values: {} },
        { header: 'Col3', values: {} }
      ]
      
      const result = groupColumnsForMobile(columns)
      
      expect(result.left).toHaveLength(2)
      expect(result.right).toHaveLength(1)
    })
  })
})