import { FieldSearch } from '@/shared/domain/fields/field-search'
import type { UseFieldFilterResult } from '@/features/settings/column-config/use-field-filter'

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