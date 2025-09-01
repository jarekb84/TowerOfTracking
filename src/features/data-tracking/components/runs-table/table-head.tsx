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
                  onKeyDown={(e) => {
                    if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      const handler = header.column.getToggleSortingHandler();
                      if (handler) handler();
                    }
                  }}
                  role={header.column.getCanSort() ? 'button' : undefined}
                  tabIndex={header.column.getCanSort() ? 0 : undefined}
                  aria-sort={
                    header.column.getIsSorted() === 'asc' 
                      ? 'ascending' 
                      : header.column.getIsSorted() === 'desc' 
                      ? 'descending' 
                      : 'none'
                  }
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