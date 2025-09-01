import type { Table } from '@tanstack/react-table';
import type { ParsedGameRun } from '../../types/game-run.types';
import { useViewport } from '@/shared/hooks/use-viewport';

interface TableEmptyStateProps {
  table: Table<ParsedGameRun>;
}

export function TableEmptyState({ table }: TableEmptyStateProps) {
  const viewportSize = useViewport({ breakpoint: 'md' });

  if (viewportSize === 'desktop') {
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
    <div className="text-center py-6 text-muted-foreground">
      No runs found. Add your first game run to get started!
    </div>
  );
}