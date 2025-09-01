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
import { useData } from '../../hooks/use-data';
import { createRunsTableColumns } from './table-columns';
import { TableHeader } from './table-header';
import { TableHead } from './table-head';
import { TableBody } from './table-body';

export function RunsTable() {
  const { runs, removeRun } = useData();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = createRunsTableColumns(removeRun);

  const table = useReactTable({
    data: runs,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <Card>
      <CardHeader>
        <TableHeader
          totalRuns={runs.length}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full hidden md:table">
            <TableHead table={table} />
            <TableBody table={table} removeRun={removeRun} variant="desktop" />
          </table>
          <div className="md:hidden">
            <TableBody table={table} removeRun={removeRun} variant="mobile" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}