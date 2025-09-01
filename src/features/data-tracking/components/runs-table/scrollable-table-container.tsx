import type { Table } from '@tanstack/react-table';
import type { ParsedGameRun } from '../../types/game-run.types';
import { TableHead } from './table-head';
import { TableBody } from './table-body';

interface ScrollableTableContainerProps {
  table: Table<ParsedGameRun>;
  removeRun: (id: string) => void;
}

export function ScrollableTableContainer({ table, removeRun }: ScrollableTableContainerProps) {
  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
      <table className="w-full hidden md:table">
        <TableHead table={table} />
        <TableBody table={table} removeRun={removeRun} variant="desktop" />
      </table>
      <div className="md:hidden">
        <TableBody table={table} removeRun={removeRun} variant="mobile" />
      </div>
    </div>
  );
}