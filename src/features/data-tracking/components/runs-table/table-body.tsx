import React from 'react';
import { flexRender, type Table } from '@tanstack/react-table';
import { RunDetails } from './run-details';
import { RunCard } from './run-card';
import { TableEmptyState } from './table-empty-state';
import type { ParsedGameRun } from '../../types/game-run.types';

interface TableBodyProps {
  table: Table<ParsedGameRun>;
  removeRun: (id: string) => void;
  variant?: 'desktop' | 'mobile';
}

export function TableBody({ table, removeRun, variant = 'desktop' }: TableBodyProps) {
  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return <TableEmptyState table={table} />;
  }

  // Desktop Table View
  if (variant === 'desktop') {
    return (
      <tbody>
        {rows.map((row) => (
          <React.Fragment key={row.id}>
            <tr className="border-b hover:bg-muted/50">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="p-2"
                  style={{ width: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
            {row.getIsExpanded() && (
              <tr>
                <td colSpan={row.getVisibleCells().length} className="p-4 bg-muted/25">
                  <RunDetails run={row.original} />
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    );
  }

  // Mobile Card View
  return (
    <div className="space-y-6 px-4 py-6" data-testid="mobile-cards-container">
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