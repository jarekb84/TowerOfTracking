import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnSearch } from './use-column-search'
import type { AvailableField } from '../types/tier-stats-config.types'

describe('useColumnSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const createField = (fieldName: string, displayName: string): AvailableField => ({
    fieldName,
    displayName,
    dataType: 'number',
    isNumeric: true,
    canHaveHourlyRate: true
  })

  const mockFields: AvailableField[] = [
    createField('coinsEarned', 'Coins Earned'),
    createField('cellsEarned', 'Cells Earned'),
    createField('attackDamage', 'Attack Damage'),
    createField('attackSpeed', 'Attack Speed'),
    createField('bossKills', 'Boss Kills')
  ]

  describe('initialization', () => {
    it('should initialize with empty search and all fields', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields))

      expect(result.current.searchTerm).toBe('')
      expect(result.current.debouncedSearchTerm).toBe('')
      expect(result.current.filteredFields).toEqual(mockFields)
      expect(result.current.hasActiveSearch).toBe(false)
    })
  })

  describe('setSearchTerm', () => {
    it('should update search term immediately', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields))

      act(() => {
        result.current.setSearchTerm('attack')
      })

      expect(result.current.searchTerm).toBe('attack')
      // Debounced term should not update yet
      expect(result.current.debouncedSearchTerm).toBe('')
    })

    it('should debounce search term updates', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('attack')
      })

      expect(result.current.debouncedSearchTerm).toBe('')

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.debouncedSearchTerm).toBe('attack')
    })

    it('should use custom debounce delay', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 500))

      act(() => {
        result.current.setSearchTerm('coins')
      })

      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(result.current.debouncedSearchTerm).toBe('')

      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(result.current.debouncedSearchTerm).toBe('coins')
    })
  })

  describe('filteredFields', () => {
    it('should filter fields after debounce delay', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('attack')
      })

      // Before debounce - should show all fields
      expect(result.current.filteredFields).toEqual(mockFields)

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // After debounce - should show filtered results
      expect(result.current.filteredFields).toHaveLength(2)
      expect(result.current.filteredFields[0].fieldName).toBe('attackDamage')
      expect(result.current.filteredFields[1].fieldName).toBe('attackSpeed')
    })

    it('should update filtered fields when search changes', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('coins')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.filteredFields).toHaveLength(1)
      expect(result.current.filteredFields[0].fieldName).toBe('coinsEarned')

      act(() => {
        result.current.setSearchTerm('earned')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.filteredFields).toHaveLength(2)
      expect(result.current.filteredFields[0].fieldName).toBe('coinsEarned')
      expect(result.current.filteredFields[1].fieldName).toBe('cellsEarned')
    })

    it('should show all fields when search is empty', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('attack')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.filteredFields).toHaveLength(2)

      act(() => {
        result.current.setSearchTerm('')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.filteredFields).toEqual(mockFields)
    })

    it('should return empty array when no matches', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('nonexistent')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.filteredFields).toEqual([])
    })
  })

  describe('clearSearch', () => {
    it('should clear search term', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('attack')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.searchTerm).toBe('attack')
      expect(result.current.debouncedSearchTerm).toBe('attack')

      act(() => {
        result.current.clearSearch()
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.searchTerm).toBe('')
      expect(result.current.debouncedSearchTerm).toBe('')
    })

    it('should restore all fields after clearing', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('attack')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.filteredFields).toHaveLength(2)

      act(() => {
        result.current.clearSearch()
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.filteredFields).toEqual(mockFields)
    })
  })

  describe('hasActiveSearch', () => {
    it('should be false initially', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields))
      expect(result.current.hasActiveSearch).toBe(false)
    })

    it('should be true when search is active', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('attack')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.hasActiveSearch).toBe(true)
    })

    it('should be false when search is cleared', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('attack')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.hasActiveSearch).toBe(true)

      act(() => {
        result.current.clearSearch()
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.hasActiveSearch).toBe(false)
    })

    it('should be false for whitespace-only search', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('   ')
        vi.advanceTimersByTime(300)
      })

      expect(result.current.hasActiveSearch).toBe(false)
    })
  })

  describe('rapid search changes', () => {
    it('should only filter once after rapid typing', () => {
      const { result } = renderHook(() => useColumnSearch(mockFields, 300))

      act(() => {
        result.current.setSearchTerm('a')
        vi.advanceTimersByTime(100)
        result.current.setSearchTerm('at')
        vi.advanceTimersByTime(100)
        result.current.setSearchTerm('att')
        vi.advanceTimersByTime(100)
        result.current.setSearchTerm('atta')
        vi.advanceTimersByTime(100)
        result.current.setSearchTerm('attack')
      })

      // Still showing all fields during typing
      expect(result.current.filteredFields).toEqual(mockFields)

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Now filtered to final search term
      expect(result.current.filteredFields).toHaveLength(2)
      expect(result.current.debouncedSearchTerm).toBe('attack')
    })
  })
})
