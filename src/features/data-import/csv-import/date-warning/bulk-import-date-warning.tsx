import { Card, CardContent } from '@/components/ui';
import { cn } from '@/shared/lib/utils';
import type { DateValidationWarning } from '../types';
import { categorizeWarnings } from './date-derivation-fixer';
import { DateWarningHeader } from './date-warning-header';
import { AutoFixToggle } from './auto-fix-toggle';
import { DateIssuesTable } from './date-issues-table';
import { UnfixableRowsTable } from './unfixable-rows-table';
import { DateWarningInfoBox } from './date-warning-info-box';
import { DateWarningTip } from './date-warning-tip';

interface BulkImportDateWarningProps {
  dateWarnings: DateValidationWarning[];
  totalRuns: number;
  className?: string;
  /** Whether auto-fix from _date/_time is enabled */
  deriveEnabled: boolean;
  /** Callback when user toggles the auto-fix option */
  onDeriveToggle: (enabled: boolean) => void;
}

/**
 * Displays date validation warnings for CSV bulk import.
 * Shows which rows have invalid battleDate values and explains the fallback behavior.
 * Provides an option to auto-fix rows that have _date/_time fields.
 */
export function BulkImportDateWarning({
  dateWarnings,
  totalRuns,
  className,
  deriveEnabled,
  onDeriveToggle,
}: BulkImportDateWarningProps) {
  if (dateWarnings.length === 0) {
    return null;
  }

  const { fixable, unfixable } = categorizeWarnings(dateWarnings);
  const hasFixable = fixable.length > 0;
  const hasUnfixable = unfixable.length > 0;

  // Determine which warnings to show in the main table
  // Toggle OFF: show all warnings
  // Toggle ON: show only fixable warnings (unfixable shown separately below)
  const mainTableWarnings = deriveEnabled ? fixable : dateWarnings;

  return (
    <Card className={cn('border-orange-500/30 bg-orange-500/10', className)}>
      <CardContent className="p-4 space-y-4">
        <DateWarningHeader
          warningCount={dateWarnings.length}
          totalRuns={totalRuns}
        />

        {/* Toggle at TOP - above the issues table */}
        {hasFixable && (
          <AutoFixToggle
            fixableCount={fixable.length}
            deriveEnabled={deriveEnabled}
            onDeriveToggle={onDeriveToggle}
          />
        )}

        {/* Main issues table - morphs based on toggle state */}
        {mainTableWarnings.length > 0 && (
          <DateIssuesTable
            warnings={mainTableWarnings}
            deriveEnabled={deriveEnabled}
          />
        )}

        {/* Unfixable section - only shown when toggle ON and unfixable rows exist */}
        {deriveEnabled && hasUnfixable && <UnfixableRowsTable warnings={unfixable} />}

        <DateWarningInfoBox
          deriveEnabled={deriveEnabled}
          fixableCount={fixable.length}
          unfixableCount={unfixable.length}
        />

        {hasUnfixable && <DateWarningTip />}
      </CardContent>
    </Card>
  );
}
