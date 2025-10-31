import { describe, it, expect } from 'vitest'
import { reorderColumns, findColumnIndex } from './column-reorder'
import type { TierStatsColumnConfig } from '@/features/analysis/tier-stats/types'

describe('column-reorder', () => {
  const createColumn = (fieldName: string, showHourlyRate = false): TierStatsColumnConfig => ({
    fieldName,
    showHourlyRate
  })

  const mockColumns: TierStatsColumnConfig[] = [
    createColumn('wave'),
    createColumn('realTime'),
    createColumn('coinsEarned', true),
    createColumn('cellsEarned', true),
    createColumn('shards')
  ]

  describe('reorderColumns', () => {
    it('should move column forward in array', () => {
      const result = reorderColumns(mockColumns, 0, 2)

      expect(result).toHaveLength(5)
      expect(result[0].fieldName).toBe('realTime')
      expect(result[1].fieldName).toBe('coinsEarned')
      expect(result[2].fieldName).toBe('wave')
      expect(result[3].fieldName).toBe('cellsEarned')
      expect(result[4].fieldName).toBe('shards')
    })

    it('should move column backward in array', () => {
      const result = reorderColumns(mockColumns, 3, 1)

      expect(result).toHaveLength(5)
      expect(result[0].fieldName).toBe('wave')
      expect(result[1].fieldName).toBe('cellsEarned')
      expect(result[2].fieldName).toBe('realTime')
      expect(result[3].fieldName).toBe('coinsEarned')
      expect(result[4].fieldName).toBe('shards')
    })

    it('should move column to end', () => {
      const result = reorderColumns(mockColumns, 0, 4)

      expect(result).toHaveLength(5)
      expect(result[0].fieldName).toBe('realTime')
      expect(result[1].fieldName).toBe('coinsEarned')
      expect(result[2].fieldName).toBe('cellsEarned')
      expect(result[3].fieldName).toBe('shards')
      expect(result[4].fieldName).toBe('wave')
    })

    it('should move column to beginning', () => {
      const result = reorderColumns(mockColumns, 4, 0)

      expect(result).toHaveLength(5)
      expect(result[0].fieldName).toBe('shards')
      expect(result[1].fieldName).toBe('wave')
      expect(result[2].fieldName).toBe('realTime')
      expect(result[3].fieldName).toBe('coinsEarned')
      expect(result[4].fieldName).toBe('cellsEarned')
    })

    it('should preserve column properties', () => {
      const result = reorderColumns(mockColumns, 2, 0)

      const movedColumn = result[0]
      expect(movedColumn.fieldName).toBe('coinsEarned')
      expect(movedColumn.showHourlyRate).toBe(true)
    })

    it('should return original array when indices are equal', () => {
      const result = reorderColumns(mockColumns, 2, 2)
      expect(result).toEqual(mockColumns)
    })

    it('should return original array for invalid from index', () => {
      expect(reorderColumns(mockColumns, -1, 2)).toEqual(mockColumns)
      expect(reorderColumns(mockColumns, 10, 2)).toEqual(mockColumns)
    })

    it('should return original array for invalid to index', () => {
      expect(reorderColumns(mockColumns, 2, -1)).toEqual(mockColumns)
      expect(reorderColumns(mockColumns, 2, 10)).toEqual(mockColumns)
    })

    it('should not mutate original array', () => {
      const original = [...mockColumns]
      const result = reorderColumns(mockColumns, 0, 2)

      expect(mockColumns).toEqual(original)
      expect(result).not.toBe(mockColumns)
    })

    it('should handle single-item array', () => {
      const single = [createColumn('wave')]
      const result = reorderColumns(single, 0, 0)
      expect(result).toEqual(single)
    })

    it('should handle two-item swap', () => {
      const two = [createColumn('wave'), createColumn('coins')]
      const result = reorderColumns(two, 0, 1)

      expect(result).toHaveLength(2)
      expect(result[0].fieldName).toBe('coins')
      expect(result[1].fieldName).toBe('wave')
    })
  })

  describe('findColumnIndex', () => {
    it('should find column index by field name', () => {
      expect(findColumnIndex(mockColumns, 'wave')).toBe(0)
      expect(findColumnIndex(mockColumns, 'realTime')).toBe(1)
      expect(findColumnIndex(mockColumns, 'coinsEarned')).toBe(2)
      expect(findColumnIndex(mockColumns, 'cellsEarned')).toBe(3)
      expect(findColumnIndex(mockColumns, 'shards')).toBe(4)
    })

    it('should return -1 for non-existent field', () => {
      expect(findColumnIndex(mockColumns, 'nonexistent')).toBe(-1)
    })

    it('should return -1 for empty array', () => {
      expect(findColumnIndex([], 'wave')).toBe(-1)
    })

    it('should handle case-sensitive matching', () => {
      expect(findColumnIndex(mockColumns, 'Wave')).toBe(-1)
      expect(findColumnIndex(mockColumns, 'wave')).toBe(0)
    })
  })
})
