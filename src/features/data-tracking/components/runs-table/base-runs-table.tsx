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
import { TableHead } from './table-head';
import { TableBody } from './table-body';

interface BaseRunsTableProps {
  runs: ParsedGameRun[];
  removeRun: (id: string) => void;
  columns: ColumnDef<ParsedGameRun, unknown>[];
  title: string;
  emptyStateMessage: string;
  searchPlaceholder: string;
  useCardStructure?: boolean;
}

export function BaseRunsTable({
  runs,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeRun: _,
  columns,
  title,
  emptyStateMessage,
  searchPlaceholder,
  useCardStructure = false,
}: BaseRunsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: runs,
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

  if (runs.length === 0) {
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
          <TableHead 
            table={table} 
            searchPlaceholder={searchPlaceholder} 
            showSearch={runs.length > 3}
          />
        </CardHeader>
        <CardContent className="p-0">
          <TableBody table={table} />
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
              {runs.length} runs
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHead table={table} />
            <TableBody table={table} />
          </table>
        </div>
      </CardContent>
    </Card>
  );
}