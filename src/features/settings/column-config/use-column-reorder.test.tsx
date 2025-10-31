import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnReorder } from './use-column-reorder'
import type { TierStatsColumnConfig } from '@/features/analysis/tier-stats/types'

describe('useColumnReorder', () => {
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

  describe('initialization', () => {
    it('should initialize with null drag state', () => {
      const { result } = renderHook(() => useColumnReorder())

      expect(result.current.draggedIndex).toBeNull()
      expect(result.current.draggedOverIndex).toBeNull()
      expect(result.current.isDragging).toBe(false)
    })
  })

  describe('drag handlers', () => {
    it('should set dragged index on drag start', () => {
      const { result } = renderHook(() => useColumnReorder())

      act(() => {
        result.current.handleDragStart(2)
      })

      expect(result.current.draggedIndex).toBe(2)
      expect(result.current.isDragging).toBe(true)
    })

    it('should set dragged over index on drag enter', () => {
      const { result } = renderHook(() => useColumnReorder())

      act(() => {
        result.current.handleDragEnter(3)
      })

      expect(result.current.draggedOverIndex).toBe(3)
    })

    it('should clear drag state on drag end', () => {
      const { result } = renderHook(() => useColumnReorder())

      act(() => {
        result.current.handleDragStart(2)
        result.current.handleDragEnter(3)
      })

      expect(result.current.draggedIndex).toBe(2)
      expect(result.current.draggedOverIndex).toBe(3)

      act(() => {
        result.current.handleDragEnd()
      })

      expect(result.current.draggedIndex).toBeNull()
      expect(result.current.draggedOverIndex).toBeNull()
      expect(result.current.isDragging).toBe(false)
    })
  })

  describe('handleDrop', () => {
    it('should reorder columns on drop', () => {
      const { result } = renderHook(() => useColumnReorder())

      act(() => {
        result.current.handleDragStart(0)
        result.current.handleDragEnter(2)
      })

      let reordered: TierStatsColumnConfig[] = []
      act(() => {
        reordered = result.current.handleDrop(mockColumns)
      })

      expect(reordered).toHaveLength(5)
      expect(reordered[0].fieldName).toBe('realTime')
      expect(reordered[1].fieldName).toBe('coinsEarned')
      expect(reordered[2].fieldName).toBe('wave')
    })

    it('should return original columns if drag indices are null', () => {
      const { result } = renderHook(() => useColumnReorder())

      let reordered: TierStatsColumnConfig[] = []
      act(() => {
        reordered = result.current.handleDrop(mockColumns)
      })

      expect(reordered).toEqual(mockColumns)
    })

    it('should return original columns if only draggedIndex is set', () => {
      const { result } = renderHook(() => useColumnReorder())

      act(() => {
        result.current.handleDragStart(0)
      })

      let reordered: TierStatsColumnConfig[] = []
      act(() => {
        reordered = result.current.handleDrop(mockColumns)
      })

      expect(reordered).toEqual(mockColumns)
    })

    it('should return original columns if only draggedOverIndex is set', () => {
      const { result } = renderHook(() => useColumnReorder())

      act(() => {
        result.current.handleDragEnter(2)
      })

      let reordered: TierStatsColumnConfig[] = []
      act(() => {
        reordered = result.current.handleDrop(mockColumns)
      })

      expect(reordered).toEqual(mockColumns)
    })

    it('should preserve column properties during reorder', () => {
      const { result } = renderHook(() => useColumnReorder())

      act(() => {
        result.current.handleDragStart(2) // coinsEarned with hourly rate
        result.current.handleDragEnter(0)
      })

      let reordered: TierStatsColumnConfig[] = []
      act(() => {
        reordered = result.current.handleDrop(mockColumns)
      })

      expect(reordered[0].fieldName).toBe('coinsEarned')
      expect(reordered[0].showHourlyRate).toBe(true)
    })
  })

  describe('isDragging', () => {
    it('should be false when not dragging', () => {
      const { result } = renderHook(() => useColumnReorder())
      expect(result.current.isDragging).toBe(false)
    })

    it('should be true when dragging', () => {
      const { result } = renderHook(() => useColumnReorder())

      act(() => {
        result.current.handleDragStart(0)
      })

      expect(result.current.isDragging).toBe(true)
    })

    it('should become false after drag end', () => {
      const { result } = renderHook(() => useColumnReorder())

      act(() => {
        result.current.handleDragStart(0)
      })

      expect(result.current.isDragging).toBe(true)

      act(() => {
        result.current.handleDragEnd()
      })

      expect(result.current.isDragging).toBe(false)
    })
  })

  describe('complete drag-and-drop workflow', () => {
    it('should handle full drag-and-drop sequence', () => {
      const { result } = renderHook(() => useColumnReorder())

      // Start dragging first item
      act(() => {
        result.current.handleDragStart(0)
      })
      expect(result.current.draggedIndex).toBe(0)
      expect(result.current.isDragging).toBe(true)

      // Drag over third item
      act(() => {
        result.current.handleDragEnter(2)
      })
      expect(result.current.draggedOverIndex).toBe(2)

      // Drop
      let reordered: TierStatsColumnConfig[] = []
      act(() => {
        reordered = result.current.handleDrop(mockColumns)
      })
      expect(reordered[2].fieldName).toBe('wave')

      // End drag
      act(() => {
        result.current.handleDragEnd()
      })
      expect(result.current.isDragging).toBe(false)
      expect(result.current.draggedIndex).toBeNull()
      expect(result.current.draggedOverIndex).toBeNull()
    })

    it('should handle drag cancellation without drop', () => {
      const { result } = renderHook(() => useColumnReorder())

      act(() => {
        result.current.handleDragStart(0)
        result.current.handleDragEnter(2)
      })

      expect(result.current.isDragging).toBe(true)

      // Cancel without dropping
      act(() => {
        result.current.handleDragEnd()
      })

      expect(result.current.isDragging).toBe(false)
      expect(result.current.draggedIndex).toBeNull()
    })
  })
})
