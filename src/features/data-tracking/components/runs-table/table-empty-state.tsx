import type { Table } from '@tanstack/react-table';
import type { ParsedGameRun } from '../../types/game-run.types';

interface TableEmptyStateProps {
  table: Table<ParsedGameRun>;
}

export function TableEmptyState({ table }: TableEmptyStateProps) {
  return (
    <>
      {/* Desktop empty state */}
      <tbody className="hidden md:table-row-group">
        <tr>
          <td colSpan={table.getAllColumns().length} className="text-center py-6 text-muted-foreground">
            No runs found. Add your first game run to get started!
          </td>
        </tr>
      </tbody>
      {/* Mobile empty state */}
      <div className="md:hidden text-center py-6 text-muted-foreground">
        No runs found. Add your first game run to get started!
      </div>
    </>
  );
}