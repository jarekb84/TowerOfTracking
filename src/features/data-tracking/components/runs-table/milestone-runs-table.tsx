import type { ParsedGameRun } from '../../types/game-run.types';
import { createMilestoneTableColumns } from './milestone-table-columns';
import { BaseRunsTable } from './base-runs-table';

interface MilestoneRunsTableProps {
  runs: ParsedGameRun[];
  removeRun: (id: string) => void;
}

export function MilestoneRunsTable({ runs, removeRun }: MilestoneRunsTableProps) {
  const columns = createMilestoneTableColumns(removeRun);

  return (
    <BaseRunsTable
      runs={runs}
      removeRun={removeRun}
      columns={columns}
      title="Milestone Runs"
      emptyStateMessage="No milestone runs yet. Import some data or add runs manually to get started!"
      searchPlaceholder="Search milestone runs..."
      useCardStructure={true}
    />
  );
}