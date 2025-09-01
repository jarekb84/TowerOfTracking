import type { Table } from '@tanstack/react-table';
import type { ParsedGameRun } from '../../types/game-run.types';
import { TableHead } from './table-head';
import { TableBody } from './table-body';
import { useViewport } from '@/shared/hooks/use-viewport';

interface ScrollableTableContainerProps {
  table: Table<ParsedGameRun>;
  removeRun: (id: string) => void;
}

export function ScrollableTableContainer({ table, removeRun }: ScrollableTableContainerProps) {
  const viewportSize = useViewport({ breakpoint: 'md' });

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
      {viewportSize === 'desktop' ? (
        <table className="w-full">
          <TableHead table={table} />
          <TableBody table={table} removeRun={removeRun} variant="desktop" />
        </table>
      ) : (
        <TableBody table={table} removeRun={removeRun} variant="mobile" />
      )}
    </div>
  );
}