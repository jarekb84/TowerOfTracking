import { useSearch, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

/**
 * Generic hook for managing URL search parameters with type safety
 */
export function useUrlSearchParam<T extends Record<string, unknown>>(
  fromRoute: string,
  defaultValue: Partial<T> = {}
) {
  // Type assertion for TanStack Router compatibility
  const search = useSearch({ from: fromRoute } as Parameters<typeof useSearch>[0]) as Partial<T>
  const navigate = useNavigate({ from: fromRoute } as Parameters<typeof useNavigate>[0])

  const currentSearch = { ...defaultValue, ...search } as T

  const updateSearch = useCallback((newSearch: Partial<T>) => {
    navigate({
      search: ({ ...currentSearch, ...newSearch } as unknown) as Parameters<typeof navigate>[0]['search']
    })
  }, [navigate, currentSearch])

  return {
    search: currentSearch,
    updateSearch
  }
}