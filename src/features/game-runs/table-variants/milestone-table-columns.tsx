import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
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
 * Creates column definitions for the milestone runs table.
 * Uses locale-aware formatting from the locale store.
 */
export function createMilestoneTableColumns(
  removeRun: (id: string) => void
): ColumnDef<ParsedGameRun>[] {
  return [
    createExpanderColumn(),
    createNotesColumn(),
    createDateColumn(),
    createTimeColumn(),
    createDurationColumn(),
    // Milestone-specific tier column (just the number)
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
    createCellsColumn(),
    createActionsColumn(removeRun),
  ] as ColumnDef<ParsedGameRun>[];
}
