import { Input } from '@/components/ui';

interface FieldSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClear: () => void;
  isSearchActive: boolean;
  matchCount?: number;
  totalCount?: number;
}

export function FieldSearch({
  searchTerm,
  onSearchChange,
  onClear,
  isSearchActive,
  matchCount,
  totalCount
}: FieldSearchProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search fields... (e.g., type 'earned' to see all earning metrics)"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pr-8 bg-slate-800/30 border-slate-600/50 text-slate-100 placeholder:text-slate-400"
        />
        {searchTerm && (
          <button
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {isSearchActive && typeof matchCount === 'number' && typeof totalCount === 'number' && (
        <div className="text-sm text-slate-400">
          {matchCount > 0 
            ? `Showing ${matchCount} of ${totalCount} fields`
            : `No fields match "${searchTerm}"`
          }
        </div>
      )}
    </div>
  );
}