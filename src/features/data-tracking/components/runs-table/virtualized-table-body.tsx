import { flexRender, type Table } from '@tanstack/react-table';
import { RunCard } from './run-card';
import { TableEmptyState } from './table-empty-state';
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
          <tr key={row.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors duration-200">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="p-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
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
