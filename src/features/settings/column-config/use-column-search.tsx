import { useState, useMemo, useCallback } from 'react'
import { useDebounce } from '../../../hooks/use-debounce'
import { filterFieldsBySearch } from '../../data-tracking/utils/field-search'
import type { AvailableField } from '@/features/analysis/tier-stats/types'

export interface UseColumnSearchReturn {
  searchTerm: string
  debouncedSearchTerm: string
  filteredFields: AvailableField[]
  setSearchTerm: (term: string) => void
  clearSearch: () => void
  hasActiveSearch: boolean
}

/**
 * Hook for managing column search with debouncing
 * Provides search state and filtered results
 */
export function useColumnSearch(
  fields: AvailableField[],
  debounceMs: number = 300
): UseColumnSearchReturn {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs)

  const filteredFields = useMemo(
    () => filterFieldsBySearch(fields, debouncedSearchTerm),
    [fields, debouncedSearchTerm]
  )

  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  const hasActiveSearch = useMemo(
    () => debouncedSearchTerm.trim().length > 0,
    [debouncedSearchTerm]
  )

  return {
    searchTerm,
    debouncedSearchTerm,
    filteredFields,
    setSearchTerm,
    clearSearch,
    hasActiveSearch
  }
}
