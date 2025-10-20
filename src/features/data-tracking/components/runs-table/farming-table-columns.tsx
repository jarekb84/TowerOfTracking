import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { formatNumber, formatDuration, calculatePerHour } from '../../utils/data-parser';
import { getFieldValue } from '../../utils/field-utils';
import type { ParsedGameRun } from '../../types/game-run.types';
import { StickyNote } from 'lucide-react';
import { ExpandButton, DeleteButton } from './table-action-buttons';

const columnHelper = createColumnHelper<ParsedGameRun>();

export function createFarmingTableColumns(removeRun: (id: string) => void): ColumnDef<ParsedGameRun>[] {
  return [
    columnHelper.display({
      id: 'expander',
      header: '',
      cell: ({ row }) => (
        <ExpandButton 
          isExpanded={row.getIsExpanded()}
          onToggle={row.getToggleExpandedHandler()}
        />
      ),
      size: 40,
    }),
    columnHelper.display({
      id: 'notes',
      header: '',
      cell: ({ row }) => {
        const notes = getFieldValue<string>(row.original, '_notes');
        if (!notes || notes.trim() === '') {
          return null;
        }
        return (
          <StickyNote className="h-3.5 w-3.5 text-muted-foreground/60" />
        );
      },
      size: 30,
    }),
    columnHelper.accessor('timestamp', {
      header: 'Date',
      cell: (info) => info.getValue().toLocaleDateString(),
      sortingFn: 'datetime',
    }),
    columnHelper.accessor('timestamp', {
      id: 'time',
      header: 'Time',
      cell: (info) => info.getValue().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    }),
    columnHelper.accessor('realTime', {
      header: 'Duration',
      cell: (info) => {
        const value = info.getValue();
        return value ? formatDuration(value) : '-';
      },
    }),
    columnHelper.accessor('tier', {
      header: 'Tier',
      cell: (info) => {
        const row = info.row.original;
        // For farming runs, show simplified tier (just the number)
        return row.tier ? row.tier.toString() : '-';
      },
    }),
    columnHelper.accessor('wave', {
      header: 'Wave',
      cell: (info) => {
        const value = info.getValue();
        return value ? value.toLocaleString() : '-';
      },
    }),
    columnHelper.accessor((row) => getFieldValue<string>(row, 'killedBy'), {
      id: 'killedBy',
      header: 'Killed by',
      cell: (info) => {
        const value = info.getValue() as string | undefined;
        return value && value.trim() ? value : '-';
      },
    }),
    columnHelper.accessor('coinsEarned', {
      header: 'Coins',
      cell: (info) => {
        const value = info.getValue();
        return value ? formatNumber(value) : '-';
      },
    }),
    columnHelper.accessor((row) =>
      calculatePerHour(row.coinsEarned ?? 0, row.realTime ?? 0)
    , {
      id: 'coinsPerHour',
      header: 'Coins/Hour',
      cell: (info) => {
        const value = info.getValue() as number;
        return value ? formatNumber(value) : '-';
      },
    }),
    columnHelper.accessor('cellsEarned', {
      header: 'Cells',
      cell: (info) => {
        const value = info.getValue();
        return value ? formatNumber(value) : '-';
      },
    }),
    columnHelper.accessor((row) =>
      calculatePerHour(row.cellsEarned ?? 0, row.realTime ?? 0)
    , {
      id: 'cellsPerHour',
      header: 'Cells/Hour',
      cell: (info) => {
        const value = info.getValue() as number;
        return value ? formatNumber(value) : '-';
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DeleteButton onDelete={() => removeRun(row.original.id)} />
      ),
      size: 40,
    }),
  ] as ColumnDef<ParsedGameRun>[];
}