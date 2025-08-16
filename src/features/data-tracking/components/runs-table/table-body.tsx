import React from 'react';
import { flexRender, type Table } from '@tanstack/react-table';
import { RunDetails } from './run-details';
import type { ParsedGameRun } from '../../types/game-run.types';

interface TableBodyProps {
  table: Table<ParsedGameRun>;
}

export function TableBody({ table }: TableBodyProps) {
  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={table.getAllColumns().length} className="text-center py-6 text-muted-foreground">
            No runs found. Add your first game run to get started!
          </td>
        </tr>
      </tbody>
    );
  }

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