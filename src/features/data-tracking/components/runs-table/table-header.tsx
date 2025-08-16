import { Input } from '../../../ui';
import { Search } from 'lucide-react';

interface TableHeaderProps {
  totalRuns: number;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
}

export function TableHeader({ totalRuns, globalFilter, onGlobalFilterChange }: TableHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Game Runs</h3>
        <p className="text-sm text-muted-foreground">
          {totalRuns} total runs
        </p>
      </div>
      <div className="flex gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search runs..."
            value={globalFilter}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
      </div>
    </div>
  );
}