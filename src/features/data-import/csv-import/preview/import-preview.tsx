import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui';
import { format } from 'date-fns';
import { formatNumber, formatDuration } from '@/features/analysis/shared/data-parser';
import { getFieldValue } from '@/features/analysis/shared/field-utils';
import type { GameRun } from '../../../data-tracking/types/game-run.types';

interface ImportPreviewProps {
  runs: GameRun[];
}

export function ImportPreview({ runs }: ImportPreviewProps) {
  if (!runs || runs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Preview ({runs.length} runs)</CardTitle>
        <CardDescription>
          Here&apos;s how your data will be imported
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {runs.slice(0, 3).map((run, index) => (
            <div key={index} className="border rounded p-3 space-y-2">
              <div className="font-medium text-sm">
                Run {index + 1} - {format(run.timestamp, "MMM d, yyyy 'at' HH:mm")}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Tier: {run.tier}</div>
                <div>Wave: {formatNumber(run.wave)}</div>
                {run.realTime > 0 && <div>Duration: {formatDuration(run.realTime)}</div>}
                <div>Coins: {formatNumber(run.coinsEarned)}</div>
                {run.cellsEarned > 0 && <div>Cells: {formatNumber(run.cellsEarned)}</div>}
                {getFieldValue<string>(run, 'killedBy') && <div>Killed By: {getFieldValue<string>(run, 'killedBy')}</div>}
                {getFieldValue<string>(run, '_notes') && <div>Notes: {getFieldValue<string>(run, '_notes')}</div>}
              </div>
            </div>
          ))}
          {runs.length > 3 && (
            <div className="text-center text-sm text-muted-foreground">
              ... and {runs.length - 3} more runs
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
