import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { getTournamentLeague } from '@/features/analysis/shared/parsing/data-parser';
import { getFieldValue } from '@/features/analysis/shared/parsing/field-utils';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import {
  createExpanderColumn,
  createNotesColumn,
  createDateColumn,
  createTimeColumn,
  createDurationColumn,
  createWaveColumn,
  createKilledByColumn,
  createActionsColumn,
  COLUMN_SIZES,
} from './shared-column-definitions';

const columnHelper = createColumnHelper<ParsedGameRun>();

export function createTournamentTableColumns(removeRun: (id: string) => void): ColumnDef<ParsedGameRun>[] {
  return [
    createExpanderColumn(),
    createNotesColumn(),
    createDateColumn(),
    createTimeColumn(),
    createDurationColumn(),
    // Tournament-specific league column (converts tier to league name)
    columnHelper.accessor('tier', {
      header: 'League',
      cell: (info) => {
        const tierValue = info.getValue() as number | string;

        // Extract numeric tier from string like "11+" or number
        let tierNumber: number;
        if (typeof tierValue === 'string') {
          const match = tierValue.match(/^(\d+)/);
          tierNumber = match ? parseInt(match[1], 10) : 0;
        } else {
          tierNumber = tierValue || 0;
        }

        // Get league from tier number
        if (tierNumber > 0) {
          const league = getTournamentLeague(tierNumber);
          return league || '-';
        }

        return '-';
      },
      size: COLUMN_SIZES.league,
    }),
    createWaveColumn(),
    createKilledByColumn(),
    // Tournament-specific placement column
    columnHelper.display({
      id: 'placement',
      header: 'Rank',
      cell: ({ row }) => {
        const rank = getFieldValue<string>(row.original, '_rank');
        return rank || '-';
      },
      size: COLUMN_SIZES.placement,
    }),
    createActionsColumn(removeRun),
  ] as ColumnDef<ParsedGameRun>[];
}
