/**
 * Shared column definitions for game run tables.
 * These columns are identical across farming, tournament, and milestone tables.
 */
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { formatDuration } from '@/features/analysis/shared/parsing/data-parser';
import { formatLargeNumber } from '@/shared/formatting/number-scale';
import { getFieldValue } from '@/features/analysis/shared/parsing/field-utils';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { StickyNote } from 'lucide-react';
import { ExpandButton, DeleteButton } from '../table-ui/table-action-buttons';

const columnHelper = createColumnHelper<ParsedGameRun>();

/**
 * Column sizes used across all table variants.
 * Centralized to ensure consistency.
 */
export const COLUMN_SIZES = {
  expander: 40,
  notes: 36,
  date: 105,
  time: 85,
  duration: 115,
  tier: 40,
  league: 65,
  wave: 55,
  killedBy: 70,
  coins: 55,
  cells: 55,
  coinsPerHour: 80,
  cellsPerHour: 80,
  placement: 50,
  actions: 40,
} as const;

/**
 * Creates the expander button column.
 */
export function createExpanderColumn(): ColumnDef<ParsedGameRun> {
  return columnHelper.display({
    id: 'expander',
    header: '',
    cell: ({ row }) => (
      <ExpandButton
        isExpanded={row.getIsExpanded()}
        onToggle={row.getToggleExpandedHandler()}
      />
    ),
    size: COLUMN_SIZES.expander,
  }) as ColumnDef<ParsedGameRun>;
}

/**
 * Creates the notes indicator column.
 */
export function createNotesColumn(): ColumnDef<ParsedGameRun> {
  return columnHelper.display({
    id: 'notes',
    header: '',
    cell: ({ row }) => {
      const notes = getFieldValue<string>(row.original, '_notes');
      if (!notes || notes.trim() === '') {
        return null;
      }
      return <StickyNote className="h-4 w-4 text-orange-400" />;
    },
    size: COLUMN_SIZES.notes,
  }) as ColumnDef<ParsedGameRun>;
}

/**
 * Creates the date column.
 */
export function createDateColumn(): ColumnDef<ParsedGameRun> {
  return columnHelper.accessor('timestamp', {
    header: 'Date',
    cell: (info) => info.getValue().toLocaleDateString(),
    sortingFn: 'datetime',
    size: COLUMN_SIZES.date,
  }) as ColumnDef<ParsedGameRun>;
}

/**
 * Creates the time column.
 */
export function createTimeColumn(): ColumnDef<ParsedGameRun> {
  return columnHelper.accessor('timestamp', {
    id: 'time',
    header: 'Time',
    cell: (info) =>
      info.getValue().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    size: COLUMN_SIZES.time,
  }) as ColumnDef<ParsedGameRun>;
}

/**
 * Creates the duration column.
 */
export function createDurationColumn(): ColumnDef<ParsedGameRun> {
  return columnHelper.accessor('realTime', {
    header: 'Duration',
    cell: (info) => {
      const value = info.getValue();
      return value ? formatDuration(value) : '-';
    },
    size: COLUMN_SIZES.duration,
  }) as ColumnDef<ParsedGameRun>;
}

/**
 * Creates the wave column.
 */
export function createWaveColumn(): ColumnDef<ParsedGameRun> {
  return columnHelper.accessor('wave', {
    header: 'Wave',
    cell: (info) => {
      const value = info.getValue();
      return value ? value.toLocaleString() : '-';
    },
    size: COLUMN_SIZES.wave,
  }) as ColumnDef<ParsedGameRun>;
}

/**
 * Creates the killed by column.
 */
export function createKilledByColumn(): ColumnDef<ParsedGameRun> {
  return columnHelper.accessor((row) => getFieldValue<string>(row, 'killedBy'), {
    id: 'killedBy',
    header: 'Killed by',
    cell: (info) => {
      const value = info.getValue() as string | undefined;
      return value && value.trim() ? value : '-';
    },
    size: COLUMN_SIZES.killedBy,
  }) as ColumnDef<ParsedGameRun>;
}

/**
 * Creates the coins column.
 */
export function createCoinsColumn(): ColumnDef<ParsedGameRun> {
  return columnHelper.accessor('coinsEarned', {
    header: 'Coins',
    cell: (info) => {
      const value = info.getValue();
      return value ? formatLargeNumber(value) : '-';
    },
    size: COLUMN_SIZES.coins,
  }) as ColumnDef<ParsedGameRun>;
}

/**
 * Creates the cells column.
 */
export function createCellsColumn(): ColumnDef<ParsedGameRun> {
  return columnHelper.accessor('cellsEarned', {
    header: 'Cells',
    cell: (info) => {
      const value = info.getValue();
      return value ? formatLargeNumber(value) : '-';
    },
    size: COLUMN_SIZES.cells,
  }) as ColumnDef<ParsedGameRun>;
}

/**
 * Creates the delete action column.
 */
export function createActionsColumn(
  removeRun: (id: string) => void
): ColumnDef<ParsedGameRun> {
  return columnHelper.display({
    id: 'actions',
    header: '',
    cell: ({ row }) => <DeleteButton onDelete={() => removeRun(row.original.id)} />,
    size: COLUMN_SIZES.actions,
  }) as ColumnDef<ParsedGameRun>;
}
