import { flexRender, type Table } from '@tanstack/react-table';
import type { ParsedGameRun } from '../../types/game-run.types';

interface TableHeadProps {
  table: Table<ParsedGameRun>;
}

export function TableHead({ table }: TableHeadProps) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id} className="border-b">
          {headerGroup.headers.map((header) => (
            <th
              key={header.id}
              className="sticky top-0 z-30 text-left p-2 font-medium text-muted-foreground bg-card border-b border-border"
              style={{ width: header.getSize() }}
            >
              {header.isPlaceholder ? null : (
                <div
                  className={
                    header.column.getCanSort()
                      ? 'cursor-pointer select-none flex items-center gap-1'
                      : ''
                  }
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: ' ↑',
                    desc: ' ↓',
                  }[header.column.getIsSorted() as string] ?? null}
                </div>
              )}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
}