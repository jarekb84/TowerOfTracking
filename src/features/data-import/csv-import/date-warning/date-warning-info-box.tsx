import { InfoBox } from '@/components/ui/info-box';

interface DateWarningInfoBoxProps {
  deriveEnabled: boolean;
  fixableCount: number;
  unfixableCount: number;
}

/**
 * Contextual info box showing what will happen to runs with date issues.
 * Message changes based on whether auto-fix is enabled.
 */
export function DateWarningInfoBox({
  deriveEnabled,
  fixableCount,
  unfixableCount,
}: DateWarningInfoBoxProps) {
  const hasFixable = fixableCount > 0;
  const hasUnfixable = unfixableCount > 0;

  if (deriveEnabled && hasFixable) {
    return (
      <InfoBox variant="info">
        <strong>Note:</strong> {fixableCount} run{fixableCount !== 1 ? 's' : ''} will use dates derived from _Date/_Time fields.
        {hasUnfixable && ` ${unfixableCount} run${unfixableCount !== 1 ? 's' : ''} will use the current timestamp.`}
      </InfoBox>
    );
  }

  return (
    <InfoBox variant="info">
      <strong>Note:</strong> Runs with date issues will use the current timestamp as their date.
      This may affect chronological ordering in analytics.
      {hasFixable && ' Enable auto-fix above to use _Date/_Time fields instead.'}
    </InfoBox>
  );
}
