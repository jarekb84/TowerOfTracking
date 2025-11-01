import { useState, useCallback } from 'react'
import { reorderColumns } from '@/features/analysis/tier-stats/config/column-reorder'
import type { TierStatsColumnConfig } from '@/features/analysis/tier-stats/types'

export interface UseColumnReorderReturn {
  draggedIndex: number | null
  draggedOverIndex: number | null
  handleDragStart: (index: number) => void
  handleDragEnter: (index: number) => void
  handleDragEnd: () => void
  handleDrop: (columns: TierStatsColumnConfig[]) => TierStatsColumnConfig[]
  isDragging: boolean
}

/**
 * Hook for managing drag-and-drop column reordering
 * Provides drag state and handlers for reordering columns
 */
export function useColumnReorder(): UseColumnReorderReturn {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragEnter = useCallback((index: number) => {
    setDraggedOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDraggedOverIndex(null)
  }, [])

  const handleDrop = useCallback((columns: TierStatsColumnConfig[]): TierStatsColumnConfig[] => {
    if (draggedIndex === null || draggedOverIndex === null) {
      return columns
    }

    const reordered = reorderColumns(columns, draggedIndex, draggedOverIndex)
    return reordered
  }, [draggedIndex, draggedOverIndex])

  const isDragging = draggedIndex !== null

  return {
    draggedIndex,
    draggedOverIndex,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    handleDrop,
    isDragging
  }
}
