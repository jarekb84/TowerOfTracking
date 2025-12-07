import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';

interface MissingBattleDateWarningProps {
  totalRuns: number;
  className?: string;
}

/**
 * Warning displayed when the imported CSV is completely missing a battleDate column.
 * This is a more severe warning than individual row validation issues.
 */
export function MissingBattleDateWarning({
  totalRuns,
  className,
}: MissingBattleDateWarningProps) {
  return (
    <Card className={`border-orange-500/50 bg-orange-500/15 ${className ?? ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div className="font-medium text-orange-300">
              Missing Battle Date Column
            </div>
            <div className="text-sm text-muted-foreground">
              Your CSV does not contain a <code className="text-orange-400/80 bg-orange-500/10 px-1 rounded">Battle Date</code> column.
              All {totalRuns} run{totalRuns !== 1 ? 's' : ''} will use the <strong>current time</strong> as their timestamp.
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Tip:</strong> If your data has separate date and time columns with different names, rename them to{' '}
              <code className="text-orange-400/80 bg-orange-500/10 px-1 rounded">_Date</code> and{' '}
              <code className="text-orange-400/80 bg-orange-500/10 px-1 rounded">_Time</code> to preserve timestamps.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
