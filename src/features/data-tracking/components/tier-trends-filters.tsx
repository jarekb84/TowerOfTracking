import { FieldSearch } from './field-search'
import type { UseFieldFilterResult } from '../../settings/column-config/use-field-filter'

interface TierTrendsFiltersProps {
  fieldFilter: UseFieldFilterResult
  totalCount: number
}

export function TierTrendsFilters({ fieldFilter, totalCount }: TierTrendsFiltersProps) {
  const {
    searchTerm,
    isSearchActive,
    filteredTrends,
    handleSearchChange,
    clearSearch
  } = fieldFilter

  return (
    <div>
      <FieldSearch
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onClear={clearSearch}
        isSearchActive={isSearchActive}
        matchCount={filteredTrends.length}
        totalCount={totalCount}
      />
    </div>
  )
}