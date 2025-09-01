import { useSearch, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

/**
 * Generic hook for managing URL search parameters with type safety
 */
export function useUrlSearchParam<T extends Record<string, unknown>>(
  fromRoute: string,
  defaultValue: Partial<T> = {}
) {
  const search = useSearch({ from: fromRoute })
  const navigate = useNavigate({ from: fromRoute })

  const currentSearch = { ...defaultValue, ...search } as T

  const updateSearch = useCallback((newSearch: Partial<T>) => {
    navigate({
      search: { ...currentSearch, ...newSearch }
    })
  }, [navigate, currentSearch])

  return {
    search: currentSearch,
    updateSearch
  }
}