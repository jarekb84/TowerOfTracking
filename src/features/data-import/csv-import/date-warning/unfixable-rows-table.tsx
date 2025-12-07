import { XCircle } from 'lucide-react';
import type { DateValidationWarning } from '../types';

interface UnfixableRowsTableProps {
  warnings: DateValidationWarning[];
  maxRows?: number;
}

/**
 * Displays rows that cannot be auto-fixed because they lack _date/_time fields.
 * These rows will use the import timestamp as a fallback.
 */
export function UnfixableRowsTable({
  warnings,
  maxRows = 10,
}: UnfixableRowsTableProps) {
  if (warnings.length === 0) {
    return null;
  }

  const displayedWarnings = warnings.slice(0, maxRows);
  const remainingCount = warnings.length - maxRows;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-sm font-medium text-red-300">
          Cannot Auto-Fix ({warnings.length} row{warnings.length !== 1 ? 's' : ''})
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        These rows are missing _Date and _Time fields. They will use the current time.
      </div>

      <div className="bg-card/80 rounded-lg border border-red-500/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-500/10 border-b border-border/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Row</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tier</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Wave</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Battle Date Value</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Issue</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {displayedWarnings.map((warning, index) => (
                <tr key={index} className="hover:bg-red-500/5 transition-colors duration-150">
                  <td className="px-3 py-2 text-foreground tabular-nums">{warning.rowNumber}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {warning.context.tier ? `T${warning.context.tier}` : '-'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground tabular-nums">
                    {warning.context.wave ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {warning.context.duration ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-red-400/90 font-mono text-xs">
                    {warning.rawValue ? `"${warning.rawValue}"` : '(empty)'}
                  </td>
                  <td className="px-3 py-2 text-red-400/90 text-xs">
                    {getShortErrorMessage(warning.error.code)}
                  </td>
                  <td className="px-3 py-2 text-red-400 text-xs">
                    Will use current time
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {remainingCount > 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/20 border-t border-border/40">
            ... and {remainingCount} more row{remainingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get a short, user-friendly error message for each error code
 */
function getShortErrorMessage(code: string): string {
  switch (code) {
    case 'empty':
      return 'No date provided';
    case 'invalid-format':
      return 'Format not recognized';
    case 'invalid-month':
      return 'Unknown month name';
    case 'invalid-hour':
      return 'Invalid hour';
    case 'invalid-minute':
      return 'Invalid minute';
    case 'invalid-day':
      return 'Invalid day';
    case 'future-date':
      return 'Date in future';
    case 'too-old':
      return 'Date too old';
    default:
      return 'Invalid date';
  }
}
