import { flexRender, type Row } from '@tanstack/react-table';
import { type VirtualItem } from '@tanstack/react-virtual';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { isFixedWidthColumn } from './virtualization';

interface VirtualizedDesktopRowProps {
  row: Row<ParsedGameRun>;
  children?: React.ReactNode;
  virtualItem: VirtualItem;
  measureRef: (node: HTMLElement | null) => void;
  gridTemplateColumns: string;
}

export function VirtualizedDesktopRow({
  row,
  children,
  virtualItem,
  measureRef,
  gridTemplateColumns,
}: VirtualizedDesktopRowProps) {
  return (
    <div
      ref={measureRef}
      data-index={virtualItem.index}
      role="row"
      className="virtualized-row border-b border-border/40 hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 transition-colors duration-200 ease-out cursor-pointer group"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        transform: `translateY(${virtualItem.start}px)`,
        willChange: 'transform',
      }}
      tabIndex={0}
      onClick={row.getToggleExpandedHandler()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          row.getToggleExpandedHandler()();
        }
      }}
    >
      {/* Main row cells using CSS Grid */}
      <div
        className="grid pr-6"
        style={{ gridTemplateColumns }}
      >
        {row.getVisibleCells().map((cell) => {
          const isIconColumn = isFixedWidthColumn(cell.column.id);
          return (
            <div
              key={cell.id}
              role="cell"
              className={`py-2 text-sm flex items-center transition-colors duration-200 ${
                isIconColumn ? 'px-2 justify-center' : 'px-4 truncate'
              }`}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          );
        })}
      </div>

      {/* Expanded content - stop propagation to prevent row collapse when interacting */}
      {row.getIsExpanded() && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div
          className="bg-muted/15 border-t border-border/50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-5 md:p-6 space-y-4">{children}</div>
        </div>
      )}
    </div>
  );
}
