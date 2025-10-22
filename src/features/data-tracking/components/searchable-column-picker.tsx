import { Search, X } from 'lucide-react'
import { AddItemButton } from '../../../components/ui/add-item-button'
import { EmptyState } from '../../../components/ui/empty-state'
import type { UseColumnSearchReturn } from '../hooks/use-column-search'

interface SearchableColumnPickerProps {
  search: UseColumnSearchReturn
  onAddColumn: (fieldName: string) => void
}

export function SearchableColumnPicker({ search, onAddColumn }: SearchableColumnPickerProps) {
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          value={search.searchTerm}
          onChange={(e) => search.setSearchTerm(e.target.value)}
          placeholder="Search columns..."
          aria-label="Search columns"
          className="w-full bg-slate-700/30 border border-slate-600/40 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all"
        />
        {search.hasActiveSearch && (
          <button
            onClick={search.clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-2 rounded hover:bg-slate-600/30 -mr-2"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtered Columns Grid */}
      {search.filteredFields.length === 0 ? (
        <EmptyState>
          No matching columns found
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {search.filteredFields.map(field => (
            <AddItemButton
              key={field.fieldName}
              onClick={() => onAddColumn(field.fieldName)}
            >
              {field.displayName}
            </AddItemButton>
          ))}
        </div>
      )}
    </div>
  )
}
