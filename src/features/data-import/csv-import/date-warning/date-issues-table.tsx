import { AlertTriangle, ArrowRight } from 'lucide-react';
import { formatDisplayDateTime } from '@/shared/formatting/date-formatters';
import type { DateValidationWarning } from '../types';

interface DateIssuesTableProps {
  /** All warnings to display (when toggle OFF) or just fixable ones (when toggle ON) */
  warnings: DateValidationWarning[];
  /** Whether auto-fix mode is enabled - changes the table columns */
  deriveEnabled: boolean;
  maxRows?: number;
}

/**
 * A single table that morphs based on toggle state:
 * - Toggle OFF: Shows Issue column with error messages
 * - Toggle ON: Shows Current -> Derived -> Source columns
 */
export function DateIssuesTable({ warnings, deriveEnabled, maxRows = 10 }: DateIssuesTableProps) {
  if (warnings.length === 0) {
    return null;
  }

  const displayedWarnings = warnings.slice(0, maxRows);
  const remainingCount = warnings.length - maxRows;

  return (
    <div className="space-y-2">
      <DateIssuesHeader warningCount={warnings.length} deriveEnabled={deriveEnabled} />
      <div className="bg-card/80 rounded-lg border border-orange-500/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <DateIssuesTableHead deriveEnabled={deriveEnabled} />
            <tbody className="divide-y divide-border/30">
              {displayedWarnings.map((warning, index) => (
                <DateIssueRow key={index} warning={warning} deriveEnabled={deriveEnabled} />
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

function DateIssuesHeader({ warningCount, deriveEnabled }: { warningCount: number; deriveEnabled: boolean }) {
  const plural = warningCount !== 1 ? 's' : '';
  return (
    <div className="flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
      <span className="text-sm font-medium text-orange-300">
        {deriveEnabled ? `Will Fix (${warningCount} row${plural})` : `Date Issues (${warningCount} row${plural})`}
      </span>
    </div>
  );
}

const TH_CLASS = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider';

function DateIssuesTableHead({ deriveEnabled }: { deriveEnabled: boolean }) {
  return (
    <thead>
      <tr className="bg-orange-500/10 border-b border-border/50">
        <th className={TH_CLASS}>Row</th>
        <th className={TH_CLASS}>Tier</th>
        <th className={TH_CLASS}>Wave</th>
        <th className={TH_CLASS}>Duration</th>
        {deriveEnabled ? (
          <>
            <th className={TH_CLASS}>Current Value</th>
            <th className="px-3 py-2 text-center w-8" aria-hidden="true"></th>
            <th className={TH_CLASS}>Derived Value</th>
            <th className={TH_CLASS}>Source (_Date / _Time)</th>
          </>
        ) : (
          <>
            <th className={TH_CLASS}>Battle Date Value</th>
            <th className={TH_CLASS}>Issue</th>
            <th className={TH_CLASS}>Status</th>
          </>
        )}
      </tr>
    </thead>
  );
}

function DateIssueRow({ warning, deriveEnabled }: { warning: DateValidationWarning; deriveEnabled: boolean }) {
  const rawValueDisplay = warning.rawValue ? `"${warning.rawValue}"` : '(empty)';

  return (
    <tr className="hover:bg-orange-500/5 transition-colors duration-150">
      <td className="px-3 py-2 text-foreground tabular-nums">{warning.rowNumber}</td>
      <td className="px-3 py-2 text-muted-foreground">{warning.context.tier ? `T${warning.context.tier}` : '-'}</td>
      <td className="px-3 py-2 text-muted-foreground tabular-nums">{warning.context.wave ?? '-'}</td>
      <td className="px-3 py-2 text-muted-foreground">{warning.context.duration ?? '-'}</td>
      {deriveEnabled ? (
        <>
          <td className="px-3 py-2 text-orange-400/90 font-mono text-xs">{rawValueDisplay}</td>
          <td className="px-3 py-2 text-center">
            <ArrowRight className="w-4 h-4 text-emerald-400 inline-block" />
          </td>
          <td className="px-3 py-2 text-emerald-400 font-medium">
            {warning.derivedBattleDate ? formatDisplayDateTime(warning.derivedBattleDate) : '-'}
          </td>
          <td className="px-3 py-2 text-muted-foreground font-mono text-xs">
            {formatSourceFields(warning.dateFieldValue, warning.timeFieldValue)}
          </td>
        </>
      ) : (
        <>
          <td className="px-3 py-2 text-orange-400/90 font-mono text-xs">{rawValueDisplay}</td>
          <td className="px-3 py-2 text-orange-400/90 text-xs">{getShortErrorMessage(warning.error.code)}</td>
          <td className="px-3 py-2 text-xs">
            {warning.isFixable && warning.derivedBattleDate ? (
              <span className="text-emerald-400">Can auto-fix</span>
            ) : (
              <span className="text-red-400">Will use current time</span>
            )}
          </td>
        </>
      )}
    </tr>
  );
}

/**
 * Format source _date and _time fields for display
 */
function formatSourceFields(dateValue?: string, timeValue?: string): string {
  if (!dateValue && !timeValue) {
    return '-';
  }
  return `${dateValue ?? '?'} / ${timeValue ?? '?'}`;
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
