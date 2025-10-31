import type { ParsedGameRun } from '../../data-tracking/types/game-run.types';
import { createMilestoneTableColumns } from './milestone-table-columns';
import { BaseRunsTable } from '../table/base-runs-table';
import { useTierFilter } from '../filters/use-tier-filter';

interface MilestoneRunsTableProps {
  runs: ParsedGameRun[];
  removeRun: (id: string) => void;
}

export function MilestoneRunsTable({ runs, removeRun }: MilestoneRunsTableProps) {
  const columns = createMilestoneTableColumns(removeRun);
  const { selectedTier, setSelectedTier, filteredRuns, availableTiers, shouldShowFilter } = useTierFilter(runs);

  return (
    <BaseRunsTable
      runs={runs}
      removeRun={removeRun}
      columns={columns}
      title="Milestone Runs"
      emptyStateMessage="No milestone runs yet. Import some data or add runs manually to get started!"
      searchPlaceholder="Search milestone runs..."
      useCardStructure={true}
      filteredRuns={filteredRuns}
      selectedTier={selectedTier}
      onTierChange={setSelectedTier}
      availableTiers={availableTiers}
      shouldShowTierFilter={shouldShowFilter}
    />
  );
}