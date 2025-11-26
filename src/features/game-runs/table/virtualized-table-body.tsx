import { type RefObject } from 'react';
import { type Table } from '@tanstack/react-table';
import { type VirtualItem } from '@tanstack/react-virtual';
import { RunCard } from '../card-view/run-card';
import { TableEmptyState } from '../table-ui/table-empty-state';
import { RunDetails } from '../card-view/run-details';
import { VirtualizedDesktopRow } from './virtualized-desktop-row';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { useTableVirtualizer } from './virtualization';

interface VirtualizedTableBodyProps {
  table: Table<ParsedGameRun>;
  removeRun: (id: string) => void;
  variant?: 'desktop' | 'mobile';
  containerRef: RefObject<HTMLDivElement | null>;
  /** CSS Grid template columns string for desktop layout */
  gridTemplateColumns?: string;
}

export function VirtualizedTableBody({
  table,
  removeRun,
  variant = 'desktop',
  containerRef,
  gridTemplateColumns = '',
}: VirtualizedTableBodyProps) {
  const rows = table.getRowModel().rows;

  const { virtualItems, totalSize, measureElement } = useTableVirtualizer({
    containerRef,
    rows,
    variant,
  });

  if (rows.length === 0) {
    return <TableEmptyState />;
  }

  // Desktop: Div-based layout with CSS Grid for virtualization
  if (variant === 'desktop') {
    return (
      <div
        className="virtualized-container relative"
        style={{ height: totalSize }}
        role="rowgroup"
      >
        {virtualItems.map((virtualItem) => {
          const row = rows[virtualItem.index];
          return (
            <VirtualizedDesktopRow
              key={row.id}
              row={row}
              virtualItem={virtualItem}
              measureRef={measureElement}
              gridTemplateColumns={gridTemplateColumns}
            >
              <RunDetails run={row.original} />
            </VirtualizedDesktopRow>
          );
        })}
      </div>
    );
  }

  // Mobile Card View
  return (
    <div
      className="relative virtualized-container"
      style={{ height: totalSize }}
      data-testid="mobile-cards-container"
    >
      {virtualItems.map((virtualItem) => {
        const row = rows[virtualItem.index];
        return (
          <MobileCardWrapper
            key={row.id}
            virtualItem={virtualItem}
            measureRef={measureElement}
          >
            <RunCard
              run={row.original}
              isExpanded={row.getIsExpanded()}
              onToggleExpanded={row.getToggleExpandedHandler()}
              onRemove={() => removeRun(row.original.id)}
            />
          </MobileCardWrapper>
        );
      })}
    </div>
  );
}

interface MobileCardWrapperProps {
  virtualItem: VirtualItem;
  measureRef: (node: HTMLElement | null) => void;
  children: React.ReactNode;
}

function MobileCardWrapper({
  virtualItem,
  measureRef,
  children,
}: MobileCardWrapperProps) {
  return (
    <div
      ref={measureRef}
      data-index={virtualItem.index}
      className="virtualized-row px-4 pb-4"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        transform: `translateY(${virtualItem.start}px)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}
