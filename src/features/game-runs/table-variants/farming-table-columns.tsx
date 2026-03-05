import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { calculatePerHour } from '@/features/analysis/shared/parsing/data-parser';
import { calculateSumTotal } from '@/features/game-runs/card-view/run-details/breakdown/breakdown-calculations';
import { REROLL_SHARDS_FIELDS } from '@/features/game-runs/card-view/run-details/section-config';
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
      header: 'Coins/hr',
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
      header: 'Cells/hr',
      cell: (info) => {
        const value = info.getValue() as number;
        return value ? formatLargeNumber(value) : '-';
      },
      size: COLUMN_SIZES.cellsPerHour,
    }),
    // Farming-specific reroll shards/hour column
    columnHelper.accessor((row) => {
      const total = calculateSumTotal(row, [...REROLL_SHARDS_FIELDS]);
      return calculatePerHour(total, row.realTime ?? 0);
    }, {
      id: 'rerollShardsPerHour',
      header: 'Reroll/hr',
      cell: (info) => {
        const value = info.getValue() as number;
        return value ? formatLargeNumber(value) : '-';
      },
      size: COLUMN_SIZES.rerollShardsPerHour,
    }),
    createActionsColumn(removeRun),
  ] as ColumnDef<ParsedGameRun>[];
}
