import { useState, useEffect } from 'react';
import {
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
  type ColumnDef,
  type ExpandedState,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader } from '@/components/ui';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { ScrollableTableContainer } from './scrollable-table-container';
import { TierFilter } from '../filters/tier-filter';

interface BaseRunsTableProps {
  runs: ParsedGameRun[];
  removeRun: (id: string) => void;
  columns: ColumnDef<ParsedGameRun, unknown>[];
  title: string;
  emptyStateMessage: string;
  searchPlaceholder: string;
  useCardStructure?: boolean;
  filteredRuns?: ParsedGameRun[];
  selectedTier?: number | null;
  onTierChange?: (tier: number | null) => void;
  availableTiers?: number[];
  shouldShowTierFilter?: boolean;
}

export function BaseRunsTable({
  runs,
  removeRun,
  columns,
  title,
  emptyStateMessage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchPlaceholder: _searchPlaceholder,
  useCardStructure = false,
  filteredRuns,
  selectedTier,
  onTierChange,
  availableTiers,
  shouldShowTierFilter,
}: BaseRunsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const displayRuns = filteredRuns || runs;

  // Reset expanded state when the data changes (e.g., run moves to different tab)
  useEffect(() => {
    setExpanded({});
  }, [displayRuns.length]);

  const table = useReactTable({
    data: displayRuns,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    state: {
      sorting,
      columnFilters,
      expanded,
    },
  });

  if (displayRuns.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {emptyStateMessage}
        </CardContent>
      </Card>
    );
  }

  if (useCardStructure) {
    return (
      <Card>
        <CardHeader className="pb-4">
          {onTierChange && shouldShowTierFilter && (
            <TierFilter 
              availableTiers={availableTiers || []}
              selectedTier={selectedTier || null}
              onTierChange={onTierChange}
            />
          )}
        </CardHeader>
        <CardContent className="p-0">
          <ScrollableTableContainer table={table} removeRun={removeRun} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {displayRuns.length} runs{selectedTier !== null && selectedTier !== undefined ? ` (Tier ${selectedTier})` : ''}
            </p>
          </div>
        </div>
        {onTierChange && shouldShowTierFilter && (
          <TierFilter 
            availableTiers={availableTiers || []}
            selectedTier={selectedTier || null}
            onTierChange={onTierChange}
          />
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollableTableContainer table={table} removeRun={removeRun} />
      </CardContent>
    </Card>
  );
}