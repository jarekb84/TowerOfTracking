import type { Table } from '@tanstack/react-table';
import type { ParsedGameRun } from '../../types/game-run.types';
import { TableHead } from './table-head';
import { VirtualizedTableBody } from './virtualized-table-body';
import { useViewport } from '@/shared/hooks/use-viewport';
import { useRef } from 'react';

interface ScrollableTableContainerProps {
  table: Table<ParsedGameRun>;
  removeRun: (id: string) => void;
}

export function ScrollableTableContainer({ table, removeRun }: ScrollableTableContainerProps) {
  const viewportSize = useViewport({ breakpoint: 'md' });
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="overflow-x-auto overflow-y-auto max-h-[65vh]">
      {viewportSize === 'desktop' ? (
        <table className="w-full">
          <TableHead table={table} />
          <VirtualizedTableBody 
            table={table} 
            removeRun={removeRun} 
            variant="desktop"
            containerRef={containerRef}
          />
        </table>
      ) : (
        <VirtualizedTableBody 
          table={table} 
          removeRun={removeRun} 
          variant="mobile"
          containerRef={containerRef}
        />
      )}
    </div>
  );
}