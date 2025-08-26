import type { Table } from '@tanstack/react-table';
import type { ParsedGameRun } from '../../types/game-run.types';
import { TableHead } from './table-head';
import { TableBody } from './table-body';

interface ScrollableTableContainerProps {
  table: Table<ParsedGameRun>;
}

export function ScrollableTableContainer({ table }: ScrollableTableContainerProps) {
  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
      <table className="w-full">
        <TableHead table={table} />
        <TableBody table={table} />
      </table>
    </div>
  );
}