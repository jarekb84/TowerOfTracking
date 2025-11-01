import { Fragment } from 'react';
import { flexRender, type Row } from '@tanstack/react-table';
import type { ParsedGameRun } from '@/shared/types/game-run.types';

interface ExpandableTableRowProps {
  row: Row<ParsedGameRun>;
  children?: React.ReactNode;
}

export function ExpandableTableRow({ row, children }: ExpandableTableRowProps) {
  return (
    <Fragment>
      <tr 
        className="border-b border-border/40 hover:bg-muted/25 transition-all duration-300 ease-out cursor-pointer group"
        onClick={row.getToggleExpandedHandler()}
      >
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id} className="p-2 sm:p-3 md:p-2 group-hover:text-foreground/90 transition-colors duration-300">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
      {row.getIsExpanded() && (
        <tr>
          <td colSpan={row.getVisibleCells().length} className="p-0">
            <div className="bg-muted/15 border-t border-border/40 transition-all duration-300 ease-out">
              <div className="p-4 sm:p-6 md:p-6 space-y-4">
                {children}
              </div>
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}