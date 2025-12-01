import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { calculatePerHour } from '@/features/analysis/shared/parsing/data-parser';
import { formatLargeNumber } from '@/shared/formatting/number-scale';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import {
  createExpanderColumn,
  createNotesColumn,
  createDateColumn,
  createTimeColumn,
  createDurationColumn,
  createWaveColumn,
  createKilledByColumn,
  createCoinsColumn,
  createCellsColumn,
  createActionsColumn,
  COLUMN_SIZES,
} from './shared-column-definitions';

const columnHelper = createColumnHelper<ParsedGameRun>();

/**
 * Creates column definitions for the farming runs table.
 * Uses locale-aware formatting from the locale store.
 */
export function createFarmingTableColumns(
  removeRun: (id: string) => void
): ColumnDef<ParsedGameRun>[] {
  return [
    createExpanderColumn(),
    createNotesColumn(),
    createDateColumn(),
    createTimeColumn(),
    createDurationColumn(),
    // Farming-specific tier column (just the number)
    columnHelper.accessor('tier', {
      header: 'Tier',
      cell: (info) => {
        const row = info.row.original;
        return row.tier ? row.tier.toString() : '-';
      },
      size: COLUMN_SIZES.tier,
    }),
    createWaveColumn(),
    createKilledByColumn(),
    createCoinsColumn(),
    // Farming-specific coins/hour column
    columnHelper.accessor((row) =>
      calculatePerHour(row.coinsEarned ?? 0, row.realTime ?? 0)
    , {
      id: 'coinsPerHour',
      header: 'Coins/Hour',
      cell: (info) => {
        const value = info.getValue() as number;
        return value ? formatLargeNumber(value) : '-';
      },
      size: COLUMN_SIZES.coinsPerHour,
    }),
    createCellsColumn(),
    // Farming-specific cells/hour column
    columnHelper.accessor((row) =>
      calculatePerHour(row.cellsEarned ?? 0, row.realTime ?? 0)
    , {
      id: 'cellsPerHour',
      header: 'Cells/Hour',
      cell: (info) => {
        const value = info.getValue() as number;
        return value ? formatLargeNumber(value) : '-';
      },
      size: COLUMN_SIZES.cellsPerHour,
    }),
    createActionsColumn(removeRun),
  ] as ColumnDef<ParsedGameRun>[];
}
