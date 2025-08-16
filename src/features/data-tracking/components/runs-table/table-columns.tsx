import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '../../../ui';
import { formatNumber, formatDuration } from '../../utils/data-parser';
import type { ParsedGameRun } from '../../types/game-run.types';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

const columnHelper = createColumnHelper<ParsedGameRun>();

export function createRunsTableColumns(removeRun: (id: string) => void) {
  return [
    columnHelper.display({
      id: 'expander',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={row.getToggleExpandedHandler()}
          className="p-1"
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
      size: 40,
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
    columnHelper.accessor('tier', {
      header: 'Tier',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('wave', {
      header: 'Wave',
      cell: (info) => {
        const value = info.getValue();
        return value ? value.toLocaleString() : '-';
      },
    }),
    columnHelper.accessor('coins', {
      header: 'Coins',
      cell: (info) => {
        const value = info.getValue();
        return value ? formatNumber(value) : '-';
      },
    }),
    columnHelper.accessor('cash', {
      header: 'Cash',
      cell: (info) => {
        const value = info.getValue();
        return value ? formatNumber(value) : '-';
      },
    }),
    columnHelper.accessor('cells', {
      header: 'Cells',
      cell: (info) => {
        const value = info.getValue();
        return value ? formatNumber(value) : '-';
      },
    }),
    columnHelper.accessor('duration', {
      header: 'Duration',
      cell: (info) => {
        const value = info.getValue();
        return value ? formatDuration(value) : '-';
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeRun(row.original.id)}
          className="p-1 hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
      size: 40,
    }),
  ];
}