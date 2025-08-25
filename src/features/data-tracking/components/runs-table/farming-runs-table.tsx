import type { ParsedGameRun } from '../../types/game-run.types';
import { createFarmingTableColumns } from './farming-table-columns';
import { BaseRunsTable } from './base-runs-table';
import { useTierFilter } from './use-tier-filter';

interface FarmingRunsTableProps {
  runs: ParsedGameRun[];
  removeRun: (id: string) => void;
}

export function FarmingRunsTable({ runs, removeRun }: FarmingRunsTableProps) {
  const columns = createFarmingTableColumns(removeRun);
  const { selectedTier, setSelectedTier, filteredRuns, availableTiers, shouldShowFilter } = useTierFilter(runs);

  return (
    <BaseRunsTable
      runs={runs}
      removeRun={removeRun}
      columns={columns}
      title="Farming Runs"
      emptyStateMessage="No farming runs yet. Import some data or add runs manually to get started!"
      searchPlaceholder="Search farming runs..."
      useCardStructure={false}
      filteredRuns={filteredRuns}
      selectedTier={selectedTier}
      onTierChange={setSelectedTier}
      availableTiers={availableTiers}
      shouldShowTierFilter={shouldShowFilter}
    />
  );
}