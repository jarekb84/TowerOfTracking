import { flexRender, type Table } from '@tanstack/react-table';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { VirtualizedTableBody } from './virtualized-table-body';
import { buildGridTemplateColumns, isFixedWidthColumn } from './virtualization';
import { useViewport } from '../../../shared/hooks/use-viewport';
import { useRef } from 'react';

interface ScrollableTableContainerProps {
  table: Table<ParsedGameRun>;
  removeRun: (id: string) => void;
}

export function ScrollableTableContainer({ table, removeRun }: ScrollableTableContainerProps) {
  const viewportSize = useViewport({ breakpoint: 'md' });
  const containerRef = useRef<HTMLDivElement>(null);

  if (viewportSize === 'mobile') {
    // Mobile: Use virtualized cards
    return (
      <div ref={containerRef} className="overflow-x-auto overflow-y-auto max-h-[65vh]">
        <VirtualizedTableBody
          table={table}
          removeRun={removeRun}
          variant="mobile"
          containerRef={containerRef}
        />
      </div>
    );
  }

  // Desktop: CSS Grid for both header and body ensures perfect alignment
  const headerGroups = table.getHeaderGroups();
  const headers = headerGroups[0]?.headers ?? [];
  const gridTemplateColumns = buildGridTemplateColumns(headers);

  return (
    <div ref={containerRef} className="overflow-x-auto overflow-y-auto max-h-[65vh]">
      {/* CSS Grid Header - uses identical grid template as body */}
      <div
        role="rowgroup"
        className="sticky top-0 z-30 bg-background/95 border-b border-border/40"
      >
        {headerGroups.map((headerGroup) => (
          <div
            key={headerGroup.id}
            role="row"
            className="grid pr-6"
            style={{ gridTemplateColumns }}
          >
            {headerGroup.headers.map((header) => {
              const isIconColumn = isFixedWidthColumn(header.id);
              return (
              <div
                key={header.id}
                role="columnheader"
                className={`py-2 text-sm font-semibold text-foreground ${
                  isIconColumn ? 'px-2 text-center' : 'px-4 text-left'
                }`}
              >
                {header.isPlaceholder ? null : (
                  <div
                    className={
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none flex items-center gap-1 hover:text-foreground/90 transition-colors'
                        : 'flex items-center'
                    }
                    onClick={header.column.getToggleSortingHandler()}
                    onKeyDown={(e) => {
                      if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        const handler = header.column.getToggleSortingHandler();
                        if (handler) handler(e);
                      }
                    }}
                    role={header.column.getCanSort() ? 'button' : undefined}
                    tabIndex={header.column.getCanSort() ? 0 : undefined}
                    aria-sort={
                      header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : 'none'
                    }
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' ↑',
                      desc: ' ↓',
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Virtualized body - uses same grid template */}
      <VirtualizedTableBody
        table={table}
        removeRun={removeRun}
        variant="desktop"
        containerRef={containerRef}
        gridTemplateColumns={gridTemplateColumns}
      />
    </div>
  );
}
