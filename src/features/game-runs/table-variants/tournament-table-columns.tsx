import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { formatDuration, getTournamentLeague } from '@/features/analysis/shared/parsing/data-parser';
import { getFieldValue } from '@/features/analysis/shared/parsing/field-utils';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { StickyNote } from 'lucide-react';
import { ExpandButton, DeleteButton } from '../table-ui/table-action-buttons';

const columnHelper = createColumnHelper<ParsedGameRun>();

export function createTournamentTableColumns(removeRun: (id: string) => void): ColumnDef<ParsedGameRun>[] {
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
    columnHelper.display({
      id: 'placement',
      header: 'Rank',
      cell: ({ row }) => {
        const rank = getFieldValue<string>(row.original, '_rank');
        return rank || '-';
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