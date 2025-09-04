import { flexRender, type Table } from '@tanstack/react-table';
import type { ParsedGameRun } from '../../types/game-run.types';

interface TableHeadProps {
  table: Table<ParsedGameRun>;
}

export function TableHead({ table }: TableHeadProps) {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id} className="border-b border-border/50">
          {headerGroup.headers.map((header) => (
            <th
              key={header.id}
              className="sticky top-0 z-30 text-left px-4 py-3 font-semibold text-foreground bg-background/95 border-b border-border/50"
              style={{ width: header.getSize() }}
            >
              {header.isPlaceholder ? null : (
                <div
                  className={
                    header.column.getCanSort()
                      ? 'cursor-pointer select-none flex items-center gap-1 hover:text-foreground/90 transition-colors'
                      : 'flex items-center'
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