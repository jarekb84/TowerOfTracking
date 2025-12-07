import { InfoBox } from '@/components/ui/info-box';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import type { DateIssueInfo } from '@/shared/formatting/date-issue-detection';
import { computeDateWarningDisplayData, type DateWarningDisplayData } from './single-entry-date-warning-logic';

interface SingleEntryDateWarningProps {
  dateIssueInfo: DateIssueInfo;
  autoFixEnabled: boolean;
  onAutoFixToggle: (enabled: boolean) => void;
  className?: string;
}

/** Validation error details section */
function ValidationErrorSection({ dateIssueInfo, displayData }: { dateIssueInfo: DateIssueInfo; displayData: DateWarningDisplayData }) {
  if (!dateIssueInfo.validationError) return null;

  return (
    <div className="space-y-1.5">
      <p>
        <span className="font-medium">Value:</span>{' '}
        <code className="font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
          {displayData.rawValueDisplay}
        </code>
      </p>
      <p>
        <span className="font-medium">Issue:</span> {dateIssueInfo.validationError.message}
      </p>
      {dateIssueInfo.validationError.suggestion && (
        <p>
          <span className="font-medium">Suggestion:</span> {dateIssueInfo.validationError.suggestion}
        </p>
      )}
    </div>
  );
}

/** Auto-fix toggle section */
function AutoFixToggleSection({
  displayData,
  autoFixEnabled,
  onAutoFixToggle,
}: {
  displayData: DateWarningDisplayData;
  autoFixEnabled: boolean;
  onAutoFixToggle: (enabled: boolean) => void;
}) {
  if (!displayData.formattedFixDate) return null;

  return (
    <div className="mt-3 pt-3 border-t border-orange-500/20">
      <div className="flex items-center justify-between gap-4 py-2 px-3 bg-card/60 rounded-lg border border-border/40">
        <div className="min-w-0 text-sm">
          <div className="font-medium text-foreground">Auto-fix date</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {displayData.isInternalFieldsFix ? (
              <>
                Use date from <code className="font-mono text-orange-400 bg-orange-500/10 px-1 rounded">_Date</code> and{' '}
                <code className="font-mono text-orange-400 bg-orange-500/10 px-1 rounded">_Time</code> fields:{' '}
                <span className="font-medium">{displayData.formattedFixDate}</span>
              </>
            ) : (
              <>
                Use your selected date/time: <span className="font-medium">{displayData.formattedFixDate}</span>
              </>
            )}
          </div>
        </div>
        <ToggleSwitch
          checked={autoFixEnabled}
          onCheckedChange={onAutoFixToggle}
          aria-label="Toggle auto-fix date"
        />
      </div>
    </div>
  );
}

/**
 * Displays a date validation warning for single-entry manual import.
 * Shows different messages for missing vs invalid battleDate.
 * Includes auto-fix toggle when the issue is fixable.
 */
export function SingleEntryDateWarning({
  dateIssueInfo,
  autoFixEnabled,
  onAutoFixToggle,
  className,
}: SingleEntryDateWarningProps) {
  const displayData = computeDateWarningDisplayData(dateIssueInfo);

  if (!displayData.showWarning) {
    return null;
  }

  return (
    <InfoBox variant="warning" title={displayData.title} className={className}>
      <div className="space-y-3">
        <ValidationErrorSection dateIssueInfo={dateIssueInfo} displayData={displayData} />

        {displayData.isMissing && (
          <p className="text-sm">
            The pasted data does not include a Battle Date field. A date is required for proper
            chronological ordering in analytics.
          </p>
        )}

        {dateIssueInfo.isFixable && (
          <AutoFixToggleSection
            displayData={displayData}
            autoFixEnabled={autoFixEnabled}
            onAutoFixToggle={onAutoFixToggle}
          />
        )}

        {!dateIssueInfo.isFixable && (
          <p className="mt-2 pt-2 border-t border-orange-500/20 text-orange-200 text-sm">
            The date/time you selected below will be used as the import timestamp.
          </p>
        )}

        {dateIssueInfo.isFixable && !autoFixEnabled && (
          <p className="text-orange-200/80 text-xs">
            Enable auto-fix to create a proper Battle Date field for this run.
          </p>
        )}
      </div>
    </InfoBox>
  );
}
