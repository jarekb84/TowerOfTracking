import { AlertCircle } from 'lucide-react';

interface DateWarningHeaderProps {
  warningCount: number;
  totalRuns: number;
}

/**
 * Header section for the date validation warning card.
 * Shows icon, title, and count of affected rows.
 */
export function DateWarningHeader({
  warningCount,
  totalRuns,
}: DateWarningHeaderProps) {
  const runsPlural = totalRuns !== 1 ? 's' : '';
  const hasPlural = warningCount === 1 ? 'has' : 'have';

  return (
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-semibold text-orange-200">
          Date Validation Issues
        </h3>
        <p className="text-sm text-orange-300/90 mt-1">
          {warningCount} of {totalRuns} run{runsPlural} {hasPlural} invalid Battle Date values.
        </p>
      </div>
    </div>
  );
}
