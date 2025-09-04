import { createColumnHelper } from '@tanstack/react-table';
import { formatNumber, formatDuration } from '../../utils/data-parser';
import { getFieldValue } from '../../utils/field-utils';
import type { ParsedGameRun } from '../../types/game-run.types';
import { StickyNote } from 'lucide-react';
import { ExpandButton, DeleteButton } from './table-action-buttons';

const columnHelper = createColumnHelper<ParsedGameRun>();

export function createMilestoneTableColumns(removeRun: (id: string) => void) {
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
        const notes = getFieldValue<string>(row.original, 'notes');
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
        // For milestone runs, show simplified tier (just the number)
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
    columnHelper.accessor('cellsEarned', {
      header: 'Cells',
      cell: (info) => {
        const value = info.getValue();
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
  ];
}