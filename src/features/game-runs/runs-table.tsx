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
import { Card, CardContent, CardHeader } from '../../components/ui';
import { useData } from '../data-tracking/hooks/use-data';
import { createRunsTableColumns } from './table-ui/table-columns';
import { TableHeader } from './table-ui/table-header';
import { TableHead } from './table-ui/table-head';
import { VirtualizedTableBody } from './table/virtualized-table-body';
import { useViewport } from '../../shared/hooks/use-viewport';
import { useRef } from 'react';

export function RunsTable() {
  const { runs, removeRun } = useData();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const viewportSize = useViewport({ breakpoint: 'md' });
  const containerRef = useRef<HTMLDivElement>(null);

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
        <div ref={containerRef} className="overflow-x-auto overflow-y-auto max-h-[65vh]">
          {viewportSize === 'desktop' ? (
            <table className="w-full">
              <TableHead table={table} />
              <VirtualizedTableBody 
                table={table} 
                removeRun={removeRun} 
                variant="desktop"
              />
            </table>
          ) : (
            <VirtualizedTableBody 
              table={table} 
              removeRun={removeRun} 
              variant="mobile"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}