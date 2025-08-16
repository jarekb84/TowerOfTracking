import type { ParsedGameRun } from '../../types/game-run.types';

interface RunDetailsProps {
  run: ParsedGameRun;
}

export function RunDetails({ run }: RunDetailsProps) {
  const sortedData = Object.entries(run.rawData)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-md">
      <h4 className="font-medium">Complete Run Data</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
        {sortedData.map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-center p-sm bg-background rounded border"
          >
            <span className="font-mono text-sm text-muted-foreground">
              {key}
            </span>
            <span className="font-mono text-sm font-medium">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}