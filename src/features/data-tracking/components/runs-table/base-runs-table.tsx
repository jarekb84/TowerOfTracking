import { useState } from 'react';
import {
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
  type ColumnDef,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader } from '../../../../components/ui';
import type { ParsedGameRun } from '../../types/game-run.types';
import { ScrollableTableContainer } from './scrollable-table-container';
import { TierFilter } from './tier-filter';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeRun: _,
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

  const displayRuns = filteredRuns || runs;

  const table = useReactTable({
    data: displayRuns,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getRowCanExpand: () => true,
    state: {
      sorting,
      columnFilters,
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
          <ScrollableTableContainer table={table} />
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
        <ScrollableTableContainer table={table} />
      </CardContent>
    </Card>
  );
}