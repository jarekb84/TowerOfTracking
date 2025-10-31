import type { ParsedGameRun } from '../../data-tracking/types/game-run.types';
import { createTournamentTableColumns } from './tournament-table-columns';
import { BaseRunsTable } from '../table/base-runs-table';
import { useTierFilter } from '../filters/use-tier-filter';

interface TournamentRunsTableProps {
  runs: ParsedGameRun[];
  removeRun: (id: string) => void;
}

export function TournamentRunsTable({ runs, removeRun }: TournamentRunsTableProps) {
  const columns = createTournamentTableColumns(removeRun);
  const { selectedTier, setSelectedTier, filteredRuns, availableTiers, shouldShowFilter } = useTierFilter(runs);

  return (
    <BaseRunsTable
      runs={runs}
      removeRun={removeRun}
      columns={columns}
      title="Tournament Runs"
      emptyStateMessage="No tournament runs yet. Import some data or add runs manually to get started!"
      searchPlaceholder="Search tournament runs..."
      useCardStructure={false}
      filteredRuns={filteredRuns}
      selectedTier={selectedTier}
      onTierChange={setSelectedTier}
      availableTiers={availableTiers}
      shouldShowTierFilter={shouldShowFilter}
    />
  );
}