import { useState } from 'react';
import {
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader } from '../../../../components/ui';
import type { ParsedGameRun } from '../../types/game-run.types';
import { createFarmingTableColumns } from './farming-table-columns';
import { TableHead } from './table-head';
import { TableBody } from './table-body';

interface FarmingRunsTableProps {
  runs: ParsedGameRun[];
  removeRun: (id: string) => void;
}

export function FarmingRunsTable({ runs, removeRun }: FarmingRunsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = createFarmingTableColumns(removeRun);

  const table = useReactTable({
    data: runs,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Farming Runs</h3>
            <p className="text-sm text-muted-foreground">
              {runs.length} farming runs
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