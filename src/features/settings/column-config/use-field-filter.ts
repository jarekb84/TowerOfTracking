import { useState, useEffect, useMemo } from 'react';
import type { FieldTrendData } from '@/shared/types/game-run.types';
import { filterFieldTrends, isValidSearchTerm } from '@/shared/domain/fields/field-filter';

interface UseFieldFilterOptions {
  debounceMs?: number;
}

export interface UseFieldFilterResult {
  searchTerm: string;
  debouncedSearchTerm: string;
  isSearchActive: boolean;
  filteredTrends: FieldTrendData[];
  hasMatches: boolean;
  handleSearchChange: (term: string) => void;
  clearSearch: () => void;
}

/**
 * Custom hook for managing field search with debouncing
 */
export function useFieldFilter(
  trends: FieldTrendData[],
  options: UseFieldFilterOptions = {}
): UseFieldFilterResult {
  const { debounceMs = 200 } = options;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Filter trends based on debounced search term
  const filteredTrends = useMemo(() => {
    return filterFieldTrends(trends, debouncedSearchTerm);
  }, [trends, debouncedSearchTerm]);

  // Derived state
  const isSearchActive = isValidSearchTerm(debouncedSearchTerm);
  const hasMatches = filteredTrends.length > 0;

  // Event handlers
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearchActive,
    filteredTrends,
    hasMatches,
    handleSearchChange,
    clearSearch
  };
}