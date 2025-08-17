import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '../../../../components/ui';
import { formatNumber, formatDuration, calculatePerHour, formatTierLabel } from '../../utils/data-parser';
import type { ParsedGameRun } from '../../types/game-run.types';
import { ChevronDown, ChevronRight, Trash2, StickyNote } from 'lucide-react';

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
    columnHelper.display({
      id: 'notes',
      header: '',
      cell: ({ row }) => {
        const notes = row.original.processedData.notes;
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
      header: 'Real Time',
      cell: (info) => {
        const value = info.getValue();
        return value ? formatDuration(value) : '-';
      },
    }),
    columnHelper.accessor('tier', {
      header: 'Tier',
      cell: (info) => {
        const row = info.row.original;
        return formatTierLabel(row.camelCaseData?.tier, row.tier);
      },
    }),
    columnHelper.accessor('wave', {
      header: 'Wave',
      cell: (info) => {
        const value = info.getValue();
        return value ? value.toLocaleString() : '-';
      },
    }),
    columnHelper.accessor((row) => row.processedData.killedBy, {
      id: 'killedBy',
      header: 'Killed by',
      cell: (info) => {
        const value = info.getValue() as string | undefined;
        return value && value.trim() ? value : '-';
      },
    }),
    columnHelper.accessor('runType', {
      header: 'Run Type',
      cell: (info) => {
        const rt = info.getValue();
        return rt === 'tournament' ? 'Tournament' : 'Farm';
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
      header: 'Coins/hr',
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
      header: 'Cells/hr',
      cell: (info) => {
        const value = info.getValue() as number;
        return value ? formatNumber(value) : '-';
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
