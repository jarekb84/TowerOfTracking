import { type Table } from '@tanstack/react-table';
import { RunCard } from './run-card';
import { TableEmptyState } from './table-empty-state';
import { RunDetails } from './run-details';
import { ExpandableTableRow } from './expandable-table-row';
import type { ParsedGameRun } from '../../types/game-run.types';

interface VirtualizedTableBodyProps {
  table: Table<ParsedGameRun>;
  removeRun: (id: string) => void;
  variant?: 'desktop' | 'mobile';
}

export function VirtualizedTableBody({ 
  table, 
  removeRun, 
  variant = 'desktop'
}: VirtualizedTableBodyProps) {
  const rows = table.getRowModel().rows;
  
  // Use non-virtualized rendering for reliability
  if (rows.length === 0) {
    return <TableEmptyState table={table} />;
  }

  // Desktop Table View
  if (variant === 'desktop') {
    return (
      <tbody>
        {rows.map((row) => (
          <ExpandableTableRow key={row.id} row={row}>
            <RunDetails run={row.original} />
          </ExpandableTableRow>
        ))}
      </tbody>
    );
  }

  // Mobile Card View
  return (
    <div className="px-4 py-6" data-testid="mobile-cards-container">
      {rows.map((row) => (
        <RunCard
          key={row.id}
          run={row.original}
          isExpanded={row.getIsExpanded()}
          onToggleExpanded={row.getToggleExpandedHandler()}
          onRemove={() => removeRun(row.original.id)}
        />
      ))}
    </div>
  );
}
